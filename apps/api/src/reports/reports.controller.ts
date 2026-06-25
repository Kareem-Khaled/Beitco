import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { AdminGuard } from '../admin/admin.guard';
import { CurrentUser, type AuthUser } from '../auth/decorators/current-user.decorator';
import { CreateReportDto, AdminReportsQueryDto, UpdateReportDto } from './dto/reports.dto';

// ADMIN-5: reports. POST /reports is for any authed user; the /admin/reports
// triage surface is AdminGuard-only and audit-logs every status change.
@Controller({ version: '1' })
@ApiTags('Reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Post('reports')
  @ApiOperation({ summary: 'File a report against a listing/review/user/question' })
  create(@CurrentUser() me: AuthUser, @Body() dto: CreateReportDto) {
    return this.reports.create(me, dto);
  }

  @Get('admin/reports')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Triage queue (defaults to open + reviewing)' })
  async list(@Query() query: AdminReportsQueryDto) {
    const { data, meta } = await this.reports.list(query);
    return { success: true, data, meta };
  }

  @Get('admin/reports/count')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Open-report count (nav badge)' })
  count() {
    return this.reports.count();
  }

  @Patch('admin/reports/:id')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Set a report status (reviewing / resolved / dismissed)' })
  update(@CurrentUser() me: AuthUser, @Param('id') id: string, @Body() dto: UpdateReportDto) {
    return this.reports.updateStatus(me, id, dto);
  }
}
