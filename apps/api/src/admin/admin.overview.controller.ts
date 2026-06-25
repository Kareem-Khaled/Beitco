import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AdminGuard } from './admin.guard';

// ADMIN-1: the platform-operator portal surface (separate from the per-listing
// moderation queue at /admin/moderation). Admin-only (AdminGuard after the
// global JwtAuthGuard).
@Controller({ path: 'admin', version: '1' })
@ApiTags('Admin')
@UseGuards(AdminGuard)
export class AdminOverviewController {
  constructor(private readonly admin: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Platform overview KPIs (users, listings, engagement, queues)' })
  stats() {
    return this.admin.platformStats();
  }
}
