import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TrustService } from '../trust/trust.service';
import { FanoutService } from '../notifications/fanout.service';
import { SearchService } from '../search/search.service';
import { serializeProperty, type PropertyRow } from './listings.serializer';
import { CreateListingDto, ManageListingDto } from './dto/create-listing.dto';

const UNIT_LATIN: Record<string, 'apartment' | 'studio' | 'duplex' | 'roof' | 'villa'> = {
  شقة: 'apartment',
  استوديو: 'studio',
  دوبلكس: 'duplex',
  روف: 'roof',
  فيلا: 'villa',
};
const NEARBY_LATIN: Record<string, 'metro' | 'university' | 'transit' | 'mall' | 'hospital' | 'supermarket' | 'other'> = {
  مترو: 'metro',
  جامعة: 'university',
  مواصلات: 'transit',
  مول: 'mall',
  مستشفى: 'hospital',
  'سوبر ماركت': 'supermarket',
  'حاجة تانية': 'other',
};

const detailInclude = {
  owner: true,
  rooms: { include: { beds: true }, orderBy: { createdAt: 'asc' as const } },
  nearby: true,
  customSpecs: true,
  reviews: { where: { removedAt: null }, orderBy: { createdAt: 'desc' as const } },
};

// Owner-facing include: like detailInclude but WITH occupant data (beds, rooms,
// whole) + questions, for the dashboard management grid. Ownership-checked, so
// the private occupant details are only ever returned to the listing's owner.
const ownerInclude = {
  owner: true,
  rooms: {
    include: { beds: { include: { occupant: true } }, occupant: true },
    orderBy: { createdAt: 'asc' as const },
  },
  nearby: true,
  customSpecs: true,
  reviews: { where: { removedAt: null }, orderBy: { createdAt: 'desc' as const } },
  questions: { where: { removedAt: null }, orderBy: { createdAt: 'desc' as const } },
  wholeOccupant: true,
};

