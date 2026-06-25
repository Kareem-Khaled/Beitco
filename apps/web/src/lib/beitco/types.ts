// Shared types for Beitco mock data layer.
// These match the eventual API shape so we can swap mock → real with minimal changes.

export type PropertyType = "شقة" | "أوضة" | "سرير";
export type PropertyStatus = "draft" | "pending_approval" | "published" | "paused" | "rejected";
export type BedStatus = "available" | "occupied" | "reserved";
export type UserRole = "renter" | "owner" | "both";

// How the owner rents the place out.
//  - whole   = rent the entire apartment to one tenant/family
//  - by_room = rent each room privately (different price per room)
//  - by_bed  = rent individual beds inside shared rooms (different price per bed)
export type RentalMode = "whole" | "by_room" | "by_bed";

// What the owner is doing with the place: renting it out or selling it.
// Defaults to "rent" everywhere for back-compatibility with existing listings.
export type ListingType = "rent" | "sale";

// Whether a for-sale unit is still on the market.
export type SaleStatus = "available" | "sold";

// What the unit physically is.
export type UnitType = "شقة" | "استوديو" | "دوبلكس" | "روف" | "فيلا";

// ── Renter preferences (powers matching) ──
export type Occupation = "طالب" | "موظف" | "شغل ريموت" | "حر" | "غير ده";
export type GenderPref = "ذكر" | "أنثى" | "مايفرقش";
export type Gender = "ذكر" | "أنثى"; // a person's own gender — captured at registration
export type FurnishedPref = "furnished" | "unfurnished" | "any";
// Shared rentals (by_room / by_bed) are always restricted to one gender —
// there's no "anyone" option. Whole-apartment rentals leave this undefined.
export type RentalGenderPolicy = "male_only" | "female_only";

// What the renter is looking for + about them. All optional — the more
// they fill, the better Beitco can match them to the right place.
export type RenterProfile = {
  intent?: "rent" | "buy"; // looking to rent (default) or to buy a place
  budgetMin?: number;
  budgetMax?: number;
  areas?: string[]; // preferred areas
  lookingFor?: PropertyType[]; // شقة / أوضة / سرير
  moveInBy?: string; // ISO date — when they want to move
  mustHaveAmenities?: string[]; // deal-breaker amenities
  nearMetro?: boolean; // wants to be close to a metro
  metroLines?: string[]; // preferred metro lines
  maxWalkMinutes?: number; // acceptable walking time to transit/metro
  nearTransit?: boolean; // wants public transit nearby (even without metro)
  furnishedPref?: FurnishedPref;
  gender?: GenderPref; // preferred housemates' gender (shared housing)
  selfGender?: Gender; // the renter's own gender — matched against a listing's rentToGender policy
  occupation?: Occupation;
  smoker?: boolean;
  bio?: string; // a few words about themselves for owners
  updatedAt?: string;
};

// Optional details an owner records about who reserved/rented a unit.
// Private — shown only to the owner in their dashboard, never publicly.
export type Occupant = {
  userId?: string; // linked Beitco account — set only after the renter consents
  linkStatus?: "pending" | "confirmed"; // consent state of the account link
  name?: string;
  phone?: string;
  moveInDate?: string; // ISO date
  notes?: string;
};

// Account verification lifecycle (the trust wedge made visible).
export type VerificationStatus = "unverified" | "pending" | "verified";

// Per-channel notification preferences (mock; stored on the user).
export type NotificationPrefs = {
  leads?: boolean; // viewing requests on my listings
  messages?: boolean; // new chat messages
  reviews?: boolean; // when I become eligible to review / new reviews on my listing
  marketing?: boolean; // product updates & tips
};

export type User = {
  id: string;
  phone: string;
  name: string;
  role: UserRole;
  avatar?: string;
  trust: number;
  verified: boolean;
  verificationStatus?: VerificationStatus; // when absent, derive from `verified`
  responseRate?: number; // 0–100, computed from reply behavior (T-3 fills this in)
  trustBreakdown?: TrustBreakdown; // computed owner trust explainability (T-1)
  renterReputation?: number; // 0–10, computed from owner reviews (T-4), when role includes renter
  renterReviewsCount?: number; // how many owner reviews back the reputation
  isAdmin?: boolean; // platform moderator — can review the approval queue (MOD-1)
  notifications?: NotificationPrefs;
  createdAt: string;
  profile?: RenterProfile; // renter preferences, when role includes renter
};

export type Bed = {
  id: string;
  label: string; // e.g. "السرير الأول جنب الشباك"
  status: BedStatus;
  price: number;
  features?: string[]; // bed-level extras that justify the price, e.g. ["جنب الشباك"]
  occupant?: Occupant; // owner-only renter details when reserved/occupied
};

// A room inside the apartment. Depending on rentalMode it's either
// rented whole (price + status) or split into beds (beds[]).
export type Room = {
  id: string;
  name: string; // "الأوضة الكبيرة" / "أوضة على البحري"
  features: string[]; // ["تكييف", "حمام خاص", "بلكونة"]
  sizeM2?: number;
  // by_room mode — rent the whole room privately:
  price?: number;
  status?: BedStatus;
  occupant?: Occupant; // owner-only renter details when reserved/occupied
  // by_bed mode — beds inside this room (each its own price):
  beds: Bed[];
};

