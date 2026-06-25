import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TrustService } from '../trust/trust.service';
import { VerificationService } from './verification.service';

// TEST-1: VerificationService (PROD-5 KYC) with a mocked Prisma + Trust. The
// e2e covers the happy path end-to-end; these lock the branch logic (guards,
// the "one active request" replacement, the approve transaction + trust
// recompute, and reject's reason defaulting).

type Mock = jest.Mock;

interface PrismaMock {
  user: { findUnique: Mock; update: Mock };
  verificationRequest: {
    deleteMany: Mock;
    create: Mock;
    findFirst: Mock;
    findUnique: Mock;
    findMany: Mock;
    count: Mock;
    update: Mock;
  };
  notification: { create: Mock };
  $transaction: Mock;
}

function makePrisma(): PrismaMock {
  return {
    user: { findUnique: jest.fn(), update: jest.fn() },
    verificationRequest: {
      deleteMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    notification: { create: jest.fn() },
    // $transaction just resolves the array of (already-invoked) operations.
    $transaction: jest.fn((ops: unknown[]) => Promise.all(ops)),
  };
}

function makeTrust() {
  return { recomputeOwner: jest.fn().mockResolvedValue(undefined) };
}

const baseRequest = {
  id: 'req1',
  userId: 'u1',
  status: 'pending',
  idDocUrl: 'id.jpg',
  selfieUrl: 'selfie.jpg',
  ownershipDocUrl: null,
  rejectionReason: null,
  submittedAt: new Date('2026-06-01T00:00:00Z'),
  reviewedAt: null,
};

describe('VerificationService', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let trust: ReturnType<typeof makeTrust>;
  let service: VerificationService;

  beforeEach(() => {
    prisma = makePrisma();
    trust = makeTrust();
    service = new VerificationService(
      prisma as unknown as PrismaService,
      trust as unknown as TrustService,
    );
  });

  describe('submit', () => {
    const dto = { idDocUrl: 'id.jpg', selfieUrl: 'selfie.jpg' };

    it('throws USER_NOT_FOUND when the user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.submit('u1', dto)).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.verificationRequest.create).not.toHaveBeenCalled();
    });

    it('throws ALREADY_VERIFIED when the user is already verified', async () => {
      prisma.user.findUnique.mockResolvedValue({ verificationStatus: 'verified' });
      await expect(service.submit('u1', dto)).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.verificationRequest.deleteMany).not.toHaveBeenCalled();
    });

    it('replaces any prior non-verified request, creates a pending one, and flips the user to pending', async () => {
      prisma.user.findUnique.mockResolvedValue({ verificationStatus: 'unverified' });
      prisma.verificationRequest.deleteMany.mockResolvedValue({ count: 1 });
      prisma.verificationRequest.create.mockResolvedValue(baseRequest);
      prisma.user.update.mockResolvedValue({});

      const res = await service.submit('u1', dto);

      // Old pending/unverified requests are cleared first.
      expect(prisma.verificationRequest.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'u1', status: { in: ['pending', 'unverified'] } },
      });
      // New request is pending with the submitted docs.
      expect(prisma.verificationRequest.create).toHaveBeenCalledWith({
        data: { userId: 'u1', status: 'pending', idDocUrl: 'id.jpg', selfieUrl: 'selfie.jpg', ownershipDocUrl: null },
      });
      // User flips to pending.
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { verificationStatus: 'pending' },
      });
      expect(res).toMatchObject({ id: 'req1', userId: 'u1', status: 'pending' });
    });

    it('passes ownershipDocUrl through when provided', async () => {
      prisma.user.findUnique.mockResolvedValue({ verificationStatus: null });
      prisma.verificationRequest.deleteMany.mockResolvedValue({ count: 0 });
      prisma.verificationRequest.create.mockResolvedValue(baseRequest);
      prisma.user.update.mockResolvedValue({});

      await service.submit('u1', { ...dto, ownershipDocUrl: 'deed.pdf' });

      expect(prisma.verificationRequest.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ ownershipDocUrl: 'deed.pdf' }) }),
      );
    });
  });

  describe('mine', () => {
    it('returns the latest serialized request', async () => {
      prisma.verificationRequest.findFirst.mockResolvedValue(baseRequest);
      const res = await service.mine('u1');
      expect(prisma.verificationRequest.findFirst).toHaveBeenCalledWith({
        where: { userId: 'u1' },
        orderBy: { submittedAt: 'desc' },
      });
      expect(res).toMatchObject({ id: 'req1', status: 'pending' });
    });

    it('returns null when there is no request', async () => {
      prisma.verificationRequest.findFirst.mockResolvedValue(null);
      await expect(service.mine('u1')).resolves.toBeNull();
    });
  });

  describe('pending / pendingCount', () => {
    it('lists pending requests oldest-first with applicant info', async () => {
      prisma.verificationRequest.findMany.mockResolvedValue([
        { ...baseRequest, user: { name: 'سارة', phone: '+201000000000', role: 'owner' } },
      ]);
      const res = await service.pending();
      expect(prisma.verificationRequest.findMany).toHaveBeenCalledWith({
        where: { status: 'pending' },
        orderBy: { submittedAt: 'asc' },
        include: { user: { select: { name: true, phone: true, role: true } } },
      });
      expect(res[0]).toMatchObject({ user: { name: 'سارة', role: 'owner' } });
    });

    it('returns the pending count', async () => {
      prisma.verificationRequest.count.mockResolvedValue(3);
      await expect(service.pendingCount()).resolves.toEqual({ count: 3 });
    });
  });

  describe('approve', () => {
    it('throws REQUEST_NOT_FOUND for an unknown request', async () => {
      prisma.verificationRequest.findUnique.mockResolvedValue(null);
      await expect(service.approve('nope')).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('verifies the user (transaction), notifies, and recomputes owner trust', async () => {
      prisma.verificationRequest.findUnique.mockResolvedValue({ id: 'req1', userId: 'u1' });

      const res = await service.approve('req1');

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.verificationRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'req1' }, data: expect.objectContaining({ status: 'verified' }) }),
      );
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'u1' }, data: { verified: true, verificationStatus: 'verified' } }),
      );
      expect(prisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ userId: 'u1', type: 'verification' }) }),
      );
      // The T-2 verification bonus only applies after a recompute.
      expect(trust.recomputeOwner).toHaveBeenCalledWith('u1');
      expect(res).toEqual({ ok: true });
    });
  });

  describe('reject', () => {
    it('throws REQUEST_NOT_FOUND for an unknown request', async () => {
      prisma.verificationRequest.findUnique.mockResolvedValue(null);
      await expect(service.reject('nope', 'blurry')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('stores the trimmed reason and never recomputes trust', async () => {
      prisma.verificationRequest.findUnique.mockResolvedValue({ id: 'req1', userId: 'u1' });

      await service.reject('req1', '  صورة مش واضحة  ');

      expect(prisma.verificationRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'unverified', rejectionReason: 'صورة مش واضحة' }),
        }),
      );
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'u1' }, data: { verificationStatus: 'unverified' } }),
      );
      expect(trust.recomputeOwner).not.toHaveBeenCalled();
    });

    it('falls back to a default reason when given only whitespace', async () => {
      prisma.verificationRequest.findUnique.mockResolvedValue({ id: 'req1', userId: 'u1' });
      await service.reject('req1', '   ');
      expect(prisma.verificationRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ rejectionReason: 'مستندات غير مكتملة أو غير واضحة.' }),
        }),
      );
    });
  });
});
