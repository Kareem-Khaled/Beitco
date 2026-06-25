import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TrustService } from '../trust/trust.service';
import { AdminAuditService } from './admin.audit.service';
import { AdminUsersService } from './admin.users.service';
import type { AuthUser } from '../auth/decorators/current-user.decorator';

// ADMIN-2 / ADMIN-12: user management + audit. Mocked Prisma/Trust/Audit lock
// the filters, the ban/admin guards (can't self-ban, can't ban an admin), and
// that every mutation writes an audit-log row (+ notifies the user on ban).

type Mock = jest.Mock;

interface PrismaMock {
  user: { findMany: Mock; findFirst: Mock; update: Mock };
  property: { count: Mock };
  lead: { count: Mock };
  tenancy: { count: Mock };
  review: { count: Mock };
  renterReview: { count: Mock };
  thread: { count: Mock };
  verificationRequest: { findMany: Mock };
  notification: { create: Mock };
}

function makePrisma(): PrismaMock {
  return {
    user: { findMany: jest.fn(), findFirst: jest.fn(), update: jest.fn().mockResolvedValue({}) },
    property: { count: jest.fn().mockResolvedValue(0) },
    lead: { count: jest.fn().mockResolvedValue(0) },
    tenancy: { count: jest.fn().mockResolvedValue(0) },
    review: { count: jest.fn().mockResolvedValue(0) },
    renterReview: { count: jest.fn().mockResolvedValue(0) },
    thread: { count: jest.fn().mockResolvedValue(0) },
    verificationRequest: { findMany: jest.fn().mockResolvedValue([]) },
    notification: { create: jest.fn().mockResolvedValue({}) },
  };
}

const admin: AuthUser = {
  id: 'admin1',
  name: 'فريق بيتكو',
  phone: '+20100',
  role: 'both',
  isAdmin: true,
  verified: true,
  verificationStatus: 'verified',
};

const userRow = (over: Partial<Record<string, unknown>> = {}) => ({
  id: 'u1',
  name: 'سارة',
  phone: '+20111',
  role: 'renter',
  gender: null,
  avatar: null,
  isAdmin: false,
  verified: false,
  verificationStatus: 'unverified',
  trust: 5,
  trustBreakdown: null,
  responseRate: null,
  renterReputation: null,
  renterReviewsCount: 0,
  bannedAt: null,
  banReason: null,
  createdAt: new Date('2026-06-01T00:00:00Z'),
  deletedAt: null,
  ...over,
});

describe('AdminUsersService', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let trust: { recomputeOwner: Mock };
  let audit: { log: Mock };
  let service: AdminUsersService;

  beforeEach(() => {
    prisma = makePrisma();
    trust = { recomputeOwner: jest.fn().mockResolvedValue(undefined) };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    service = new AdminUsersService(
      prisma as unknown as PrismaService,
      trust as unknown as TrustService,
      audit as unknown as AdminAuditService,
    );
  });

  describe('list', () => {
    it('builds a name/phone search + role + banned filter and paginates', async () => {
      prisma.user.findMany.mockResolvedValue([userRow()]);
      const res = await service.list({ q: 'سارة', role: 'renter', status: 'banned', limit: 25 });

      const arg = prisma.user.findMany.mock.calls[0][0];
      expect(arg.where).toMatchObject({ role: 'renter', bannedAt: { not: null }, deletedAt: null });
      expect(arg.where.OR).toEqual([
        { name: { contains: 'سارة', mode: 'insensitive' } },
        { phone: { contains: 'سارة' } },
      ]);
      expect(res.data[0]).toMatchObject({ id: 'u1', banned: false });
      expect(res.meta).toEqual({ cursor: null, hasMore: false });
    });

    it('flags hasMore + returns a cursor when over the limit', async () => {
      prisma.user.findMany.mockResolvedValue([userRow({ id: 'a' }), userRow({ id: 'b' })]);
      const res = await service.list({ limit: 1 });
      expect(res.meta).toEqual({ cursor: 'a', hasMore: true });
      expect(res.data).toHaveLength(1);
    });
  });

  describe('detail', () => {
    it('throws USER_NOT_FOUND for a missing user', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      await expect(service.detail('nope')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns the user with activity counts', async () => {
      prisma.user.findFirst.mockResolvedValue(userRow());
      prisma.property.count.mockResolvedValue(3);
      prisma.tenancy.count.mockResolvedValue(1);
      const res = (await service.detail('u1')) as { counts: Record<string, number> };
      expect(res.counts).toMatchObject({ listings: 3, tenancies: 1 });
    });
  });

  describe('update', () => {
    it('manually verifies + recomputes trust + audits', async () => {
      prisma.user.findFirst
        .mockResolvedValueOnce(userRow()) // guard lookup
        .mockResolvedValueOnce(userRow({ verified: true, verificationStatus: 'verified' })); // detail()
      await service.update(admin, 'u1', { verified: true, reason: 'تأكدنا يدوي' });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { verified: true, verificationStatus: 'verified' },
      });
      expect(trust.recomputeOwner).toHaveBeenCalledWith('u1');
      expect(audit.log).toHaveBeenCalledWith(
        admin,
        'user.update',
        'user',
        'u1',
        expect.objectContaining({ reason: 'تأكدنا يدوي' }),
      );
    });

    it('rejects an empty update', async () => {
      prisma.user.findFirst.mockResolvedValue(userRow());
      await expect(service.update(admin, 'u1', {})).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('ban / reinstate', () => {
    it('refuses to ban yourself', async () => {
      await expect(service.ban(admin, 'admin1', { reason: 'x' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('refuses to ban another admin', async () => {
      prisma.user.findFirst.mockResolvedValue(userRow({ id: 'u2', isAdmin: true }));
      await expect(service.ban(admin, 'u2', { reason: 'x' })).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('bans: sets bannedAt + reason, notifies the user, and audits', async () => {
      prisma.user.findFirst
        .mockResolvedValueOnce(userRow()) // guard
        .mockResolvedValueOnce(userRow({ bannedAt: new Date(), banReason: 'سبام' })); // detail
      await service.ban(admin, 'u1', { reason: '  سبام  ' });

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ banReason: 'سبام' }) }),
      );
      expect(prisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ userId: 'u1', type: 'verification' }) }),
      );
      expect(audit.log).toHaveBeenCalledWith(admin, 'user.ban', 'user', 'u1', { reason: 'سبام' });
    });

    it('reinstate clears the ban, notifies, and audits', async () => {
      prisma.user.findFirst
        .mockResolvedValueOnce(userRow({ bannedAt: new Date() }))
        .mockResolvedValueOnce(userRow());
      await service.reinstate(admin, 'u1');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { bannedAt: null, banReason: null },
      });
      expect(audit.log).toHaveBeenCalledWith(admin, 'user.reinstate', 'user', 'u1', {});
    });
  });

  describe('setAdmin', () => {
    it('refuses to change your own admin status', async () => {
      await expect(service.setAdmin(admin, 'admin1', false)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('grants admin + audits', async () => {
      prisma.user.findFirst.mockResolvedValueOnce(userRow()).mockResolvedValueOnce(userRow({ isAdmin: true }));
      await service.setAdmin(admin, 'u1', true);
      expect(prisma.user.update).toHaveBeenCalledWith({ where: { id: 'u1' }, data: { isAdmin: true } });
      expect(audit.log).toHaveBeenCalledWith(admin, 'user.make_admin', 'user', 'u1', {});
    });
  });
});