// Specs of the apartment as a whole.
export type ApartmentSpec = {
  unitType: UnitType;
  bedrooms: number;
  bathrooms: number;
  floor?: number;
  sizeM2?: number;
  furnished: boolean;
};

// Nearby landmarks / transit — "قريب من المترو، الجامعة...".
export type NearbyType =
  | "مترو"
  | "جامعة"
  | "مواصلات"
  | "مول"
  | "مستشفى"
  | "سوبر ماركت"
  | "حاجة تانية";

export type NearbyPlace = {
  id: string;
  type: NearbyType;
  name: string; // "محطة السادات" / "جامعة القاهرة"
  line?: string; // metro line, when type === "مترو"
  minutes?: number; // walking minutes
};

// Owner-defined free-form spec, e.g. { label: "اتجاه الشمس", value: "بحري" }.
export type CustomSpec = {
  id: string;
  label: string;
  value: string;
};

export type Review = {
  id: string;
  propertyId: string;
  author: string;
  initials: string;
  monthsLived: number;
  rating: number;
  date: string;
  body: string;
  createdAtISO?: string; // machine date for recency scoring (user-posted reviews set this)
  helpful?: number; // "مفيد" upvote count
  ownerReply?: { body: string; date: string }; // landlord's reply to this review
  scores?: {
    internet: number;
    safety: number;
    noise: number;
    maintenance: number;
    cleanliness: number;
  };
};

export type QA = {
  id: string;
  propertyId: string;
  q: string;
  a?: string;
  asker: string;
  answerer?: string;
  date: string;
};

export type CostItem = { label: string; amount: number };

export type Landlord = {
  id: string;
  name: string;
  initials: string;
  trust: number;
  responseRate: number;
  verified: boolean;
};

export type QualityScores = {
  internet: number;
  safety: number;
  noise: number;
  maintenance: number;
  cleanliness: number;
};

// Computed, explainable trust. `score` is 0–10; `components` are the per-factor
// point contributions that sum (≈) to the score, so the UI can show "ليه الدرجة دي؟".
export type TrustBreakdown = {
  score: number; // 0–10 computed
  components: {
    verification: number; // contribution from being verified
    reviews: number; // Bayesian-smoothed resident ratings
    tenure: number; // how long residents actually stayed
    responsiveness: number; // owner reply behavior
    recency: number; // recent positive activity
  };
  reviewsCount: number; // n used in the Bayesian smoothing (for transparency)
  capped?: boolean; // true when the unverified cap was applied
  updatedAt: string; // ISO
};

export type Property = {
  id: string;
  ownerId: string;
  title: string;
  area: string;
  address: string;
  lat?: number; // owner-set map location (keyless OSM/Leaflet pin)
  lng?: number;
  type: PropertyType;
  status: PropertyStatus;
  price: number;
  trust: number;
  verified: boolean;
  reviewsCount: number;
  residents: number;
  internet: number; // shortcut score for cards
  image: string;
  images: string[];
  description: string;
  quality: QualityScores;
  trustBreakdown?: TrustBreakdown; // computed explainability (T-1)
  amenities: string[];
  costs: CostItem[];
  beds: { total: number; available: number; occupied: number };
  bedDetails?: Bed[];
  // ── Structured apartment model (source of truth when present) ──
  rentalMode?: RentalMode;
  spec?: ApartmentSpec;
  wholePrice?: number; // when rentalMode === "whole"
  wholeStatus?: BedStatus; // when rentalMode === "whole"
  wholeOccupant?: Occupant; // owner-only renter details for whole-apartment rentals
  nightlyPrice?: number; // optional short-stay rate (nice-to-have; monthly is the focus)
  rooms?: Room[]; // when rentalMode === "by_room" | "by_bed"
  rentToGender?: RentalGenderPolicy; // shared rentals policy (by_room/by_bed)
  // ── For-sale listings ──
  listingType?: ListingType; // undefined / "rent" = rental (default), "sale" = for sale
  salePrice?: number; // total asking price when listingType === "sale"
  saleStatus?: SaleStatus; // available / sold
  negotiable?: boolean; // سعر قابل للتفاوض
  priceFrom?: number; // derived: cheapest available unit
  nearby?: NearbyPlace[]; // transit & landmarks around the place
  customSpecs?: CustomSpec[]; // owner-defined extra specs
  landlord: Landlord;
  reviews: Review[];
  qa: QA[];
  createdAt: string;
  // ── Moderation (MOD-1) ──
  rejectionReason?: string; // why a listing was rejected (shown to the owner)
  moderatedAt?: string; // ISO — when an admin last approved/rejected it
};

