import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SearchService } from '../search/search.service';
import { ListPropertiesQueryDto } from './dto/list-properties-query.dto';
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
  reviews: { orderBy: { createdAt: 'desc' as const } },
  questions: { orderBy: { createdAt: 'desc' as const } },
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
    const where: Record<string, unknown> = { status: 'published', deletedAt: null };
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

    const orderBy = this.orderFor(query.sort);

    const rows = (await this.prisma.property.findMany({
      where,
      orderBy,
      include: detailInclude,
      // For a Meili search we fetch the whole matched set (<=200) and reorder by
      // relevance below; otherwise use cursor pagination.
      ...(meiliOrder
        ? {}
        : {
            take: limit + 1,
            ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
          }),
    })) as unknown as PropertyRow[];

    // Meili path: reorder by relevance, then paginate by cursor (the id of the
    // last returned item) over that relevance-ordered list.
    if (meiliOrder) {
      const rank = new Map(meiliOrder.map((id, i) => [id, i]));
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

  async findOne(id: string): Promise<Record<string, unknown>> {
    const row = (await this.prisma.property.findFirst({
      where: { id, deletedAt: null },
      include: detailInclude,
    })) as unknown as PropertyRow | null;

    if (!row || row.status !== 'published') {
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
