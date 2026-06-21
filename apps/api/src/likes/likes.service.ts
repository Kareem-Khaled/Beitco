import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class LikesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  // ═══════════════════════════════════════════════════════
  // TOGGLE POST LIKE
  // ═══════════════════════════════════════════════════════

  async togglePostLike(userId: string, postId: string) {
    // Verify post exists
    const post = await this.prisma.post.findUnique({
      where: { id: postId, deletedAt: null },
      select: { id: true, likeCount: true, authorId: true },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Check if already liked
    const existing = await this.prisma.like.findFirst({
      where: {
        userId,
        targetType: 'post',
        postId,
      },
    });

    if (existing) {
      // Unlike — delete + decrement
      await this.prisma.$transaction(async (tx) => {
        await tx.like.delete({ where: { id: existing.id } });
        await tx.post.update({
          where: { id: postId },
          data: { likeCount: { decrement: 1 } },
        });
      });

      const updated = await this.prisma.post.findUnique({
        where: { id: postId },
        select: { likeCount: true },
      });

      return { liked: false, likeCount: updated?.likeCount ?? 0 };
    } else {
      // Like — create + increment
      await this.prisma.$transaction(async (tx) => {
        await tx.like.create({
          data: {
            userId,
            targetType: 'post',
            postId,
            commentId: null,
          },
        });
        await tx.post.update({
          where: { id: postId },
          data: { likeCount: { increment: 1 } },
        });
      });

      const updated = await this.prisma.post.findUnique({
        where: { id: postId },
        select: { likeCount: true },
      });

      // Notify post author (don't notify self-likes)
      if (post.authorId !== userId) {
        void this.notifications.create(
          post.authorId,
          'like',
          'إعجاب جديد',
          'أعجب شخص بمنشورك',
          { postId, likerId: userId },
        );
      }

      return { liked: true, likeCount: updated?.likeCount ?? 0 };
    }
  }

  // ═══════════════════════════════════════════════════════
  // TOGGLE COMMENT LIKE
  // ═══════════════════════════════════════════════════════

  async toggleCommentLike(userId: string, commentId: string) {
    // Verify comment exists
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId, deletedAt: null, status: 'visible' },
      select: { id: true, likeCount: true },
    });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Check if already liked
    const existing = await this.prisma.like.findFirst({
      where: {
        userId,
        targetType: 'comment',
        commentId,
      },
    });

    if (existing) {
      // Unlike
      await this.prisma.$transaction(async (tx) => {
        await tx.like.delete({ where: { id: existing.id } });
        await tx.comment.update({
          where: { id: commentId },
          data: { likeCount: { decrement: 1 } },
        });
      });

      const updated = await this.prisma.comment.findUnique({
        where: { id: commentId },
        select: { likeCount: true },
      });

      return { liked: false, likeCount: updated?.likeCount ?? 0 };
    } else {
      // Like
      await this.prisma.$transaction(async (tx) => {
        await tx.like.create({
          data: {
            userId,
            targetType: 'comment',
            commentId,
            postId: null,
          },
        });
        await tx.comment.update({
          where: { id: commentId },
          data: { likeCount: { increment: 1 } },
        });
      });

      const updated = await this.prisma.comment.findUnique({
        where: { id: commentId },
        select: { likeCount: true },
      });

      return { liked: true, likeCount: updated?.likeCount ?? 0 };
    }
  }

  // ═══════════════════════════════════════════════════════
  // CHECK IF LIKED
  // ═══════════════════════════════════════════════════════

  async isPostLiked(userId: string, postId: string): Promise<boolean> {
    const like = await this.prisma.like.findFirst({
      where: { userId, targetType: 'post', postId },
      select: { id: true },
    });
    return !!like;
  }

  async isCommentLiked(userId: string, commentId: string): Promise<boolean> {
    const like = await this.prisma.like.findFirst({
      where: { userId, targetType: 'comment', commentId },
      select: { id: true },
    });
    return !!like;
  }
}
