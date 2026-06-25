import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EngagementService } from './engagement.service';

// TEST-1: EngagementService — saves, the lead -> tenancy flow, and Q&A. Mocked
// Prisma locks the ownership guards (403s), the save toggle, and the key rule
// that completing a lead creates a tenancy idempotently (the gate for reviews).

type Mock = jest.Mock;

interface PrismaMock {
  savedListing: { findUnique: Mock; delete: Mock; create: Mock; findMany: Mock };
  property: { findFirst: Mock };
  lead: { create: Mock; findUnique: Mock; update: Mock; findMany: Mock };
  tenancy: { findFirst: Mock; create: Mock };
  question: { create: Mock; findUnique: Mock; update: Mock };
}

function makePrisma(): PrismaMock {
  return {
    savedListing: { findUnique: jest.fn(), delete: jest.fn(), create: jest.fn(), findMany: jest.fn() },
    property: { findFirst: jest.fn() },
    lead: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn(), findMany: jest.fn() },
    tenancy: { findFirst: jest.fn(), create: jest.fn() },
    question: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
  };
}

describe('EngagementService', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let service: EngagementService;

  beforeEach(() => {
    prisma = makePrisma();
    service = new EngagementService(prisma as unknown as PrismaService);
  });

  describe('toggleSaved', () => {
    it('removes an existing save and returns saved:false', async () => {
      prisma.savedListing.findUnique.mockResolvedValue({ id: 's1' });
      const res = await service.toggleSaved('u1', 'p1');
      expect(prisma.savedListing.delete).toHaveBeenCalledWith({ where: { id: 's1' } });
      expect(prisma.savedListing.create).not.toHaveBeenCalled();
      expect(res).toEqual({ saved: false });
    });

    it('adds a save (after asserting the property exists) and returns saved:true', async () => {
      prisma.savedListing.findUnique.mockResolvedValue(null);
      prisma.property.findFirst.mockResolvedValue({ id: 'p1' });
      const res = await service.toggleSaved('u1', 'p1');
      expect(prisma.savedListing.create).toHaveBeenCalledWith({ data: { userId: 'u1', propertyId: 'p1' } });
      expect(res).toEqual({ saved: true });
    });

    it('throws PROPERTY_NOT_FOUND when saving a missing property', async () => {
      prisma.savedListing.findUnique.mockResolvedValue(null);
      prisma.property.findFirst.mockResolvedValue(null);
      await expect(service.toggleSaved('u1', 'gone')).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.savedListing.create).not.toHaveBeenCalled();
    });
  });

  describe('updateLeadStatus (owner-only; completion -> tenancy)', () => {
    it('throws LEAD_NOT_FOUND for a missing lead', async () => {
      prisma.lead.findUnique.mockResolvedValue(null);
      await expect(service.updateLeadStatus('o1', 'l1', { status: 'approved' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('throws NOT_OWNER (403) when the caller does not own the listing', async () => {
      prisma.lead.findUnique.mockResolvedValue({
        id: 'l1',
        propertyId: 'p1',
        renterId: 'r1',
        property: { ownerId: 'someone-else' },
        units: [],
      });
      await expect(service.updateLeadStatus('o1', 'l1', { status: 'approved' })).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(prisma.lead.update).not.toHaveBeenCalled();
    });

    it('updates status without creating a tenancy for non-completed transitions', async () => {
      prisma.lead.findUnique.mockResolvedValue({
        id: 'l1',
        propertyId: 'p1',
        renterId: 'r1',
        property: { ownerId: 'o1' },
        units: [],
      });
      prisma.lead.update.mockResolvedValue({
        id: 'l1',
        propertyId: 'p1',
        renterId: 'r1',
        renterName: 'سارة',
        status: 'approved',
        intent: null,
        preferredDate: null,
        note: null,
        createdAt: new Date('2026-06-01T00:00:00Z'),
        units: [],
      });

      const res = await service.updateLeadStatus('o1', 'l1', { status: 'approved' });

      expect(prisma.tenancy.create).not.toHaveBeenCalled();
      expect(res).toMatchObject({ id: 'l1', status: 'approved' });
    });

    it('creates a tenancy on completion when none exists yet', async () => {
      prisma.lead.findUnique.mockResolvedValue({
        id: 'l1',
        propertyId: 'p1',
        renterId: 'r1',
        property: { ownerId: 'o1' },
        units: [],
      });
      prisma.lead.update.mockResolvedValue({
        id: 'l1',
        propertyId: 'p1',
        renterId: 'r1',
        renterName: 'سارة',
        status: 'completed',
        intent: null,
        preferredDate: null,
        note: null,
        createdAt: new Date('2026-06-01T00:00:00Z'),
        units: [],
      });
      prisma.tenancy.findFirst.mockResolvedValue(null);

      await service.updateLeadStatus('o1', 'l1', { status: 'completed' });

      expect(prisma.tenancy.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ propertyId: 'p1', userId: 'r1', monthsLived: 0 }) }),
      );
    });

    it('is idempotent: no duplicate tenancy when one already exists', async () => {
      prisma.lead.findUnique.mockResolvedValue({
        id: 'l1',
        propertyId: 'p1',
        renterId: 'r1',
        property: { ownerId: 'o1' },
        units: [],
      });
      prisma.lead.update.mockResolvedValue({
        id: 'l1',
        propertyId: 'p1',
        renterId: 'r1',
        renterName: 'سارة',
        status: 'completed',
        intent: null,
        preferredDate: null,
        note: null,
        createdAt: new Date('2026-06-01T00:00:00Z'),
        units: [],
      });
      prisma.tenancy.findFirst.mockResolvedValue({ id: 't-existing' });

      await service.updateLeadStatus('o1', 'l1', { status: 'completed' });

      expect(prisma.tenancy.create).not.toHaveBeenCalled();
    });
  });

  describe('answer (owner-only Q&A)', () => {
    it('throws QUESTION_NOT_FOUND for a missing question', async () => {
      prisma.question.findUnique.mockResolvedValue(null);
      await expect(service.answer('o1', 'مالك', 'q1', { body: 'أيوة' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('throws NOT_OWNER when a non-owner tries to answer', async () => {
      prisma.question.findUnique.mockResolvedValue({ id: 'q1', property: { ownerId: 'someone-else' } });
      await expect(service.answer('o1', 'مالك', 'q1', { body: 'أيوة' })).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(prisma.question.update).not.toHaveBeenCalled();
    });

    it('records the owner answer', async () => {
      prisma.question.findUnique.mockResolvedValue({ id: 'q1', property: { ownerId: 'o1' } });
      prisma.question.update.mockResolvedValue({
        id: 'q1',
        propertyId: 'p1',
        askerName: 'خالد',
        body: 'النت كويس؟',
        answer: 'أيوة 200 ميجا',
        answererName: 'مالك',
        createdAt: new Date('2026-06-01T00:00:00Z'),
        answeredAt: new Date('2026-06-02T00:00:00Z'),
      });

      const res = await service.answer('o1', 'مالك', 'q1', { body: 'أيوة 200 ميجا' });

      expect(prisma.question.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'q1' },
          data: expect.objectContaining({ answer: 'أيوة 200 ميجا', answererId: 'o1' }),
        }),
      );
      expect(res).toMatchObject({ id: 'q1', a: 'أيوة 200 ميجا', answerer: 'مالك' });
    });
  });
});
