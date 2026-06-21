import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { RequireTier } from '../auth/decorators/require-tier.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { TrackEventDto, AnalyticsQueryDto } from './dto';

/**
 * Analytics endpoints.
 * Event tracking, post/user/listing analytics, platform stats.
 */
@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  // ─── EVENT TRACKING ──────────────────────────────────

  @Post('events')
  @RequireTier(5)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Track an analytics event' })
  async trackEvent(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: TrackEventDto,
  ) {
    const result = await this.analyticsService.trackEvent(user.id, dto);
    return { success: true, data: result };
  }

  @Get('events/:eventType')
  @RequireTier(1)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get event counts (admin only)' })
  async getEventCounts(
    @Param('eventType') eventType: string,
    @Query() query: AnalyticsQueryDto,
  ) {
    const result = await this.analyticsService.getEventCounts(eventType, query);
    return { success: true, data: result };
  }

  // ─── POST ANALYTICS ──────────────────────────────────

  @Get('posts/:id')
  @RequireTier(5)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get analytics for a specific post (author only)' })
  async getPostAnalytics(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.analyticsService.getPostAnalytics(id, user.id);
    return { success: true, data };
  }

  // ─── USER ANALYTICS ──────────────────────────────────

  @Get('users/me')
  @RequireTier(5)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get analytics for current user' })
  async getUserAnalytics(@CurrentUser() user: AuthenticatedUser) {
    const data = await this.analyticsService.getUserAnalytics(user.id);
    return { success: true, data };
  }

  // ─── LISTING ANALYTICS ───────────────────────────────

  @Get('listings/:id')
  @RequireTier(5)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get analytics for a specific listing (agent only)' })
  async getListingAnalytics(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.analyticsService.getListingAnalytics(id, user.id);
    return { success: true, data };
  }

  // ─── PLATFORM STATS ──────────────────────────────────

  @Get('platform')
  @Public()
  @ApiOperation({ summary: 'Get public platform stats' })
  async getPlatformStats() {
    const data = await this.analyticsService.getPlatformStats();
    return { success: true, data };
  }
}
