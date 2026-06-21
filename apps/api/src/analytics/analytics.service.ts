import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { TrackEventDto, AnalyticsQueryDto } from './dto';
import Redis from 'ioredis';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  private redis: Redis | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    try {
      const redisUrl = this.config.get<string>('REDIS_URL') || 'redis://localhost:6379';
      this.redis = new Redis(redisUrl);
      this.logger.log('Redis connection established for analytics');
    } catch (err) {
      this.logger.warn('Redis not available for analytics — events will be logged only');
    }
  }

  /**
   * Get date range from period string.
   */
  private getDateRange(query: AnalyticsQueryDto): { start: Date; end: Date } {
    const end = query.endDate ? new Date(query.endDate) : new Date();
    let start: Date;

    if (query.startDate) {
      start = new Date(query.startDate);
    } else {
      switch (query.period) {
        case 'day':
          start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'month':
          start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'all':
          start = new Date(0);
          break;
        case 'week':
        default:
          start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
      }
    }

    return { start, end };
  }

  // ─── EVENT TRACKING ──────────────────────────────────

  /**
   * Track an analytics event.
   * Stores in Redis sorted set keyed by event type + date.
   */
  async trackEvent(userId: string | null, dto: TrackEventDto) {
    const event = {
      userId,
      eventType: dto.eventType,
      targetId: dto.targetId || null,
      targetType: dto.targetType || null,
      metadata: dto.metadata || null,
      timestamp: new Date().toISOString(),
    };

    // Store in Redis as a lightweight event log
    if (this.redis) {
      const dayKey = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const redisKey = `analytics:${dto.eventType}:${dayKey}`;
      await this.redis.lpush(redisKey, JSON.stringify(event));
      await this.redis.expire(redisKey, 90 * 24 * 60 * 60); // 90 day TTL

      // Increment daily counter
      const counterKey = `analytics:count:${dto.eventType}:${dayKey}`;
      await this.redis.incr(counterKey);
      await this.redis.expire(counterKey, 90 * 24 * 60 * 60);
    }

    this.logger.debug(`Event tracked: ${dto.eventType} by ${userId || 'anon'}`);

    return { tracked: true };
  }

  /**
   * Get event counts for a specific event type over a period.
   */
  async getEventCounts(eventType: string, query: AnalyticsQueryDto) {
    const { start, end } = this.getDateRange(query);
    const counts: Record<string, number> = {};

    if (this.redis) {
      const current = new Date(start);
      while (current <= end) {
        const dayKey = current.toISOString().slice(0, 10);
        const counterKey = `analytics:count:${eventType}:${dayKey}`;
        const count = await this.redis.get(counterKey);
        counts[dayKey] = count ? parseInt(count, 10) : 0;
        current.setDate(current.getDate() + 1);
      }
    }

    const total = Object.values(counts).reduce((sum, c) => sum + c, 0);

    return { eventType, period: query.period || 'week', counts, total };
  }

  // ─── POST ANALYTICS ──────────────────────────────────

  /**
   * Get analytics for a specific post.
   */
  async getPostAnalytics(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        authorId: true,
        viewCount: true,
        likeCount: true,
        commentCount: true,
        shareCount: true,
        createdAt: true,
        postType: true,
        status: true,
      },
    });

    if (!post || post.authorId !== userId) {
      throw new NotFoundException('Post not found');
    }

    // Calculate engagement rate
    const totalEngagement = post.likeCount + post.commentCount + post.shareCount;
    const engagementRate = post.viewCount > 0
      ? Math.round((totalEngagement / post.viewCount) * 10000) / 100
      : 0;

    // Days since creation
    const daysSinceCreation = Math.max(1, Math.floor(
      (Date.now() - post.createdAt.getTime()) / (24 * 60 * 60 * 1000),
    ));
    const viewsPerDay = Math.round((post.viewCount / daysSinceCreation) * 100) / 100;

    return {
      postId: post.id,
      postType: post.postType,
      status: post.status,
      views: post.viewCount,
      likes: post.likeCount,
      comments: post.commentCount,
      shares: post.shareCount,
      engagementRate,
      viewsPerDay,
      createdAt: post.createdAt,
    };
  }

  // ─── USER ANALYTICS ──────────────────────────────────

  /**
   * Get analytics for the current user's profile and content.
   */
  async getUserAnalytics(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        followerCount: true,
        followingCount: true,
        postCount: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Aggregate post stats
    const postStats = await this.prisma.post.aggregate({
      where: { authorId: userId, deletedAt: null },
      _sum: {
        viewCount: true,
        likeCount: true,
        commentCount: true,
        shareCount: true,
      },
    });

    // Top performing posts
    const topPosts = await this.prisma.post.findMany({
      where: { authorId: userId, deletedAt: null },
      select: {
        id: true,
        postType: true,
        contentText: true,
        viewCount: true,
        likeCount: true,
        commentCount: true,
        createdAt: true,
      },
      orderBy: { viewCount: 'desc' },
      take: 5,
    });

    // Listing stats (if any)
    const listingStats = await this.prisma.listing.aggregate({
      where: { agentId: userId, deletedAt: null },
      _sum: {
        viewCount: true,
        saveCount: true,
        inquiryCount: true,
      },
      _count: true,
    });

    const totalViews = postStats._sum.viewCount || 0;
    const totalLikes = postStats._sum.likeCount || 0;
    const totalComments = postStats._sum.commentCount || 0;
    const totalShares = postStats._sum.shareCount || 0;
    const totalEngagement = totalLikes + totalComments + totalShares;
    const engagementRate = totalViews > 0
      ? Math.round((totalEngagement / totalViews) * 10000) / 100
      : 0;

    return {
      userId: user.id,
      followers: user.followerCount,
      following: user.followingCount,
      totalPosts: user.postCount,
      content: {
        totalViews,
        totalLikes,
        totalComments,
        totalShares,
        engagementRate,
      },
      topPosts,
      listings: {
        count: listingStats._count,
        totalViews: listingStats._sum.viewCount || 0,
        totalSaves: listingStats._sum.saveCount || 0,
        totalInquiries: listingStats._sum.inquiryCount || 0,
      },
      memberSince: user.createdAt,
    };
  }

  // ─── LISTING ANALYTICS ───────────────────────────────

  /**
   * Get analytics for a specific listing.
   */
  async getListingAnalytics(listingId: string, userId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: {
        id: true,
        agentId: true,
        titleAr: true,
        listingType: true,
        propertyType: true,
        viewCount: true,
        saveCount: true,
        inquiryCount: true,
        price: true,
        createdAt: true,
        status: true,
      },
    });

    if (!listing || listing.agentId !== userId) {
      throw new NotFoundException('Listing not found');
    }

    // Days since creation
    const daysSinceCreation = Math.max(1, Math.floor(
      (Date.now() - listing.createdAt.getTime()) / (24 * 60 * 60 * 1000),
    ));
    const viewsPerDay = Math.round((listing.viewCount / daysSinceCreation) * 100) / 100;
    const conversionRate = listing.viewCount > 0
      ? Math.round((listing.inquiryCount / listing.viewCount) * 10000) / 100
      : 0;

    return {
      listingId: listing.id,
      title: listing.titleAr,
      listingType: listing.listingType,
      propertyType: listing.propertyType,
      status: listing.status,
      price: listing.price,
      views: listing.viewCount,
      saves: listing.saveCount,
      inquiries: listing.inquiryCount,
      viewsPerDay,
      conversionRate,
      createdAt: listing.createdAt,
    };
  }

  // ─── PLATFORM STATS ──────────────────────────────────

  /**
   * Get platform-wide stats (public — for landing/about pages).
   */
  async getPlatformStats() {
    const [totalUsers, totalPosts, totalListings, totalGroups] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.post.count({ where: { deletedAt: null, status: 'published' } }),
      this.prisma.listing.count({ where: { deletedAt: null, status: 'active' } }),
      this.prisma.group.count({ where: { deletedAt: null } }),
    ]);

    return {
      totalUsers,
      totalPosts,
      totalListings,
      totalGroups,
    };
  }
}
