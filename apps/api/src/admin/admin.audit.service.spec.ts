import { PrismaService } from '../prisma/prisma.service';
import { AdminAuditService } from './admin.audit.service';
import type { AuthUser } from '../auth/decorators/current-user.decorator';

// ADMIN-12: the audit log. Writes are best-effort (must never throw and break
// the action they record); reads are filtered + cursor-paginated.

type Mock = jest.Mock;

const admin: AuthUser = {
  id: 'admin1',
  name: 'فريق بيتكو',
  phone: '+20100',
  role: 'both',
  isAdmin: true,
  verified: true,
  verificationStatus: 'verified',
};

function makePrisma() {
  return {
    adminAuditLog: { create: jest.fn().mockResolvedValue({}), findMany: jest.fn().mockResolvedValue([]) },
  };
}

describe('AdminAuditService', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let service: AdminAuditService;

  beforeEach(() => {
    prisma = makePrisma();
    service = new AdminAuditService(prisma as unknown as PrismaService);
  });

  it('writes a row capturing actor + action + target + meta', async () => {
    await service.log(admin, 'user.ban', 'user', 'u1', { reason: 'سبام' });
    expect(prisma.adminAuditLog.create).toHaveBeenCalledWith({
      data: {
        adminId: 'admin1',
        adminName: 'فريق بيتكو',
        action: 'user.ban',
        targetType: 'user',
        targetId: 'u1',
        meta: { reason: 'سبام' },
      },
    });
  });

  it('never throws when the write fails (logging must not break the action)', async () => {
    (prisma.adminAuditLog.create as Mock).mockRejectedValue(new Error('db down'));
    await expect(service.log(admin, 'user.ban', 'user', 'u1')).resolves.toBeUndefined();
  });

  it('lists newest-first with filters + cursor pagination', async () => {
    prisma.adminAuditLog.findMany.mockResolvedValue([
      { id: 'a', adminId: 'admin1', adminName: 'X', action: 'user.ban', targetType: 'user', targetId: 'u1', meta: null, createdAt: new Date('2026-06-25T00:00:00Z') },
      { id: 'b', adminId: 'admin1', adminName: 'X', action: 'user.ban', targetType: 'user', targetId: 'u2', meta: null, createdAt: new Date('2026-06-24T00:00:00Z') },
    ]);
    const res = await service.list({ targetType: 'user', action: 'ban', limit: 1 });

    const arg = prisma.adminAuditLog.findMany.mock.calls[0][0];
    expect(arg.where).toMatchObject({ targetType: 'user', action: { contains: 'ban' } });
    expect(arg.orderBy).toEqual({ createdAt: 'desc' });
    expect(res.meta).toEqual({ cursor: 'a', hasMore: true });
    expect(res.data).toHaveLength(1);
    expect(res.data[0]).toMatchObject({ id: 'a', action: 'user.ban' });
  });
});
