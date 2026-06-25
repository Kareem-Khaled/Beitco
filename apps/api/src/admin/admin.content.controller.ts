import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from './admin.guard';
import { AdminContentService } from './admin.content.service';
import { CurrentUser, type AuthUser } from '../auth/decorators/current-user.decorator';
import { AdminReviewsQueryDto, RemoveContentDto } from './dto/admin-content.dto';

// ADMIN-4: content moderation (reviews + Q&A). Admin-only; every removal/restore
// is audit-logged and recomputes the listing's trust.
@Controller({ path: 'admin', version: '1' })
@ApiTags('Admin')
@UseGuards(AdminGuard)
export class AdminContentController {
  constructor(private readonly content: AdminContentService) {}

  @Get('reviews')
  @ApiOperation({ summary: 'Search / filter reviews (incl. removed)' })
  async listReviews(@Query() query: AdminReviewsQueryDto) {
    const { data, meta } = await this.content.listReviews(query);
    return { success: true, data, meta };
  }

  @Post('reviews/:id/remove')
  @ApiOperation({ summary: 'Soft-remove a review (recomputes trust)' })
  removeReview(@CurrentUser() me: AuthUser, @Param('id') id: string, @Body() dto: RemoveContentDto) {
    return this.content.removeReview(me, id, dto);
  }

  @Post('reviews/:id/restore')
  @ApiOperation({ summary: 'Restore a removed review (recomputes trust)' })
  restoreReview(@CurrentUser() me: AuthUser, @Param('id') id: string) {
    return this.content.restoreReview(me, id);
  }

  @Post('questions/:id/remove')
  @ApiOperation({ summary: 'Soft-remove a question' })
  removeQuestion(@CurrentUser() me: AuthUser, @Param('id') id: string, @Body() dto: RemoveContentDto) {
    return this.content.removeQuestion(me, id, dto);
  }

  @Post('questions/:id/restore')
  @ApiOperation({ summary: 'Restore a removed question' })
  restoreQuestion(@CurrentUser() me: AuthUser, @Param('id') id: string) {
    return this.content.restoreQuestion(me, id);
  }
}
