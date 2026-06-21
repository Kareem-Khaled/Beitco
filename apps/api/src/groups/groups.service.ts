import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SearchService } from '../search/search.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { GroupQueryDto, MemberQueryDto, UpdateMemberDto } from './dto/group-query.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

const TIER_LEVELS: Record<string, number> = {
  admin: 1,
  verified_contributor: 2,
  trusted_member: 3,
  new_user: 4,
  restricted: 5,
};

const CREATOR_SELECT = {
  id: true,
  username: true,
  nameAr: true,
  nameEn: true,
  avatarUrl: true,
  permissionTier: true,
  nationalIdVerified: true,
  followerCount: true,
} as const;

const GROUP_SELECT = {
  id: true,
  nameAr: true,
  nameEn: true,
  slug: true,
  descriptionAr: true,
  descriptionEn: true,
  groupType: true,
  coverPhotoUrl: true,
  avatarUrl: true,
  privacy: true,
  postingRules: true,
  locationLat: true,
  locationLng: true,
  city: true,
  district: true,
  memberCount: true,
  postCount: true,
  creatorId: true,
  createdAt: true,
  updatedAt: true,
  creator: { select: CREATOR_SELECT },
} as const;

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
  createdAt: true,
  updatedAt: true,
  author: { select: AUTHOR_SELECT },
} as const;

@Injectable()
export class GroupsService {
  private readonly logger = new Logger(GroupsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly search: SearchService,
  ) {}

  // ═══════════════════════════════════════════════════════
  // CREATE
  // ═══════════════════════════════════════════════════════

  async create(userId: string, dto: CreateGroupDto) {
    const slug = this.generateSlug(dto.nameAr, dto.nameEn);

    // Check slug uniqueness
    const existingSlug = await this.prisma.group.findUnique({ where: { slug } });
    if (existingSlug) {
      throw new ConflictException('A group with a similar name already exists');
    }

    const group = await this.prisma.$transaction(async (tx) => {
      const g = await tx.group.create({
        data: {
          nameAr: dto.nameAr,
          nameEn: dto.nameEn,
          slug,
          descriptionAr: dto.descriptionAr,
          descriptionEn: dto.descriptionEn,
          groupType: dto.groupType,
          privacy: dto.privacy ?? 'public',
          postingRules: dto.postingRules ?? 'open',
          locationLat: dto.locationLat,
          locationLng: dto.locationLng,
          city: dto.city,
          district: dto.district,
          coverPhotoUrl: dto.coverPhotoUrl,
          avatarUrl: dto.avatarUrl,
          creatorId: userId,
          memberCount: 1,
        },
        select: GROUP_SELECT,
      });

      // Creator auto-joins as admin
      await tx.groupMember.create({
        data: {
          groupId: g.id,
          userId,
          role: 'admin',
          status: 'active',
        },
      });

      return g;
    });

    this.logger.log(`Group ${group.id} created by ${userId}`);

    // Index in search
    void this.search.indexGroup({
      id: group.id,
      nameAr: group.nameAr,
      nameEn: group.nameEn,
      descriptionAr: group.descriptionAr,
      descriptionEn: group.descriptionEn,
      groupType: group.groupType,
      privacy: group.privacy,
      city: group.city,
      memberCount: group.memberCount,
      createdAt: group.createdAt,
    });

    return group;
  }

  // ═══════════════════════════════════════════════════════
  // LIST
  // ═══════════════════════════════════════════════════════

