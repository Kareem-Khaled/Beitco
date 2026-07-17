import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TrustService } from '../trust/trust.service';
import { AdminAuditService } from './admin.audit.service';
import { AdminContentService } from './admin.content.service';
import type { AuthUser } from '../auth/decorators/current-user.decorator';

// ADMIN-4: content moderation. Mocked Prisma/Trust/Audit lock the soft-remove
// (sets removedAt + reason + remover), the trust recompute (the wedge stays
// honest), restore, and the list filters.

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

const reviewRow = (over: Record<string, unknown> = {}) => ({
  id: 'rev1',
  propertyId: 'p1',
  authorId: 'u1',
  authorName: 'سارة',
  rating: 9,
  body: 'حلو',
  helpful: 0,
  removedAt: null,
  removedReason: null,
  createdAt: new Date('2026-06-01T00:00:00Z'),
  ...over,
});

function makePrisma() {
  return {
    review: { findUnique: jest.fn(), findMany: jest.fn().mockResolvedValue([]), update: jest.fn().mockResolvedValue({}) },
    question: { findUnique: jest.fn(), update: jest.fn().mockResolvedValue({}) },
    property: { findUnique: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
  };
}

describe('AdminContentService', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let trust: { recomputeListing: Mock };
  let audit: { log: Mock };
  let service: AdminContentService;

  beforeEach(() => {
    prisma = makePrisma();
    trust = { recomputeListing: jest.fn().mockResolvedValue(undefined) };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    service = new AdminContentService(
      prisma as unknown as PrismaService,
      trust as unknown as TrustService,
      audit as unknown as AdminAuditService,
    );
  });

  describe('listReviews', () => {
    it('filters to removed reviews + enriches with the listing title', async () => {
      prisma.review.findMany.mockResolvedValue([reviewRow({ removedAt: new Date() })]);
      prisma.property.findMany.mockResolvedValue([{ id: 'p1', title: 'أوضة في المعادي' }]);

      const res = await service.listReviews({ removed: 'true' });

      expect(prisma.review.findMany.mock.calls[0][0].where).toMatchObject({ removedAt: { not: null } });
      expect(res.data[0]).toMatchObject({ id: 'rev1', removed: true, propertyTitle: 'أوضة في المعادي' });
    });

    it('filters to active reviews when removed=false', async () => {
      prisma.review.findMany.mockResolvedValue([]);
      await service.listReviews({ removed: 'false' });
      expect(prisma.review.findMany.mock.calls[0][0].where).toMatchObject({ removedAt: null });
    });
  });

  describe('removeReview', () => {
    it('throws REVIEW_NOT_FOUND for a missing review', async () => {
      prisma.review.findUnique.mockResolvedValue(null);
      await expect(service.removeReview(admin, 'nope', { reason: 'مزيّف' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('soft-removes, recomputes the listing trust, and audits', async () => {
      prisma.review.findUnique
        .mockResolvedValueOnce({ id: 'rev1', propertyId: 'p1', removedAt: null }) // guard
        .mockResolvedValueOnce(reviewRow({ removedAt: new Date(), removedReason: 'مزيّف' })); // detail
      prisma.property.findUnique.mockResolvedValue({ title: 'أوضة' });

      await service.removeReview(admin, 'rev1', { reason: '  مزيّف  ' });

      expect(prisma.review.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'rev1' },
          data: expect.objectContaining({ removedReason: 'مزيّف', removedById: 'admin1', removedAt: expect.any(Date) }),
        }),
      );
      // The wedge: trust is recomputed so the removed review stops counting.
      expect(trust.recomputeListing).toHaveBeenCalledWith('p1');
      expect(audit.log).toHaveBeenCalledWith(
        admin,
        'review.remove',
        'review',
        'rev1',
        expect.objectContaining({ reason: 'مزيّف', propertyId: 'p1' }),
      );
    });
  });

  describe('restoreReview', () => {
    it('clears removal fields, recomputes, and audits', async () => {
      prisma.review.findUnique
        .mockResolvedValueOnce({ id: 'rev1', propertyId: 'p1' })
        .mockResolvedValueOnce(reviewRow());
      prisma.property.findUnique.mockResolvedValue({ title: 'أوضة' });

      await service.restoreReview(admin, 'rev1');

      expect(prisma.review.update).toHaveBeenCalledWith({
        where: { id: 'rev1' },
        data: { removedAt: null, removedReason: null, removedById: null },
      });
      expect(trust.recomputeListing).toHaveBeenCalledWith('p1');
      expect(audit.log).toHaveBeenCalledWith(admin, 'review.restore', 'review', 'rev1', { propertyId: 'p1' });
    });
  });

  describe('removeQuestion', () => {
    it('soft-removes a question + audits (no trust recompute)', async () => {
      prisma.question.findUnique.mockResolvedValue({ id: 'q1', propertyId: 'p1' });
      const res = await service.removeQuestion(admin, 'q1', { reason: 'سبام' });

      expect(prisma.question.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ removedReason: 'سبام', removedById: 'admin1' }) }),
      );
      expect(trust.recomputeListing).not.toHaveBeenCalled();
      expect(audit.log).toHaveBeenCalledWith(admin, 'question.remove', 'question', 'q1', expect.any(Object));
      expect(res).toEqual({ ok: true });
    });
  });
});
