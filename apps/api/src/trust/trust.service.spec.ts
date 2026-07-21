import { PrismaService } from '../prisma/prisma.service';
import { TrustService } from './trust.service';

// TEST-1: TrustService  -  the engine wiring (the pure math is covered by
// trust.engine.spec). Mocked Prisma verifies that recompute reads the right
// rows (incl. the ADMIN-4 removedAt filter), persists a score, and cascades
// listing→owner; and the renter-reputation null/compute branches.

function makePrisma() {
  return {
    property: {
      findUnique: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue({}),
    },
    user: { findUnique: jest.fn(), update: jest.fn().mockResolvedValue({}) },
    renterReview: { findMany: jest.fn().mockResolvedValue([]) },
    responseEvent: { findMany: jest.fn().mockResolvedValue([]) },
  };
}

const review = (over: Record<string, unknown> = {}) => ({
  rating: 9,
  monthsLived: 12,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  scores: null,
  ...over,
});

describe('TrustService', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let service: TrustService;

  beforeEach(() => {
    prisma = makePrisma();
    service = new TrustService(prisma as unknown as PrismaService);
  });

  describe('recomputeListing', () => {
    it('no-ops when the property is gone', async () => {
      prisma.property.findUnique.mockResolvedValue(null);
      await service.recomputeListing('nope');
      expect(prisma.property.update).not.toHaveBeenCalled();
    });

    it('reads reviews with the removedAt:null filter (ADMIN-4)', async () => {
      prisma.property.findUnique.mockResolvedValue({ ownerId: 'o1', verified: true, reviews: [] });
      prisma.user.findUnique.mockResolvedValue({
        id: 'o1',
        verified: true,
        createdAt: new Date('2025-01-01T00:00:00Z'),
        responseRate: 90,
      });
      await service.recomputeListing('p1');
      const include = prisma.property.findUnique.mock.calls[0][0].include;
      expect(include.reviews.where).toEqual({ removedAt: null });
    });

    it('persists a computed trust + breakdown, then recomputes the owner', async () => {
      prisma.property.findUnique.mockResolvedValue({
        ownerId: 'o1',
        verified: true,
        reviews: [review(), review({ rating: 8 })],
      });
      prisma.user.findUnique.mockResolvedValue({
        id: 'o1',
        verified: true,
        createdAt: new Date('2025-01-01T00:00:00Z'),
        responseRate: 90,
      });

      await service.recomputeListing('p1');

      // listing trust persisted with the real review count
      const upd = prisma.property.update.mock.calls[0][0];
      expect(upd.where).toEqual({ id: 'p1' });
      expect(typeof upd.data.trust).toBe('number');
      expect(upd.data.reviewsCount).toBe(2);
      // cascaded to the owner
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'o1' } }),
      );
    });
  });

  describe('recomputeRenterReputation', () => {
    it('clears reputation when the renter has no reviews', async () => {
      prisma.renterReview.findMany.mockResolvedValue([]);
      await service.recomputeRenterReputation('r1');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'r1' },
        data: { renterReputation: null, renterReviewsCount: 0 },
      });
    });

    it('computes + persists reputation from owner reviews', async () => {
      prisma.renterReview.findMany.mockResolvedValue([{ rating: 8 }, { rating: 9 }]);
      await service.recomputeRenterReputation('r1');
      const data = prisma.user.update.mock.calls[0][0].data;
      expect(data.renterReviewsCount).toBe(2);
      expect(typeof data.renterReputation).toBe('number');
    });
  });

  describe('listingBreakdown', () => {
    it('returns null for a missing property', async () => {
      prisma.property.findUnique.mockResolvedValue(null);
      await expect(service.listingBreakdown('nope')).resolves.toBeNull();
    });

    it('computes a breakdown (with the removedAt filter)', async () => {
      prisma.property.findUnique.mockResolvedValue({
        verified: true,
        ownerId: 'o1',
        reviews: [review()],
      });
      const res = await service.listingBreakdown('p1');
      expect(prisma.property.findUnique.mock.calls[0][0].select.reviews.where).toEqual({
        removedAt: null,
      });
      expect(res).toHaveProperty('score');
    });
  });
});
