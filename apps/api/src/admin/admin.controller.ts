import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AdminGuard } from './admin.guard';
import { RejectListingDto } from '../listings/dto/create-listing.dto';

// MOD-1 admin moderation queue. Admin-only (AdminGuard after global JwtAuthGuard).
@Controller({ path: 'admin/moderation', version: '1' })
@ApiTags('Admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get()
  @ApiOperation({ summary: 'Pending listings awaiting approval' })
  pending() {
    return this.admin.pendingListings();
  }

  @Get('count')
  @ApiOperation({ summary: 'Pending count (for the nav badge)' })
  count() {
    return this.admin.pendingCount();
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve a listing -> published' })
  approve(@Param('id') id: string) {
    return this.admin.approve(id);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject a listing with a reason' })
  reject(@Param('id') id: string, @Body() dto: RejectListingDto) {
    return this.admin.reject(id, dto.reason);
  }
}
