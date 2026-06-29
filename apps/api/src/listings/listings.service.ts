import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SearchService } from '../search/search.service';
import { ListPropertiesQueryDto } from './dto/list-properties-query.dto';
import type { AuthUser } from '../auth/decorators/current-user.decorator';
import {
  serializeProperty,
  serializeSummary,
  type PropertyRow,
} from './listings.serializer';

const TYPE_LATIN: Record<string, 'apartment' | 'room' | 'bed'> = {
  شقة: 'apartment',
  أوضة: 'room',
  سرير: 'bed',
};

const truthy = (v?: string) => v === 'true' || v === '1';

// Relations needed to build the full Property shape.
const detailInclude = {
  owner: true,
  rooms: { include: { beds: true }, orderBy: { createdAt: 'asc' as const } },
  nearby: true,
  customSpecs: true,
  reviews: { where: { removedAt: null }, orderBy: { createdAt: 'desc' as const } },
  questions: { where: { removedAt: null }, orderBy: { createdAt: 'desc' as const } },
};

@Injectable()
export class ListingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly search: SearchService,
  ) {}

  async list(query: ListPropertiesQueryDto): Promise<{
    data: Record<string, unknown>[];
    meta: { cursor: string | null; hasMore: boolean };
  }> {
    const limit = query.limit ?? 24;

    // DB-level filters (everything except freeOnly, which is a computed count).
    // BUG-1: a banned owner's listings never surface publicly.
    const where: Record<string, unknown> = {
      status: 'published',
      deletedAt: null,
      owner: { bannedAt: null },
    };
    if (query.type && TYPE_LATIN[query.type]) where.type = TYPE_LATIN[query.type];
    if (query.purpose) where.listingType = query.purpose;
    if (query.gender) where.rentToGender = query.gender;
    if (query.area) where.area = { contains: query.area };
    if (truthy(query.verifiedOnly)) where.verified = true;
    if (truthy(query.nightly)) where.nightlyPrice = { not: null };
    if (query.minPrice != null || query.maxPrice != null) {
      where.price = {
        ...(query.minPrice != null ? { gte: query.minPrice } : {}),
        ...(query.maxPrice != null ? { lte: query.maxPrice } : {}),
      };
    }

    // PROD-3: free-text `q`. Prefer Meilisearch (typo-tolerant, Arabic-aware):
    // it returns matching ids in relevance order, which we constrain the DB
    // query to + reorder by. When Meili is disabled, fall back to a DB
    // `contains` across title/area/address.
    let meiliOrder: string[] | null = null;
    if (query.q?.trim()) {
      if (this.search.enabled) {
        const ids = await this.search.searchIds(query.q, 200);
        if (ids.length === 0) {
          return { data: [], meta: { cursor: null, hasMore: false } };
        }
        where.id = { in: ids };
        meiliOrder = ids;
      } else {
        const q = query.q.trim();
        where.OR = [
          { title: { contains: q, mode: 'insensitive' } },
          { area: { contains: q, mode: 'insensitive' } },
          { address: { contains: q, mode: 'insensitive' } },
        ];
      }
    }

    // PROD-4: geo radius ("قريب مني"). When lat+lng are present, a PostGIS
    // ST_DWithin query (GiST-indexed) returns nearby published ids ordered by
    // distance; we constrain the main query to them and (absent a text query)
    // order by proximity. Intersects with the q result when both are given.
    let geoOrder: string[] | null = null;
    if (query.lat != null && query.lng != null) {
      const radiusM = (query.radiusKm ?? 5) * 1000;
      const nearby = await this.prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM properties
        WHERE status = 'published' AND deleted_at IS NULL AND geog IS NOT NULL
          AND ST_DWithin(geog, ST_SetSRID(ST_MakePoint(${query.lng}, ${query.lat}), 4326)::geography, ${radiusM})
        ORDER BY geog <-> ST_SetSRID(ST_MakePoint(${query.lng}, ${query.lat}), 4326)::geography
        LIMIT 300`;
      let nearbyIds = nearby.map((r) => r.id);
      if (meiliOrder) {
        const meiliSet = new Set(meiliOrder);
        nearbyIds = nearbyIds.filter((id) => meiliSet.has(id));
        // q already drives ordering; just constrain to the nearby set.
        where.id = { in: nearbyIds };
      } else {
        where.id = { in: nearbyIds };
        geoOrder = nearbyIds; // order by distance when there's no text query
      }
      if (nearbyIds.length === 0) {
        return { data: [], meta: { cursor: null, hasMore: false } };
      }
    }

    const orderBy = this.orderFor(query.sort);

    // A relevance ordering (text or proximity) overrides the DB sort + uses
    // fetch-all-then-slice paging.
    const relevanceOrder = meiliOrder ?? geoOrder;

    const rows = (await this.prisma.property.findMany({
      where,
      orderBy,
      include: detailInclude,
      // With a relevance order we fetch the whole matched set (bounded above)
      // and reorder below; otherwise use cursor pagination.
      ...(relevanceOrder
        ? {}
        : {
            take: limit + 1,
            ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
          }),
    })) as unknown as PropertyRow[];

    // Relevance path: reorder by the prefilter's order (Meili relevance or geo
    // distance), then paginate by cursor (the id of the last returned item).
    if (relevanceOrder) {
      const rank = new Map(relevanceOrder.map((id, i) => [id, i]));
      rows.sort((a, b) => (rank.get(a.id) ?? 1e9) - (rank.get(b.id) ?? 1e9));
      const start = query.cursor ? rows.findIndex((r) => r.id === query.cursor) + 1 : 0;
      const slice = rows.slice(start, start + limit + 1);
      const hasMoreM = slice.length > limit;
      const pageM = hasMoreM ? slice.slice(0, limit) : slice;
      let summariesM = pageM.map(serializeSummary);
      if (truthy(query.freeOnly)) {
        summariesM = summariesM.filter((s) => (s.beds as { available: number }).available > 0);
      }
      const cursorM = hasMoreM ? (pageM[pageM.length - 1]?.id ?? null) : null;
      return { data: summariesM, meta: { cursor: cursorM, hasMore: hasMoreM } };
    }

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;

    // freeOnly is computed from bed availability — apply on the page.
    let summaries = page.map(serializeSummary);
    if (truthy(query.freeOnly)) {
      summaries = summaries.filter(
        (s) => (s.beds as { available: number }).available > 0,
      );
    }

    const cursor = hasMore ? (page[page.length - 1]?.id ?? null) : null;
    return { data: summaries, meta: { cursor, hasMore } };
  }

  async findOne(id: string, viewer?: AuthUser): Promise<Record<string, unknown>> {
    const row = (await this.prisma.property.findFirst({
      where: { id, deletedAt: null },
      include: detailInclude,
    })) as unknown as PropertyRow | null;

    // Owner or admin may preview their listing at any status (e.g. from the
    // moderation queue before it's published). Everyone else only sees a
    // published listing whose owner isn't banned (BUG-1).
    const isPrivileged = !!viewer && (viewer.isAdmin || viewer.id === row?.ownerId);
    const bannedOwner = (row?.owner as { bannedAt?: Date | null } | undefined)?.bannedAt;
    const publiclyVisible = !!row && row.status === 'published' && !bannedOwner;

    if (!row || (!isPrivileged && !publiclyVisible)) {
      throw new NotFoundException({
        code: 'PROPERTY_NOT_FOUND',
        message: 'المكان ده مش موجود أو مش متاح.',
      });
    }
    return serializeProperty(row);
  }

  private orderFor(sort?: string): Record<string, 'asc' | 'desc'>[] {
    switch (sort) {
      case 'price_asc':
        return [{ price: 'asc' }, { id: 'asc' }];
      case 'price_desc':
        return [{ price: 'desc' }, { id: 'asc' }];
      case 'newest':
        return [{ createdAt: 'desc' }, { id: 'asc' }];
      case 'trust':
      default:
        return [{ trust: 'desc' }, { id: 'asc' }];
    }
  }
}
