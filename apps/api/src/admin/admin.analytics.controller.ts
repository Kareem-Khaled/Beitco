import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from './admin.guard';
import { AdminAnalyticsService } from './admin.analytics.service';
import { AnalyticsTimeseriesDto } from './dto/admin-analytics.dto';

// ADMIN-9: analytics & insights. Admin-only.
@Controller({ path: 'admin/analytics', version: '1' })
@ApiTags('Admin')
@UseGuards(AdminGuard)
export class AdminAnalyticsController {
  constructor(private readonly analytics: AdminAnalyticsService) {}

  @Get('timeseries')
  @ApiOperation({ summary: 'Daily counts for a metric (signups/listings/leads/tenancies)' })
  timeseries(@Query() query: AnalyticsTimeseriesDto) {
    return this.analytics.timeseries(query);
  }

  @Get('funnel')
  @ApiOperation({ summary: 'Conversion funnel (browse -> lead -> approved -> move-in) + rates' })
  funnel() {
    return this.analytics.funnel();
  }

  @Get('areas')
  @ApiOperation({ summary: 'Supply vs demand per area (where to seed supply)' })
  async areas() {
    const data = await this.analytics.areas();
    return { success: true, data };
  }
}
