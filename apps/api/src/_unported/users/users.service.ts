import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto';

/** Fields returned for the authenticated user's own profile */
const ME_SELECT = {
  id: true,
  phone: true,
  email: true,
  username: true,
  nameAr: true,
  nameEn: true,
  role: true,
  permissionTier: true,
  avatarUrl: true,
  coverPhotoUrl: true,
  bio: true,
  nationalIdVerified: true,
  agentLicenseVerified: true,
  trustScore: true,
  reputationScore: true,
  followerCount: true,
  followingCount: true,
  postCount: true,
  preferences: true,
  createdAt: true,
  updatedAt: true,
} as const;

/** Fields returned for a public profile (no phone, email, preferences) */
const PUBLIC_SELECT = {
  id: true,
  username: true,
  nameAr: true,
  nameEn: true,
  role: true,
  permissionTier: true,
  avatarUrl: true,
  coverPhotoUrl: true,
  bio: true,
  nationalIdVerified: true,
  agentLicenseVerified: true,
  trustScore: true,
  reputationScore: true,
  followerCount: true,
  followingCount: true,
  postCount: true,
  createdAt: true,
} as const;

/** Compact user summary for lists */
const SUMMARY_SELECT = {
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
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get the authenticated user's full profile.
   */
  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: ME_SELECT,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Update the authenticated user's profile.
   * Enforces username uniqueness.
   */
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    // Check username uniqueness if being changed
    if (dto.username) {
      const existing = await this.prisma.user.findUnique({
        where: { username: dto.username },
        select: { id: true },
      });

      if (existing && existing.id !== userId) {
        throw new ConflictException({
          code: 'USERNAME_TAKEN',
          message: 'This username is already taken',
        });
      }
    }

    // Check email uniqueness if being changed
    if (dto.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email },
        select: { id: true },
      });

      if (existing && existing.id !== userId) {
        throw new ConflictException({
          code: 'EMAIL_TAKEN',
          message: 'This email is already in use',
        });
      }
    }

    // Build update data — parse preferences JSON if provided
    const updateData: Record<string, unknown> = { ...dto };
    if (dto.preferences) {
      updateData.preferences = JSON.parse(dto.preferences);
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: ME_SELECT,
    });

    return updated;
  }

  /**
   * Get a user's public profile by ID.
   * Excludes private fields (phone, email, preferences).
   */
  async getPublicProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      select: PUBLIC_SELECT,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Get a user's posts with cursor-based pagination.
   */
  async getUserPosts(userId: string, cursor?: string, limit: number = 20) {
    // Verify user exists
    const userExists = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      select: { id: true },
    });

    if (!userExists) {
      throw new NotFoundException('User not found');
    }

    const posts = await this.prisma.post.findMany({
      where: {
        authorId: userId,
        status: 'published',
        deletedAt: null,
      },
      select: {
        id: true,
        postType: true,
        contentText: true,
        media: true,
        likeCount: true,
        commentCount: true,
        shareCount: true,
        createdAt: true,
        author: {
          select: SUMMARY_SELECT,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1, // fetch one extra to determine hasMore
      ...(cursor
        ? {
            cursor: { id: cursor },
            skip: 1, // skip the cursor item itself
          }
        : {}),
    });

    const hasMore = posts.length > limit;
    const items = hasMore ? posts.slice(0, limit) : posts;
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1]!.id : null;

    return {
      items,
      meta: {
        cursor: nextCursor,
        hasMore,
      },
    };
  }

  /**
   * Get a user's followers with cursor-based pagination.
   */
  async getUserFollowers(userId: string, cursor?: string, limit: number = 20) {
    const userExists = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      select: { id: true },
    });

    if (!userExists) {
      throw new NotFoundException('User not found');
    }

    const follows = await this.prisma.follow.findMany({
      where: { followingId: userId },
      select: {
        id: true,
        follower: {
          select: SUMMARY_SELECT,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor
        ? {
            cursor: { id: cursor },
            skip: 1,
          }
        : {}),
    });

    const hasMore = follows.length > limit;
    const items = hasMore ? follows.slice(0, limit) : follows;
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1]!.id : null;

    return {
      items: items.map((f) => f.follower),
      meta: {
        cursor: nextCursor,
        hasMore,
      },
    };
  }

  /**
   * Get users a user is following with cursor-based pagination.
   */
  async getUserFollowing(userId: string, cursor?: string, limit: number = 20) {
    const userExists = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      select: { id: true },
    });

    if (!userExists) {
      throw new NotFoundException('User not found');
    }

    const follows = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: {
        id: true,
        following: {
          select: SUMMARY_SELECT,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor
        ? {
            cursor: { id: cursor },
            skip: 1,
          }
        : {}),
    });

    const hasMore = follows.length > limit;
    const items = hasMore ? follows.slice(0, limit) : follows;
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1]!.id : null;

    return {
      items: items.map((f) => f.following),
      meta: {
        cursor: nextCursor,
        hasMore,
      },
    };
  }

  /**
   * Check if a username is available.
   */
  async isUsernameAvailable(username: string): Promise<boolean> {
    const existing = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });
    return !existing;
  }
}
