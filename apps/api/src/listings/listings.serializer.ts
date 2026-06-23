// Maps Prisma rows -> the frontend's Property shape (apps/web/src/lib/beitco/
// types.ts). The DB stores stable Latin enums; the UI uses Arabic for type /
// unitType / nearby.type, so we map those back here. Other enums (rentalMode,
// listingType, saleStatus, bedStatus, rentToGender) already match the frontend.

type PType = 'apartment' | 'room' | 'bed';
type UType = 'apartment' | 'studio' | 'duplex' | 'roof' | 'villa';
type NType = 'metro' | 'university' | 'transit' | 'mall' | 'hospital' | 'supermarket' | 'other';

const TYPE_AR: Record<PType, string> = {
  apartment: 'شقة',
  room: 'أوضة',
  bed: 'سرير',
};
const UNIT_AR: Record<UType, string> = {
  apartment: 'شقة',
  studio: 'استوديو',
  duplex: 'دوبلكس',
  roof: 'روف',
  villa: 'فيلا',
};
const NEARBY_AR: Record<NType, string> = {
  metro: 'مترو',
  university: 'جامعة',
  transit: 'مواصلات',
  mall: 'مول',
  hospital: 'مستشفى',
  supermarket: 'سوبر ماركت',
  other: 'حاجة تانية',
};

const AR_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

