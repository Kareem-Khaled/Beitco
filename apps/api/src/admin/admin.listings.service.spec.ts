import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SearchService } from '../search/search.service';
import { TrustService } from '../trust/trust.service';
import { AdminAuditService } from './admin.audit.service';
import { AdminListingsService } from './admin.listings.service';
import type { AuthUser } from '../auth/decorators/current-user.decorator';

// ADMIN-3: listing management. Mocked Prisma/Search/Trust/Audit lock the
// filters, the force-takedown (pause + drop from search + notify owner + audit),
// restore, verified toggle, and soft-delete.

type Mock = jest.Mock;

const admin: AuthUser = {
  id: 'admin1',
  name: 'فريق بيتون',
  phone: '+20100',
  role: 'both',
  isAdmin: true,
  verified: true,
  verificationStatus: 'verified',
};

// Minimal property row the serializer can consume.
const propRow = (over: Record<string, unknown> = {}) => ({
  id: 'p1',
  ownerId: 'o1',
  title: 'أوضة في المعادي',
  area: 'المعادي',
  address: 'شارع 9',
  type: 'room',
  status: 'published',
  listingType: 'rent',
  rentalMode: 'by_room',
  price: 4000,
  trust: 8,
  verified: true,
  reviewsCount: 0,
  residents: 0,
  images: [],
  amenities: [],
  quality: null,
  rooms: [],
  reviews: [],
  questions: [],
  nearby: [],
  customSpecs: [],
  owner: { id: 'o1', name: 'مالك', verified: true, trust: 8, responseRate: 90 },
  rejectionReason: null,
  moderatedAt: null,
  createdAt: new Date('2026-06-01T00:00:00Z'),
  updatedAt: new Date('2026-06-01T00:00:00Z'),
  ...over,
});

function makePrisma() {
  return {
    property: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
    },
    notification: { create: jest.fn().mockResolvedValue({}) },
  };
}

describe('AdminListingsService', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let search: { indexById: Mock; removeOne: Mock };
  let trust: { recomputeListing: Mock };
  let audit: { log: Mock };
  let service: AdminListingsService;

  beforeEach(() => {
    prisma = makePrisma();
    search = { indexById: jest.fn().mockResolvedValue(undefined), removeOne: jest.fn().mockResolvedValue(undefined) };
    trust = { recomputeListing: jest.fn().mockResolvedValue(undefined) };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    service = new AdminListingsService(
      prisma as unknown as PrismaService,
      search as unknown as SearchService,
      trust as unknown as TrustService,
      audit as unknown as AdminAuditService,
    );
  });

  describe('list', () => {
    it('filters by status + Arabic type + search across title/area/address', async () => {
      prisma.property.findMany.mockResolvedValue([propRow()]);
      const res = await service.list({ q: 'معادي', status: 'paused', type: 'أوضة', limit: 25 });

      const arg = prisma.property.findMany.mock.calls[0][0];
      expect(arg.where).toMatchObject({ status: 'paused', type: 'room', deletedAt: null });
      expect(arg.where.OR).toEqual([
        { title: { contains: 'معادي', mode: 'insensitive' } },
        { area: { contains: 'معادي', mode: 'insensitive' } },
        { address: { contains: 'معادي', mode: 'insensitive' } },
      ]);
      expect(res.data[0]).toMatchObject({ id: 'p1', status: 'published', ownerId: 'o1' });
    });

    it('paginates with a cursor when over the limit', async () => {
      prisma.property.findMany.mockResolvedValue([propRow({ id: 'a' }), propRow({ id: 'b' })]);
      const res = await service.list({ limit: 1 });
      expect(res.meta).toEqual({ cursor: 'a', hasMore: true });
      expect(res.data).toHaveLength(1);
    });
  });

  describe('detail', () => {
    it('throws LISTING_NOT_FOUND for a missing listing', async () => {
      prisma.property.findFirst.mockResolvedValue(null);
      await expect(service.detail('nope')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('takedown', () => {
    it('throws LISTING_NOT_FOUND when the listing is gone', async () => {
      prisma.property.findFirst.mockResolvedValue(null);
      await expect(service.takedown(admin, 'p1', { reason: 'سبام' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('pauses, drops from search, notifies the owner, and audits', async () => {
      prisma.property.findFirst
        .mockResolvedValueOnce({ id: 'p1', ownerId: 'o1', title: 'أوضة', status: 'published' }) // guard
        .mockResolvedValueOnce(propRow({ status: 'paused' })); // detail()
      await service.takedown(admin, 'p1', { reason: '  صور وهمية  ' });

      expect(prisma.property.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'paused', rejectionReason: 'صور وهمية' }) }),
      );
      expect(search.removeOne).toHaveBeenCalledWith('p1');
      expect(prisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ userId: 'o1' }) }),
      );
      expect(audit.log).toHaveBeenCalledWith(
        admin,
        'listing.takedown',
        'listing',
        'p1',
        expect.objectContaining({ reason: 'صور وهمية', previousStatus: 'published' }),
      );
    });
  });

  describe('restore', () => {
    it('republishes, reindexes, notifies, and audits', async () => {
      prisma.property.findFirst
        .mockResolvedValueOnce({ id: 'p1', ownerId: 'o1', title: 'أوضة', status: 'paused' })
        .mockResolvedValueOnce(propRow());
      await service.restore(admin, 'p1');

      expect(prisma.property.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'published', rejectionReason: null }) }),
      );
      expect(search.indexById).toHaveBeenCalledWith('p1');
      expect(audit.log).toHaveBeenCalledWith(admin, 'listing.restore', 'listing', 'p1', { previousStatus: 'paused' });
    });
  });

  describe('update (verified)', () => {
    it('sets verified, recomputes trust, reindexes, and audits', async () => {
      prisma.property.findFirst
        .mockResolvedValueOnce({ id: 'p1', verified: false })
        .mockResolvedValueOnce(propRow({ verified: true }));
      await service.update(admin, 'p1', { verified: true });

      expect(prisma.property.update).toHaveBeenCalledWith({ where: { id: 'p1' }, data: { verified: true } });
      expect(trust.recomputeListing).toHaveBeenCalledWith('p1');
      expect(search.indexById).toHaveBeenCalledWith('p1');
      expect(audit.log).toHaveBeenCalledWith(
        admin,
        'listing.set_verified',
        'listing',
        'p1',
        expect.objectContaining({ verified: true }),
      );
    });
  });

  describe('remove', () => {
    it('soft-deletes, drops from search, and audits', async () => {
      prisma.property.findFirst.mockResolvedValue({ id: 'p1', ownerId: 'o1', title: 'أوضة' });
      const res = await service.remove(admin, 'p1', 'تكرار');

      expect(prisma.property.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ deletedAt: expect.any(Date) }) }),
      );
      expect(search.removeOne).toHaveBeenCalledWith('p1');
      expect(audit.log).toHaveBeenCalledWith(admin, 'listing.delete', 'listing', 'p1', { reason: 'تكرار' });
      expect(res).toEqual({ ok: true });
    });
  });
});
