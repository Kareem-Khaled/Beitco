import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TrustService } from '../trust/trust.service';
import { ReviewsService } from './reviews.service';

// TEST-1: ReviewsService  -  the trust wedge. Mocked Prisma + Trust lock the
// residency gate (30-day tenancy), the helpful-vote toggle, owner-reply
// ownership, and the two-sided renter-review guards. The e2e proves a real
// review moves the score end-to-end; here we assert the recompute is triggered.

type Mock = jest.Mock;

interface PrismaMock {
  property: { findFirst: Mock };
  tenancy: { findFirst: Mock };
  review: { create: Mock; findUnique: Mock; update: Mock };
  reviewHelpfulVote: { findUnique: Mock; create: Mock; delete: Mock; findMany: Mock };
  renterReview: { findFirst: Mock; create: Mock };
}

function makePrisma(): PrismaMock {
  return {
    property: { findFirst: jest.fn() },
    tenancy: { findFirst: jest.fn() },
    review: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    reviewHelpfulVote: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
    renterReview: { findFirst: jest.fn(), create: jest.fn() },
  };
}

function makeTrust() {
  return {
    recomputeListing: jest.fn().mockResolvedValue(undefined),
    recomputeRenterReputation: jest.fn().mockResolvedValue(undefined),
  };
}

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000);

