import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AdminAuditService } from './admin.audit.service';
import { AdminGuard } from './admin.guard';
import { AdminAuditQueryDto } from './dto/admin-users.dto';

// ADMIN-1: the platform-operator portal surface (separate from the per-listing
// moderation queue at /admin/moderation). Admin-only (AdminGuard after the
// global JwtAuthGuard).
@Controller({ path: 'admin', version: '1' })
@ApiTags('Admin')
@UseGuards(AdminGuard)
export class AdminOverviewController {
  constructor(
    private readonly admin: AdminService,
    private readonly audit: AdminAuditService,
  ) {}

  @Get('stats')
  @ApiOperation({ summary: 'Platform overview KPIs (users, listings, engagement, queues)' })
  stats() {
    return this.admin.platformStats();
  }

  @Get('audit')
  @ApiOperation({ summary: 'Admin audit log (newest first, cursor-paginated)' })
  async auditLog(@Query() query: AdminAuditQueryDto) {
    const { data, meta } = await this.audit.list(query);
    return { success: true, data, meta };
  }
}
