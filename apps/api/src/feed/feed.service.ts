import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

const AUTHOR_SELECT = {
  id: true,
  username: true,
  nameAr: true,
  nameEn: true,
  avatarUrl: true,
  permissionTier: true,
  nationalIdVerified: true,
  followerCount: true,
} as const;

const POST_SELECT = {
  id: true,
  postType: true,
  contentText: true,
  media: true,
  hashtags: true,
  status: true,
  likeCount: true,
  commentCount: true,
  shareCount: true,
  viewCount: true,
  isPinned: true,
  metadata: true,
  groupId: true,
  listingId: true,
  videoId: true,
  repostOfId: true,
  createdAt: true,
  updatedAt: true,
  author: { select: AUTHOR_SELECT },
} as const;

@Injectable()
export class FeedService {
  constructor(private readonly prisma: PrismaService) {}

  // ═══════════════════════════════════════════════════════
  // FOR YOU — engagement-weighted algorithm
  // ═══════════════════════════════════════════════════════

  async getForYou(userId: string, query: PaginationQueryDto) {
    const { cursor, limit = 20 } = query;
    const blockedIds = await this.getBlockedUserIds(userId);

    const posts = await this.prisma.post.findMany({
      where: {
        status: 'published',
        deletedAt: null,
        authorId: { notIn: [userId, ...blockedIds] },
      },
      select: POST_SELECT,
      orderBy: [
        { isPinned: 'desc' },
        { likeCount: 'desc' },
        { commentCount: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = posts.length > limit;
    const data = hasMore ? posts.slice(0, limit) : posts;
    const nextCursor = hasMore ? data[data.length - 1]?.id : undefined;

    return {
      data: data.map((post) => ({
        ...post,
        feedSource: 'for_you' as const,
        feedReason: post.likeCount > 10 ? 'trending' : 'suggested',
      })),
      meta: { cursor: nextCursor ?? null, hasMore },
    };
  }

  // ═══════════════════════════════════════════════════════
  // FOLLOWING — chronological from followed users
  // ═══════════════════════════════════════════════════════

  async getFollowing(userId: string, query: PaginationQueryDto) {
    const { cursor, limit = 20 } = query;

    // Get list of users we follow
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    const followingIds = following.map((f) => f.followingId);

    if (followingIds.length === 0) {
      return { data: [], meta: { cursor: null, hasMore: false } };
    }

    const posts = await this.prisma.post.findMany({
      where: {
        status: 'published',
        deletedAt: null,
        authorId: { in: followingIds },
      },
      select: POST_SELECT,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = posts.length > limit;
    const data = hasMore ? posts.slice(0, limit) : posts;
    const nextCursor = hasMore ? data[data.length - 1]?.id : undefined;

    return {
      data: data.map((post) => ({
        ...post,
        feedSource: 'following' as const,
      })),
      meta: { cursor: nextCursor ?? null, hasMore },
    };
  }

  // ═══════════════════════════════════════════════════════
  // VIDEOS — video posts only
  // ═══════════════════════════════════════════════════════

  async getVideos(userId: string, query: PaginationQueryDto) {
    const { cursor, limit = 10 } = query;
    const blockedIds = await this.getBlockedUserIds(userId);

    const posts = await this.prisma.post.findMany({
      where: {
        status: 'published',
        deletedAt: null,
        postType: 'video',
        authorId: { notIn: [userId, ...blockedIds] },
      },
      select: POST_SELECT,
      orderBy: [
        { viewCount: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = posts.length > limit;
    const data = hasMore ? posts.slice(0, limit) : posts;
    const nextCursor = hasMore ? data[data.length - 1]?.id : undefined;

    return {
      data: data.map((post) => ({
        ...post,
        feedSource: 'videos' as const,
      })),
      meta: { cursor: nextCursor ?? null, hasMore },
    };
  }

  // ═══════════════════════════════════════════════════════
  // TRENDING — trending hashtags + popular posts
  // ═══════════════════════════════════════════════════════

  async getTrending() {
    // Get popular posts from last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const posts = await this.prisma.post.findMany({
      where: {
        status: 'published',
        deletedAt: null,
        createdAt: { gte: sevenDaysAgo },
      },
      select: POST_SELECT,
      orderBy: [
        { likeCount: 'desc' },
        { commentCount: 'desc' },
        { shareCount: 'desc' },
      ],
      take: 20,
    });

    // Aggregate hashtags from recent posts
    const hashtagMap = new Map<string, number>();
    for (const post of posts) {
      const tags = post.hashtags as string[] | null;
      if (tags) {
        for (const tag of tags) {
          hashtagMap.set(tag, (hashtagMap.get(tag) ?? 0) + 1);
        }
      }
    }

    const hashtags = [...hashtagMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, postCount]) => ({ tag, postCount }));

    return {
      hashtags,
      posts: posts.slice(0, 10),
    };
  }

  // ═══════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════

  private async getBlockedUserIds(userId: string): Promise<string[]> {
    const blocksOut = await this.prisma.block.findMany({
      where: { blockerId: userId },
      select: { blockedId: true },
    });
    const blocksIn = await this.prisma.block.findMany({
      where: { blockedId: userId },
      select: { blockerId: true },
    });
    return [
      ...blocksOut.map((b) => b.blockedId),
      ...blocksIn.map((b) => b.blockerId),
    ];
  }
}
