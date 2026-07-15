// Wizard state + types for the list-a-property flow.
// New model: an APARTMENT with specs, a RENTAL MODE (whole / by room / by bed),
// and per-room / per-bed pricing driven by features.
import type {
  RentalMode,
  RentalGenderPolicy,
  ListingType,
  SaleStatus,
  UnitType,
  BedStatus,
  Room,
  Bed,
  Property,
  NearbyPlace,
  NearbyType,
  CustomSpec,
} from "./types";

export type ListingDraft = {
  // Step 1 — location
  area?: string;
  address?: string;
  lat?: number; // exact map pin the owner sets (Google Maps)
  lng?: number;
  // Step 2 — apartment specs
  unitType?: UnitType;
  bedrooms?: number;
  bathrooms?: number;
  floor?: number;
  sizeM2?: number;
  furnished?: boolean;
  nearby?: NearbyPlace[]; // قريب من المترو / الجامعة...
  customSpecs?: CustomSpec[]; // مواصفات إضافية من عند المالك
  // Step 3 — offer type (rent vs sell) + rental mode
  listingType?: ListingType; // "rent" (default) | "sale"
  rentalMode?: RentalMode;
  rentToGender?: RentalGenderPolicy;
  // Step 4 — pricing
  wholePrice?: number;
  wholeStatus?: BedStatus;
  nightlyPrice?: number; // optional short-stay rate
  rooms?: Room[];
  costs?: { label: string; amount: number }[];
  salePrice?: number; // when listingType === "sale"
  saleStatus?: SaleStatus;
  negotiable?: boolean;
  // Step 5 — amenities
  amenities?: string[];
  // Step 6 — photos
  images?: string[]; // data URLs from local upload
  // Step 7 — title + description
  title?: string;
  description?: string;
};

const DRAFT_KEY = "beitco:listingDraft";

export function loadDraft(): ListingDraft {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveDraft(draft: ListingDraft) {
  if (typeof window === "undefined") return;
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function clearDraft() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(DRAFT_KEY);
}

export const STEPS = [
  { id: 1, label: "المكان", short: "المكان" },
  { id: 2, label: "مواصفات الشقة", short: "المواصفات" },
  { id: 3, label: "نوع العرض", short: "العرض" },
  { id: 4, label: "السعر", short: "السعر" },
  { id: 5, label: "المميزات المشتركة", short: "المميزات" },
  { id: 6, label: "الصور", short: "الصور" },
  { id: 7, label: "العنوان والوصف", short: "الوصف" },
  { id: 8, label: "مراجعة ونشر", short: "المراجعة" },
] as const;

export type StepId = (typeof STEPS)[number]["id"];

// ── Factory helpers ──
let _seq = 0;
function uid(prefix: string): string {
  _seq += 1;
  return `${prefix}-${Date.now().toString(36)}-${_seq}`;
}

export function makeBed(index: number): Bed {
  return {
    id: uid("bed"),
    label: `سرير ${index}`,
    price: 0,
    status: "available",
    features: [],
  };
}

export function makeRoom(index: number, withBed = false): Room {
  return {
    id: uid("room"),
    name: `أوضة ${index}`,
    features: [],
    price: undefined,
    status: "available",
    beds: withBed ? [makeBed(1)] : [],
  };
}

export function makeNearby(type: NearbyType = "مترو"): NearbyPlace {
  return { id: uid("near"), type, name: "" };
}

export function makeCustomSpec(): CustomSpec {
  return { id: uid("spec"), label: "", value: "" };
}

// Rent line labels that draftToProperty injects into `costs`. We strip these
// when converting back to a draft so the wizard only shows real extra bills.
const RENT_LABELS = ["إيجار الشقة", "أرخص أوضة", "أرخص سرير", "الإيجار"];

// Convert an existing property into a draft so the wizard can edit it.
export function propertyToDraft(p: Property): ListingDraft {
  return {
    area: p.area,
    address: p.address,
    lat: p.lat,
    lng: p.lng,
    unitType: p.spec?.unitType,
    bedrooms: p.spec?.bedrooms,
    bathrooms: p.spec?.bathrooms,
    floor: p.spec?.floor,
    sizeM2: p.spec?.sizeM2,
    furnished: p.spec?.furnished,
    nearby: p.nearby ? p.nearby.map((n) => ({ ...n })) : undefined,
    customSpecs: p.customSpecs ? p.customSpecs.map((c) => ({ ...c })) : undefined,
    listingType: p.listingType ?? "rent",
    rentalMode: p.rentalMode,
    rentToGender: p.rentToGender,
    wholePrice: p.wholePrice,
    wholeStatus: p.wholeStatus,
    nightlyPrice: p.nightlyPrice,
    rooms: p.rooms ? p.rooms.map((r) => ({ ...r, beds: [...r.beds] })) : undefined,
    costs: (p.costs ?? []).filter((c) => !RENT_LABELS.includes(c.label)),
    salePrice: p.salePrice,
    saleStatus: p.saleStatus,
    negotiable: p.negotiable,
    amenities: p.amenities ? [...p.amenities] : [],
    images: p.images ? [...p.images] : [],
    title: p.title,
    description: p.description,
  };
}
