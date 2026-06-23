import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
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
  constructor(private readonly prisma: PrismaService) {}

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

    const orderBy = this.orderFor(query.sort);

    const rows = (await this.prisma.property.findMany({
      where,
      orderBy,
      include: detailInclude,
      take: limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    })) as unknown as PropertyRow[];

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
