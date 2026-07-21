import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsTimeseriesDto } from './dto/admin-analytics.dto';

// ADMIN-9: analytics & insights. Growth time-series, the conversion funnel, and
// supply/demand by area  -  the operator's "understand the marketplace" view.

const METRIC_TABLE: Record<string, { table: string; dateCol: string; where?: string }> = {
  signups: { table: 'users', dateCol: 'created_at', where: "deleted_at IS NULL" },
  listings: { table: 'properties', dateCol: 'created_at', where: "deleted_at IS NULL" },
  leads: { table: 'leads', dateCol: 'created_at' },
  tenancies: { table: 'tenancies', dateCol: 'created_at' },
};

@Injectable()
export class AdminAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  // Daily counts for one metric over the last N days (zero-filled).
  async timeseries(query: AnalyticsTimeseriesDto): Promise<Record<string, unknown>> {
    const metric = query.metric && METRIC_TABLE[query.metric] ? query.metric : 'signups';
    const days = Math.min(Math.max(query.days ?? 30, 1), 365);
    const { table, dateCol, where } = METRIC_TABLE[metric]!;

    // date_trunc('day') buckets; table/column names are from our fixed allow-list
    // (never user input), the interval is parameterized.
    const rows = await this.prisma.$queryRaw<{ day: Date; count: bigint }[]>(
      Prisma.sql`
        SELECT date_trunc('day', ${Prisma.raw(`"${dateCol}"`)}) AS day, COUNT(*)::bigint AS count
        FROM ${Prisma.raw(`"${table}"`)}
        WHERE ${Prisma.raw(`"${dateCol}"`)} >= NOW() - ${`${days} days`}::interval
          ${where ? Prisma.raw(`AND ${where}`) : Prisma.empty}
        GROUP BY day
        ORDER BY day ASC`,
    );

    // Zero-fill every day in the window so the chart has no gaps.
    const counts = new Map<string, number>();
    for (const r of rows) counts.set(r.day.toISOString().slice(0, 10), Number(r.count));
    const points: { date: string; count: number }[] = [];
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    start.setUTCDate(start.getUTCDate() - (days - 1));
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setUTCDate(start.getUTCDate() + i);
      const key = d.toISOString().slice(0, 10);
      points.push({ date: key, count: counts.get(key) ?? 0 });
    }

    const total = points.reduce((a, b) => a + b.count, 0);
    return { metric, days, total, points };
  }

  // The browse -> lead -> approved -> move-in funnel + drop-off rates.
  async funnel(): Promise<Record<string, unknown>> {
    const [users, savers, leads, approvedLeads, tenancies] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.savedSearch
        .findMany({ select: { userId: true }, distinct: ['userId'] })
        .then((r) => r.length),
      this.prisma.lead.count(),
      this.prisma.lead.count({ where: { status: { in: ['approved', 'completed'] } } }),
      this.prisma.tenancy.count(),
    ]);

    const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 1000) / 10 : 0);

    return {
      stages: [
        { key: 'users', label: 'مستخدمين', value: users },
        { key: 'savers', label: 'حافظوا بحث', value: savers },
        { key: 'leads', label: 'طلبوا معاينة', value: leads },
        { key: 'approved', label: 'اتوافق عليهم', value: approvedLeads },
        { key: 'tenancies', label: 'سكنوا', value: tenancies },
      ],
      rates: {
        userToLead: pct(leads, users),
        leadToApproved: pct(approvedLeads, leads),
        approvedToMoveIn: pct(tenancies, approvedLeads),
        leadToMoveIn: pct(tenancies, leads),
      },
    };
  }

  // Supply (published listings) vs demand (leads + saved searches) per area, so
  // the team knows where to seed supply. Sorted by the biggest demand gap.
  async areas(): Promise<Record<string, unknown>[]> {
    const [listingsByArea, leadsByArea] = await Promise.all([
      this.prisma.property.groupBy({
        by: ['area'],
        where: { status: 'published', deletedAt: null },
        _count: { _all: true },
      }),
      // leads carry no area; join through the property.
      this.prisma.$queryRaw<{ area: string; count: bigint }[]>(
        Prisma.sql`
          SELECT p.area AS area, COUNT(*)::bigint AS count
          FROM leads l JOIN properties p ON p.id = l.property_id
          WHERE p.deleted_at IS NULL
          GROUP BY p.area`,
      ),
    ]);

    const demand = new Map<string, number>();
    for (const r of leadsByArea) demand.set(r.area, Number(r.count));

    const rows = listingsByArea.map((l) => {
      const supply = l._count._all;
      const d = demand.get(l.area) ?? 0;
      return { area: l.area, supply, demand: d, gap: d - supply };
    });
    // Areas with demand but no listing at all (pure gaps).
    for (const [area, d] of demand) {
      if (!rows.some((r) => r.area === area)) rows.push({ area, supply: 0, demand: d, gap: d });
    }
    return rows.sort((a, b) => b.gap - a.gap || b.demand - a.demand);
  }
}
