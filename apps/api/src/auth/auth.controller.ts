import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import {
  SendOtpDto,
  VerifyOtpDto,
  RefreshTokenDto,
  GoogleLoginDto,
  AppleLoginDto,
} from './dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ─── OTP Flow ──────────────────────────────────────

  @Public()
  @Post('otp/send')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send OTP to phone number' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  @ApiResponse({ status: 400, description: 'Invalid phone or cooldown active' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async sendOtp(@Body() dto: SendOtpDto) {
    const result = await this.authService.sendOtp(dto.phone);
    return { success: true, data: result };
  }

  @Public()
  @Post('otp/verify')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP and get JWT tokens' })
  @ApiResponse({ status: 200, description: 'Authentication successful' })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    const result = await this.authService.verifyOtp(dto.phone, dto.code);
    return { success: true, data: result };
  }

  // ─── Token Refresh ─────────────────────────────────

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'New access token returned' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(@Body() dto: RefreshTokenDto) {
    const result = await this.authService.refreshAccessToken(dto.refreshToken);
    return { success: true, data: result };
  }

  // ─── Social Login ──────────────────────────────────

  @Public()
  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with Google' })
  @ApiResponse({ status: 200, description: 'Authentication successful' })
  @ApiResponse({ status: 400, description: 'Invalid Google token or not implemented' })
  async googleLogin(@Body() dto: GoogleLoginDto) {
    const result = await this.authService.googleLogin(dto.idToken);
    return { success: true, data: result };
  }

  @Public()
  @Post('apple')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with Apple' })
  @ApiResponse({ status: 200, description: 'Authentication successful' })
  @ApiResponse({ status: 400, description: 'Invalid Apple token or not implemented' })
  async appleLogin(@Body() dto: AppleLoginDto) {
    const result = await this.authService.appleLogin(
      dto.identityToken,
      dto.authorizationCode,
    );
    return { success: true, data: result };
  }

  // ─── Logout ────────────────────────────────────────

  @Delete('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and invalidate refresh token' })
  @ApiResponse({ status: 204, description: 'Logged out successfully' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  async logout(
    @CurrentUser('id') userId: string,
    @Body() dto: RefreshTokenDto,
  ) {
    await this.authService.logout(userId, dto.refreshToken);
  }
}
