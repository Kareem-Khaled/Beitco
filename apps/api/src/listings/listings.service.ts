import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SearchService } from '../search/search.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { ListingQueryDto } from './dto/listing-query.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

const TIER_LEVELS: Record<string, number> = {
  admin: 1,
  verified_contributor: 2,
  trusted_member: 3,
  new_user: 4,
  restricted: 5,
};

const AGENT_SELECT = {
  id: true,
  username: true,
  nameAr: true,
  nameEn: true,
  avatarUrl: true,
  permissionTier: true,
  nationalIdVerified: true,
  followerCount: true,
} as const;

const LISTING_SELECT = {
  id: true,
  titleAr: true,
  titleEn: true,
  descriptionAr: true,
  descriptionEn: true,
  listingType: true,
  propertyType: true,
  price: true,
  currency: true,
  area: true,
  bedrooms: true,
  bathrooms: true,
  floor: true,
  finishing: true,
  amenities: true,
  images: true,
  locationLat: true,
  locationLng: true,
  address: true,
  city: true,
  district: true,
  compound: true,
  status: true,
  viewCount: true,
  saveCount: true,
  agentId: true,
  createdAt: true,
  updatedAt: true,
  agent: { select: AGENT_SELECT },
} as const;

@Injectable()
export class ListingsService {
  private readonly logger = new Logger(ListingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly search: SearchService,
  ) {}

  // ═══════════════════════════════════════════════════════
  // CREATE
  // ═══════════════════════════════════════════════════════

  async create(userId: string, dto: CreateListingDto) {
    const listing = await this.prisma.listing.create({
      data: {
        agentId: userId,
        titleAr: dto.titleAr,
        titleEn: dto.titleEn,
        descriptionAr: dto.descriptionAr,
        descriptionEn: dto.descriptionEn,
        listingType: dto.listingType,
        propertyType: dto.propertyType,
        price: dto.price,
        currency: dto.currency ?? 'EGP',
        area: dto.area,
        bedrooms: dto.bedrooms,
        bathrooms: dto.bathrooms,
        floor: dto.floor,
        finishing: dto.finishing,
        amenities: dto.amenities ?? [],
        images: dto.images ?? [],
        locationLat: dto.locationLat,
        locationLng: dto.locationLng,
        address: dto.address,
        city: dto.city,
        district: dto.district,
        compound: dto.compound,
      },
      select: LISTING_SELECT,
    });

    this.logger.log(`Listing ${listing.id} created by ${userId}`);

    // Index in search
    void this.search.indexListing({
      id: listing.id,
      titleAr: listing.titleAr,
      titleEn: listing.titleEn,
      descriptionAr: listing.descriptionAr,
      descriptionEn: listing.descriptionEn,
      listingType: listing.listingType,
      propertyType: listing.propertyType,
      price: Number(listing.price),
      area: Number(listing.area),
      bedrooms: listing.bedrooms,
      city: listing.city,
      district: listing.district,
      compound: listing.compound,
      address: listing.address,
      status: listing.status,
      viewCount: listing.viewCount,
      createdAt: listing.createdAt,
    });

    return listing;
  }

  // ═══════════════════════════════════════════════════════
  // SEARCH / LIST
  // ═══════════════════════════════════════════════════════