  async findAll(query: GroupQueryDto) {
    const { cursor, limit = 20, search, type, city } = query;

    const where: Record<string, unknown> = { deletedAt: null };
    if (type) where['groupType'] = type;
    if (city) where['city'] = city;
    if (search) {
      where['OR'] = [
        { nameAr: { contains: search, mode: 'insensitive' } },
        { nameEn: { contains: search, mode: 'insensitive' } },
      ];
    }

    const groups = await this.prisma.group.findMany({
      where: where as Parameters<typeof this.prisma.group.findMany>[0] extends { where?: infer W } ? W : never,
      select: GROUP_SELECT,
      orderBy: [{ memberCount: 'desc' }, { createdAt: 'desc' }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = groups.length > limit;
    const data = hasMore ? groups.slice(0, limit) : groups;
    const nextCursor = hasMore ? data[data.length - 1]?.id : undefined;

    return {
      data,
      meta: { cursor: nextCursor ?? null, hasMore },
    };
  }

  // ═══════════════════════════════════════════════════════
  // GET BY ID
  // ═══════════════════════════════════════════════════════

  async findById(groupId: string, userId?: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId, deletedAt: null },
      select: GROUP_SELECT,
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // Check membership if authenticated
    let isMember = false;
    let myRole: string | null = null;
    if (userId) {
      const member = await this.prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId, userId } },
        select: { role: true, status: true },
      });
      if (member && member.status === 'active') {
        isMember = true;
        myRole = member.role;
      }
    }

    return { ...group, isMember, myRole };
  }

  // ═══════════════════════════════════════════════════════
  // UPDATE
  // ═══════════════════════════════════════════════════════

  async update(groupId: string, userId: string, permissionTier: string, dto: UpdateGroupDto) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId, deletedAt: null },
      select: { id: true, creatorId: true },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const tierLevel = TIER_LEVELS[permissionTier] ?? 5;
    const isPlatformAdmin = tierLevel <= 1;

    // Check if user is group admin
    const membership = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
      select: { role: true },
    });
    const isGroupAdmin = membership?.role === 'admin';

    if (!isPlatformAdmin && !isGroupAdmin) {
      throw new ForbiddenException('Only group admins can update this group');
    }

    const updated = await this.prisma.group.update({
      where: { id: groupId },
      data: dto as Record<string, unknown>,
      select: GROUP_SELECT,
    });

    return updated;
  }

  // ═══════════════════════════════════════════════════════
  // DELETE
  // ═══════════════════════════════════════════════════════

  async softDelete(groupId: string, userId: string, permissionTier: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId, deletedAt: null },
      select: { id: true, creatorId: true },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const tierLevel = TIER_LEVELS[permissionTier] ?? 5;
    const isPlatformAdmin = tierLevel <= 1;

    if (!isPlatformAdmin && group.creatorId !== userId) {
      throw new ForbiddenException('Only the creator or platform admin can delete this group');
    }

    await this.prisma.group.update({
      where: { id: groupId },
      data: { deletedAt: new Date() },
    });
  }

  // ═══════════════════════════════════════════════════════
  // JOIN
  // ═══════════════════════════════════════════════════════

  async join(groupId: string, userId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId, deletedAt: null },
      select: { id: true, privacy: true },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // Check if already a member
    const existing = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });

    if (existing) {
      if (existing.status === 'active') {
        throw new ConflictException('Already a member of this group');
      }
      if (existing.status === 'banned') {
        throw new ForbiddenException('You are banned from this group');
      }
      if (existing.status === 'pending') {
        throw new ConflictException('Join request already pending');
      }
    }

    const status = group.privacy === 'public' ? 'active' : 'pending';

    await this.prisma.$transaction(async (tx) => {
      await tx.groupMember.create({
        data: { groupId, userId, role: 'member', status: status as 'active' | 'pending' },
      });

      if (status === 'active') {
        await tx.group.update({
          where: { id: groupId },
          data: { memberCount: { increment: 1 } },
        });
      }
    });

    return { status };
  }

  // ═══════════════════════════════════════════════════════
  // LEAVE
  // ═══════════════════════════════════════════════════════

  async leave(groupId: string, userId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId, deletedAt: null },
      select: { id: true, creatorId: true },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    if (group.creatorId === userId) {
      throw new BadRequestException('Group creator cannot leave. Transfer ownership or delete the group.');
    }

    const membership = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });

    if (!membership || membership.status !== 'active') {
      throw new NotFoundException('You are not a member of this group');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.groupMember.delete({
        where: { id: membership.id },
      });

      await tx.group.update({
        where: { id: groupId },
        data: { memberCount: { decrement: 1 } },
      });
    });
  }

  // ═══════════════════════════════════════════════════════
  // MEMBERS
  // ═══════════════════════════════════════════════════════

  async getMembers(groupId: string, query: MemberQueryDto) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId, deletedAt: null },
      select: { id: true },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const { cursor, limit = 20, role } = query;

    const where: Record<string, unknown> = { groupId, status: 'active' };
    if (role) where['role'] = role;

    const members = await this.prisma.groupMember.findMany({
      where: where as Parameters<typeof this.prisma.groupMember.findMany>[0] extends { where?: infer W } ? W : never,
      select: {
        id: true,
        role: true,
        joinedAt: true,
        user: { select: CREATOR_SELECT },
      },
      orderBy: { joinedAt: 'asc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = members.length > limit;
    const data = hasMore ? members.slice(0, limit) : members;
    const nextCursor = hasMore ? data[data.length - 1]?.id : undefined;

    return {
      data: data.map((m) => ({ user: m.user, role: m.role, joinedAt: m.joinedAt })),
      meta: { cursor: nextCursor ?? null, hasMore },
    };
  }

  // ═══════════════════════════════════════════════════════
  // GROUP POSTS (FEED)
  // ═══════════════════════════════════════════════════════

  async getGroupPosts(groupId: string, query: PaginationQueryDto) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId, deletedAt: null },
      select: { id: true },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const { cursor, limit = 20 } = query;

    const posts = await this.prisma.post.findMany({
      where: {
        groupId,
        status: 'published',
        deletedAt: null,
      },
      select: POST_SELECT,
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = posts.length > limit;
    const data = hasMore ? posts.slice(0, limit) : posts;
    const nextCursor = hasMore ? data[data.length - 1]?.id : undefined;

    return {
      data,
      meta: { cursor: nextCursor ?? null, hasMore },
    };
  }

  // ═══════════════════════════════════════════════════════
  // UPDATE MEMBER (role/status)
  // ═══════════════════════════════════════════════════════

  async updateMember(
    groupId: string,
    targetUserId: string,
    actingUserId: string,
    permissionTier: string,
    dto: UpdateMemberDto,
  ) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId, deletedAt: null },
      select: { id: true, creatorId: true },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const tierLevel = TIER_LEVELS[permissionTier] ?? 5;
    const isPlatformAdmin = tierLevel <= 1;

    const actingMember = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: actingUserId } },
      select: { role: true },
    });
    const isGroupAdmin = actingMember?.role === 'admin';

    if (!isPlatformAdmin && !isGroupAdmin) {
      throw new ForbiddenException('Only group admins can manage members');
    }

    const targetMember = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: targetUserId } },
    });

    if (!targetMember) {
      throw new NotFoundException('Member not found');
    }

    // Can't change creator's role
    if (targetUserId === group.creatorId) {
      throw new ForbiddenException('Cannot change the creator\'s role or status');
    }

    const updateData: Record<string, unknown> = {};
    if (dto.role) updateData['role'] = dto.role;
    if (dto.status) updateData['status'] = dto.status;

    await this.prisma.groupMember.update({
      where: { id: targetMember.id },
      data: updateData,
    });

    // If banning, decrement member count
    if (dto.status === 'banned' && targetMember.status === 'active') {
      await this.prisma.group.update({
        where: { id: groupId },
        data: { memberCount: { decrement: 1 } },
      });
    }

    return { role: dto.role ?? targetMember.role, status: dto.status ?? targetMember.status };
  }

  // ═══════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════

  private generateSlug(nameAr: string, nameEn?: string | null): string {
    const base = nameEn || nameAr;
    const slug = base
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s-]/gu, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 100);
    // Append random suffix for uniqueness
    const suffix = Math.random().toString(36).substring(2, 8);
    return `${slug}-${suffix}`;
  }
}
