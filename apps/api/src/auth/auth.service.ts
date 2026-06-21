import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import Redis from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from './strategies/jwt.strategy';

// ─── Constants ─────────────────────────────────────────
const OTP_LENGTH = 6;
const OTP_EXPIRY_SECONDS = 300;          // 5 minutes
const OTP_COOLDOWN_SECONDS = 60;         // 1 minute between sends
const OTP_MAX_ATTEMPTS = 5;              // max verify attempts per OTP
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '30d';
const REFRESH_TOKEN_EXPIRY_SECONDS = 30 * 24 * 60 * 60; // 30 days

// Redis key prefixes
const OTP_KEY = 'otp:';                  // otp:{phone} → code
const OTP_ATTEMPTS_KEY = 'otp_attempts:'; // otp_attempts:{phone} → count
const OTP_COOLDOWN_KEY = 'otp_cd:';      // otp_cd:{phone} → 1
const REFRESH_TOKEN_KEY = 'rt:';          // rt:{userId}:{jti} → 1
const BLACKLIST_KEY = 'bl:';              // bl:{jti} → 1

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: Record<string, unknown>;
  isNewUser: boolean;
}

@Injectable()
export class AuthService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AuthService.name);
  private redis!: Redis;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL', 'redis://localhost:6379');
    this.redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    try {
      await this.redis.connect();
      this.logger.log('Redis connection established for auth');
    } catch {
      this.logger.warn(
        'Could not connect to Redis. OTP and token features will not work. Start Redis with: docker compose up -d redis',
      );
    }
  }

  async onModuleDestroy() {
    await this.redis?.quit();
  }

  // ═══════════════════════════════════════════════════════
  // OTP FLOW
  // ═══════════════════════════════════════════════════════

  /**
   * Send OTP to a phone number.
   * - Generates a 6-digit OTP
   * - Stores in Redis with 5-minute TTL
   * - Enforces 60-second cooldown between sends
   * - In development, logs OTP to console
   */
  async sendOtp(phone: string): Promise<{ expiresIn: number; retryAfter: number }> {
    // Check cooldown
    const cooldown = await this.redis.get(`${OTP_COOLDOWN_KEY}${phone}`);
    if (cooldown) {
      const ttl = await this.redis.ttl(`${OTP_COOLDOWN_KEY}${phone}`);
      throw new BadRequestException({
        code: 'OTP_COOLDOWN',
        message: `Please wait ${ttl} seconds before requesting another OTP`,
        retryAfter: ttl,
      });
    }

    // Generate OTP
    const otp = this.generateOtp();

    // Store OTP in Redis with expiry
    const pipeline = this.redis.pipeline();
    pipeline.set(`${OTP_KEY}${phone}`, otp, 'EX', OTP_EXPIRY_SECONDS);
    pipeline.set(`${OTP_COOLDOWN_KEY}${phone}`, '1', 'EX', OTP_COOLDOWN_SECONDS);
    pipeline.del(`${OTP_ATTEMPTS_KEY}${phone}`); // Reset attempts on new OTP
    await pipeline.exec();

    // In development, log OTP to console
    if (this.configService.get<string>('NODE_ENV') !== 'production') {
      this.logger.debug(`📱 OTP for ${phone}: ${otp}`);
    } else {
      // TODO: Integrate SMS provider (Twilio, Vonage, etc.)
      this.logger.log(`OTP sent to ${phone}`);
    }

    return {
      expiresIn: OTP_EXPIRY_SECONDS,
      retryAfter: OTP_COOLDOWN_SECONDS,
    };
  }

  /**
   * Verify OTP and return JWT tokens.
   * - Validates OTP against Redis store
   * - Creates user if first login (new_user tier)
   * - Returns access + refresh tokens
   */
  async verifyOtp(phone: string, code: string): Promise<AuthResult> {
    // Check attempt count
    const attempts = await this.redis.incr(`${OTP_ATTEMPTS_KEY}${phone}`);
    if (attempts === 1) {
      await this.redis.expire(`${OTP_ATTEMPTS_KEY}${phone}`, OTP_EXPIRY_SECONDS);
    }

    if (attempts > OTP_MAX_ATTEMPTS) {
      // Delete OTP to force re-send
      await this.redis.del(`${OTP_KEY}${phone}`, `${OTP_ATTEMPTS_KEY}${phone}`);
      throw new BadRequestException({
        code: 'OTP_MAX_ATTEMPTS',
        message: 'Too many verification attempts. Please request a new OTP.',
      });
    }

    // Retrieve stored OTP
    const storedOtp = await this.redis.get(`${OTP_KEY}${phone}`);
    if (!storedOtp) {
      throw new BadRequestException({
        code: 'OTP_EXPIRED',
        message: 'OTP has expired. Please request a new one.',
      });
    }

    if (storedOtp !== code) {
      throw new BadRequestException({
        code: 'OTP_INVALID',
        message: `Invalid OTP. ${OTP_MAX_ATTEMPTS - attempts} attempts remaining.`,
      });
    }

    // OTP is valid — clean up Redis
    await this.redis.del(
      `${OTP_KEY}${phone}`,
      `${OTP_ATTEMPTS_KEY}${phone}`,
      `${OTP_COOLDOWN_KEY}${phone}`,
    );

    // Find or create user
    const { user, isNewUser } = await this.findOrCreateUser(phone);

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user: this.sanitizeUser(user),
      isNewUser,
    };
  }

  // ═══════════════════════════════════════════════════════
  // TOKEN MANAGEMENT
  // ═══════════════════════════════════════════════════════

  /**
   * Refresh an access token using a valid refresh token.
   */
  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresIn: number }> {
    let payload: JwtPayload & { jti: string; type: string };

    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET', 'dev-jwt-refresh-secret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    // Check if token is blacklisted
    const isBlacklisted = await this.redis.get(`${BLACKLIST_KEY}${payload.jti}`);
    if (isBlacklisted) {
      throw new UnauthorizedException('Token has been revoked');
    }

    // Verify user still exists and is active
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || user.deletedAt) {
      throw new UnauthorizedException('User not found or account deleted');
    }

    // Generate new access token
    const accessToken = this.jwtService.sign(
      {
        sub: user.id,
        phone: user.phone,
        tier: user.permissionTier,
        type: 'access',
      } satisfies JwtPayload & { type: string },
      { expiresIn: ACCESS_TOKEN_EXPIRY },
    );

    return {
      accessToken,
      expiresIn: 900, // 15 minutes in seconds
    };
  }

  /**
   * Logout — blacklist the refresh token.
   */
  async logout(userId: string, refreshToken: string): Promise<void> {
    try {
      const payload = this.jwtService.verify<JwtPayload & { jti: string }>(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET', 'dev-jwt-refresh-secret'),
      });

      if (payload.sub !== userId) {
        throw new UnauthorizedException('Token does not belong to this user');
      }

      // Blacklist the refresh token until it would naturally expire
      const ttl = payload.exp ? payload.exp - Math.floor(Date.now() / 1000) : REFRESH_TOKEN_EXPIRY_SECONDS;
      if (ttl > 0) {
        await this.redis.set(`${BLACKLIST_KEY}${payload.jti}`, '1', 'EX', ttl);
      }

      // Remove from active refresh tokens
      await this.redis.del(`${REFRESH_TOKEN_KEY}${userId}:${payload.jti}`);
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      // If token is already expired or invalid, just ignore
      this.logger.debug('Logout with invalid token — ignored');
    }
  }

  // ═══════════════════════════════════════════════════════
  // SOCIAL LOGIN (Stubs)
  // ═══════════════════════════════════════════════════════

  /**
   * Google Sign-In — verify Google ID token and authenticate.
   * TODO: Integrate Google OAuth2 token verification in production.
   */
  async googleLogin(_idToken: string): Promise<AuthResult> {
    throw new BadRequestException({
      code: 'NOT_IMPLEMENTED',
      message: 'Google login is not yet configured. Use phone OTP login.',
    });
  }

  /**
   * Apple Sign-In — verify Apple identity token and authenticate.
   * TODO: Integrate Apple Sign In token verification in production.
   */
  async appleLogin(_identityToken: string, _authorizationCode: string): Promise<AuthResult> {
    throw new BadRequestException({
      code: 'NOT_IMPLEMENTED',
      message: 'Apple login is not yet configured. Use phone OTP login.',
    });
  }

  // ═══════════════════════════════════════════════════════
  // PRIVATE HELPERS
  // ═══════════════════════════════════════════════════════

  private generateOtp(): string {
    const digits = new Array(OTP_LENGTH)
      .fill(0)
      .map(() => Math.floor(Math.random() * 10))
      .join('');
    return digits;
  }

  private async findOrCreateUser(phone: string): Promise<{ user: Record<string, unknown>; isNewUser: boolean }> {
    const existingUser = await this.prisma.user.findUnique({
      where: { phone },
    });

    if (existingUser) {
      return { user: existingUser as unknown as Record<string, unknown>, isNewUser: false };
    }

    // Create new user with default "new_user" tier
    const newUser = await this.prisma.user.create({
      data: {
        phone,
        nameAr: 'مستخدم جديد', // "New User" in Arabic
        role: 'buyer',
        permissionTier: 'new_user',
      },
    });

    this.logger.log(`New user created: ${newUser.id} (${phone})`);
    return { user: newUser as unknown as Record<string, unknown>, isNewUser: true };
  }

  private async generateTokens(user: Record<string, unknown>): Promise<AuthTokens> {
    const jti = crypto.randomUUID();

    const payload: JwtPayload & { type: string } = {
      sub: user['id'] as string,
      phone: user['phone'] as string,
      tier: user['permissionTier'] as string,
      type: 'access',
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: ACCESS_TOKEN_EXPIRY,
    });

    const refreshToken = this.jwtService.sign(
      { ...payload, type: 'refresh', jti },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET', 'dev-jwt-refresh-secret'),
        expiresIn: REFRESH_TOKEN_EXPIRY,
      },
    );

    // Store refresh token reference in Redis
    await this.redis.set(
      `${REFRESH_TOKEN_KEY}${user['id']}:${jti}`,
      '1',
      'EX',
      REFRESH_TOKEN_EXPIRY_SECONDS,
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
    };
  }

  private sanitizeUser(user: Record<string, unknown>): Record<string, unknown> {
    const { ...safeUser } = user;
    delete safeUser['deletedAt'];
    return safeUser;
  }
}
