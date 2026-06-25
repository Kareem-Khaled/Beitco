import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SearchService } from '../search/search.service';
import { TrustService } from '../trust/trust.service';
import { AdminAuditService } from './admin.audit.service';
import { serializeProperty, serializeSummary, type PropertyRow } from '../listings/listings.serializer';
import type { AuthUser } from '../auth/decorators/current-user.decorator';
import { AdminListingsQueryDto, AdminTakedownDto, AdminUpdateListingDto } from './dto/admin-listings.dto';

const TYPE_LATIN: Record<string, 'apartment' | 'room' | 'bed'> = {
  شقة: 'apartment',
  أوضة: 'room',
  سرير: 'bed',
};

const summaryInclude = { rooms: { include: { beds: true } } };
const detailInclude = {
  owner: true,
  rooms: { include: { beds: { include: { occupant: true } }, occupant: true }, orderBy: { createdAt: 'asc' as const } },
  wholeOccupant: true,
  nearby: true,
  customSpecs: true,
  reviews: { orderBy: { createdAt: 'desc' as const } },
  questions: { orderBy: { createdAt: 'desc' as const } },
};

@Injectable()
export class AdminListingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly search: SearchService,
    private readonly trust: TrustService,
    private readonly audit: AdminAuditService,
  ) {}

  // ── List ALL listings (any status), search + filter + cursor paginate ──
  async list(query: AdminListingsQueryDto) {
    const limit = Math.min(Math.max(query.limit ?? 25, 1), 50);
    const where: Record<string, unknown> = { deletedAt: null };
    if (query.status) where.status = query.status;
    if (query.type && TYPE_LATIN[query.type]) where.type = TYPE_LATIN[query.type];
    if (query.purpose) where.listingType = query.purpose;
    if (query.verified === 'true') where.verified = true;
    if (query.verified === 'false') where.verified = false;
    if (query.ownerId) where.ownerId = query.ownerId;
    const q = query.q?.trim();
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { area: { contains: q, mode: 'insensitive' } },
        { address: { contains: q, mode: 'insensitive' } },
      ];
    }

    const rows = (await this.prisma.property.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: summaryInclude,
      take: limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    })) as unknown as PropertyRow[];

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    return {
      data: page.map((p) => ({ ...serializeSummary(p), status: p.status, ownerId: p.ownerId })),
      meta: { cursor: hasMore ? (page[page.length - 1]?.id ?? null) : null, hasMore },
    };
  }

  // ── Full detail (admin view: includes occupants + moderation fields) ──
  async detail(id: string): Promise<Record<string, unknown>> {
    const row = (await this.prisma.property.findFirst({
      where: { id, deletedAt: null },
      include: detailInclude,
    })) as unknown as (PropertyRow & { rejectionReason: string | null; moderatedAt: Date | null }) | null;
    if (!row) throw new NotFoundException({ code: 'LISTING_NOT_FOUND', message: 'الإعلان مش موجود.' });

    return {
      ...serializeProperty(row, { includeOccupants: true }),
      status: row.status,
      rejectionReason: row.rejectionReason ?? undefined,
      moderatedAt: row.moderatedAt?.toISOString(),
    };
  }

  // ── Force-takedown a live listing (pause it) with a reason → notify + audit ──
  async takedown(admin: AuthUser, id: string, dto: AdminTakedownDto): Promise<Record<string, unknown>> {
    const p = await this.prisma.property.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, ownerId: true, title: true, status: true },
    });
    if (!p) throw new NotFoundException({ code: 'LISTING_NOT_FOUND', message: 'الإعلان مش موجود.' });

    const reason = dto.reason.trim() || 'مخالف لشروط النشر.';
    await this.prisma.property.update({
      where: { id },
      data: { status: 'paused', rejectionReason: reason, moderatedAt: new Date() },
    });
    await this.search.removeOne(id); // drop from search immediately
    await this.prisma.notification.create({
      data: {
        userId: p.ownerId,
        type: 'verification',
        title: 'وقفنا إعلانك',
        body: `إعلان «${p.title}» اتوقف: ${reason} — عدّله وكلّمنا عشان يرجع.`,
      },
    });
    await this.audit.log(admin, 'listing.takedown', 'listing', id, {
      reason,
      previousStatus: p.status,
    });
    return this.detail(id);
  }

  // ── Restore a paused/rejected listing back to published ──
  async restore(admin: AuthUser, id: string): Promise<Record<string, unknown>> {
    const p = await this.prisma.property.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, ownerId: true, title: true, status: true },
    });
    if (!p) throw new NotFoundException({ code: 'LISTING_NOT_FOUND', message: 'الإعلان مش موجود.' });

    await this.prisma.property.update({
      where: { id },
      data: { status: 'published', rejectionReason: null, moderatedAt: new Date() },
    });
    await this.search.indexById(id);
    await this.prisma.notification.create({
      data: {
        userId: p.ownerId,
        type: 'verification',
        title: 'رجع إعلانك',
        body: `إعلان «${p.title}» رجع شغّال تاني.`,
      },
    });
    await this.audit.log(admin, 'listing.restore', 'listing', id, { previousStatus: p.status });
    return this.detail(id);
  }

  // ── Toggle the verified badge (with trust recompute + search resync) ──
  async update(admin: AuthUser, id: string, dto: AdminUpdateListingDto): Promise<Record<string, unknown>> {
    const p = await this.prisma.property.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, verified: true },
    });
    if (!p) throw new NotFoundException({ code: 'LISTING_NOT_FOUND', message: 'الإعلان مش موجود.' });

    await this.prisma.property.update({ where: { id }, data: { verified: dto.verified } });
    await this.trust.recomputeListing(id);
    await this.search.indexById(id);
    await this.audit.log(admin, 'listing.set_verified', 'listing', id, {
      verified: dto.verified,
      reason: dto.reason,
    });
    return this.detail(id);
  }

  // ── Soft-delete a listing entirely (with reason → notify + audit) ──
  async remove(admin: AuthUser, id: string, reason?: string): Promise<{ ok: true }> {
    const p = await this.prisma.property.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, ownerId: true, title: true },
    });
    if (!p) throw new NotFoundException({ code: 'LISTING_NOT_FOUND', message: 'الإعلان مش موجود.' });

    await this.prisma.property.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.search.removeOne(id);
    await this.audit.log(admin, 'listing.delete', 'listing', id, { reason: reason?.trim() || undefined });
    return { ok: true };
  }
}