// Compact summary used in cards / search results
export type PropertySummary = Pick<
  Property,
  | "id"
  | "title"
  | "area"
  | "address"
  | "type"
  | "price"
  | "trust"
  | "reviewsCount"
  | "residents"
  | "internet"
  | "image"
  | "verified"
  | "beds"
  | "rentalMode"
  | "rentToGender"
  | "listingType"
  | "salePrice"
  | "saleStatus"
  | "negotiable"
  | "nightlyPrice"
  | "spec"
  | "priceFrom"
  | "createdAt"
>;

// Messaging
export type Message = {
  id: string;
  threadId: string;
  senderId: string;
  body: string;
  createdAt: string;
  type?: "text" | "viewing_request";
};

export type Thread = {
  id: string;
  propertyId: string;
  ownerId: string;
  renterId: string;
  lastMessageAt: string;
  unreadFor?: string; // user id who has unread messages
  messages: Message[];
  // Embedded property summary — present on API responses so the messages pages
  // need no extra property fetch. In mock mode it's derived via getProperty.
  property?: {
    id: string;
    title: string;
    image: string;
    area: string;
    landlord: { name: string; initials: string; verified: boolean };
  };
};

// Tracks how fast an owner replies to a renter's first message in a thread (T-3).
// Response rate = % of events answered within the threshold (24h). One event per
// thread; opened on the renter's first message, closed on the owner's first reply.
export type ResponseEvent = {
  id: string;
  ownerId: string;
  threadId: string;
  firstRenterMessageAt: string; // ISO
  firstOwnerReplyAt?: string; // ISO — undefined = not yet answered
};

// The specific unit a renter is asking about (a bed / room), so the owner
// knows exactly which one — the heart of bed-level booking.
export type LeadUnit = {
  label: string; // e.g. "السرير الأول جنب الشباك" / "الأوضة الكبيرة"
  kind: "bed" | "room" | "whole";
  roomId?: string;
  roomName?: string; // the room a bed sits in, so the owner can place it precisely
  bedId?: string;
  price?: number;
};

// Lead = a viewing / booking request
export type Lead = {
  id: string;
  propertyId: string;
  renterId: string;
  renterName: string;
  status: "pending" | "approved" | "declined" | "completed";
  intent?: "viewing" | "booking"; // booking = wants specific unit(s)
  units?: LeadUnit[]; // the targeted beds/rooms, when booking specific units
  preferredDate?: string;
  note?: string;
  createdAt: string;
  // Owner-context enrichment (only present on the owner-leads API response):
  renterReputation?: { score: number; count: number } | null; // T-4 badge
  canReview?: boolean; // owner may still review this renter (confirmed tenancy, not yet reviewed)
};

// Tenancy = user lived at a property (gates review eligibility)
export type Tenancy = {
  id: string;
  propertyId: string;
  userId: string;
  moveInDate: string;
  moveOutDate?: string;
  monthsLived: number;
};

// Owner → renter review (two-sided trust, T-4). Gated by a confirmed tenancy.
// Privacy: the score is shown to owners on leads, but never the individual text
// from other owners (prevents blacklisting/retaliation chains) — see TRUST_SPEC §6.
export type RenterReview = {
  id: string;
  tenancyId: string;
  renterId: string; // who is being reviewed
  ownerId: string; // author (the owner)
  propertyId: string;
  rating: number; // 1–10 overall
  scores: {
    reliability: number; // paid on time, honored commitments
    cleanliness: number;
    communication: number;
  };
  body: string;
  date: string;
  createdAtISO?: string;
};

// Saved listing
export type SavedListing = {
  propertyId: string;
  userId: string;
  savedAt: string;
};

// A renter's saved search — the filter set they want to revisit / be alerted on.
export type SavedSearchParams = {
  q?: string;
  type?: PropertyType;
  purpose?: "rent" | "sale";
  gender?: "male_only" | "female_only";
  area?: string;
  freeOnly?: boolean;
  verifiedOnly?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sort?: "trust" | "price_asc" | "price_desc" | "newest";
};

export type SavedSearch = {
  id: string;
  userId: string;
  label: string;
  params: SavedSearchParams;
  createdAt: string;
};

// ADMIN-1: the platform-operator overview snapshot (GET /admin/stats).
export type PlatformStats = {
  users: {
    total: number;
    renters: number;
    owners: number;
    both: number;
    admins: number;
    verified: number;
    pendingVerification: number;
    new7d: number;
    new30d: number;
  };
  listings: {
    total: number;
    published: number;
    pending: number;
    draft: number;
    rejected: number;
    verified: number;
    new7d: number;
    new30d: number;
    byType: Record<PropertyType, number>;
  };
  engagement: {
    leads: number;
    leadsPending: number;
    tenancies: number;
    reviews: number;
    questions: number;
    threads: number;
    savedSearches: number;
  };
  inventory: { totalBeds: number; availableBeds: number };
  trust: { avgListingTrust: number | null; avgOwnerTrust: number | null };
  queues: { pendingListings: number; pendingVerifications: number };
  recent: {
    users: { id: string; name: string; role: string; verified: boolean; createdAt: string }[];
    listings: {
      id: string;
      title: string;
      area: string;
      type: PropertyType;
      status: string;
      price: number;
      createdAt: string;
    }[];
  };
};
