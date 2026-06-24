import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { VerificationService } from './verification.service';
import { AdminGuard } from '../admin/admin.guard';
import { UseGuards } from '@nestjs/common';
import { CurrentUser, type AuthUser } from '../auth/decorators/current-user.decorator';
import { SubmitVerificationDto, RejectVerificationDto } from './dto/verification.dto';

// PROD-5: KYC verification. Self-service submit/status (auth) + an admin review
// queue (AdminGuard).
@Controller({ path: '', version: '1' })
@ApiTags('Verification')
export class VerificationController {
  constructor(private readonly verification: VerificationService) {}

  @Post('me/verification')
  @ApiOperation({ summary: 'Submit identity (+ ownership) docs for verification' })
  submit(@CurrentUser() me: AuthUser, @Body() dto: SubmitVerificationDto) {
    return this.verification.submit(me.id, dto);
  }

  @Get('me/verification')
  @ApiOperation({ summary: 'My latest verification request + status' })
  mine(@CurrentUser() me: AuthUser) {
    return this.verification.mine(me.id);
  }

  @Get('admin/verifications')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Pending verification requests (admin)' })
  pending() {
    return this.verification.pending();
  }

  @Get('admin/verifications/count')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Pending verification count (admin nav badge)' })
  count() {
    return this.verification.pendingCount();
  }

  @Post('admin/verifications/:id/approve')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Approve -> verified + recompute trust (admin)' })
  approve(@Param('id') id: string) {
    return this.verification.approve(id);
  }

  @Post('admin/verifications/:id/reject')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Reject with a reason (admin)' })
  reject(@Param('id') id: string, @Body() dto: RejectVerificationDto) {
    return this.verification.reject(id, dto.reason);
  }
}
