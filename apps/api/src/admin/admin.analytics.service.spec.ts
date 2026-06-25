import { PrismaService } from '../prisma/prisma.service';
import { AdminAnalyticsService } from './admin.analytics.service';

// ADMIN-9: analytics. Mocked Prisma (incl. $queryRaw) locks the funnel rate
// math, the supply/demand gap sort (+ pure-gap areas), and the zero-filled
// time-series shape.

type Mock = jest.Mock;

function makePrisma() {
  return {
    $queryRaw: jest.fn().mockResolvedValue([]),
    user: { count: jest.fn().mockResolvedValue(0) },
    savedSearch: { findMany: jest.fn().mockResolvedValue([]) },
    lead: { count: jest.fn().mockResolvedValue(0) },
    tenancy: { count: jest.fn().mockResolvedValue(0) },
    property: { groupBy: jest.fn().mockResolvedValue([]) },
  };
}

describe('AdminAnalyticsService', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let service: AdminAnalyticsService;

  beforeEach(() => {
    prisma = makePrisma();
    service = new AdminAnalyticsService(prisma as unknown as PrismaService);
  });

  describe('timeseries', () => {
    it('zero-fills the window + sums the total, mapping raw rows by day', async () => {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      (prisma.$queryRaw as Mock).mockResolvedValue([{ day: today, count: 3n }]);

      const res = (await service.timeseries({ metric: 'signups', days: 7 })) as {
        metric: string;
        days: number;
        total: number;
        points: { date: string; count: number }[];
      };

      expect(res.metric).toBe('signups');
      expect(res.points).toHaveLength(7);
      expect(res.total).toBe(3);
      // last bucket is today with the mapped count
      expect(res.points[6]).toEqual({ date: today.toISOString().slice(0, 10), count: 3 });
      // earlier buckets are zero-filled
      expect(res.points[0]?.count).toBe(0);
    });

    it('falls back to signups for an unknown metric', async () => {
      const res = (await service.timeseries({ metric: 'bogus', days: 1 })) as { metric: string };
      expect(res.metric).toBe('signups');
    });
  });

  describe('funnel', () => {
    it('computes stage values + conversion rates', async () => {
      prisma.user.count.mockResolvedValue(100);
      prisma.savedSearch.findMany.mockResolvedValue([{ userId: 'a' }, { userId: 'b' }]);
      prisma.lead.count
        .mockResolvedValueOnce(20) // all leads
        .mockResolvedValueOnce(10); // approved/completed
      prisma.tenancy.count.mockResolvedValue(5);

      const res = (await service.funnel()) as {
        stages: { key: string; value: number }[];
        rates: Record<string, number>;
      };

      expect(res.stages.map((s) => [s.key, s.value])).toEqual([
        ['users', 100],
        ['savers', 2],
        ['leads', 20],
        ['approved', 10],
        ['tenancies', 5],
      ]);
      expect(res.rates).toEqual({
        userToLead: 20, // 20/100
        leadToApproved: 50, // 10/20
        approvedToMoveIn: 50, // 5/10
        leadToMoveIn: 25, // 5/20
      });
    });

    it('guards against divide-by-zero (no users)', async () => {
      // all counts default to 0
      const res = (await service.funnel()) as { rates: Record<string, number> };
      expect(res.rates.userToLead).toBe(0);
    });
  });

  describe('areas', () => {
    it('joins supply + demand, computes the gap, and sorts by it', async () => {
      prisma.property.groupBy.mockResolvedValue([
        { area: 'المعادي', _count: { _all: 5 } },
        { area: 'الزمالك', _count: { _all: 1 } },
      ]);
      // leadsByArea via $queryRaw
      (prisma.$queryRaw as Mock).mockResolvedValue([
        { area: 'الزمالك', count: 8n },
        { area: 'مدينة نصر', count: 3n }, // demand with zero supply -> pure gap
      ]);

      const res = (await service.areas()) as { area: string; supply: number; demand: number; gap: number }[];

      // Sorted by biggest gap: الزمالك (8-1=7), مدينة نصر (3-0=3), المعادي (0-5=-5)
      expect(res.map((r) => r.area)).toEqual(['الزمالك', 'مدينة نصر', 'المعادي']);
      expect(res[0]).toEqual({ area: 'الزمالك', supply: 1, demand: 8, gap: 7 });
      expect(res[1]).toEqual({ area: 'مدينة نصر', supply: 0, demand: 3, gap: 3 });
      expect(res[2]).toEqual({ area: 'المعادي', supply: 5, demand: 0, gap: -5 });
    });
  });
});
