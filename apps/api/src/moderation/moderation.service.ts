import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  runRulesStage,
  runTextAiStage,
  runMediaAiStage,
  ModerationFlag,
  ModerationResult,
} from './stages';

/**
 * Combined result of the 3-stage moderation pipeline.
 */
export interface PipelineResult {
  passed: boolean;
  flags: ModerationFlag[];
  totalScore: number;
  autoAction: 'none' | 'flag_for_review' | 'auto_reject';
  stages: {
    rules: ModerationResult;
    textAi: ModerationResult;
    mediaAi: ModerationResult;
  };
}

@Injectable()
export class ModerationService {
  private readonly logger = new Logger(ModerationService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── 3-STAGE PIPELINE ────────────────────────────────

  /**
   * Run the full 3-stage moderation pipeline on content.
   *
   * Stage 1: Rules (blocked words, spam patterns, suspicious URLs)
   * Stage 2: Text AI (toxicity, hate speech — stub)
   * Stage 3: Media AI (NSFW, violence — stub)
   */
  async moderate(text: string | null | undefined, mediaUrls: string[] = []): Promise<PipelineResult> {
    // Stage 1: Rule-based checks (fast, synchronous)
    const rulesResult = runRulesStage(text);

    // Stage 2: Text AI analysis (async, currently stub)
    const textAiResult = await runTextAiStage(text);

    // Stage 3: Media AI analysis (async, currently stub)
    const mediaAiResult = await runMediaAiStage(mediaUrls);

    // Combine results
    const allFlags = [
      ...rulesResult.flags,
      ...textAiResult.flags,
      ...mediaAiResult.flags,
    ];

    const totalScore = Math.min(
      100,
      rulesResult.score + textAiResult.score + mediaAiResult.score,
    );

    // Highest severity action wins
    let autoAction: PipelineResult['autoAction'] = 'none';
    if (
      rulesResult.autoAction === 'auto_reject' ||
      textAiResult.autoAction === 'auto_reject' ||
      mediaAiResult.autoAction === 'auto_reject'
    ) {
      autoAction = 'auto_reject';
    } else if (
      rulesResult.autoAction === 'flag_for_review' ||
      textAiResult.autoAction === 'flag_for_review' ||
      mediaAiResult.autoAction === 'flag_for_review'
    ) {
      autoAction = 'flag_for_review';
    }

    this.logger.debug(
      `Moderation: score=${totalScore}, flags=${allFlags.length}, action=${autoAction}`,
    );

    return {
      passed: allFlags.length === 0,
      flags: allFlags,
      totalScore,
      autoAction,
      stages: {
        rules: rulesResult,
        textAi: textAiResult,
        mediaAi: mediaAiResult,
      },
    };
  }

  // ─── POST MODERATION ─────────────────────────────────

  /**
   * Moderate a post and apply the result.
   * Called during post creation for non-auto-approved posts.
   */
  async moderatePost(postId: string): Promise<PipelineResult> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, contentText: true, media: true },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Extract media URLs from JSON
    const mediaUrls: string[] = Array.isArray(post.media)
      ? (post.media as string[])
      : [];

    const result = await this.moderate(post.contentText, mediaUrls);

    // Update post with moderation results
    await this.prisma.post.update({
      where: { id: postId },
      data: {
        aiModerationFlags: result.flags as unknown as object[],
        aiQualityScore: 100 - result.totalScore, // Higher quality = lower violation score
      },
    });

    // Auto-reject if score is very high
    if (result.autoAction === 'auto_reject') {
      await this.prisma.post.update({
        where: { id: postId },
        data: {
          status: 'rejected',
          approvalStatus: 'rejected',
          rejectionReason: `Auto-rejected by moderation: ${result.flags.map(f => f.type).join(', ')}`,
        },
      });
      this.logger.warn(`Post ${postId} auto-rejected (score: ${result.totalScore})`);
    }

