import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ModerationService } from './moderation.service';
import { RequireTier } from '../auth/decorators/require-tier.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { ModerationRejectDto, ModerateContentDto } from './dto';

/**
 * Moderation endpoints — Admin only (Tier 1).
 * Content moderation pipeline, review queue, approval/rejection.
 */
@ApiTags('Moderation')
@ApiBearerAuth()
@Controller('moderation')
@RequireTier(1)
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  // ─── PIPELINE ────────────────────────────────────────

  @Post('check')
  @ApiOperation({ summary: 'Run moderation check on text content (admin testing)' })
  async checkContent(@Body() dto: ModerateContentDto) {
    const mediaUrls = dto.mediaUrls ? JSON.parse(dto.mediaUrls) : [];
    const result = await this.moderationService.moderate(dto.text, mediaUrls);
    return { success: true, data: result };
  }

  @Post('posts/:id/moderate')
  @ApiOperation({ summary: 'Run moderation pipeline on a specific post' })
  async moderatePost(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.moderationService.moderatePost(id);
    return { success: true, data: result };
  }

  @Post('comments/:id/moderate')
  @ApiOperation({ summary: 'Run moderation pipeline on a specific comment' })
  async moderateComment(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.moderationService.moderateComment(id);
    return { success: true, data: result };
  }

  // ─── QUEUE ───────────────────────────────────────────

  @Get('queue')
  @ApiOperation({ summary: 'Get moderation queue (flagged posts pending review)' })
  async getQueue(@Query() query: PaginationQueryDto) {
    const result = await this.moderationService.getModerationQueue(query.cursor, query.limit);
    return { success: true, data: result.items, meta: result.meta };
  }

  // ─── REVIEW ──────────────────────────────────────────

  @Get('posts/:id')
  @ApiOperation({ summary: 'Get moderation details for a post' })
  async getPostDetails(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.moderationService.getPostModerationDetails(id);
    return { success: true, data };
  }

  @Patch('posts/:id/approve')
  @ApiOperation({ summary: 'Approve a flagged post' })
  async approvePost(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.moderationService.approvePost(id, user.id);
    return { success: true, data };
  }

  @Patch('posts/:id/reject')
  @ApiOperation({ summary: 'Reject a flagged post' })
  async rejectPost(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ModerationRejectDto,
  ) {
    const data = await this.moderationService.rejectPost(id, user.id, dto.reason);
    return { success: true, data };
  }

  // ─── STATS ───────────────────────────────────────────

  @Get('stats')
  @ApiOperation({ summary: 'Get moderation statistics' })
  async getStats() {
    const data = await this.moderationService.getStats();
    return { success: true, data };
  }
}
