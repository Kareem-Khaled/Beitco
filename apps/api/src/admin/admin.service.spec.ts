import { PrismaService } from '../prisma/prisma.service';
import { TrustService } from '../trust/trust.service';
import { FanoutService } from '../notifications/fanout.service';
import { SearchService } from '../search/search.service';
import { AdminService } from './admin.service';

// TEST-1 / ADMIN-1: platformStats maps a pile of parallel aggregates into the
// operator-dashboard shape. Mocked Prisma returns canned counts; we assert the
// mapping (enum translation, status buckets, role split, derived totals).

type Mock = jest.Mock;

function makePrisma() {
  const groupBy = (rows: unknown[]) => jest.fn().mockResolvedValue(rows);
  return {
    user: {
      count: jest.fn().mockResolvedValue(0),
      groupBy: groupBy([
        { role: 'renter', _count: { _all: 8 } },
        { role: 'owner', _count: { _all: 3 } },
        { role: 'both', _count: { _all: 1 } },
      ]),
      aggregate: jest.fn().mockResolvedValue({ _avg: { trust: 8.4123 } }),
      findMany: jest.fn().mockResolvedValue([
        { id: 'u1', name: 'سارة', role: 'renter', verified: true, createdAt: new Date('2026-06-20T00:00:00Z') },
      ]),
    },
    property: {
      count: jest.fn().mockResolvedValue(0),
      groupBy: jest.fn(),
      aggregate: jest.fn().mockResolvedValue({ _avg: { trust: 7.96 } }),
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'p1',
          title: 'أوضة في المعادي',
          area: 'المعادي',
          type: 'room',
          status: 'published',
          price: 4000,
          createdAt: new Date('2026-06-22T00:00:00Z'),
        },
      ]),
    },
    lead: {
      count: jest.fn().mockResolvedValue(20),
      groupBy: jest.fn().mockResolvedValue([
        { status: 'pending', _count: { _all: 5 } },
        { status: 'completed', _count: { _all: 9 } },
      ]),
    },
    tenancy: { count: jest.fn().mockResolvedValue(9) },
    review: { count: jest.fn().mockResolvedValue(14) },
    question: { count: jest.fn().mockResolvedValue(6) },
    thread: { count: jest.fn().mockResolvedValue(11) },
    savedSearch: { count: jest.fn().mockResolvedValue(4) },
    bed: {
      groupBy: jest.fn().mockResolvedValue([
        { status: 'available', _count: { _all: 12 } },
        { status: 'occupied', _count: { _all: 18 } },
      ]),
    },
  };
}

function makeStubs() {
  return {
    trust: {} as unknown as TrustService,
    fanout: {} as unknown as FanoutService,
    search: {} as unknown as SearchService,
  };
}

describe('AdminService.platformStats', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let service: AdminService;

  beforeEach(() => {
    prisma = makePrisma();
    // property.groupBy is called twice (by status, then by type)  -  return the
    // status buckets first, the type buckets second.
    (prisma.property.groupBy as Mock)
      .mockResolvedValueOnce([
        { status: 'published', _count: { _all: 5 } },
        { status: 'pending_approval', _count: { _all: 2 } },
        { status: 'draft', _count: { _all: 1 } },
        { status: 'rejected', _count: { _all: 1 } },
      ])
      .mockResolvedValueOnce([
        { type: 'apartment', _count: { _all: 4 } },
        { type: 'room', _count: { _all: 3 } },
        { type: 'bed', _count: { _all: 2 } },
      ]);
    // user.count is called many times; total first, then verified/pending/etc.
    (prisma.user.count as Mock).mockResolvedValue(12);
    (prisma.property.count as Mock).mockResolvedValue(9);

    const { trust, fanout, search } = makeStubs();
    service = new AdminService(
      prisma as unknown as PrismaService,
      trust,
      fanout,
      search,
    );
  });

  it('splits users by role and surfaces totals', async () => {
    const stats = (await service.platformStats()) as {
      users: { renters: number; owners: number; both: number; total: number };
    };
    expect(stats.users).toMatchObject({ renters: 8, owners: 3, both: 1, total: 12 });
  });

  it('buckets listings by status and translates types to Arabic', async () => {
    const stats = (await service.platformStats()) as {
      listings: {
        published: number;
        pending: number;
        draft: number;
        rejected: number;
        byType: Record<string, number>;
      };
    };
    expect(stats.listings).toMatchObject({ published: 5, pending: 2, draft: 1, rejected: 1 });
    expect(stats.listings.byType).toEqual({ شقة: 4, أوضة: 3, سرير: 2 });
  });

  it('derives bed inventory totals and rounds trust averages', async () => {
    const stats = (await service.platformStats()) as {
      inventory: { totalBeds: number; availableBeds: number };
      trust: { avgListingTrust: number; avgOwnerTrust: number };
    };
    expect(stats.inventory).toEqual({ totalBeds: 30, availableBeds: 12 });
    expect(stats.trust.avgListingTrust).toBe(8.0); // 7.96 -> 8.0
    expect(stats.trust.avgOwnerTrust).toBe(8.4); // 8.4123 -> 8.4
  });

  it('exposes the moderation + verification queue counts', async () => {
    const stats = (await service.platformStats()) as {
      queues: { pendingListings: number; pendingVerifications: number };
    };
    expect(stats.queues.pendingListings).toBe(2);
  });

  it('returns recent users + listings (serialized dates)', async () => {
    const stats = (await service.platformStats()) as {
      recent: { users: { id: string; createdAt: string }[]; listings: { id: string }[] };
    };
    expect(stats.recent.users[0]).toMatchObject({ id: 'u1', createdAt: '2026-06-20T00:00:00.000Z' });
    expect(stats.recent.listings[0]).toMatchObject({ id: 'p1' });
  });
});