function arMonthYear(d: Date): string {
  return `${AR_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

// Day/month/year in Egyptian Arabic with Latin numerals — matches the mock
// store's Q&A date format (toLocaleDateString("ar-EG-u-nu-latn")).
function arDate(d: Date): string {
  return d.toLocaleDateString('ar-EG-u-nu-latn');
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '؟';
  if (parts.length === 1) return parts[0]!.slice(0, 2);
  return `${parts[0]![0]}.${parts[1]![0]}`;
}

// Loose shapes for the included relations (avoids coupling to the generated
// Prisma types, which the editor sometimes caches stale).
interface OccupantRow {
  name: string | null;
  phone: string | null;
  moveInDate: Date | null;
  notes: string | null;
  userId: string | null;
  linkStatus: string | null;
}
interface BedRow {
  id: string;
  label: string;
  status: string;
  price: number;
  features: string[];
  occupant?: OccupantRow | null;
}
interface RoomRow {
  id: string;
  name: string;
  features: string[];
  sizeM2: number | null;
  price: number | null;
  status: string | null;
  beds: BedRow[];
  occupant?: OccupantRow | null;
}
interface NearbyRow {
  id: string;
  type: NType;
  name: string;
  line: string | null;
  minutes: number | null;
}
interface CustomSpecRow {
  id: string;
  label: string;
  value: string;
}
interface ReviewRow {
  id: string;
  authorName: string;
  initials: string;
  monthsLived: number;
  rating: number;
  body: string;
  scores: unknown;
  helpful: number;
  ownerReply: unknown;
  createdAt: Date;
}
interface OwnerRow {
  id: string;
  name: string;
  trust: number;
  responseRate: number | null;
  verified: boolean;
}
interface QuestionRow {
  id: string;
  askerName: string;
  body: string;
  answer: string | null;
  answererName: string | null;
  createdAt: Date;
  answeredAt: Date | null;
}
export interface PropertyRow {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  area: string;
  address: string;
  lat: number | null;
  lng: number | null;
  type: PType;
  status: string;
  listingType: string;
  rentalMode: string | null;
  unitType: UType | null;
  bedrooms: number | null;
  bathrooms: number | null;
  floor: number | null;
  sizeM2: number | null;
  furnished: boolean;
  price: number;
  priceFrom: number | null;
  wholePrice: number | null;
  wholeStatus: string | null;
  nightlyPrice: number | null;
  salePrice: number | null;
  saleStatus: string | null;
  negotiable: boolean;
  rentToGender: string | null;
  images: string[];
  amenities: string[];
  costs: unknown;
  trust: number;
  trustBreakdown: unknown;
  verified: boolean;
  quality: unknown;
  reviewsCount: number;
  residents: number;
  createdAt: Date;
  owner?: OwnerRow | null;
  rooms?: RoomRow[];
  nearby?: NearbyRow[];
  customSpecs?: CustomSpecRow[];
  reviews?: ReviewRow[];
  questions?: QuestionRow[];
  wholeOccupant?: OccupantRow | null;
}

// Compute the card-facing { total, available, occupied } the way the frontend's
// summarizeListing does, so counts match exactly.
function bedSummary(p: PropertyRow): { total: number; available: number; occupied: number } {
  if (p.listingType === 'sale') {
    const avail = (p.saleStatus ?? 'available') === 'available';
    return { total: 1, available: avail ? 1 : 0, occupied: avail ? 0 : 1 };
  }
  if (p.rentalMode === 'whole') {
    const total = p.bedrooms ?? 1;
    const free = (p.wholeStatus ?? 'available') === 'available';
    return { total, available: free ? 1 : 0, occupied: free ? 0 : 1 };
  }
  if (p.rentalMode === 'by_room') {
    const rooms = p.rooms ?? [];
    const total = rooms.length;
    const available = rooms.filter((r) => (r.status ?? 'available') === 'available').length;
    return { total, available, occupied: total - available };
  }
  if (p.rentalMode === 'by_bed') {
    const beds = (p.rooms ?? []).flatMap((r) => r.beds ?? []);
    const total = beds.length;
    const available = beds.filter((b) => b.status === 'available').length;
    return { total, available, occupied: total - available };
  }
  return { total: 1, available: 1, occupied: 0 };
}

interface QualityScores {
  internet: number;
  safety: number;
  noise: number;
  maintenance: number;
  cleanliness: number;
}

const DEFAULT_QUALITY: QualityScores = {
  internet: 7.5,
  safety: 7.5,
  noise: 7.5,
  maintenance: 7.5,
  cleanliness: 7.5,
};

/** Full Property shape for the detail page (public — owner-only occupant data omitted). */
export function serializeProperty(
  p: PropertyRow,
  opts: { includeOccupants?: boolean } = {},
): Record<string, unknown> {
  const quality = (p.quality as QualityScores | null) ?? DEFAULT_QUALITY;
  const beds = bedSummary(p);
  // Owner-only renter details — included only when the owner views their own
  // listings (the dashboard management grid). Never on the public detail page.
  const occ = (o?: OccupantRow | null) =>
    opts.includeOccupants && o
      ? {
          name: o.name ?? undefined,
          phone: o.phone ?? undefined,
          moveInDate: o.moveInDate?.toISOString() ?? undefined,
          notes: o.notes ?? undefined,
          userId: o.userId ?? undefined,
          linkStatus: o.linkStatus ?? undefined,
        }
      : undefined;
  const spec = p.unitType
    ? {
        unitType: UNIT_AR[p.unitType],
        bedrooms: p.bedrooms ?? 0,
        bathrooms: p.bathrooms ?? 0,
        floor: p.floor ?? undefined,
        sizeM2: p.sizeM2 ?? undefined,
        furnished: p.furnished,
      }
    : undefined;

  const ownerName = p.owner?.name ?? 'صاحب البيت';

  return {
    id: p.id,
    ownerId: p.ownerId,
    title: p.title,
    area: p.area,
    address: p.address,
    lat: p.lat ?? undefined,
    lng: p.lng ?? undefined,
    type: TYPE_AR[p.type],
    status: p.status,
    price: p.price,
    priceFrom: p.priceFrom ?? p.price,
    trust: p.trust,
    verified: p.verified,
    reviewsCount: p.reviewsCount,
    residents: p.residents,
    internet: quality.internet,
    image: p.images[0] ?? '',
    images: p.images,
    description: p.description,
    quality,
    trustBreakdown: p.trustBreakdown ?? undefined,
    amenities: p.amenities,
    costs: (p.costs as unknown[]) ?? [],
    beds,
    rentalMode: p.rentalMode ?? undefined,
    spec,
    wholePrice: p.wholePrice ?? undefined,
    wholeStatus: p.wholeStatus ?? undefined,
    wholeOccupant: occ(p.wholeOccupant),
    nightlyPrice: p.nightlyPrice ?? undefined,
    listingType: p.listingType,
    salePrice: p.salePrice ?? undefined,
    saleStatus: p.saleStatus ?? undefined,
    negotiable: p.negotiable,
    rentToGender: p.rentToGender ?? undefined,
    rooms: (p.rooms ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      features: r.features,
      sizeM2: r.sizeM2 ?? undefined,
      price: r.price ?? undefined,
      status: r.status ?? undefined,
      occupant: occ(r.occupant),
      beds: (r.beds ?? []).map((b) => ({
        id: b.id,
        label: b.label,
        status: b.status,
        price: b.price,
        features: b.features,
        occupant: occ(b.occupant),
      })),
    })),
    nearby: (p.nearby ?? []).map((n) => ({
      id: n.id,
      type: NEARBY_AR[n.type],
      name: n.name,
      line: n.line ?? undefined,
      minutes: n.minutes ?? undefined,
    })),
    customSpecs: (p.customSpecs ?? []).map((c) => ({ id: c.id, label: c.label, value: c.value })),
    landlord: {
      id: p.owner?.id ?? p.ownerId,
      name: ownerName,
      initials: initialsOf(ownerName),
      trust: p.owner?.trust ?? p.trust,
      responseRate: p.owner?.responseRate ?? 0,
      verified: p.owner?.verified ?? p.verified,
    },
    reviews: (p.reviews ?? []).map((r) => ({
      id: r.id,
      propertyId: p.id,
      author: r.authorName,
      initials: r.initials,
      monthsLived: r.monthsLived,
      rating: r.rating,
      date: arMonthYear(r.createdAt),
      createdAtISO: r.createdAt.toISOString(),
      body: r.body,
      helpful: r.helpful,
      ownerReply: r.ownerReply ?? undefined,
      scores: r.scores ?? undefined,
    })),
    qa: (p.questions ?? []).map((q) => ({
      id: q.id,
      propertyId: p.id,
      asker: q.askerName,
      q: q.body,
      a: q.answer ?? undefined,
      answerer: q.answererName ?? undefined,
      date: arDate(q.createdAt),
    })),
    createdAt: p.createdAt.toISOString(),
  };
}

/** Compact card shape (PropertySummary) for list/search results. */
export function serializeSummary(p: PropertyRow): Record<string, unknown> {
  const quality = (p.quality as QualityScores | null) ?? DEFAULT_QUALITY;
  const beds = bedSummary(p);
  const spec = p.unitType
    ? {
        unitType: UNIT_AR[p.unitType],
        bedrooms: p.bedrooms ?? 0,
        bathrooms: p.bathrooms ?? 0,
        floor: p.floor ?? undefined,
        sizeM2: p.sizeM2 ?? undefined,
        furnished: p.furnished,
      }
    : undefined;

  return {
    id: p.id,
    title: p.title,
    area: p.area,
    address: p.address,
    type: TYPE_AR[p.type],
    price: p.price,
    trust: p.trust,
    reviewsCount: p.reviewsCount,
    residents: p.residents,
    internet: quality.internet,
    image: p.images[0] ?? '',
    verified: p.verified,
    beds,
    rentalMode: p.rentalMode ?? undefined,
    rentToGender: p.rentToGender ?? undefined,
    listingType: p.listingType,
    salePrice: p.salePrice ?? undefined,
    saleStatus: p.saleStatus ?? undefined,
    negotiable: p.negotiable,
    nightlyPrice: p.nightlyPrice ?? undefined,
    spec,
    priceFrom: p.priceFrom ?? p.price,
    createdAt: p.createdAt.toISOString(),
  };
}
