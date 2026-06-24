import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { serializeUser } from './auth.serializer';
import { SmsService } from './sms.service';
import type { JwtPayload } from './strategies/jwt.strategy';

const OTP_LENGTH = 6;
const OTP_EXPIRY_SECONDS = 300; // 5 min
const OTP_COOLDOWN_SECONDS = 60; // 1 min between sends
const OTP_MAX_ATTEMPTS = 5;
const ACCESS_TOKEN_EXPIRY = '15m';
const ACCESS_TOKEN_EXPIRY_SECONDS = 900;
const REFRESH_TOKEN_EXPIRY = '30d';
const REFRESH_TOKEN_EXPIRY_SECONDS = 30 * 24 * 60 * 60;
// Dev convenience: a fixed code that always works when not in production.
const DEV_OTP = '123456';

const OTP_KEY = 'otp:';
const OTP_ATTEMPTS_KEY = 'otp_attempts:';
const OTP_COOLDOWN_KEY = 'otp_cd:';
const REFRESH_KEY = 'rt:';
const BLACKLIST_KEY = 'bl:';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly sms: SmsService,
    private readonly redisService: RedisService,
  ) {}

  // The shared connection (POLISH-3). The getter keeps the OTP/token call sites
  // (`this.redis.get/set/del/incr/pipeline/...`) unchanged.
  private get redis() {
    return this.redisService.client;
  }

  private isProd() {
    return this.config.get<string>('NODE_ENV') === 'production';
  }

  // ─── OTP ───────────────────────────────────────────────

  async sendOtp(phone: string): Promise<{ expiresIn: number; devCode?: string }> {
    this.assertRedis();
    const cd = await this.redis.get(`${OTP_COOLDOWN_KEY}${phone}`);
    if (cd) {
      const ttl = await this.redis.ttl(`${OTP_COOLDOWN_KEY}${phone}`);
      throw new BadRequestException({
        code: 'OTP_COOLDOWN',
        message: `استنى ${ttl} ثانية قبل ما تطلب كود تاني.`,
      });
    }

    // Use a real random code whenever SMS actually goes out (a live provider),
    // OR in production. The fixed dev code only applies to the console provider
    // in non-prod. The code is returned to the client (devCode) ONLY when no
    // real SMS was sent, so prod/live never leaks it.
    const liveDelivery = this.sms.isLiveProvider || this.isProd();
    const code = liveDelivery ? this.generateOtp() : DEV_OTP;
    const pipe = this.redis.pipeline();
    pipe.set(`${OTP_KEY}${phone}`, code, 'EX', OTP_EXPIRY_SECONDS);
    pipe.set(`${OTP_COOLDOWN_KEY}${phone}`, '1', 'EX', OTP_COOLDOWN_SECONDS);
    pipe.del(`${OTP_ATTEMPTS_KEY}${phone}`);
    await pipe.exec();

    // Deliver via the configured SMS provider (console logs in dev; HTTP gateway
    // in prod). Best-effort: a gateway failure is logged but the OTP still lives
    // in Redis (the user can retry / contact support) — we don't 500 the login.
    const result = await this.sms.sendOtp(phone, code);
    if (!result.delivered) {
      this.logger.error(`OTP send failed via ${result.provider} for ${phone}`);
    } else {
      this.logger.log(`OTP sent to ${phone} via ${result.provider}`);
    }

    // Return the code to the client only when no real SMS carried it.
    return liveDelivery
      ? { expiresIn: OTP_EXPIRY_SECONDS }
      : { expiresIn: OTP_EXPIRY_SECONDS, devCode: code };
  }

  async verifyOtp(
    phone: string,
    code: string,
  ): Promise<{ tokens: AuthTokens; user: Record<string, unknown>; isNewUser: boolean }> {
    this.assertRedis();

    const attempts = await this.redis.incr(`${OTP_ATTEMPTS_KEY}${phone}`);
    if (attempts === 1) await this.redis.expire(`${OTP_ATTEMPTS_KEY}${phone}`, OTP_EXPIRY_SECONDS);
    if (attempts > OTP_MAX_ATTEMPTS) {
      await this.redis.del(`${OTP_KEY}${phone}`, `${OTP_ATTEMPTS_KEY}${phone}`);
      throw new BadRequestException({ code: 'OTP_MAX_ATTEMPTS', message: 'حاولت كتير. اطلب كود جديد.' });
    }

    const stored = await this.redis.get(`${OTP_KEY}${phone}`);
    if (!stored) throw new BadRequestException({ code: 'OTP_EXPIRED', message: 'الكود انتهت صلاحيته. اطلب كود جديد.' });
    if (stored !== code) {
      throw new BadRequestException({
        code: 'OTP_INVALID',
        message: `الكود غلط. فاضلك ${OTP_MAX_ATTEMPTS - attempts} محاولات.`,
      });
    }

    await this.redis.del(`${OTP_KEY}${phone}`, `${OTP_ATTEMPTS_KEY}${phone}`, `${OTP_COOLDOWN_KEY}${phone}`);

    const existing = await this.prisma.user.findUnique({
      where: { phone },
      include: { profile: true },
    });
    if (existing) {
      const tokens = await this.issueTokens(existing.id, existing.phone);
      return { tokens, user: serializeUser(existing), isNewUser: false };
    }

    // New user: minimal record; they complete name/role/gender next.
    const created = await this.prisma.user.create({
      data: { phone, name: 'مستخدم جديد', role: 'renter' },
    });
    this.logger.log(`New user ${created.id} (${phone})`);
    const tokens = await this.issueTokens(created.id, created.phone);
    return { tokens, user: serializeUser(created), isNewUser: true };
  }

  // ─── Profile completion (after first OTP) ──────────────

  async completeProfile(
    userId: string,
    data: { name: string; role: 'renter' | 'owner' | 'both'; gender: 'male' | 'female' },
  ): Promise<Record<string, unknown>> {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { name: data.name, role: data.role, gender: data.gender },
    });
    return serializeUser(updated);
  }

  async me(userId: string): Promise<Record<string, unknown>> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
    if (!user || user.deletedAt) throw new UnauthorizedException('User not found');
    return serializeUser(user);
  }

  // ─── Tokens ────────────────────────────────────────────

  async refresh(refreshToken: string): Promise<{ accessToken: string; expiresIn: number }> {
    let payload: JwtPayload & { jti: string };
    try {
      payload = this.jwt.verify(refreshToken, {
        secret: this.refreshSecret(),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    if (payload.type !== 'refresh') throw new UnauthorizedException('Invalid token type');

    if (this.redisService.ready) {
      const black = await this.redis.get(`${BLACKLIST_KEY}${payload.jti}`);
      if (black) throw new UnauthorizedException('Token revoked');
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.deletedAt) throw new UnauthorizedException('User not found');

    const accessToken = this.signAccess(user.id, user.phone);
    return { accessToken, expiresIn: ACCESS_TOKEN_EXPIRY_SECONDS };
  }

  async logout(userId: string, refreshToken?: string): Promise<void> {
    if (!refreshToken || !this.redisService.ready) return;
    try {
      const payload = this.jwt.verify<JwtPayload & { jti: string }>(refreshToken, {
        secret: this.refreshSecret(),
      });
      if (payload.sub !== userId) return;
      const ttl = payload.exp ? payload.exp - Math.floor(Date.now() / 1000) : REFRESH_TOKEN_EXPIRY_SECONDS;
      if (ttl > 0) await this.redis.set(`${BLACKLIST_KEY}${payload.jti}`, '1', 'EX', ttl);
      await this.redis.del(`${REFRESH_KEY}${userId}:${payload.jti}`);
    } catch {
      // already invalid — nothing to revoke
    }
  }

  // ─── Helpers ───────────────────────────────────────────

  private async issueTokens(userId: string, phone: string): Promise<AuthTokens> {
    const jti = randomUUID();
    const accessToken = this.signAccess(userId, phone);
    const refreshToken = this.jwt.sign(
      { sub: userId, phone, type: 'refresh', jti } satisfies JwtPayload & { jti: string },
      {
        secret: this.refreshSecret(),
        expiresIn: REFRESH_TOKEN_EXPIRY,
      },
    );
    if (this.redisService.ready) {
      await this.redis.set(`${REFRESH_KEY}${userId}:${jti}`, '1', 'EX', REFRESH_TOKEN_EXPIRY_SECONDS);
    }
    return { accessToken, refreshToken, expiresIn: ACCESS_TOKEN_EXPIRY_SECONDS };
  }

  private signAccess(userId: string, phone: string): string {
    return this.jwt.sign(
      { sub: userId, phone, type: 'access' } satisfies JwtPayload,
      { expiresIn: ACCESS_TOKEN_EXPIRY },
    );
  }

  // Guaranteed present by validateEnv (SEC-1) — no inline dev fallback here.
  private refreshSecret(): string {
    return this.config.get<string>('JWT_REFRESH_SECRET')!;
  }

  private generateOtp(): string {
    return new Array(OTP_LENGTH).fill(0).map(() => Math.floor(Math.random() * 10)).join('');
  }

  private assertRedis() {
    if (!this.redisService.ready) {
      throw new BadRequestException({
        code: 'OTP_UNAVAILABLE',
        message: 'خدمة الكود مش متاحة دلوقتي. جرّب تاني بعد شوية.',
      });
    }
  }
}
