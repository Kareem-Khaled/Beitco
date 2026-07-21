import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { NotificationsService } from './notifications.service';

// TEST-1: NotificationsService  -  the derived feed (leads/messages/review-gate/
// verification/persisted) + the Redis-gated read-state (lastSeen/unreadCount/
// markSeen). Mocked Prisma + RedisService.

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000);

function makePrisma() {
  return {
    user: { findUnique: jest.fn() },
    lead: { findMany: jest.fn().mockResolvedValue([]) },
    thread: { findMany: jest.fn().mockResolvedValue([]) },
    tenancy: { findMany: jest.fn().mockResolvedValue([]) },
    notification: { findMany: jest.fn().mockResolvedValue([]) },
    property: { findMany: jest.fn().mockResolvedValue([]) },
  };
}

function makeRedis(ready: boolean) {
  const store = new Map<string, string>();
  return {
    ready,
    client: {
      get: jest.fn((k: string) => Promise.resolve(store.get(k) ?? null)),
      set: jest.fn((k: string, v: string) => {
        store.set(k, v);
        return Promise.resolve('OK');
      }),
    },
  };
}

describe('NotificationsService', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let redis: ReturnType<typeof makeRedis>;
  let service: NotificationsService;

  const build = (ready = true) => {
    redis = makeRedis(ready);
    service = new NotificationsService(
      prisma as unknown as PrismaService,
      redis as unknown as RedisService,
    );
  };

  beforeEach(() => {
    prisma = makePrisma();
    build();
  });

  describe('feed', () => {
    it('returns [] for a missing user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.feed('nope')).resolves.toEqual([]);
    });

    it('derives an owner lead notification', async () => {
      prisma.user.findUnique.mockResolvedValue({ role: 'owner', verificationStatus: 'unverified', createdAt: daysAgo(10) });
      prisma.lead.findMany.mockResolvedValue([
        { id: 'l1', renterName: 'سارة', propertyId: 'p1', property: { title: 'شقتي' }, createdAt: daysAgo(1) },
      ]);
      const feed = await service.feed('owner1');
      expect(feed.some((n) => n.type === 'lead' && n.id === 'lead-l1')).toBe(true);
    });

    it('does not query leads for a pure renter', async () => {
      prisma.user.findUnique.mockResolvedValue({ role: 'renter', verificationStatus: 'unverified', createdAt: daysAgo(10) });
      await service.feed('r1');
      expect(prisma.lead.findMany).not.toHaveBeenCalled();
    });

    it('emits a review-eligibility item only after 30 days', async () => {
      prisma.user.findUnique.mockResolvedValue({ role: 'renter', verificationStatus: 'unverified', createdAt: daysAgo(10) });
      prisma.tenancy.findMany.mockResolvedValue([
        { id: 't-new', propertyId: 'p1', property: { title: 'المكان' }, moveInDate: daysAgo(10) },
        { id: 't-old', propertyId: 'p2', property: { title: 'القديم' }, moveInDate: daysAgo(40) },
      ]);
      const feed = await service.feed('r1');
      const reviewItems = feed.filter((n) => n.type === 'review');
      expect(reviewItems).toHaveLength(1);
      expect(reviewItems[0]?.id).toBe('rev-t-old');
    });

    it('adds a verification item for a pending user + includes persisted rows', async () => {
      prisma.user.findUnique.mockResolvedValue({ role: 'renter', verificationStatus: 'pending', createdAt: daysAgo(2) });
      prisma.notification.findMany.mockResolvedValue([
        { id: 'n1', type: 'saved_search', title: 'مكان جديد', body: '...', propertyId: 'p9', threadId: null, createdAt: daysAgo(1) },
      ]);
      const feed = await service.feed('r1');
      expect(feed.some((n) => n.id === 'verif-pending')).toBe(true);
      expect(feed.some((n) => n.id === 'n1' && n.type === 'saved_search')).toBe(true);
    });

    it('sorts newest-first', async () => {
      prisma.user.findUnique.mockResolvedValue({ role: 'renter', verificationStatus: 'unverified', createdAt: daysAgo(10) });
      prisma.notification.findMany.mockResolvedValue([
        { id: 'old', type: 'saved_search', title: 'a', body: 'b', propertyId: null, threadId: null, createdAt: daysAgo(5) },
        { id: 'new', type: 'saved_search', title: 'c', body: 'd', propertyId: null, threadId: null, createdAt: daysAgo(1) },
      ]);
      const feed = await service.feed('r1');
      expect(feed[0]?.id).toBe('new');
    });

    it('SCALE-2: caps every per-user feed source with take', async () => {
      prisma.user.findUnique.mockResolvedValue({ role: 'both', verificationStatus: 'unverified', createdAt: daysAgo(10) });
      await service.feed('u1');
      // owner leads + threads + tenancies + stored notifications all bounded.
      expect(prisma.lead.findMany.mock.calls[0][0].take).toBe(50);
      expect(prisma.thread.findMany.mock.calls[0][0].take).toBe(50);
      expect(prisma.tenancy.findMany.mock.calls[0][0].take).toBe(50);
      expect(prisma.notification.findMany.mock.calls[0][0].take).toBe(50);
    });

    it('derives a moderation notification for an admin (pending listings)', async () => {
      prisma.user.findUnique.mockResolvedValue({ role: 'both', verificationStatus: 'verified', createdAt: daysAgo(10), isAdmin: true });
      // role 'both' means the owner moderated-listings source also queries
      // property.findMany  -  distinguish the two by their where clause.
      const created = daysAgo(1);
      prisma.property.findMany.mockImplementation((args: { where?: { status?: string } }) =>
        Promise.resolve(
          args.where?.status === 'pending_approval'
            ? [{ id: 'p-pending', title: 'شقة مستنية', area: 'المعادي', createdAt: created, updatedAt: created }]
            : [],
        ),
      );
      const feed = await service.feed('admin1');
      const mod = feed.find((n) => n.type === 'moderation');
      expect(mod?.id).toBe('mod-p-pending');
      expect(mod?.propertyId).toBe('p-pending');
      expect(mod?.title).toBe('إعلان جديد مستني مراجعة'); // fresh, not resubmitted
      const adminCall = prisma.property.findMany.mock.calls.find(
        (c: [{ where?: { status?: string } }]) => c[0]?.where?.status === 'pending_approval',
      );
      expect(adminCall?.[0]).toMatchObject({
        where: { status: 'pending_approval', deletedAt: null },
        take: 50,
      });
    });

    it('re-alerts the admin with a "resubmitted" moderation notice (updatedAt >> createdAt)', async () => {
      prisma.user.findUnique.mockResolvedValue({ role: 'admin', verificationStatus: 'verified', createdAt: daysAgo(30), isAdmin: true });
      // Created 10 days ago, edited & resubmitted 1 day ago  -  the gap marks it a resubmit.
      prisma.property.findMany.mockImplementation((args: { where?: { status?: string } }) =>
        Promise.resolve(
          args.where?.status === 'pending_approval'
            ? [{ id: 'p-redo', title: 'إعلان متعدّل', area: 'الزمالك', createdAt: daysAgo(10), updatedAt: daysAgo(1) }]
            : [],
        ),
      );
      const feed = await service.feed('admin1');
      const mod = feed.find((n) => n.id === 'mod-p-redo');
      expect(mod?.title).toBe('إعلان اتعدّل ومستني مراجعة تانية');
      // The notification date tracks the resubmit (updatedAt), so it counts as
      // fresh/unread even though the listing was created long ago.
      expect(new Date(mod!.date).getTime()).toBeCloseTo(+daysAgo(1), -5);
    });

    it('does not query the admin moderation queue for a non-admin', async () => {
      prisma.user.findUnique.mockResolvedValue({ role: 'owner', verificationStatus: 'verified', createdAt: daysAgo(10), isAdmin: false });
      await service.feed('owner1');
      // The owner source may query property.findMany, but never with the admin
      // pending_approval queue filter.
      const adminCall = prisma.property.findMany.mock.calls.find(
        (c: [{ where?: { status?: string } }]) => c[0]?.where?.status === 'pending_approval',
      );
      expect(adminCall).toBeUndefined();
    });

    it('derives listing_status notifications for an owner (approved + rejected)', async () => {
      prisma.user.findUnique.mockResolvedValue({ role: 'owner', verificationStatus: 'verified', createdAt: daysAgo(10), isAdmin: false });
      prisma.property.findMany.mockResolvedValue([
        { id: 'p-rej', title: 'مرفوض', status: 'rejected', rejectionReason: 'السعر غالي', moderatedAt: daysAgo(1) },
        { id: 'p-pub', title: 'منشور', status: 'published', rejectionReason: null, moderatedAt: daysAgo(2) },
      ]);
      const feed = await service.feed('owner1');
      const rej = feed.find((n) => n.id === 'modres-p-rej-rej');
      const pub = feed.find((n) => n.id === 'modres-p-pub-pub');
      expect(rej?.type).toBe('listing_status');
      expect(rej?.body).toContain('السعر غالي');
      expect(rej?.propertyId).toBe('p-rej');
      expect(pub?.type).toBe('listing_status');
      expect(prisma.property.findMany.mock.calls[0][0]).toMatchObject({
        where: { ownerId: 'owner1', deletedAt: null, moderatedAt: { not: null } },
        take: 50,
      });
    });
  });

  describe('read-state (Redis-gated)', () => {
    const renter = { role: 'renter', verificationStatus: 'unverified', createdAt: daysAgo(10) };

    it('lastSeen is 0 when Redis is down', async () => {
      build(false);
      await expect(service.lastSeen('u1')).resolves.toBe(0);
    });

    it('markSeen writes the marker only when Redis is up', async () => {
      await service.markSeen('u1');
      expect(redis.client.set).toHaveBeenCalled();

      build(false);
      await service.markSeen('u1');
      expect(redis.client.set).not.toHaveBeenCalled();
    });

    it('unreadCount counts feed items newer than the last-seen marker', async () => {
      prisma.user.findUnique.mockResolvedValue(renter);
      prisma.notification.findMany.mockResolvedValue([
        { id: 'recent', type: 'saved_search', title: 'a', body: 'b', propertyId: null, threadId: null, createdAt: daysAgo(1) },
        { id: 'stale', type: 'saved_search', title: 'c', body: 'd', propertyId: null, threadId: null, createdAt: daysAgo(10) },
      ]);
      // seen marker = 5 days ago -> only the 1-day-old item is unread.
      redis.client.get.mockResolvedValue(String(+daysAgo(5)));
      const { count } = await service.unreadCount('u1');
      expect(count).toBe(1);
    });
  });
});
