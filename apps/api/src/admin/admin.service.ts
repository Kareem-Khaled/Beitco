import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionTier, Prisma } from '@prisma/client';
import {
  AdminUsersQueryDto,
  AdminReportsQueryDto,
  ChangeTierDto,
  ReviewReportDto,
  RejectContentDto,
  SuspendUserDto,
} from './dto';

/** Select fields for admin user listing */
const ADMIN_USER_SELECT = {
  id: true,
  phone: true,
  email: true,
  username: true,
  nameAr: true,
  nameEn: true,
  role: true,
  permissionTier: true,
  avatarUrl: true,
  nationalIdVerified: true,
  agentLicenseVerified: true,
  trustScore: true,
  reputationScore: true,
  followerCount: true,
  postCount: true,
  createdAt: true,
  deletedAt: true,
} as const;

/** Select fields for post in admin context */
const ADMIN_POST_SELECT = {
  id: true,
  postType: true,
  contentText: true,
  contentAr: true,
  hashtags: true,
  status: true,
  approvalStatus: true,
  rejectionReason: true,
  aiQualityScore: true,
  aiModerationFlags: true,
  likeCount: true,
  commentCount: true,
  createdAt: true,
  author: {
    select: {
      id: true,
      nameAr: true,
      nameEn: true,
      username: true,
      avatarUrl: true,
      permissionTier: true,
    },
  },
} as const;

/** Select fields for comment in admin context */
const ADMIN_COMMENT_SELECT = {
  id: true,
  content: true,
  status: true,
  aiModerationFlags: true,
  likeCount: true,
  createdAt: true,
  postId: true,
  author: {
    select: {
      id: true,
      nameAr: true,
      nameEn: true,
      username: true,
      avatarUrl: true,
      permissionTier: true,
    },
  },
} as const;

/** Select fields for reports */
const ADMIN_REPORT_SELECT = {
  id: true,
  reporterId: true,
  targetType: true,
  targetPostId: true,
  targetCommentId: true,
  targetUserId: true,
  targetListingId: true,
  reason: true,
  details: true,
  status: true,
  reviewedBy: true,
  actionTaken: true,
  aiSeverityScore: true,
  createdAt: true,
  reviewedAt: true,
  reporter: {
    select: {
      id: true,
      nameAr: true,
      nameEn: true,
      username: true,
      avatarUrl: true,
    },
  },
} as const;