  async findAll(query: ListingQueryDto) {
    const {
      cursor, limit = 20, type, propertyType, minPrice, maxPrice,
      minArea, bedrooms, city, district, search,
    } = query;

    const where: Record<string, unknown> = {
      status: 'active',
      deletedAt: null,
    };

    if (type) where['listingType'] = type;
    if (propertyType) where['propertyType'] = propertyType;
    if (city) where['city'] = city;
    if (district) where['district'] = district;
    if (bedrooms !== undefined) where['bedrooms'] = bedrooms;
    if (minArea !== undefined) where['area'] = { gte: minArea };

    if (minPrice !== undefined || maxPrice !== undefined) {
      const priceFilter: Record<string, unknown> = {};
      if (minPrice !== undefined) priceFilter['gte'] = minPrice;
      if (maxPrice !== undefined) priceFilter['lte'] = maxPrice;
      where['price'] = priceFilter;
    }

    if (search) {
      where['OR'] = [
        { titleAr: { contains: search, mode: 'insensitive' } },
        { titleEn: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }

    const listings = await this.prisma.listing.findMany({
      where: where as Parameters<typeof this.prisma.listing.findMany>[0] extends { where?: infer W } ? W : never,
      select: LISTING_SELECT,
      orderBy: [{ createdAt: 'desc' }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = listings.length > limit;
    const data = hasMore ? listings.slice(0, limit) : listings;
    const nextCursor = hasMore ? data[data.length - 1]?.id : undefined;

    return {
      data,
      meta: { cursor: nextCursor ?? null, hasMore },
    };
  }

  // ═══════════════════════════════════════════════════════
  // GET BY ID
  // ═══════════════════════════════════════════════════════

  async findById(listingId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId, deletedAt: null },
      select: LISTING_SELECT,
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    // Increment view count (fire and forget)
    this.prisma.listing.update({
      where: { id: listingId },
      data: { viewCount: { increment: 1 } },
    }).catch(() => {});

    return listing;
  }

  // ═══════════════════════════════════════════════════════
  // UPDATE
  // ═══════════════════════════════════════════════════════

  async update(listingId: string, userId: string, permissionTier: string, dto: UpdateListingDto) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId, deletedAt: null },
      select: { id: true, agentId: true },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    const tierLevel = TIER_LEVELS[permissionTier] ?? 5;
    if (tierLevel > 1 && listing.agentId !== userId) {
      throw new ForbiddenException('You can only edit your own listings');
    }

    const updated = await this.prisma.listing.update({
      where: { id: listingId },
      data: dto as Record<string, unknown>,
      select: LISTING_SELECT,
    });

    // Re-index in search
    void this.search.indexListing({
      id: updated.id,
      titleAr: updated.titleAr,
      titleEn: updated.titleEn,
      descriptionAr: updated.descriptionAr,
      descriptionEn: updated.descriptionEn,
      listingType: updated.listingType,
      propertyType: updated.propertyType,
      price: Number(updated.price),
      area: Number(updated.area),
      bedrooms: updated.bedrooms,
      city: updated.city,
      district: updated.district,
      compound: updated.compound,
      address: updated.address,
      status: updated.status,
      viewCount: updated.viewCount,
      createdAt: updated.createdAt,
    });

    return updated;
  }

  // ═══════════════════════════════════════════════════════
  // SOFT DELETE
  // ═══════════════════════════════════════════════════════

  async softDelete(listingId: string, userId: string, permissionTier: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId, deletedAt: null },
      select: { id: true, agentId: true },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    const tierLevel = TIER_LEVELS[permissionTier] ?? 5;
    if (tierLevel > 1 && listing.agentId !== userId) {
      throw new ForbiddenException('You can only delete your own listings');
    }

    await this.prisma.listing.update({
      where: { id: listingId },
      data: { deletedAt: new Date() },
    });

    // Remove from search index
    void this.search.removeListing(listingId);
  }

  // ═══════════════════════════════════════════════════════
  // SAVE / UNSAVE (toggle)
  // ═══════════════════════════════════════════════════════

  async toggleSave(userId: string, listingId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId, deletedAt: null },
      select: { id: true },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    const existing = await this.prisma.savedListing.findUnique({
      where: { userId_listingId: { userId, listingId } },
    });

    if (existing) {
      // Unsave
      await this.prisma.$transaction(async (tx) => {
        await tx.savedListing.delete({ where: { id: existing.id } });
        await tx.listing.update({
          where: { id: listingId },
          data: { saveCount: { decrement: 1 } },
        });
      });
      return { saved: false };
    } else {
      // Save
      await this.prisma.$transaction(async (tx) => {
        await tx.savedListing.create({ data: { userId, listingId } });
        await tx.listing.update({
          where: { id: listingId },
          data: { saveCount: { increment: 1 } },
        });
      });
      return { saved: true };
    }
  }

  // ═══════════════════════════════════════════════════════
  // SAVED LISTINGS
  // ═══════════════════════════════════════════════════════

  async getSaved(userId: string, query: PaginationQueryDto) {
    const { cursor, limit = 20 } = query;

    const saved = await this.prisma.savedListing.findMany({
      where: { userId },
      select: {
        id: true,
        createdAt: true,
        listing: { select: LISTING_SELECT },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = saved.length > limit;
    const data = hasMore ? saved.slice(0, limit) : saved;
    const nextCursor = hasMore ? data[data.length - 1]?.id : undefined;

    return {
      data: data.map((s) => s.listing),
      meta: { cursor: nextCursor ?? null, hasMore },
    };
  }

  // ═══════════════════════════════════════════════════════
  // SIMILAR LISTINGS
  // ═══════════════════════════════════════════════════════

  async getSimilar(listingId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId, deletedAt: null },
      select: { id: true, propertyType: true, city: true, price: true, listingType: true },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    const priceNum = Number(listing.price);

    const similar = await this.prisma.listing.findMany({
      where: {
        id: { not: listingId },
        status: 'active',
        deletedAt: null,
        listingType: listing.listingType,
        propertyType: listing.propertyType,
        city: listing.city,
        price: {
          gte: priceNum * 0.7,
          lte: priceNum * 1.3,
        },
      },
      select: LISTING_SELECT,
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return similar;
  }
}