    return result;
  }

  /**
   * Moderate a comment and apply the result.
   */
  async moderateComment(commentId: string): Promise<PipelineResult> {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, content: true },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    const result = await this.moderate(comment.content);

    // Update comment with moderation flags
    await this.prisma.comment.update({
      where: { id: commentId },
      data: {
        aiModerationFlags: result.flags as unknown as object[],
      },
    });

    // Auto-hide if score is very high
    if (result.autoAction === 'auto_reject') {
      await this.prisma.comment.update({
        where: { id: commentId },
        data: { status: 'hidden' },
      });
      this.logger.warn(`Comment ${commentId} auto-hidden (score: ${result.totalScore})`);
    }

    return result;
  }

  // ─── MODERATION QUEUE ────────────────────────────────

  /**
   * Get posts flagged for review (non-empty aiModerationFlags, not yet reviewed).
   */
  async getModerationQueue(cursor?: string, limit: number = 20) {
    const where = {
      deletedAt: null,
      approvalStatus: 'pending' as const,
      NOT: {
        aiModerationFlags: { equals: [] as unknown as object },
      },
    };

    const items = await this.prisma.post.findMany({
      where: cursor
        ? { ...where, id: { lt: cursor } }
        : where,
      select: {
        id: true,
        authorId: true,
        contentText: true,
        postType: true,
        aiModerationFlags: true,
        aiQualityScore: true,
        approvalStatus: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
            permissionTier: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' }, // FIFO — oldest first
      take: limit + 1,
    });

    const hasMore = items.length > limit;
    if (hasMore) items.pop();

    return {
      items,
      meta: {
        cursor: items.length > 0 ? items[items.length - 1]!.id : null,
        hasMore,
      },
    };
  }

  // ─── MANUAL REVIEW ───────────────────────────────────

  /**
   * Get moderation details for a specific post.
   */
  async getPostModerationDetails(postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId, deletedAt: null },
      select: {
        id: true,
        contentText: true,
        media: true,
        postType: true,
        status: true,
        approvalStatus: true,
        aiModerationFlags: true,
        aiQualityScore: true,
        rejectionReason: true,
        approvalReviewedBy: true,
        approvalReviewedAt: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
            permissionTier: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return post;
  }

  /**
   * Approve a flagged post after manual review.
   */
  async approvePost(postId: string, reviewerId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId, deletedAt: null },
      select: { id: true, approvalStatus: true },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.approvalStatus === 'approved' || post.approvalStatus === 'auto_approved') {
      throw new BadRequestException('Post is already approved');
    }

    const updated = await this.prisma.post.update({
      where: { id: postId },
      data: {
        status: 'published',
        approvalStatus: 'approved',
        approvalReviewedBy: reviewerId,
        approvalReviewedAt: new Date(),
      },
      select: { id: true, status: true, approvalStatus: true },
    });

    this.logger.log(`Post ${postId} approved by ${reviewerId}`);
    return updated;
  }

  /**
   * Reject a flagged post after manual review.
   */
  async rejectPost(postId: string, reviewerId: string, reason: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId, deletedAt: null },
      select: { id: true, approvalStatus: true },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.approvalStatus === 'rejected') {
      throw new BadRequestException('Post is already rejected');
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
      select: { id: true, status: true, approvalStatus: true, rejectionReason: true },
    });

    this.logger.log(`Post ${postId} rejected by ${reviewerId}: ${reason}`);
    return updated;
  }

  // ─── MODERATION STATS ────────────────────────────────

  /**
   * Get moderation statistics.
   */
  async getStats() {
    const [
      pendingPosts,
      flaggedPosts,
      approvedToday,
      rejectedToday,
      totalReviewed,
    ] = await Promise.all([
      this.prisma.post.count({
        where: { approvalStatus: 'pending', deletedAt: null },
      }),
      this.prisma.post.count({
        where: {
          deletedAt: null,
          NOT: { aiModerationFlags: { equals: [] as unknown as object } },
        },
      }),
      this.prisma.post.count({
        where: {
          approvalStatus: 'approved',
          approvalReviewedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      this.prisma.post.count({
        where: {
          approvalStatus: 'rejected',
          approvalReviewedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      this.prisma.post.count({
        where: {
          approvalStatus: { in: ['approved', 'rejected'] },
          approvalReviewedBy: { not: null },
        },
      }),
    ]);

    return {
      pendingPosts,
      flaggedPosts,
      approvedToday,
      rejectedToday,
      totalReviewed,
    };
  }
}