@Injectable()
export class ListingsWriteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly trust: TrustService,
    private readonly fanout: FanoutService,
    private readonly search: SearchService,
  ) {}

  // Owner's own listings (all statuses) for the dashboard. Full Property shape
  // WITH occupant data (the management grid edits availability + tenant info).
  async listMine(ownerId: string): Promise<Record<string, unknown>[]> {
    const rows = (await this.prisma.property.findMany({
      where: { ownerId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: ownerInclude,
    })) as unknown as PropertyRow[];
    return rows.map((p) => ({
      ...serializeProperty(p, { includeOccupants: true }),
      status: p.status,
      rejectionReason:
        (p as unknown as { rejectionReason: string | null }).rejectionReason ?? undefined,
    }));
  }

  async create(ownerId: string, dto: CreateListingDto): Promise<Record<string, unknown>> {
    const owner = await this.prisma.user.findUnique({
      where: { id: ownerId },
      select: { isAdmin: true, verified: true, verificationStatus: true },
    });
    if (!owner) throw new NotFoundException({ code: 'USER_NOT_FOUND', message: 'الحساب مش موجود.' });

    const status = this.initialStatus(owner);
    const derived = this.derive(dto);

    const created = await this.prisma.property.create({
      data: {
        ownerId,
        title: dto.title,
        description: dto.description ?? '',
        area: dto.area,
        address: dto.address ?? '',
        lat: dto.lat ?? null,
        lng: dto.lng ?? null,
        type: derived.type,
        status,
        listingType: dto.listingType ?? 'rent',
        rentalMode: dto.listingType === 'sale' ? null : (dto.rentalMode ?? null),
        unitType: dto.spec ? UNIT_LATIN[dto.spec.unitType] : null,
        bedrooms: dto.spec?.bedrooms ?? null,
        bathrooms: dto.spec?.bathrooms ?? null,
        floor: dto.spec?.floor ?? null,
        sizeM2: dto.spec?.sizeM2 ?? null,
        furnished: dto.spec?.furnished ?? false,
        price: derived.priceFrom,
        priceFrom: derived.priceFrom,
        wholePrice: dto.wholePrice ?? null,
        wholeStatus: (dto.wholeStatus as never) ?? null,
        nightlyPrice: dto.nightlyPrice ?? null,
        salePrice: dto.salePrice ?? null,
        saleStatus: (dto.saleStatus as never) ?? null,
        negotiable: dto.negotiable ?? false,
        rentToGender: dto.rentToGender ?? null,
        images: dto.images ?? [],
        amenities: dto.amenities ?? [],
        costs: (dto.costs ?? []) as object,
        ...this.nestedCreate(dto),
      },
      include: detailInclude,
    });

    // Fresh listing: compute its real trust from (zero) reviews + owner signal.
    await this.trust.recomputeListing(created.id);
    // If it went live immediately (verified/admin owner), alert matching saved
    // searches. SCALE-1: enqueued to a worker (inline fallback w/o Redis), so
    // the create response never blocks on the fan-out.
    if (status === 'published') {
      await this.fanout.enqueue(created.id);
    }
    await this.search.indexById(created.id); // PROD-3: keep the search index in sync
    const fresh = await this.findRow(created.id);
    return { ...serializeProperty(fresh!), status };
  }

  async update(ownerId: string, id: string, dto: CreateListingDto): Promise<Record<string, unknown>> {
    const existing = await this.prisma.property.findFirst({
      where: { id, deletedAt: null },
      select: { ownerId: true, status: true },
    });
    if (!existing) throw new NotFoundException({ code: 'PROPERTY_NOT_FOUND', message: 'الإعلان مش موجود.' });
    if (existing.ownerId !== ownerId) {
      throw new ForbiddenException({ code: 'NOT_OWNER', message: 'مش من حقك تعدّل الإعلان ده.' });
    }

    const owner = await this.prisma.user.findUnique({
      where: { id: ownerId },
      select: { isAdmin: true, verified: true, verificationStatus: true },
    });
    const derived = this.derive(dto);

    // Editing a live listing keeps it live; (re)publishing a draft/rejected one
    // re-runs the moderation gate.
    const wasLive = existing.status === 'published' || existing.status === 'paused';
    const status = wasLive ? existing.status : this.initialStatus(owner!);

    // Replace nested children (simplest correct path for an edit).
    await this.prisma.room.deleteMany({ where: { propertyId: id } });
    await this.prisma.nearbyPlace.deleteMany({ where: { propertyId: id } });
    await this.prisma.customSpec.deleteMany({ where: { propertyId: id } });

    await this.prisma.property.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description ?? '',
        area: dto.area,
        address: dto.address ?? '',
        lat: dto.lat ?? null,
        lng: dto.lng ?? null,
        type: derived.type,
        status,
        listingType: dto.listingType ?? 'rent',
        rentalMode: dto.listingType === 'sale' ? null : (dto.rentalMode ?? null),
        unitType: dto.spec ? UNIT_LATIN[dto.spec.unitType] : null,
        bedrooms: dto.spec?.bedrooms ?? null,
        bathrooms: dto.spec?.bathrooms ?? null,
        floor: dto.spec?.floor ?? null,
        sizeM2: dto.spec?.sizeM2 ?? null,
        furnished: dto.spec?.furnished ?? false,
        price: derived.priceFrom,
        priceFrom: derived.priceFrom,
        wholePrice: dto.wholePrice ?? null,
        wholeStatus: (dto.wholeStatus as never) ?? null,
        nightlyPrice: dto.nightlyPrice ?? null,
        salePrice: dto.salePrice ?? null,
        saleStatus: (dto.saleStatus as never) ?? null,
        negotiable: dto.negotiable ?? false,
        rentToGender: dto.rentToGender ?? null,
        images: dto.images ?? [],
        amenities: dto.amenities ?? [],
        costs: (dto.costs ?? []) as object,
        rejectionReason: null,
        ...this.nestedCreate(dto),
      },
    });

    await this.trust.recomputeListing(id);
    await this.search.indexById(id); // PROD-3: re-index (or drop if no longer published)
    const fresh = await this.findRow(id);
    return { ...serializeProperty(fresh!), status };
  }

  async remove(ownerId: string, id: string): Promise<{ ok: true }> {
    const existing = await this.prisma.property.findFirst({
      where: { id, deletedAt: null },
      select: { ownerId: true },
    });
    if (!existing) throw new NotFoundException({ code: 'PROPERTY_NOT_FOUND', message: 'الإعلان مش موجود.' });
    if (existing.ownerId !== ownerId) {
      throw new ForbiddenException({ code: 'NOT_OWNER', message: 'مش من حقك تمسح الإعلان ده.' });
    }
    await this.prisma.property.update({ where: { id }, data: { deletedAt: new Date(), status: 'paused' } });
    await this.search.removeOne(id); // PROD-3: drop from the search index
    return { ok: true };
  }

  // Owner-only granular status/occupancy updates from the management grid.
  // Each call carries exactly one concern (pause / sale / whole / room / bed).
  async manage(ownerId: string, id: string, dto: ManageListingDto): Promise<Record<string, unknown>> {
    const existing = await this.prisma.property.findFirst({
      where: { id, deletedAt: null },
      select: { ownerId: true, status: true },
    });
    if (!existing) throw new NotFoundException({ code: 'PROPERTY_NOT_FOUND', message: 'الإعلان مش موجود.' });
    if (existing.ownerId !== ownerId) {
      throw new ForbiddenException({ code: 'NOT_OWNER', message: 'مش من حقك تعدّل الإعلان ده.' });
    }

    // Pause / unpause — only meaningful on a live listing (never override a
    // pending/rejected one through this path).
    if (dto.listingStatus) {
      if (existing.status === 'published' || existing.status === 'paused') {
        await this.prisma.property.update({ where: { id }, data: { status: dto.listingStatus } });
      }
    }

    if (dto.saleStatus) {
      await this.prisma.property.update({
        where: { id },
        data: { saleStatus: dto.saleStatus as never },
      });
    }

    if (dto.whole) {
      await this.prisma.property.update({
        where: { id },
        data: { wholeStatus: dto.whole.status as never },
      });
      await this.setOccupant({ wholePropertyId: id }, dto.whole.status, dto.whole.occupant);
    }

    if (dto.room) {
      const room = await this.prisma.room.findFirst({
        where: { id: dto.room.roomId, propertyId: id },
        select: { id: true },
      });
      if (!room) throw new NotFoundException({ code: 'ROOM_NOT_FOUND', message: 'الأوضة دي مش في الإعلان ده.' });
      await this.prisma.room.update({
        where: { id: room.id },
        data: { status: dto.room.status as never },
      });
      await this.setOccupant({ roomId: room.id }, dto.room.status, dto.room.occupant);
    }

    if (dto.bed) {
      const bed = await this.prisma.bed.findFirst({
        where: { id: dto.bed.bedId, room: { propertyId: id } },
        select: { id: true },
      });
      if (!bed) throw new NotFoundException({ code: 'BED_NOT_FOUND', message: 'السرير ده مش في الإعلان ده.' });
      await this.prisma.bed.update({
        where: { id: bed.id },
        data: { status: dto.bed.status as never },
      });
      await this.setOccupant({ bedId: bed.id }, dto.bed.status, dto.bed.occupant);
    }

    const fresh = await this.findRow(id, true);
    await this.search.indexById(id); // PROD-3: pause/sale-status changes affect the index
    return { ...serializeProperty(fresh!, { includeOccupants: true }), status: fresh!.status };
  }

  // Replace the occupant attached to a bed/room/whole-unit. Available -> clear;
  // occupied/reserved -> upsert the renter details (delete-then-create keeps the
  // 1:1 unique FK simple).
  private async setOccupant(
    link: { bedId?: string; roomId?: string; wholePropertyId?: string },
    status: string,
    occupant?: { name?: string; phone?: string; moveInDate?: string; notes?: string },
  ): Promise<void> {
    await this.prisma.occupant.deleteMany({ where: link });
    if (status === 'available' || !occupant) return;
    await this.prisma.occupant.create({
      data: {
        ...link,
        name: occupant.name ?? null,
        phone: occupant.phone ?? null,
        moveInDate: occupant.moveInDate ? new Date(occupant.moveInDate) : null,
        notes: occupant.notes ?? null,
      },
    });
  }

  // ─── helpers ──────────────────────────────────────────
  private initialStatus(owner: { isAdmin: boolean; verified: boolean; verificationStatus: string }):
    'published' | 'pending_approval' {
    if (owner.isAdmin) return 'published';
    const verified = owner.verificationStatus === 'verified' || owner.verified;
    return verified ? 'published' : 'pending_approval';
  }

  private nestedCreate(dto: CreateListingDto) {
    return {
      rooms:
        dto.listingType === 'sale' || !dto.rooms?.length
          ? undefined
          : {
              create: dto.rooms.map((r) => ({
                name: r.name,
                features: r.features ?? [],
                sizeM2: r.sizeM2 ?? null,
                price: r.price ?? null,
                status: (r.status as never) ?? null,
                beds: r.beds?.length
                  ? {
                      create: r.beds.map((b) => ({
                        label: b.label,
                        status: b.status as never,
                        price: b.price,
                        features: b.features ?? [],
                      })),
                    }
                  : undefined,
              })),
            },
      nearby: dto.nearby?.length
        ? {
            create: dto.nearby
              .map((n) => ({ type: NEARBY_LATIN[n.type], name: n.name, line: n.line ?? null, minutes: n.minutes ?? null }))
              .filter((n): n is { type: NonNullable<typeof n.type>; name: string; line: string | null; minutes: number | null } => !!n.type),
          }
        : undefined,
      customSpecs: dto.customSpecs?.length
        ? { create: dto.customSpecs.map((c) => ({ label: c.label, value: c.value })) }
        : undefined,
    };
  }

  // Derive the card-facing type + entry price from the structured model.
  private derive(dto: CreateListingDto): { type: 'apartment' | 'room' | 'bed'; priceFrom: number } {
    if (dto.listingType === 'sale') {
      return { type: 'apartment', priceFrom: dto.salePrice ?? 0 };
    }
    if (dto.rentalMode === 'by_room') {
      const rooms = dto.rooms ?? [];
      const avail = rooms.filter((r) => (r.status ?? 'available') === 'available');
      const prices = (avail.length ? avail : rooms).map((r) => r.price ?? 0).filter((n) => n > 0);
      return { type: 'room', priceFrom: prices.length ? Math.min(...prices) : 0 };
    }
    if (dto.rentalMode === 'by_bed') {
      const beds = (dto.rooms ?? []).flatMap((r) => r.beds ?? []);
      const avail = beds.filter((b) => b.status === 'available');
      const prices = (avail.length ? avail : beds).map((b) => b.price).filter((n) => n > 0);
      return { type: 'bed', priceFrom: prices.length ? Math.min(...prices) : 0 };
    }
    // whole
    return { type: 'apartment', priceFrom: dto.wholePrice ?? 0 };
  }

  private async findRow(id: string, withOccupants = false): Promise<PropertyRow | null> {
    return (await this.prisma.property.findUnique({
      where: { id },
      include: withOccupants ? ownerInclude : detailInclude,
    })) as unknown as PropertyRow | null;
  }
}
