import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SearchService } from '../search/search.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostQueryDto } from './dto/post-query.dto';

/** Tier numbers — lower = higher privilege */
const TIER_LEVELS: Record<string, number> = {
  admin: 1,
  verified_contributor: 2,
  trusted_member: 3,
  new_user: 4,
  restricted: 5,
};

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
  approvalStatus: true,
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

/** 24 hours in milliseconds */
const EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly search: SearchService,
  ) {}

  /**
   * Create a post.
   * - Tier 1-2 (admin, verified_contributor): auto-publish
   * - Tier 3 (trusted_member): pending approval
   * - Tier 4+ (new_user, restricted): blocked by TierGuard (requires @RequireTier(3))
   */
  async create(userId: string, permissionTier: string, dto: CreatePostDto) {
    const tierLevel = TIER_LEVELS[permissionTier] ?? 5;

    // Determine status based on tier
    const isAutoApproved = tierLevel <= 2;
    const status = isAutoApproved ? 'published' : 'pending_approval';
    const approvalStatus = isAutoApproved ? 'auto_approved' : 'pending';

    // Extract hashtags from content if not provided
    const hashtags = dto.hashtags ?? this.extractHashtags(dto.contentText ?? '');

    const post = await this.prisma.post.create({
      data: {
        authorId: userId,
        postType: dto.postType,
        contentText: dto.contentText,
        media: dto.media ? JSON.parse(dto.media) : [],
        listingId: dto.listingId,
        videoId: dto.videoId,
        groupId: dto.groupId,
        repostOfId: dto.repostOfId,
        hashtags,
        status,
        approvalStatus,
        metadata: dto.metadata ? JSON.parse(dto.metadata) : {},
      },
      select: POST_SELECT,
    });

    // Increment user post count
    await this.prisma.user.update({
      where: { id: userId },
      data: { postCount: { increment: 1 } },
    });

    this.logger.log(`Post created: ${post.id} (status: ${status}, tier: ${permissionTier})`);

    // Index in search if published
    if (status === 'published') {
      void this.search.indexPost({
        id: post.id,
        contentText: post.contentText,
        contentAr: post.contentText,
        postType: post.postType,
        hashtags: post.hashtags as string[],
        status: post.status,
        likeCount: post.likeCount,
        commentCount: post.commentCount,
        shareCount: post.shareCount,
        groupId: post.groupId,
        authorId: post.author.id,
        authorName: post.author.nameAr,
        createdAt: post.createdAt,
      });
    }

    return { post, isAutoApproved };
  }

  /**
   * Get a single post by ID (must be published, or author/admin can see any status).
   */
  async findById(postId: string, requesterId?: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId, deletedAt: null },
      select: POST_SELECT,
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Non-published posts only visible to author or admin
    if (post.status !== 'published') {
      if (!requesterId || post.author.id !== requesterId) {
        throw new NotFoundException('Post not found');
      }
    }

    return post;
  }

  /**
   * List posts with cursor-based pagination and optional filters.
   */
  async findAll(query: PostQueryDto) {
    const where: Record<string, unknown> = {
      status: 'published',
      deletedAt: null,
    };

    if (query.postType) {
      where.postType = query.postType;
    }
    if (query.groupId) {
      where.groupId = query.groupId;
    }
    if (query.hashtag) {
      where.hashtags = { has: query.hashtag };
    }

    const limit = query.limit ?? 20;

    const posts = await this.prisma.post.findMany({
      where,
      select: POST_SELECT,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(query.cursor
        ? { cursor: { id: query.cursor }, skip: 1 }
        : {}),
    });

    const hasMore = posts.length > limit;
    const items = hasMore ? posts.slice(0, limit) : posts;
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1]!.id : null;

    return {
      items,
      meta: { cursor: nextCursor, hasMore },
    };
  }

  /**
   * Update a post (author only, within 24-hour edit window).
   */
  async update(postId: string, userId: string, dto: UpdatePostDto) {
    const existing = await this.prisma.post.findUnique({
      where: { id: postId, deletedAt: null },
      select: { id: true, authorId: true, createdAt: true },
    });

    if (!existing) {
      throw new NotFoundException('Post not found');
    }

    if (existing.authorId !== userId) {
      throw new ForbiddenException('You can only edit your own posts');
    }

    // Check 24-hour edit window
    const elapsed = Date.now() - existing.createdAt.getTime();
    if (elapsed > EDIT_WINDOW_MS) {
      throw new ForbiddenException({
        code: 'EDIT_WINDOW_EXPIRED',
        message: 'Posts can only be edited within 24 hours of creation',
      });
    }

    const updateData: Record<string, unknown> = {};
    if (dto.contentText !== undefined) updateData.contentText = dto.contentText;
    if (dto.media !== undefined) updateData.media = JSON.parse(dto.media);
    if (dto.metadata !== undefined) updateData.metadata = JSON.parse(dto.metadata);
    if (dto.hashtags !== undefined) {
      updateData.hashtags = dto.hashtags;
    } else if (dto.contentText) {
      updateData.hashtags = this.extractHashtags(dto.contentText);
    }

    const updated = await this.prisma.post.update({
      where: { id: postId },
      data: updateData,
      select: POST_SELECT,
    });

    return updated;
  }

  /**
   * Soft-delete a post (author or admin).
   */
  async softDelete(postId: string, userId: string, permissionTier: string) {
    const existing = await this.prisma.post.findUnique({
      where: { id: postId, deletedAt: null },
      select: { id: true, authorId: true },
    });

    if (!existing) {
      throw new NotFoundException('Post not found');
    }

    const tierLevel = TIER_LEVELS[permissionTier] ?? 5;
    const isAdmin = tierLevel === 1;

    if (existing.authorId !== userId && !isAdmin) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    await this.prisma.post.update({
      where: { id: postId },
      data: {
        deletedAt: new Date(),
        status: 'deleted',
      },
    });

    // Decrement user post count
    await this.prisma.user.update({
      where: { id: existing.authorId },
      data: { postCount: { decrement: 1 } },
    });
  }

  /**
   * Approve a pending post (admin/moderator).
   */
  async approve(postId: string, reviewerId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, status: true, authorId: true },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.status !== 'pending_approval') {
      throw new ForbiddenException('Only pending posts can be approved');
    }

    const updated = await this.prisma.post.update({
      where: { id: postId },
      data: {
        status: 'published',
        approvalStatus: 'approved',
        approvalReviewedBy: reviewerId,
        approvalReviewedAt: new Date(),
      },
      select: POST_SELECT,
    });

    // Notify the post author
    void this.notifications.create(
      post.authorId,
      'post_approval',
      'تمت الموافقة على منشورك',
      'تم نشر منشورك بنجاح',
      { postId },
    );

    // Index in search now that it's published
    void this.search.indexPost({
      id: updated.id,
      contentText: updated.contentText,
      contentAr: updated.contentText,
      postType: updated.postType,
      hashtags: updated.hashtags as string[],
      status: updated.status,
      likeCount: updated.likeCount,
      commentCount: updated.commentCount,
      shareCount: updated.shareCount,
      groupId: updated.groupId,
      authorId: updated.author.id,
      authorName: updated.author.nameAr,
      createdAt: updated.createdAt,
    });

    this.logger.log(`Post approved: ${postId} by ${reviewerId}`);
    return updated;
  }

  /**
   * Reject a pending post (admin/moderator).
   */
  async reject(postId: string, reviewerId: string, reason: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, status: true, authorId: true },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.status !== 'pending_approval') {
      throw new ForbiddenException('Only pending posts can be rejected');
    }

    const updated = await this.prisma.post.update({
      where: { id: postId },
      data: {
        status: 'rejected',
        approvalStatus: 'rejected',
        approvalReviewedBy: reviewerId,
        approvalReviewedAt: new Date(),
        rejectionReason: reason,
      },
      select: POST_SELECT,
    });

    // Notify the post author
    void this.notifications.create(
      post.authorId,
      'post_approval',
      'تم رفض منشورك',
      `سبب الرفض: ${reason}`,
      { postId, reason },
    );

    this.logger.log(`Post rejected: ${postId} by ${reviewerId} — ${reason}`);
    return updated;
  }

  /**
   * Get the authenticated user's pending posts.
   */
  async getMyPendingPosts(userId: string, cursor?: string, limit: number = 20) {
    const posts = await this.prisma.post.findMany({
      where: {
        authorId: userId,
        status: 'pending_approval',
        deletedAt: null,
      },
      select: POST_SELECT,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = posts.length > limit;
    const items = hasMore ? posts.slice(0, limit) : posts;
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1]!.id : null;

    return {
      items,
      meta: { cursor: nextCursor, hasMore },
    };
  }

  /**
   * Extract hashtags from Arabic/English text.
   * Supports both Arabic (#عقارات) and Latin (#realestate) hashtags.
   */
  private extractHashtags(text: string): string[] {
    const regex = /#([\p{L}\p{N}_]+)/gu;
    const tags: string[] = [];
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match[1]) {
        tags.push(match[1]);
      }
    }

    return [...new Set(tags)]; // deduplicate
  }
}
