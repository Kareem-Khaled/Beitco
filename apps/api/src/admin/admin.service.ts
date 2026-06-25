import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TrustService } from '../trust/trust.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SearchService } from '../search/search.service';
import { serializeProperty, type PropertyRow } from '../listings/listings.serializer';

const detailInclude = {
  owner: true,
  rooms: { include: { beds: true }, orderBy: { createdAt: 'asc' as const } },
  nearby: true,
  customSpecs: true,
  reviews: { orderBy: { createdAt: 'desc' as const } },
};

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly trust: TrustService,
    private readonly notifications: NotificationsService,
    private readonly search: SearchService,
  ) {}

  // The review queue: listings waiting on approval, oldest first.
  async pendingListings(): Promise<Record<string, unknown>[]> {
    const rows = (await this.prisma.property.findMany({
      where: { status: 'pending_approval', deletedAt: null },
      orderBy: { createdAt: 'asc' },
      include: detailInclude,
    })) as unknown as PropertyRow[];
    return rows.map((p) => ({ ...serializeProperty(p), status: p.status }));
  }

  async pendingCount(): Promise<{ count: number }> {
    const count = await this.prisma.property.count({
      where: { status: 'pending_approval', deletedAt: null },
    });
    return { count };
  }

  async approve(id: string): Promise<{ ok: true }> {
    const p = await this.prisma.property.findUnique({ where: { id }, select: { id: true } });
    if (!p) throw new NotFoundException({ code: 'PROPERTY_NOT_FOUND', message: 'الإعلان مش موجود.' });
    await this.prisma.property.update({
      where: { id },
      data: { status: 'published', rejectionReason: null, moderatedAt: new Date() },
    });
    // Recompute now that it's live (keeps trust consistent).
    await this.trust.recomputeListing(id);
    // Now public -- alert matching saved searches (best-effort).
    await this.notifications.notifyForNewListing(id);
    await this.search.indexById(id); // PROD-3: now searchable
    return { ok: true };
  }

  async reject(id: string, reason: string): Promise<{ ok: true }> {
    const p = await this.prisma.property.findUnique({ where: { id }, select: { id: true } });
    if (!p) throw new NotFoundException({ code: 'PROPERTY_NOT_FOUND', message: 'الإعلان مش موجود.' });
    await this.prisma.property.update({
      where: { id },
      data: {
        status: 'rejected',
        rejectionReason: reason.trim() || 'مخالف لشروط النشر.',
        moderatedAt: new Date(),
      },
    });
    return { ok: true };
  }

  // ── ADMIN-1: platform overview ──
  // A single aggregate snapshot for the operator dashboard. Everything runs in
  // parallel; counts are cheap (indexed) and the recent lists are tiny.
  async platformStats(): Promise<Record<string, unknown>> {
    const now = Date.now();
    const since = (days: number) => new Date(now - days * 86400000);
    const live = { deletedAt: null };

    const [
      users,
      usersByRole,
      verifiedUsers,
      pendingVerifications,
      admins,
      newUsers7d,
      newUsers30d,
      listings,
      listingsByStatus,
      listingsByType,
      verifiedListings,
      newListings7d,
      newListings30d,
      leads,
      leadsByStatus,
      tenancies,
      reviews,
      questions,
      threads,
      savedSearches,
      listingTrust,
      ownerTrust,
      bedsByStatus,
      recentUsers,
      recentListings,
    ] = await Promise.all([
      this.prisma.user.count({ where: live }),
      this.prisma.user.groupBy({ by: ['role'], where: live, _count: { _all: true } }),
      this.prisma.user.count({ where: { ...live, verified: true } }),
      this.prisma.user.count({ where: { ...live, verificationStatus: 'pending' } }),
      this.prisma.user.count({ where: { ...live, isAdmin: true } }),
      this.prisma.user.count({ where: { ...live, createdAt: { gte: since(7) } } }),
      this.prisma.user.count({ where: { ...live, createdAt: { gte: since(30) } } }),
      this.prisma.property.count({ where: live }),
      this.prisma.property.groupBy({ by: ['status'], where: live, _count: { _all: true } }),
      this.prisma.property.groupBy({ by: ['type'], where: live, _count: { _all: true } }),
      this.prisma.property.count({ where: { ...live, verified: true } }),
      this.prisma.property.count({ where: { ...live, createdAt: { gte: since(7) } } }),
      this.prisma.property.count({ where: { ...live, createdAt: { gte: since(30) } } }),
      this.prisma.lead.count(),
      this.prisma.lead.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.tenancy.count(),
      this.prisma.review.count(),
      this.prisma.question.count(),
      this.prisma.thread.count(),
      this.prisma.savedSearch.count(),
      this.prisma.property.aggregate({ where: { ...live, status: 'published' }, _avg: { trust: true } }),
      this.prisma.user.aggregate({
        where: { ...live, role: { in: ['owner', 'both'] } },
        _avg: { trust: true },
      }),
      this.prisma.bed.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.user.findMany({
        where: live,
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: { id: true, name: true, role: true, verified: true, createdAt: true },
      }),
      this.prisma.property.findMany({
        where: live,
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: { id: true, title: true, area: true, type: true, status: true, price: true, createdAt: true },
      }),
    ]);

    const countByKey = (
      rows: { _count: { _all: number } }[],
      key: string,
    ): Record<string, number> => {
      const out: Record<string, number> = {};
      for (const r of rows) {
        const k = (r as unknown as Record<string, unknown>)[key];
        if (typeof k === 'string') out[k] = r._count._all;
      }
      return out;
    };

    const roleCounts = countByKey(usersByRole, 'role');
    const statusCounts = countByKey(listingsByStatus, 'status');
    const typeCounts = countByKey(listingsByType, 'type');
    const leadStatusCounts = countByKey(leadsByStatus, 'status');
    const bedCounts = countByKey(bedsByStatus, 'status');
    const totalBeds = Object.values(bedCounts).reduce((a, b) => a + b, 0);

    const round1 = (n: number | null | undefined) => (n == null ? null : Math.round(n * 10) / 10);

    return {
      users: {
        total: users,
        renters: roleCounts['renter'] ?? 0,
        owners: roleCounts['owner'] ?? 0,
        both: roleCounts['both'] ?? 0,
        admins,
        verified: verifiedUsers,
        pendingVerification: pendingVerifications,
        new7d: newUsers7d,
        new30d: newUsers30d,
      },
      listings: {
        total: listings,
        published: statusCounts['published'] ?? 0,
        pending: statusCounts['pending_approval'] ?? 0,
        draft: statusCounts['draft'] ?? 0,
        rejected: statusCounts['rejected'] ?? 0,
        verified: verifiedListings,
        new7d: newListings7d,
        new30d: newListings30d,
        byType: {
          شقة: typeCounts['apartment'] ?? 0,
          أوضة: typeCounts['room'] ?? 0,
          سرير: typeCounts['bed'] ?? 0,
        },
      },
      engagement: {
        leads,
        leadsPending: leadStatusCounts['pending'] ?? 0,
        tenancies,
        reviews,
        questions,
        threads,
        savedSearches,
      },
      inventory: {
        totalBeds,
        availableBeds: bedCounts['available'] ?? 0,
      },
      trust: {
        avgListingTrust: round1(listingTrust._avg.trust),
        avgOwnerTrust: round1(ownerTrust._avg.trust),
      },
      queues: {
        pendingListings: statusCounts['pending_approval'] ?? 0,
        pendingVerifications,
      },
      recent: {
        users: recentUsers.map((u) => ({
          id: u.id,
          name: u.name,
          role: u.role,
          verified: u.verified,
          createdAt: u.createdAt.toISOString(),
        })),
        listings: recentListings.map((p) => ({
          id: p.id,
          title: p.title,
          area: p.area,
          type: p.type,
          status: p.status,
          price: p.price,
          createdAt: p.createdAt.toISOString(),
        })),
      },
    };
  }
}
