import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdminAuditService } from '../admin/admin.audit.service';
import { ReportsService } from './reports.service';
import type { AuthUser } from '../auth/decorators/current-user.decorator';

// ADMIN-5: reports. Mocked Prisma/Audit lock target validation, the duplicate
// guard, the default triage filter, and that resolving audits + stamps the
// resolver.

type Mock = jest.Mock;

const user: AuthUser = {
  id: 'u1',
  name: 'سارة',
  phone: '+20111',
  role: 'renter',
  isAdmin: false,
  verified: false,
  verificationStatus: 'unverified',
};

const admin: AuthUser = { ...user, id: 'admin1', name: 'فريق بيتكو', isAdmin: true };

function makePrisma() {
  return {
    property: { findFirst: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
    review: { findUnique: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
    question: { findUnique: jest.fn() },
    user: { findFirst: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
    report: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  };
}

const reportRow = (over: Record<string, unknown> = {}) => ({
  id: 'r1',
  reporterId: 'u1',
  targetType: 'listing',
  targetId: 'p1',
  reason: 'إعلان وهمي',
  details: null,
  status: 'open',
  resolution: null,
  resolvedById: null,
  resolvedAt: null,
  createdAt: new Date('2026-06-25T00:00:00Z'),
  ...over,
});

describe('ReportsService', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let audit: { log: Mock };
  let service: ReportsService;

  beforeEach(() => {
    prisma = makePrisma();
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    service = new ReportsService(
      prisma as unknown as PrismaService,
      audit as unknown as AdminAuditService,
    );
  });

  describe('create', () => {
    const dto = { targetType: 'listing', targetId: 'p1', reason: 'إعلان وهمي' };

    it('throws TARGET_NOT_FOUND when the listing does not exist', async () => {
      prisma.property.findFirst.mockResolvedValue(null);
      await expect(service.create(user, dto)).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.report.create).not.toHaveBeenCalled();
    });

    it('blocks a duplicate open report from the same user', async () => {
      prisma.property.findFirst.mockResolvedValue({ id: 'p1' });
      prisma.report.findFirst.mockResolvedValue({ id: 'existing' });
      await expect(service.create(user, dto)).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.report.create).not.toHaveBeenCalled();
    });

    it('creates a report against a valid target', async () => {
      prisma.property.findFirst.mockResolvedValue({ id: 'p1' });
      prisma.report.findFirst.mockResolvedValue(null);
      prisma.report.create.mockResolvedValue(reportRow());
      const res = await service.create(user, dto);
      expect(prisma.report.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ reporterId: 'u1', targetType: 'listing', targetId: 'p1' }),
        }),
      );
      expect(res).toMatchObject({ id: 'r1', status: 'open' });
    });

    it('validates a review target via the review table', async () => {
      prisma.review.findUnique.mockResolvedValue(null);
      await expect(
        service.create(user, { targetType: 'review', targetId: 'rev1', reason: 'مزيّف' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('list', () => {
    it('defaults to the open + reviewing queue and enriches rows', async () => {
      prisma.report.findMany.mockResolvedValue([reportRow()]);
      prisma.user.findMany.mockResolvedValue([{ id: 'u1', name: 'سارة' }]);
      prisma.property.findMany.mockResolvedValue([{ id: 'p1', title: 'أوضة في المعادي' }]);

      const res = await service.list({});

      const arg = prisma.report.findMany.mock.calls[0][0];
      expect(arg.where.status).toEqual({ in: ['open', 'reviewing'] });
      expect(res.data[0]).toMatchObject({
        id: 'r1',
        reporterName: 'سارة',
        targetLabel: 'أوضة في المعادي',
      });
    });

    it('filters by an explicit status', async () => {
      prisma.report.findMany.mockResolvedValue([]);
      await service.list({ status: 'resolved' });
      expect(prisma.report.findMany.mock.calls[0][0].where.status).toBe('resolved');
    });
  });

  describe('updateStatus', () => {
    it('throws REPORT_NOT_FOUND for a missing report', async () => {
      prisma.report.findUnique.mockResolvedValue(null);
      await expect(service.updateStatus(admin, 'nope', { status: 'resolved' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('resolving stamps the resolver + audits', async () => {
      prisma.report.findUnique.mockResolvedValue(reportRow());
      prisma.report.update.mockResolvedValue(reportRow({ status: 'resolved', resolvedById: 'admin1' }));

      await service.updateStatus(admin, 'r1', { status: 'resolved', resolution: 'اتشال الإعلان' });

      expect(prisma.report.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'resolved', resolvedById: 'admin1' }) }),
      );
      expect(audit.log).toHaveBeenCalledWith(
        admin,
        'report.resolved',
        'report',
        'r1',
        expect.objectContaining({ resolution: 'اتشال الإعلان' }),
      );
    });

    it('moving to reviewing does not stamp a resolver', async () => {
      prisma.report.findUnique.mockResolvedValue(reportRow());
      prisma.report.update.mockResolvedValue(reportRow({ status: 'reviewing' }));
      await service.updateStatus(admin, 'r1', { status: 'reviewing' });
      const data = prisma.report.update.mock.calls[0][0].data;
      expect(data.resolvedById).toBeUndefined();
    });
  });

  describe('count', () => {
    it('counts open + reviewing reports', async () => {
      prisma.report.count.mockResolvedValue(4);
      await expect(service.count()).resolves.toEqual({ count: 4 });
      expect(prisma.report.count).toHaveBeenCalledWith({ where: { status: { in: ['open', 'reviewing'] } } });
    });
  });
});
