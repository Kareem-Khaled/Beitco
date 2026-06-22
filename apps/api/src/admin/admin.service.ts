import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TrustService } from '../trust/trust.service';
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
}
