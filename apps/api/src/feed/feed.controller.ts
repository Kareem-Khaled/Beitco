import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, Public } from '../auth/decorators';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { FeedService } from './feed.service';

@ApiTags('Feed')
@Controller('feed')
@UseGuards(JwtAuthGuard)
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  // ═══════════════════════════════════════════════════════
  // GET /feed — For You (algorithmic)
  // ═══════════════════════════════════════════════════════

  @Get()
  async getForYou(
    @CurrentUser('id') userId: string,
    @Query() query: PaginationQueryDto,
  ) {
    const result = await this.feedService.getForYou(userId, query);
    return { success: true, data: result.data, meta: result.meta };
  }

  // ═══════════════════════════════════════════════════════
  // GET /feed/following — chronological from followed users
  // ═══════════════════════════════════════════════════════

  @Get('following')
  async getFollowing(
    @CurrentUser('id') userId: string,
    @Query() query: PaginationQueryDto,
  ) {
    const result = await this.feedService.getFollowing(userId, query);
    return { success: true, data: result.data, meta: result.meta };
  }

  // ═══════════════════════════════════════════════════════
  // GET /feed/videos — video posts only
  // ═══════════════════════════════════════════════════════

  @Get('videos')
  async getVideos(
    @CurrentUser('id') userId: string,
    @Query() query: PaginationQueryDto,
  ) {
    const result = await this.feedService.getVideos(userId, query);
    return { success: true, data: result.data, meta: result.meta };
  }

  // ═══════════════════════════════════════════════════════
  // GET /feed/trending — public, trending hashtags + posts
  // ═══════════════════════════════════════════════════════

  @Get('trending')
  @Public()
  async getTrending() {
    const result = await this.feedService.getTrending();
    return { success: true, data: result };
  }
}
