import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentQueryDto } from './dto/comment-query.dto';

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

const COMMENT_SELECT = {
  id: true,
  postId: true,
  authorId: true,
  parentCommentId: true,
  content: true,
  likeCount: true,
  isPinned: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  author: { select: AUTHOR_SELECT },
} as const;

/** 15 minutes in milliseconds */
const EDIT_WINDOW_MS = 15 * 60 * 1000;

@Injectable()
export class CommentsService {
  private readonly logger = new Logger(CommentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  // ═══════════════════════════════════════════════════════
  // CREATE
  // ═══════════════════════════════════════════════════════

  async create(postId: string, userId: string, dto: CreateCommentDto) {
    // Verify post exists and is published
    const post = await this.prisma.post.findUnique({
      where: { id: postId, deletedAt: null },
      select: { id: true, status: true, authorId: true },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    if (post.status !== 'published') {
      throw new BadRequestException('Cannot comment on an unpublished post');
    }

    // If replying, verify parent comment exists on same post
    if (dto.parentCommentId) {
      const parent = await this.prisma.comment.findUnique({
        where: { id: dto.parentCommentId, deletedAt: null },
        select: { id: true, postId: true },
      });
      if (!parent) {
        throw new NotFoundException('Parent comment not found');
      }
      if (parent.postId !== postId) {
        throw new BadRequestException('Parent comment does not belong to this post');
      }
    }

    // Create comment + increment post.commentCount
    const comment = await this.prisma.$transaction(async (tx) => {
      const c = await tx.comment.create({
        data: {
          postId,
          authorId: userId,
          content: dto.content,
          parentCommentId: dto.parentCommentId ?? null,
        },
        select: COMMENT_SELECT,
      });

      await tx.post.update({
        where: { id: postId },
        data: { commentCount: { increment: 1 } },
      });

      return c;
    });

    this.logger.log(`Comment ${comment.id} created on post ${postId} by ${userId}`);

    // Notify post author (don't notify self-comments)
    if (post.authorId !== userId) {
      void this.notifications.create(
        post.authorId,
        'comment',
        'تعليق جديد',
        'علّق شخص على منشورك',
        { postId, commentId: comment.id, commenterId: userId },
      );
    }

    return comment;
  }

  // ═══════════════════════════════════════════════════════
  // LIST BY POST (threaded)
  // ═══════════════════════════════════════════════════════

  async findByPost(postId: string, query: CommentQueryDto) {
    // Verify post exists
    const post = await this.prisma.post.findUnique({
      where: { id: postId, deletedAt: null },
      select: { id: true },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const { cursor, limit = 20, sort = 'newest' } = query;

    const orderBy =
      sort === 'most_liked'
        ? [{ isPinned: 'desc' as const }, { likeCount: 'desc' as const }, { createdAt: 'desc' as const }]
        : [{ isPinned: 'desc' as const }, { createdAt: 'desc' as const }];

    // Fetch top-level comments only (parentCommentId = null)
    const comments = await this.prisma.comment.findMany({
      where: {
        postId,
        parentCommentId: null,
        deletedAt: null,
        status: 'visible',
      },
      select: {
        ...COMMENT_SELECT,
        replies: {
          where: { deletedAt: null, status: 'visible' },
          select: COMMENT_SELECT,
          orderBy: { createdAt: 'asc' },
          take: 3, // first 3 replies inline
        },
      },
      orderBy,
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = comments.length > limit;
    const data = hasMore ? comments.slice(0, limit) : comments;
    const nextCursor = hasMore ? data[data.length - 1]?.id : undefined;

    return {
      data,
      meta: {
        cursor: nextCursor ?? null,
        hasMore,
      },
    };
  }

  // ═══════════════════════════════════════════════════════
  // UPDATE (author only, within 15 min)
  // ═══════════════════════════════════════════════════════

  async update(commentId: string, userId: string, dto: UpdateCommentDto) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId, deletedAt: null },
      select: { id: true, authorId: true, createdAt: true, status: true },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    // 15-minute edit window
    const elapsed = Date.now() - comment.createdAt.getTime();
    if (elapsed > EDIT_WINDOW_MS) {
      throw new ForbiddenException('Comments can only be edited within 15 minutes of creation');
    }

    const updated = await this.prisma.comment.update({
      where: { id: commentId },
      data: { content: dto.content },
      select: COMMENT_SELECT,
    });

    return updated;
  }

  // ═══════════════════════════════════════════════════════
  // SOFT DELETE (author / post author / admin)
  // ═══════════════════════════════════════════════════════

  async softDelete(commentId: string, userId: string, permissionTier: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId, deletedAt: null },
      select: {
        id: true,
        authorId: true,
        postId: true,
        post: { select: { authorId: true } },
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    const tierLevel = TIER_LEVELS[permissionTier] ?? 5;
    const isAdmin = tierLevel <= 1;
    const isAuthor = comment.authorId === userId;
    const isPostAuthor = comment.post.authorId === userId;

    if (!isAdmin && !isAuthor && !isPostAuthor) {
      throw new ForbiddenException('You do not have permission to delete this comment');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.comment.update({
        where: { id: commentId },
        data: { deletedAt: new Date(), status: 'deleted' },
      });

      await tx.post.update({
        where: { id: comment.postId },
        data: { commentCount: { decrement: 1 } },
      });
    });
  }

  // ═══════════════════════════════════════════════════════
  // PIN (post author only)
  // ═══════════════════════════════════════════════════════

  async pin(commentId: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId, deletedAt: null },
      select: {
        id: true,
        postId: true,
        isPinned: true,
        post: { select: { authorId: true } },
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.post.authorId !== userId) {
      throw new ForbiddenException('Only the post author can pin comments');
    }

    // Toggle pin
    const newPinned = !comment.isPinned;

    // If pinning, unpin any currently pinned comment on this post first
    if (newPinned) {
      await this.prisma.comment.updateMany({
        where: { postId: comment.postId, isPinned: true },
        data: { isPinned: false },
      });
    }

    await this.prisma.comment.update({
      where: { id: commentId },
      data: { isPinned: newPinned },
    });

    return { pinned: newPinned };
  }

  // ═══════════════════════════════════════════════════════
  // GET SINGLE COMMENT
  // ═══════════════════════════════════════════════════════

  async findById(commentId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId, deletedAt: null, status: 'visible' },
      select: COMMENT_SELECT,
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    return comment;
  }
}
