import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SearchService } from '../search/search.service';
import { ListingsService } from './listings.service';

// TEST-1: ListingsService.list — the public browse query. Mocked Prisma +
// a disabled SearchService (so `q` uses the DB `contains` fallback, no Meili).
// Locks the filter mapping (Arabic→Latin type, purpose, price, verifiedOnly,
// freeOnly), cursor pagination, sort selection, and findOne's published gate.

type Mock = jest.Mock;

// A minimal PropertyRow the serializer can consume. `rentalMode: whole` +
// wholeStatus drives bed availability without needing rooms.
const propRow = (over: Record<string, unknown> = {}) => ({
  id: 'p1',
  title: 'شقة',
  area: 'المعادي',
  address: 'شارع 9',
  type: 'apartment',
  status: 'published',
  listingType: 'rent',
  rentalMode: 'whole',
  wholeStatus: 'available',
  bedrooms: 2,
  price: 8000,
  priceFrom: null,
  salePrice: null,
  saleStatus: null,
  nightlyPrice: null,
  negotiable: false,
  trust: 8,
  verified: true,
  reviewsCount: 0,
  residents: 0,
  images: [],
  quality: null,
  unitType: null,
  rentToGender: null,
  rooms: [],
  createdAt: new Date('2026-06-01T00:00:00Z'),
  ...over,
});

function makePrisma() {
  return {
    property: { findMany: jest.fn().mockResolvedValue([]), findFirst: jest.fn() },
    $queryRaw: jest.fn().mockResolvedValue([]),
  };
}

describe('ListingsService', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let search: { enabled: boolean; searchIds: Mock };
  let service: ListingsService;

  beforeEach(() => {
    prisma = makePrisma();
    search = { enabled: false, searchIds: jest.fn() };
    service = new ListingsService(
      prisma as unknown as PrismaService,
      search as unknown as SearchService,
    );
  });

  describe('list — filters', () => {
    it('always scopes to published + not-deleted', async () => {
      await service.list({});
      expect(prisma.property.findMany.mock.calls[0][0].where).toMatchObject({
        status: 'published',
        deletedAt: null,
        owner: { bannedAt: null },
      });
    });

    it('maps the Arabic type to the Latin enum + applies purpose/price/verified', async () => {
      await service.list({
        type: 'أوضة',
        purpose: 'rent',
        minPrice: 2000,
        maxPrice: 6000,
        verifiedOnly: 'true',
      });
      const where = prisma.property.findMany.mock.calls[0][0].where;
      expect(where).toMatchObject({
        type: 'room',
        listingType: 'rent',
        verified: true,
        price: { gte: 2000, lte: 6000 },
      });
    });

    it('uses a DB contains OR across title/area/address for `q` when Meili is off', async () => {
      await service.list({ q: 'معادي' });
      const where = prisma.property.findMany.mock.calls[0][0].where;
      expect(where.OR).toEqual([
        { title: { contains: 'معادي', mode: 'insensitive' } },
        { area: { contains: 'معادي', mode: 'insensitive' } },
        { address: { contains: 'معادي', mode: 'insensitive' } },
      ]);
    });

    it('area is a substring filter; nightly requires a nightlyPrice', async () => {
      await service.list({ area: 'المعادي', nightly: 'true' });
      const where = prisma.property.findMany.mock.calls[0][0].where;
      expect(where.area).toEqual({ contains: 'المعادي' });
      expect(where.nightlyPrice).toEqual({ not: null });
    });
  });

  describe('list — sort + pagination', () => {
    it('defaults to trust desc, then id', async () => {
      await service.list({});
      expect(prisma.property.findMany.mock.calls[0][0].orderBy).toEqual([
        { trust: 'desc' },
        { id: 'asc' },
      ]);
    });

    it('price_asc sorts by price then id', async () => {
      await service.list({ sort: 'price_asc' });
      expect(prisma.property.findMany.mock.calls[0][0].orderBy).toEqual([
        { price: 'asc' },
        { id: 'asc' },
      ]);
    });

    it('returns a cursor + hasMore when the page overflows (take = limit+1)', async () => {
      prisma.property.findMany.mockResolvedValue([
        propRow({ id: 'a' }),
        propRow({ id: 'b' }),
      ]);
      const res = await service.list({ limit: 1 });
      expect(prisma.property.findMany.mock.calls[0][0].take).toBe(2);
      expect(res.meta).toEqual({ cursor: 'a', hasMore: true });
      expect(res.data).toHaveLength(1);
    });

    it('passes a cursor through (skip 1)', async () => {
      await service.list({ cursor: 'x' });
      const arg = prisma.property.findMany.mock.calls[0][0];
      expect(arg.cursor).toEqual({ id: 'x' });
      expect(arg.skip).toBe(1);
    });
  });

  describe('list — freeOnly', () => {
    it('keeps only listings with an available bed', async () => {
      prisma.property.findMany.mockResolvedValue([
        propRow({ id: 'free', wholeStatus: 'available' }),
        propRow({ id: 'taken', wholeStatus: 'occupied' }),
      ]);
      const res = await service.list({ freeOnly: 'true', limit: 10 });
      expect(res.data.map((d) => d.id)).toEqual(['free']);
    });
  });

  describe('findOne', () => {
    it('throws PROPERTY_NOT_FOUND when missing', async () => {
      prisma.property.findFirst.mockResolvedValue(null);
      await expect(service.findOne('nope')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws when the listing exists but is not published', async () => {
      prisma.property.findFirst.mockResolvedValue(propRow({ status: 'pending_approval' }));
      await expect(service.findOne('p1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns the serialized property when published', async () => {
      prisma.property.findFirst.mockResolvedValue(propRow());
      const res = await service.findOne('p1');
      expect(res).toMatchObject({ id: 'p1', title: 'شقة', type: 'شقة' });
    });

    it('lets the OWNER preview their own pending listing', async () => {
      prisma.property.findFirst.mockResolvedValue(propRow({ ownerId: 'u-own', status: 'pending_approval' }));
      const viewer = { id: 'u-own', isAdmin: false } as never;
      const res = await service.findOne('p1', viewer);
      expect(res).toMatchObject({ id: 'p1' });
    });

    it('lets an ADMIN preview any pending listing', async () => {
      prisma.property.findFirst.mockResolvedValue(propRow({ ownerId: 'u-someone', status: 'pending_approval' }));
      const admin = { id: 'u-admin', isAdmin: true } as never;
      const res = await service.findOne('p1', admin);
      expect(res).toMatchObject({ id: 'p1' });
    });

    it('does NOT let a different non-admin user preview a pending listing', async () => {
      prisma.property.findFirst.mockResolvedValue(propRow({ ownerId: 'u-own', status: 'pending_approval' }));
      const stranger = { id: 'u-other', isAdmin: false } as never;
      await expect(service.findOne('p1', stranger)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('hides a published listing whose owner is banned (BUG-1)', async () => {
      prisma.property.findFirst.mockResolvedValue(propRow({ owner: { bannedAt: new Date() } }));
      await expect(service.findOne('p1')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
