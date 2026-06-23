import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

export interface JwtPayload {
  sub: string; // userId (UUID)
  phone: string;
  type?: string; // 'access' | 'refresh'
  iat?: number;
  exp?: number;
}

// Pull the access token from the httpOnly cookie first, then the Bearer header
// (lets the SSR frontend send a cookie and tools send a header).
function cookieOrBearer(req: Request): string | null {
  const cookieToken = (req.cookies as Record<string, string> | undefined)?.beitco_at;
  if (cookieToken) return cookieToken;
  return ExtractJwt.fromAuthHeaderAsBearerToken()(req);
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    // Guaranteed present by validateEnv (SEC-1).
    const secret = configService.get<string>('JWT_SECRET')!;
    super({
      jwtFromRequest: cookieOrBearer,
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        phone: true,
        name: true,
        role: true,
        isAdmin: true,
        verified: true,
        verificationStatus: true,
        deletedAt: true,
      },
    });

    if (!user || user.deletedAt) {
      throw new UnauthorizedException('User not found or account deleted');
    }

    // Returned object is attached to req.user (see @CurrentUser()).
    return {
      id: user.id,
      phone: user.phone,
      name: user.name,
      role: user.role,
      isAdmin: user.isAdmin,
      verified: user.verified,
      verificationStatus: user.verificationStatus,
    };
  }
}
