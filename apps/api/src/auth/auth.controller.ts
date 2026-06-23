import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { CurrentUser, type AuthUser } from './decorators/current-user.decorator';
import { SendOtpDto, VerifyOtpDto, CompleteProfileDto } from './dto/auth.dto';

const AT_COOKIE = 'beitco_at';
const RT_COOKIE = 'beitco_rt';

function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  const secure = process.env.NODE_ENV === 'production';
  res.cookie(AT_COOKIE, accessToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000,
    path: '/',
  });
  res.cookie(RT_COOKIE, refreshToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

@Controller({ path: 'auth', version: '1' })
@ApiTags('Auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 300_000 } }) // SEC-4: max 5 sends / 5 min per IP
  @Post('otp/send')
  @ApiOperation({ summary: 'Send a login OTP to an Egyptian phone number' })
  sendOtp(@Body() dto: SendOtpDto) {
    return this.auth.sendOtp(dto.phone);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 300_000 } }) // SEC-4: max 10 verify attempts / 5 min per IP
  @Post('otp/verify')
  @ApiOperation({ summary: 'Verify the OTP, issue a session (httpOnly cookies)' })
  async verifyOtp(@Body() dto: VerifyOtpDto, @Res({ passthrough: true }) res: Response) {
    const { tokens, user, isNewUser } = await this.auth.verifyOtp(dto.phone, dto.code);
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    return { user, isNewUser, accessToken: tokens.accessToken };
  }

  @Post('complete-profile')
  @ApiOperation({ summary: 'Finish a new user profile (name, role, gender)' })
  completeProfile(@CurrentUser() me: AuthUser, @Body() dto: CompleteProfileDto) {
    return this.auth.completeProfile(me.id, dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Current authenticated user' })
  me(@CurrentUser() me: AuthUser) {
    return this.auth.me(me.id);
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh the access token from the refresh cookie' })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const rt = (req.cookies as Record<string, string> | undefined)?.[RT_COOKIE];
    const { accessToken, expiresIn } = await this.auth.refresh(rt ?? '');
    const secure = process.env.NODE_ENV === 'production';
    res.cookie(AT_COOKIE, accessToken, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
      path: '/',
    });
    return { accessToken, expiresIn };
  }

  @Post('logout')
  @ApiOperation({ summary: 'Log out and revoke the refresh token' })
  async logout(@CurrentUser() me: AuthUser, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const rt = (req.cookies as Record<string, string> | undefined)?.[RT_COOKIE];
    await this.auth.logout(me.id, rt);
    res.clearCookie(AT_COOKIE, { path: '/' });
    res.clearCookie(RT_COOKIE, { path: '/' });
    return { ok: true };
  }
}
