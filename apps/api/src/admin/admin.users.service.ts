import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TrustService } from '../trust/trust.service';
import { AdminAuditService } from './admin.audit.service';
import type { AuthUser } from '../auth/decorators/current-user.decorator';
import { AdminUsersQueryDto, AdminUpdateUserDto, BanUserDto } from './dto/admin-users.dto';

interface UserRow {
  id: string;
  name: string;
  phone: string;
  role: string;
  gender: string | null;
  avatar: string | null;
  isAdmin: boolean;
  verified: boolean;
  verificationStatus: string;
  trust: number;
  trustBreakdown: unknown;
  responseRate: number | null;
  renterReputation: number | null;
  renterReviewsCount: number;
  bannedAt: Date | null;
  banReason: string | null;
  createdAt: Date;
}

function serializeUser(u: UserRow): Record<string, unknown> {
  return {
    id: u.id,
    name: u.name,
    phone: u.phone,
    role: u.role,
    gender: u.gender ?? undefined,
    avatar: u.avatar ?? undefined,
    isAdmin: u.isAdmin,
    verified: u.verified,
    verificationStatus: u.verificationStatus,
    trust: u.trust,
    responseRate: u.responseRate ?? undefined,
    renterReputation: u.renterReputation ?? undefined,
    renterReviewsCount: u.renterReviewsCount,
    banned: !!u.bannedAt,
    bannedAt: u.bannedAt?.toISOString(),
    banReason: u.banReason ?? undefined,
    createdAt: u.createdAt.toISOString(),
  };
}

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly trust: TrustService,
    private readonly audit: AdminAuditService,
  ) {}

  // ── List (search + filter + cursor paginate) ──
  async list(query: AdminUsersQueryDto) {
    const limit = Math.min(Math.max(query.limit ?? 25, 1), 50);
    const q = query.q?.trim();
    const where: Record<string, unknown> = { deletedAt: null };
    if (query.role) where.role = query.role;
    if (query.verified === 'true') where.verified = true;
    if (query.verified === 'false') where.verified = false;
    if (query.status === 'banned') where.bannedAt = { not: null };
    if (query.status === 'active') where.bannedAt = null;
    if (query.status === 'pending') where.verificationStatus = 'pending';
    if (query.admins === 'true') where.isAdmin = true;
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q } },
      ];
    }

    const rows = (await this.prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    })) as unknown as UserRow[];

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    return {
      data: page.map(serializeUser),
      meta: { cursor: hasMore ? (page[page.length - 1]?.id ?? null) : null, hasMore },
    };
  }

  // ── Detail (+ activity counts) ──
  async detail(id: string): Promise<Record<string, unknown>> {
    const user = (await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    })) as unknown as UserRow | null;
    if (!user) throw new NotFoundException({ code: 'USER_NOT_FOUND', message: 'الحساب مش موجود.' });

    const [listings, leads, tenancies, reviewsAuthored, reviewsReceived, threads, verifications] =
      await Promise.all([
        this.prisma.property.count({ where: { ownerId: id, deletedAt: null } }),
        this.prisma.lead.count({ where: { renterId: id } }),
        this.prisma.tenancy.count({ where: { userId: id } }),
        this.prisma.review.count({ where: { authorId: id } }),
        this.prisma.renterReview.count({ where: { renterId: id } }),
        this.prisma.thread.count({ where: { OR: [{ ownerId: id }, { renterId: id }] } }),
        this.prisma.verificationRequest.findMany({
          where: { userId: id },
          orderBy: { submittedAt: 'desc' },
          take: 5,
          select: { id: true, status: true, rejectionReason: true, submittedAt: true, reviewedAt: true },
        }),
      ]);

    return {
      ...serializeUser(user),
      trustBreakdown: user.trustBreakdown ?? undefined,
      counts: { listings, leads, tenancies, reviewsAuthored, reviewsReceived, threads },
      verifications: verifications.map((v) => ({
        id: v.id,
        status: v.status,
        rejectionReason: v.rejectionReason ?? undefined,
        submittedAt: v.submittedAt.toISOString(),
        reviewedAt: v.reviewedAt?.toISOString(),
      })),
    };
  }

  // ── Edit role / manual verify / trust override ──
  async update(admin: AuthUser, id: string, dto: AdminUpdateUserDto): Promise<Record<string, unknown>> {
    const user = await this.prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!user) throw new NotFoundException({ code: 'USER_NOT_FOUND', message: 'الحساب مش موجود.' });

    const data: Record<string, unknown> = {};
    if (dto.role) data.role = dto.role;
    if (dto.verified != null) {
      data.verified = dto.verified;
      data.verificationStatus = dto.verified ? 'verified' : 'unverified';
    }
    if (dto.trust != null) {
      data.trust = dto.trust;
    }
    if (Object.keys(data).length === 0) {
      throw new BadRequestException({ code: 'NOTHING_TO_UPDATE', message: 'مفيش حاجة تتغير.' });
    }

    await this.prisma.user.update({ where: { id }, data });
    await this.audit.log(admin, 'user.update', 'user', id, {
      changes: data,
      before: { role: user.role, verified: user.verified, trust: user.trust },
      reason: dto.reason,
    });

    // A manual verify/unverify should reflow trust (T-2 cap/bonus).
    if (dto.verified != null && dto.trust == null) {
      await this.trust.recomputeOwner(id);
    }
    return this.detail(id);
  }

  // ── Ban / reinstate ──
  async ban(admin: AuthUser, id: string, dto: BanUserDto): Promise<Record<string, unknown>> {
    if (id === admin.id) {
      throw new BadRequestException({ code: 'SELF_BAN', message: 'مش هتوقف حساب نفسك.' });
    }
    const user = await this.prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!user) throw new NotFoundException({ code: 'USER_NOT_FOUND', message: 'الحساب مش موجود.' });
    if (user.isAdmin) {
      throw new ForbiddenException({ code: 'CANNOT_BAN_ADMIN', message: 'مش هتوقف حساب أدمن.' });
    }

    const reason = dto.reason.trim() || 'مخالفة شروط الاستخدام.';
    await this.prisma.user.update({ where: { id }, data: { bannedAt: new Date(), banReason: reason } });
    await this.prisma.notification.create({
      data: {
        userId: id,
        type: 'verification',
        title: 'حسابك اتوقف',
        body: `حصل إيقاف لحسابك: ${reason} — لو ده غلط كلّمنا.`,
      },
    });
    await this.audit.log(admin, 'user.ban', 'user', id, { reason });
    return this.detail(id);
  }

  async reinstate(admin: AuthUser, id: string): Promise<Record<string, unknown>> {
    const user = await this.prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!user) throw new NotFoundException({ code: 'USER_NOT_FOUND', message: 'الحساب مش موجود.' });

    await this.prisma.user.update({ where: { id }, data: { bannedAt: null, banReason: null } });
    await this.prisma.notification.create({
      data: {
        userId: id,
        type: 'verification',
        title: 'رجع حسابك يشتغل',
        body: 'رجّعنا حسابك تاني. أهلاً بيك من جديد.',
      },
    });
    await this.audit.log(admin, 'user.reinstate', 'user', id, {});
    return this.detail(id);
  }

  // ── Grant / revoke admin ──
  async setAdmin(admin: AuthUser, id: string, makeAdmin: boolean): Promise<Record<string, unknown>> {
    if (id === admin.id) {
      throw new BadRequestException({ code: 'SELF_ADMIN', message: 'مش هتغيّر صلاحياتك بنفسك.' });
    }
    const user = await this.prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!user) throw new NotFoundException({ code: 'USER_NOT_FOUND', message: 'الحساب مش موجود.' });

    await this.prisma.user.update({ where: { id }, data: { isAdmin: makeAdmin } });
    await this.audit.log(admin, makeAdmin ? 'user.make_admin' : 'user.revoke_admin', 'user', id, {});
    return this.detail(id);
  }
}