/** Select fields for groups in admin context */
const ADMIN_GROUP_SELECT = {
  id: true,
  nameAr: true,
  nameEn: true,
  slug: true,
  privacy: true,
  memberCount: true,
  postCount: true,
  createdAt: true,
  creator: {
    select: {
      id: true,
      nameAr: true,
      nameEn: true,
      username: true,
    },
  },
} as const;

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── USER MANAGEMENT ─────────────────────────────────

  /**
   * Get paginated list of users with filters.
   */
  async getUsers(query: AdminUsersQueryDto) {
    const { cursor, limit = 20, tier, role, search } = query;

    const where: Prisma.UserWhereInput = {};

    if (tier) where.permissionTier = tier;
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { nameAr: { contains: search, mode: 'insensitive' } },
        { nameEn: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
      ];
    }

    const users = await this.prisma.user.findMany({
      where,
      select: ADMIN_USER_SELECT,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });

    const hasMore = users.length > limit;
    const items = hasMore ? users.slice(0, limit) : users;

    return {
      data: items,
      meta: {
        cursor: items.length > 0 ? items[items.length - 1]!.id : null,
        hasMore,
      },
    };
  }

  /**
   * Change a user's permission tier.
   */
  async changeTier(userId: string, dto: ChangeTierDto, _adminId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, permissionTier: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { permissionTier: dto.tier },
      select: ADMIN_USER_SELECT,
    });

    return updated;
  }

  /**
   * Verify a user (sets nationalIdVerified = true, upgrades tier if new_user).
   */
  async verifyUser(userId: string, _adminId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, nationalIdVerified: true, permissionTier: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Upgrade to trusted_member if currently new_user
    const tierUpdate: Prisma.UserUpdateInput = {
      nationalIdVerified: true,
    };
    if (user.permissionTier === PermissionTier.new_user) {
      tierUpdate.permissionTier = PermissionTier.trusted_member;
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: tierUpdate,
      select: ADMIN_USER_SELECT,
    });

    return updated;
  }

  /**
   * Suspend a user (soft-delete + set tier to restricted).
   */
  async suspendUser(userId: string, _dto: SuspendUserDto, _adminId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, deletedAt: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        permissionTier: PermissionTier.restricted,
        deletedAt: new Date(),
      },
      select: ADMIN_USER_SELECT,
    });

    return updated;
  }

  // ─── POST APPROVAL ───────────────────────────────────

  /**
   * Get paginated list of pending-approval posts.
   */
  async getPendingPosts(query: { cursor?: string; limit?: number }) {
    const { cursor, limit = 20 } = query;

    const posts = await this.prisma.post.findMany({
      where: {
        approvalStatus: 'pending',
        deletedAt: null,
      },
      select: ADMIN_POST_SELECT,
      orderBy: { createdAt: 'asc' }, // oldest first for FIFO
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });

    const hasMore = posts.length > limit;
    const items = hasMore ? posts.slice(0, limit) : posts;

    return {
      data: items,
      meta: {
        cursor: items.length > 0 ? items[items.length - 1]!.id : null,
        hasMore,
      },
    };
  }

  /**
   * Approve a pending post.
   */
  async approvePost(postId: string, adminId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, approvalStatus: true, deletedAt: true },
    });

    if (!post || post.deletedAt) {
      throw new NotFoundException('Post not found');
    }

    if (post.approvalStatus !== 'pending') {
      throw new BadRequestException('Post is not pending approval');
    }

    const updated = await this.prisma.post.update({
      where: { id: postId },
      data: {
        approvalStatus: 'approved',
        status: 'published',
        approvalReviewedBy: adminId,
        approvalReviewedAt: new Date(),
      },
      select: ADMIN_POST_SELECT,
    });

    return updated;
  }

  /**
   * Reject a pending post.
   */
  async rejectPost(postId: string, dto: RejectContentDto, adminId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, approvalStatus: true, deletedAt: true },
    });

    if (!post || post.deletedAt) {
      throw new NotFoundException('Post not found');
    }

    if (post.approvalStatus !== 'pending') {
      throw new BadRequestException('Post is not pending approval');
    }

    const updated = await this.prisma.post.update({
      where: { id: postId },
      data: {
        approvalStatus: 'rejected',
        status: 'rejected',
        rejectionReason: dto.reason,
        approvalReviewedBy: adminId,
        approvalReviewedAt: new Date(),
      },
      select: ADMIN_POST_SELECT,
    });

    return updated;
  }

  // ─── FLAGGED CONTENT ─────────────────────────────────

  /**
   * Get posts with AI moderation flags.
   */
  async getFlaggedPosts(query: { cursor?: string; limit?: number }) {
    const { cursor, limit = 20 } = query;

    const posts = await this.prisma.post.findMany({
      where: {
        NOT: { aiModerationFlags: { equals: Prisma.JsonNull } },
        // Filter posts that have non-empty AI moderation flags
        aiModerationFlags: { not: { equals: '[]' } },
        deletedAt: null,
      },
      select: ADMIN_POST_SELECT,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });

    const hasMore = posts.length > limit;
    const items = hasMore ? posts.slice(0, limit) : posts;

    return {
      data: items,
      meta: {
        cursor: items.length > 0 ? items[items.length - 1]!.id : null,
        hasMore,
      },
    };
  }

  /**
   * Get comments with AI moderation flags.
   */
  async getFlaggedComments(query: { cursor?: string; limit?: number }) {
    const { cursor, limit = 20 } = query;

    const comments = await this.prisma.comment.findMany({
      where: {
        NOT: { aiModerationFlags: { equals: Prisma.JsonNull } },
        aiModerationFlags: { not: { equals: '[]' } },
        deletedAt: null,
      },
      select: ADMIN_COMMENT_SELECT,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });

    const hasMore = comments.length > limit;
    const items = hasMore ? comments.slice(0, limit) : comments;

    return {
      data: items,
      meta: {
        cursor: items.length > 0 ? items[items.length - 1]!.id : null,
        hasMore,
      },
    };
  }

  // ─── REPORTS ─────────────────────────────────────────

  /**
   * Get paginated list of reports.
   */
  async getReports(query: AdminReportsQueryDto) {
    const { cursor, limit = 20, status } = query;

    const where: Prisma.ReportWhereInput = {};
    if (status) where.status = status;

    const reports = await this.prisma.report.findMany({
      where,
      select: ADMIN_REPORT_SELECT,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });

    const hasMore = reports.length > limit;
    const items = hasMore ? reports.slice(0, limit) : reports;

    return {
      data: items,
      meta: {
        cursor: items.length > 0 ? items[items.length - 1]!.id : null,
        hasMore,
      },
    };
  }

  /**
   * Review a report (resolve or dismiss with action taken).
   */
  async reviewReport(reportId: string, dto: ReviewReportDto, adminId: string) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      select: { id: true, status: true },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    const updated = await this.prisma.report.update({
      where: { id: reportId },
      data: {
        status: dto.status,
        actionTaken: dto.actionTaken,
        reviewedBy: adminId,
        reviewedAt: new Date(),
      },
      select: ADMIN_REPORT_SELECT,
    });

    return updated;
  }

  // ─── GROUPS ──────────────────────────────────────────

  /**
   * Get paginated list of all groups for admin overview.
   */
  async getGroups(query: { cursor?: string; limit?: number }) {
    const { cursor, limit = 20 } = query;

    const groups = await this.prisma.group.findMany({
      where: { deletedAt: null },
      select: ADMIN_GROUP_SELECT,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });

    const hasMore = groups.length > limit;
    const items = hasMore ? groups.slice(0, limit) : groups;

    return {
      data: items,
      meta: {
        cursor: items.length > 0 ? items[items.length - 1]!.id : null,
        hasMore,
      },
    };
  }

  // ─── ANALYTICS / STATS ───────────────────────────────

  /**
   * Get platform-wide dashboard stats.
   */
  async getDashboardStats() {
    const [
      totalUsers,
      activeUsers,
      totalPosts,
      totalComments,
      totalListings,
      totalGroups,
      pendingPosts,
      pendingReports,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.post.count({ where: { deletedAt: null } }),
      this.prisma.comment.count({ where: { deletedAt: null } }),
      this.prisma.listing.count({ where: { deletedAt: null } }),
      this.prisma.group.count({ where: { deletedAt: null } }),
      this.prisma.post.count({ where: { approvalStatus: 'pending', deletedAt: null } }),
      this.prisma.report.count({ where: { status: 'pending' } }),
    ]);

    // Users by tier
    const usersByTier = await this.prisma.user.groupBy({
      by: ['permissionTier'],
      _count: true,
      where: { deletedAt: null },
    });

    const tierCounts: Record<string, number> = {};
    for (const row of usersByTier) {
      tierCounts[row.permissionTier] = row._count;
    }

    return {
      totalUsers,
      activeUsers,
      totalPosts,
      totalComments,
      totalListings,
      totalGroups,
      pendingPosts,
      pendingReports,
      usersByTier: tierCounts,
    };
  }

  /**
   * Get moderation-specific statistics.
   */
  async getModerationStats() {
    const [
      pendingPosts,
      flaggedPosts,
      flaggedComments,
      pendingReports,
      resolvedReports,
      totalReports,
    ] = await Promise.all([
      this.prisma.post.count({
        where: { approvalStatus: 'pending', deletedAt: null },
      }),
      this.prisma.post.count({
        where: {
          aiModerationFlags: { not: { equals: '[]' } },
          deletedAt: null,
        },
      }),
      this.prisma.comment.count({
        where: {
          aiModerationFlags: { not: { equals: '[]' } },
          deletedAt: null,
        },
      }),
      this.prisma.report.count({ where: { status: 'pending' } }),
      this.prisma.report.count({ where: { status: 'resolved' } }),
      this.prisma.report.count(),
    ]);

    // Recent actions (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [approvedToday, rejectedToday, reportsReviewedToday] = await Promise.all([
      this.prisma.post.count({
        where: {
          approvalStatus: 'approved',
          approvalReviewedAt: { gte: oneDayAgo },
        },
      }),
      this.prisma.post.count({
        where: {
          approvalStatus: 'rejected',
          approvalReviewedAt: { gte: oneDayAgo },
        },
      }),
      this.prisma.report.count({
        where: {
          reviewedAt: { gte: oneDayAgo },
        },
      }),
    ]);

    return {
      pendingPosts,
      flaggedPosts,
      flaggedComments,
      pendingReports,
      resolvedReports,
      totalReports,
      last24Hours: {
        approvedPosts: approvedToday,
        rejectedPosts: rejectedToday,
        reportsReviewed: reportsReviewedToday,
      },
    };
  }
}