describe('ReviewsService', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let trust: ReturnType<typeof makeTrust>;
  let service: ReviewsService;

  beforeEach(() => {
    prisma = makePrisma();
    trust = makeTrust();
    service = new ReviewsService(
      prisma as unknown as PrismaService,
      trust as unknown as TrustService,
    );
  });

  describe('create (resident review)', () => {
    const dto = { rating: 9, body: 'مكان ممتاز' };

    it('throws PROPERTY_NOT_FOUND for a missing/deleted property', async () => {
      prisma.property.findFirst.mockResolvedValue(null);
      await expect(service.create('p1', 'a1', 'سارة', dto)).rejects.toBeInstanceOf(NotFoundException);
      expect(trust.recomputeListing).not.toHaveBeenCalled();
    });

    it('throws NOT_A_RESIDENT when the author has no tenancy', async () => {
      prisma.property.findFirst.mockResolvedValue({ id: 'p1' });
      prisma.tenancy.findFirst.mockResolvedValue(null);
      await expect(service.create('p1', 'a1', 'سارة', dto)).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.review.create).not.toHaveBeenCalled();
    });

    it('throws TENANCY_TOO_SHORT before 30 days of residency', async () => {
      prisma.property.findFirst.mockResolvedValue({ id: 'p1' });
      prisma.tenancy.findFirst.mockResolvedValue({ moveInDate: daysAgo(10) });
      await expect(service.create('p1', 'a1', 'سارة', dto)).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.review.create).not.toHaveBeenCalled();
    });

    it('creates the review, derives monthsLived, and recomputes listing trust', async () => {
      prisma.property.findFirst.mockResolvedValue({ id: 'p1' });
      prisma.tenancy.findFirst.mockResolvedValue({ moveInDate: daysAgo(90) });
      prisma.review.create.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({
          id: 'r1',
          propertyId: 'p1',
          authorName: data.authorName,
          initials: data.initials,
          monthsLived: data.monthsLived,
          rating: data.rating,
          body: data.body,
          helpful: 0,
          ownerReply: null,
          scores: data.scores ?? null,
          createdAt: new Date('2026-06-01T00:00:00Z'),
        }),
      );

      const res = await service.create('p1', 'a1', 'سارة علي', dto);

      // ~90 days -> 3 months; initials from the two name parts.
      expect(prisma.review.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ propertyId: 'p1', authorId: 'a1', monthsLived: 3, rating: 9 }),
        }),
      );
      // The wedge: a real review recomputes the listing's trust.
      expect(trust.recomputeListing).toHaveBeenCalledWith('p1');
      expect(res).toMatchObject({ id: 'r1', author: 'سارة علي', monthsLived: 3 });
    });
  });

  describe('toggleHelpful', () => {
    it('throws REVIEW_NOT_FOUND for a missing review', async () => {
      prisma.review.findUnique.mockResolvedValue(null);
      await expect(service.toggleHelpful('r1', 'u1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('adds a vote and increments the count', async () => {
      prisma.review.findUnique.mockResolvedValue({ id: 'r1', helpful: 2 });
      prisma.reviewHelpfulVote.findUnique.mockResolvedValue(null);
      prisma.review.update.mockResolvedValue({ helpful: 3 });

      const res = await service.toggleHelpful('r1', 'u1');

      expect(prisma.reviewHelpfulVote.create).toHaveBeenCalledWith({ data: { reviewId: 'r1', userId: 'u1' } });
      expect(prisma.review.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { helpful: { increment: 1 } } }),
      );
      expect(res).toEqual({ voted: true, helpful: 3 });
    });

    it('removes an existing vote and decrements (floored at 0)', async () => {
      prisma.review.findUnique.mockResolvedValue({ id: 'r1', helpful: 1 });
      prisma.reviewHelpfulVote.findUnique.mockResolvedValue({ id: 'v1' });
      prisma.review.update.mockResolvedValue({ helpful: 0 });

      const res = await service.toggleHelpful('r1', 'u1');

      expect(prisma.reviewHelpfulVote.delete).toHaveBeenCalledWith({ where: { id: 'v1' } });
      expect(prisma.review.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { helpful: { decrement: 1 } } }),
      );
      expect(res).toEqual({ voted: false, helpful: 0 });
    });
  });

  describe('reply (owner)', () => {
    it('throws REVIEW_NOT_FOUND for a missing review', async () => {
      prisma.review.findUnique.mockResolvedValue(null);
      await expect(service.reply('r1', 'o1', { body: 'شكرًا' })).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws NOT_OWNER when the replier does not own the listing', async () => {
      prisma.review.findUnique.mockResolvedValue({ id: 'r1', property: { ownerId: 'someone-else' } });
      await expect(service.reply('r1', 'o1', { body: 'شكرًا' })).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.review.update).not.toHaveBeenCalled();
    });

    it('writes the reply for the listing owner', async () => {
      prisma.review.findUnique.mockResolvedValue({ id: 'r1', property: { ownerId: 'o1' } });
      prisma.review.update.mockResolvedValue({
        id: 'r1',
        propertyId: 'p1',
        authorName: 'سارة',
        initials: 'س',
        monthsLived: 3,
        rating: 9,
        body: 'حلو',
        helpful: 0,
        ownerReply: { body: 'شكرًا', date: '2026-06-01T00:00:00Z' },
        scores: null,
        createdAt: new Date('2026-06-01T00:00:00Z'),
      });

      const res = await service.reply('r1', 'o1', { body: 'شكرًا' });

      expect(prisma.review.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'r1' }, data: expect.objectContaining({ ownerReply: expect.any(Object) }) }),
      );
      expect(res).toMatchObject({ id: 'r1', ownerReply: { body: 'شكرًا' } });
    });
  });

  describe('createRenterReview (owner -> renter, T-4)', () => {
    const dto = { rating: 8, body: 'ساكن محترم', scores: { reliability: 8, care: 9 } };

    it('throws SELF_REVIEW when owner and renter are the same', async () => {
      await expect(service.createRenterReview('u1', 'u1', dto)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws NO_TENANCY when the renter never lived in the owner\u2019s place', async () => {
      prisma.tenancy.findFirst.mockResolvedValue(null);
      await expect(service.createRenterReview('o1', 'r1', dto)).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('throws ALREADY_REVIEWED for a duplicate review on the same tenancy', async () => {
      prisma.tenancy.findFirst.mockResolvedValue({ id: 't1', propertyId: 'p1' });
      prisma.renterReview.findFirst.mockResolvedValue({ id: 'rr1' });
      await expect(service.createRenterReview('o1', 'r1', dto)).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.renterReview.create).not.toHaveBeenCalled();
    });

    it('creates the review and recomputes renter reputation', async () => {
      prisma.tenancy.findFirst.mockResolvedValue({ id: 't1', propertyId: 'p1' });
      prisma.renterReview.findFirst.mockResolvedValue(null);
      prisma.renterReview.create.mockResolvedValue({ id: 'rr1' });

      const res = await service.createRenterReview('o1', 'r1', dto);

      expect(prisma.renterReview.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ tenancyId: 't1', renterId: 'r1', ownerId: 'o1', propertyId: 'p1', rating: 8 }),
        }),
      );
      expect(trust.recomputeRenterReputation).toHaveBeenCalledWith('r1');
      expect(res).toEqual({ ok: true });
    });
  });

  describe('reviewMeta', () => {
    it('canReview is true after 30+ days and lists the user\u2019s helpful votes', async () => {
      prisma.tenancy.findFirst.mockResolvedValue({ moveInDate: daysAgo(40) });
      prisma.reviewHelpfulVote.findMany.mockResolvedValue([{ reviewId: 'r1' }, { reviewId: 'r2' }]);

      const res = await service.reviewMeta('p1', 'u1');

      expect(res).toEqual({ canReview: true, votedReviewIds: ['r1', 'r2'] });
    });

    it('canReview is false without a long-enough tenancy', async () => {
      prisma.tenancy.findFirst.mockResolvedValue({ moveInDate: daysAgo(5) });
      prisma.reviewHelpfulVote.findMany.mockResolvedValue([]);

      const res = await service.reviewMeta('p1', 'u1');

      expect(res).toEqual({ canReview: false, votedReviewIds: [] });
    });
  });
});
