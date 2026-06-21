import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

const USER_SUMMARY_SELECT = {
  id: true,
  username: true,
  nameAr: true,
  nameEn: true,
  avatarUrl: true,
  permissionTier: true,
  nationalIdVerified: true,
  followerCount: true,
} as const;

@Injectable()
export class SocialService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  // ═══════════════════════════════════════════════════════
  // FOLLOWS
  // ═══════════════════════════════════════════════════════

  /**
   * Follow a user. Updates follower/following counts atomically.
   */
  async follow(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new BadRequestException('You cannot follow yourself');
    }

    // Verify target user exists
    const target = await this.prisma.user.findUnique({
      where: { id: followingId, deletedAt: null },
      select: { id: true },
    });
    if (!target) {
      throw new NotFoundException('User not found');
    }

    // Check if blocked
    const isBlocked = await this.prisma.block.findUnique({
      where: { blockerId_blockedId: { blockerId: followingId, blockedId: followerId } },
    });
    if (isBlocked) {
      throw new BadRequestException('You cannot follow this user');
    }

    // Check if already following
    const existing = await this.prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });
    if (existing) {
      throw new ConflictException('Already following this user');
    }

    // Create follow + update counters in a transaction
    const follow = await this.prisma.$transaction(async (tx) => {
      const f = await tx.follow.create({
        data: { followerId, followingId },
        select: {
          id: true,
          followerId: true,
          followingId: true,
          createdAt: true,
        },
      });

      await tx.user.update({
        where: { id: followerId },
        data: { followingCount: { increment: 1 } },
      });

      await tx.user.update({
        where: { id: followingId },
        data: { followerCount: { increment: 1 } },
      });

      return f;
    });

    // Notify the followed user
    void this.notifications.create(
      followingId,
      'follow',
      'متابع جديد',
      `لديك متابع جديد`,
      { followerId },
    );

    return follow;
  }

  /**
   * Unfollow a user. Decrements follower/following counts.
   */
  async unfollow(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new BadRequestException('You cannot unfollow yourself');
    }

    const existing = await this.prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });

    if (!existing) {
      throw new NotFoundException('You are not following this user');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.follow.delete({
        where: { id: existing.id },
      });

      await tx.user.update({
        where: { id: followerId },
        data: { followingCount: { decrement: 1 } },
      });

      await tx.user.update({
        where: { id: followingId },
        data: { followerCount: { decrement: 1 } },
      });
    });
  }

  /**
   * Check if userA follows userB.
   */
  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const follow = await this.prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
      select: { id: true },
    });
    return !!follow;
  }

  // ═══════════════════════════════════════════════════════
  // BLOCKS
  // ═══════════════════════════════════════════════════════

  /**
   * Block a user. Also removes any existing follow relationship.
   */
  async block(blockerId: string, blockedId: string) {
    if (blockerId === blockedId) {
      throw new BadRequestException('You cannot block yourself');
    }

    const target = await this.prisma.user.findUnique({
      where: { id: blockedId, deletedAt: null },
      select: { id: true },
    });
    if (!target) {
      throw new NotFoundException('User not found');
    }

    const existing = await this.prisma.block.findUnique({
      where: { blockerId_blockedId: { blockerId, blockedId } },
    });
    if (existing) {
      throw new ConflictException('User is already blocked');
    }

    await this.prisma.$transaction(async (tx) => {
      // Create the block
      await tx.block.create({
        data: { blockerId, blockedId },
      });

      // Remove follow in both directions if exists
      const followA = await tx.follow.findUnique({
        where: { followerId_followingId: { followerId: blockerId, followingId: blockedId } },
      });
      if (followA) {
        await tx.follow.delete({ where: { id: followA.id } });
        await tx.user.update({ where: { id: blockerId }, data: { followingCount: { decrement: 1 } } });
        await tx.user.update({ where: { id: blockedId }, data: { followerCount: { decrement: 1 } } });
      }

      const followB = await tx.follow.findUnique({
        where: { followerId_followingId: { followerId: blockedId, followingId: blockerId } },
      });
      if (followB) {
        await tx.follow.delete({ where: { id: followB.id } });
        await tx.user.update({ where: { id: blockedId }, data: { followingCount: { decrement: 1 } } });
        await tx.user.update({ where: { id: blockerId }, data: { followerCount: { decrement: 1 } } });
      }
    });
  }

  /**
   * Unblock a user.
   */
  async unblock(blockerId: string, blockedId: string) {
    const existing = await this.prisma.block.findUnique({
      where: { blockerId_blockedId: { blockerId, blockedId } },
    });

    if (!existing) {
      throw new NotFoundException('User is not blocked');
    }

    await this.prisma.block.delete({
      where: { id: existing.id },
    });
  }

  /**
   * Check if userA has blocked userB.
   */
  async isBlocked(blockerId: string, blockedId: string): Promise<boolean> {
    const block = await this.prisma.block.findUnique({
      where: { blockerId_blockedId: { blockerId, blockedId } },
      select: { id: true },
    });
    return !!block;
  }

  // ═══════════════════════════════════════════════════════
  // SUGGESTIONS
  // ═══════════════════════════════════════════════════════

  /**
   * Get follow suggestions — active users the requester doesn't follow yet.
   */
  async getSuggestions(userId: string, limit: number = 10) {
    // Get IDs this user already follows
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    const followingIds = following.map((f) => f.followingId);

    // Get IDs this user has blocked or is blocked by
    const blocksOut = await this.prisma.block.findMany({
      where: { blockerId: userId },
      select: { blockedId: true },
    });
    const blocksIn = await this.prisma.block.findMany({
      where: { blockedId: userId },
      select: { blockerId: true },
    });
    const excludeIds = [
      userId,
      ...followingIds,
      ...blocksOut.map((b) => b.blockedId),
      ...blocksIn.map((b) => b.blockerId),
    ];

    // Suggest active users with highest follower count, not already followed/blocked
    const suggestions = await this.prisma.user.findMany({
      where: {
        id: { notIn: excludeIds },
        deletedAt: null,
      },
      select: USER_SUMMARY_SELECT,
      orderBy: [
        { followerCount: 'desc' },
        { postCount: 'desc' },
      ],
      take: limit,
    });

    return suggestions.map((user) => ({
      user,
      reason: user.followerCount > 50 ? 'popular' : 'active_contributor',
    }));
  }
}
