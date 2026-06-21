// Mock data store — localStorage-backed, simulates the API shape.
// In production, swap these functions for real fetch calls.

import { seedProperties, seedUsers } from "./seed-data";
import type {
  Property,
  PropertySummary,
  PropertyType,
  PropertyStatus,
  UnitType,
  Thread,
  Message,
  Lead,
  Tenancy,
  SavedListing,
  User,
  RenterProfile,
  VerificationStatus,
} from "./types";
import type { SavedSearch, SavedSearchParams, ResponseEvent, RenterReview } from "./types";
import {
  computeListingTrust,
  computeOwnerTrust,
  computeQualityFromReviews,
  computeRenterReputation,
} from "./trust";
import { scoreMatch, type MatchResult } from "./matching";
import { summarizeListing, normalizeProperty } from "./listing-derivation";

// Re-exported for existing consumers that import these from the store.
export { scoreMatch, type MatchResult } from "./matching";
export { summarizeListing } from "./listing-derivation";

const STORAGE_KEYS = {
  properties: "beitco:properties",
  threads: "beitco:threads",
  leads: "beitco:leads",
  tenancies: "beitco:tenancies",
  saved: "beitco:saved",
  users: "beitco:users",
  seedVersion: "beitco:seedVersion",
  savedSearches: "beitco:savedSearches",
  responseEvents: "beitco:responseEvents",
  renterReviews: "beitco:renterReviews",
} as const;

// Bump this whenever the seed data shape/content changes so existing browsers
// refresh the demo listings (e.g. new fields like `rentToGender`) WITHOUT
// wiping anything the user created. See `ensureSeeded`.
const SEED_VERSION = "2026-06-17-geo";

const isBrowser = typeof window !== "undefined";

function readJSON<T>(key: string, fallback: T): T {
  if (!isBrowser) return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(key: string, value: T) {
  if (!isBrowser) return;
  localStorage.setItem(key, JSON.stringify(value));
}


// ---------- Initialization ----------

function ensureSeeded() {
  if (!isBrowser) return;

  // Version refresh: when the seed data changes, re-apply seed records by id so
  // demo listings/users pick up new fields — while preserving user-created data.
  const storedVersion = localStorage.getItem(STORAGE_KEYS.seedVersion);
  if (storedVersion !== SEED_VERSION) {
    const seedPropIds = new Set(seedProperties.map((p) => p.id));
    const existingProps = readJSON<Property[]>(STORAGE_KEYS.properties, []);
    const userProps = existingProps.filter((p) => !seedPropIds.has(p.id));
    writeJSON(STORAGE_KEYS.properties, [...seedProperties, ...userProps]);

    const seedUserIds = new Set(seedUsers.map((u) => u.id));
    const existingUsers = readJSON<User[]>(STORAGE_KEYS.users, []);
    const registeredUsers = existingUsers.filter((u) => !seedUserIds.has(u.id));
    writeJSON(STORAGE_KEYS.users, [...seedUsers, ...registeredUsers]);

    localStorage.setItem(STORAGE_KEYS.seedVersion, SEED_VERSION);

    // Seed response events first so the computed response rate is available,
    // then make the wedge real: replace hand-set trust/quality with computed,
    // explainable values derived from reviews + verification + responsiveness.
    seedResponseEvents();
    seedRenterReviews();
    seedModerationQueue();
    recomputeAllTrust();
  }

  if (!localStorage.getItem(STORAGE_KEYS.properties)) {
    writeJSON(STORAGE_KEYS.properties, seedProperties);
  }
  if (!localStorage.getItem(STORAGE_KEYS.users)) {
    writeJSON(STORAGE_KEYS.users, seedUsers);
  }
  if (!localStorage.getItem(STORAGE_KEYS.threads)) {
    writeJSON(STORAGE_KEYS.threads, [] as Thread[]);
  }
  if (!localStorage.getItem(STORAGE_KEYS.leads)) {
    writeJSON(STORAGE_KEYS.leads, [] as Lead[]);
  }
  if (!localStorage.getItem(STORAGE_KEYS.tenancies)) {
    writeJSON(STORAGE_KEYS.tenancies, [] as Tenancy[]);
  }
  if (!localStorage.getItem(STORAGE_KEYS.saved)) {
    writeJSON(STORAGE_KEYS.saved, [] as SavedListing[]);
  }
}

// ---------- Demo data for logged-in users ----------
// Gives any logged-in user a realistic starter dataset so the owner
// dashboard, renter account, and messaging aren't empty. Idempotent
// per user via a localStorage flag.

function demoInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2);
  return parts[0][0] + parts[1][0];
}

export function seedDemoForUser(user: User) {
  if (!isBrowser) return;
  ensureSeeded();
  const flagKey = `beitco:demoSeeded:${user.id}`;
  if (localStorage.getItem(flagKey)) return;

  const isOwner = user.role === "owner" || user.role === "both";
  const isRenter = user.role === "renter" || user.role === "both";
  const now = Date.now();
  const daysAgo = (d: number) => new Date(now - d * 86400000).toISOString();

  // ---- Owner side: own a few listings (whole + by-bed), with leads + a chat ----
  if (isOwner) {
    const props = readJSON<Property[]>(STORAGE_KEYS.properties, []);
    props
      .filter((p) => p.id === "1" || p.id === "4" || p.id === "2")
      .forEach((p) => {
        p.ownerId = user.id;
        p.landlord = {
          ...p.landlord,
          id: user.id,
          name: user.name,
          initials: demoInitials(user.name),
        };
      });
    writeJSON(STORAGE_KEYS.properties, props);

    const leads = readJSON<Lead[]>(STORAGE_KEYS.leads, []);
    leads.push(
      {
        id: `l-demo-${user.id}-1`,
        propertyId: "1",
        renterId: "u-demo-ahmed",
        renterName: "أحمد سمير",
        status: "pending",
        preferredDate: daysAgo(-3),
        note: "مهتم أوي بالشقة، ممكن أعدي أشوفها الويك إند؟",
        createdAt: daysAgo(1),
      },
      {
        id: `l-demo-${user.id}-2`,
        propertyId: "4",
        renterId: "u-demo-mona",
        renterName: "منى خالد",
        status: "pending",
        note: "السرير الفاضي لسه متاح؟",
        createdAt: daysAgo(2),
      },
    );
    writeJSON(STORAGE_KEYS.leads, leads);

    const threads = readJSON<Thread[]>(STORAGE_KEYS.threads, []);
    const tId = `t-demo-${user.id}-owner`;
    threads.push({
      id: tId,
      propertyId: "1",
      ownerId: user.id,
      renterId: "u-demo-ahmed",
      lastMessageAt: daysAgo(1),
      unreadFor: user.id,
      messages: [
        {
          id: `${tId}-m1`,
          threadId: tId,
          senderId: "u-demo-ahmed",
          body: "السلام عليكم، الشقة لسه متاحة؟",
          createdAt: daysAgo(1),
          type: "text",
        },
        {
          id: `${tId}-m2`,
          threadId: tId,
          senderId: "u-demo-ahmed",
          body: "وممكن أعرف النت سرعته كام؟",
          createdAt: daysAgo(1),
          type: "text",
        },
      ],
    });
    writeJSON(STORAGE_KEYS.threads, threads);
  }

  // ---- Renter side: saved listings, applications, a tenancy + a chat ----
  if (isRenter) {
    // Seed a starter preferences profile so matching works out of the box.
    const users = readJSON<User[]>(STORAGE_KEYS.users, seedUsers);
    const me = users.find((u) => u.id === user.id);
    if (me && !me.profile) {
      me.profile = {
        budgetMin: 2500,
        budgetMax: 6000,
        areas: ["المعادي · شارع 9", "الدقي · شارع التحرير"],
        lookingFor: ["سرير", "أوضة"],
        mustHaveAmenities: ["تكييف", "نت 200 ميجا"],
        nearMetro: true,
        furnishedPref: "furnished",
        occupation: "شغل ريموت",
        bio: "بشتغل من البيت، هادي وبحب النضافة.",
        updatedAt: daysAgo(3),
      };
      writeJSON(STORAGE_KEYS.users, users);
    }

    const saved = readJSON<SavedListing[]>(STORAGE_KEYS.saved, []);
    ["2", "3"].forEach((pid) => {
      if (!saved.some((s) => s.userId === user.id && s.propertyId === pid)) {
        saved.push({ userId: user.id, propertyId: pid, savedAt: daysAgo(5) });
      }
    });
    writeJSON(STORAGE_KEYS.saved, saved);

    const leads = readJSON<Lead[]>(STORAGE_KEYS.leads, []);
    leads.push(
      {
        id: `l-demo-${user.id}-app1`,
        propertyId: "5",
        renterId: user.id,
        renterName: user.name,
        status: "approved",
        preferredDate: daysAgo(-2),
        note: "محتاج أعاين قبل آخر الشهر.",
        createdAt: daysAgo(4),
      },
      {
        id: `l-demo-${user.id}-app2`,
        propertyId: "6",
        renterId: user.id,
        renterName: user.name,
        status: "pending",
        createdAt: daysAgo(1),
      },
    );
    writeJSON(STORAGE_KEYS.leads, leads);

    const tenancies = readJSON<Tenancy[]>(STORAGE_KEYS.tenancies, []);
    if (!tenancies.some((t) => t.userId === user.id && t.propertyId === "2")) {
      tenancies.push({
        id: `ten-demo-${user.id}`,
        propertyId: "2",
        userId: user.id,
        moveInDate: daysAgo(40),
        monthsLived: 1,
      });
    }
    writeJSON(STORAGE_KEYS.tenancies, tenancies);

    const threads = readJSON<Thread[]>(STORAGE_KEYS.threads, []);
    const prop5 = readJSON<Property[]>(STORAGE_KEYS.properties, []).find((p) => p.id === "5");
    const ownerOf5 = prop5?.ownerId ?? "u-students";
    const tId = `t-demo-${user.id}-renter`;
    threads.push({
      id: tId,
      propertyId: "5",
      ownerId: ownerOf5,
      renterId: user.id,
      lastMessageAt: daysAgo(2),
      unreadFor: user.id,
      messages: [
        {
          id: `${tId}-m1`,
          threadId: tId,
          senderId: user.id,
          body: "أهلاً، السرير الفاضي بكام شامل النت؟",
          createdAt: daysAgo(3),
          type: "text",
        },
        {
          id: `${tId}-m2`,
          threadId: tId,
          senderId: ownerOf5,
          body: "أهلاً بيك! 2800 شامل كل حاجة. تحب تعدي تشوف؟",
          createdAt: daysAgo(2),
          type: "text",
        },
      ],
    });
    writeJSON(STORAGE_KEYS.threads, threads);
  }

  localStorage.setItem(flagKey, "1");
}

// ---------- Properties ----------

export function getAllProperties(): Property[] {
  ensureSeeded();
  return readJSON<Property[]>(STORAGE_KEYS.properties, seedProperties).map(normalizeProperty);
}

export function getPublishedProperties(): Property[] {
  return getAllProperties().filter((p) => p.status === "published");
}

export function getPropertySummaries(): PropertySummary[] {
  return getPublishedProperties().map((p) => ({
    id: p.id,
    title: p.title,
    area: p.area,
    type: p.type,
    price: p.price,
    trust: p.trust,
    reviewsCount: p.reviewsCount,
    residents: p.residents,
    internet: p.internet,
    image: p.image,
    verified: p.verified,
    beds: p.beds,
    rentalMode: p.rentalMode,
    rentToGender: p.rentToGender,
    listingType: p.listingType,
    salePrice: p.salePrice,
    saleStatus: p.saleStatus,
    negotiable: p.negotiable,
    nightlyPrice: p.nightlyPrice,
    spec: p.spec,
    priceFrom: p.priceFrom,
  }));
}

export function getProperty(id: string): Property | undefined {
  return getAllProperties().find((p) => p.id === id);
}

export function getPropertiesByOwner(ownerId: string): Property[] {
  return getAllProperties().filter((p) => p.ownerId === ownerId);
}

export function saveProperty(property: Property) {
  const all = getAllProperties();
  const idx = all.findIndex((p) => p.id === property.id);
  if (idx >= 0) all[idx] = property;
  else all.push(property);
  writeJSON(STORAGE_KEYS.properties, all);
}

export function deleteProperty(id: string) {
  const all = getAllProperties().filter((p) => p.id !== id);
  writeJSON(STORAGE_KEYS.properties, all);
}

// ---------- Moderation (MOD-1) ----------
// Trust-first: a listing only goes live instantly if the owner is verified.
// Everyone else's listings enter a review queue so we can catch fake/abusive
// posts before renters ever see them — the core promise Beitco makes.

export function isPlatformAdmin(user?: Pick<User, "isAdmin"> | null): boolean {
  return !!user?.isAdmin;
}

// The status a freshly published (or resubmitted) listing should take.
export function getInitialListingStatus(
  owner: Pick<User, "verified" | "verificationStatus" | "isAdmin">,
): PropertyStatus {
  // Admins and verified owners are trusted to auto-publish.
  if (owner.isAdmin) return "published";
  return getVerificationStatus(owner) === "verified" ? "published" : "pending_approval";
}

// The admin review queue: everything waiting on approval, oldest first.
export function getPendingListings(): Property[] {
  return getAllProperties()
    .filter((p) => p.status === "pending_approval")
    .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
}

export function getPendingListingsCount(): number {
  return getAllProperties().filter((p) => p.status === "pending_approval").length;
}

export function approveListing(id: string): void {
  const all = getAllProperties();
  const idx = all.findIndex((p) => p.id === id);
  if (idx < 0) return;
  all[idx].status = "published";
  all[idx].rejectionReason = undefined;
  all[idx].moderatedAt = new Date().toISOString();
  writeJSON(STORAGE_KEYS.properties, all);
}

export function rejectListing(id: string, reason: string): void {
  const all = getAllProperties();
  const idx = all.findIndex((p) => p.id === id);
  if (idx < 0) return;
  all[idx].status = "rejected";
  all[idx].rejectionReason = reason.trim() || "مخالف لشروط النشر.";
  all[idx].moderatedAt = new Date().toISOString();
  writeJSON(STORAGE_KEYS.properties, all);
}

// ---------- Threads ----------

export function getThreadsForUser(userId: string): Thread[] {
  ensureSeeded();
  const all = readJSON<Thread[]>(STORAGE_KEYS.threads, []);
  return all
    .filter((t) => t.ownerId === userId || t.renterId === userId)
    .sort((a, b) => +new Date(b.lastMessageAt) - +new Date(a.lastMessageAt));
}

export function getThread(id: string): Thread | undefined {
  ensureSeeded();
  return readJSON<Thread[]>(STORAGE_KEYS.threads, []).find((t) => t.id === id);
}

export function findOrCreateThread(propertyId: string, renterId: string): Thread {
  ensureSeeded();
  const property = getProperty(propertyId);
  if (!property) throw new Error("Property not found");
  const all = readJSON<Thread[]>(STORAGE_KEYS.threads, []);
  const existing = all.find((t) => t.propertyId === propertyId && t.renterId === renterId);
  if (existing) return existing;
  const thread: Thread = {
    id: `t-${Date.now()}`,
    propertyId,
    ownerId: property.ownerId,
    renterId,
    lastMessageAt: new Date().toISOString(),
    messages: [],
  };
  all.push(thread);
  writeJSON(STORAGE_KEYS.threads, all);
  return thread;
}

export function postMessage(threadId: string, senderId: string, body: string, type: Message["type"] = "text"): Message {
  ensureSeeded();
  const all = readJSON<Thread[]>(STORAGE_KEYS.threads, []);
  const t = all.find((x) => x.id === threadId);
  if (!t) throw new Error("Thread not found");
  const msg: Message = {
    id: `m-${Date.now()}`,
    threadId,
    senderId,
    body,
    createdAt: new Date().toISOString(),
    type,
  };
  t.messages.push(msg);
  t.lastMessageAt = msg.createdAt;
  t.unreadFor = senderId === t.ownerId ? t.renterId : t.ownerId;
  writeJSON(STORAGE_KEYS.threads, all);

  // Track response behavior for the trust engine (T-3).
  recordResponseEvent(t, senderId, msg.createdAt);
  return msg;
}

// ---------- Response events (T-3) ----------
// One event per thread: opened on the renter's first message, closed on the
// owner's first reply. Powers the real (computed) owner response rate.

function recordResponseEvent(thread: Thread, senderId: string, atISO: string): void {
  const all = readJSON<ResponseEvent[]>(STORAGE_KEYS.responseEvents, []);
  const existing = all.find((e) => e.threadId === thread.id);

  if (senderId === thread.renterId) {
    // Renter message — open an event if none exists yet for this thread.
    if (!existing) {
      all.push({
        id: `re-${Date.now()}`,
        ownerId: thread.ownerId,
        threadId: thread.id,
        firstRenterMessageAt: atISO,
      });
      writeJSON(STORAGE_KEYS.responseEvents, all);
    }
    return;
  }

  if (senderId === thread.ownerId && existing && !existing.firstOwnerReplyAt) {
    // Owner's first reply — close the event and refresh their trust.
    existing.firstOwnerReplyAt = atISO;
    writeJSON(STORAGE_KEYS.responseEvents, all);
    recomputeOwnerTrust(thread.ownerId);
  }
}

// % of an owner's first-message threads answered within the threshold (24h).
// Returns undefined when there's no signal yet (so trust uses a neutral value).
const RESPONSE_THRESHOLD_MS = 24 * 60 * 60 * 1000;

export function computeOwnerResponseRate(ownerId: string): number | undefined {
  const events = readJSON<ResponseEvent[]>(STORAGE_KEYS.responseEvents, []).filter(
    (e) => e.ownerId === ownerId,
  );
  if (events.length === 0) return undefined;
  const answeredFast = events.filter(
    (e) =>
      e.firstOwnerReplyAt &&
      +new Date(e.firstOwnerReplyAt) - +new Date(e.firstRenterMessageAt) <= RESPONSE_THRESHOLD_MS,
  ).length;
  return Math.round((answeredFast / events.length) * 100);
}

// ---------- Leads (viewing requests) ----------

export function getLeadsForOwner(ownerId: string): Lead[] {
  ensureSeeded();
  const props = getPropertiesByOwner(ownerId).map((p) => p.id);
  return readJSON<Lead[]>(STORAGE_KEYS.leads, []).filter((l) => props.includes(l.propertyId));
}

export function getLeadsForRenter(renterId: string): Lead[] {
  ensureSeeded();
  return readJSON<Lead[]>(STORAGE_KEYS.leads, []).filter((l) => l.renterId === renterId);
}

// ── Listing analytics (mock) ──
// Saves & leads are REAL (counted from stored data). Views are a deterministic
// pseudo-estimate derived from the listing id + its age, so the number is
// stable across reloads (not random jitter). Swap for real event tracking later.

export type ListingAnalytics = {
  propertyId: string;
  views: number;
  saves: number;
  leads: number;
  // Simple funnel conversion: leads / views.
  conversion: number; // 0–1
};

function stableHash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function estimatedViews(p: Property): number {
  const ageDays = Math.max(
    1,
    Math.floor((Date.now() - new Date(p.createdAt).getTime()) / 86400000),
  );
  // ~6–30 views/day baseline (stable per listing), accumulated over its age,
  // nudged up by trust. Capped so it stays believable.
  const perDay = 6 + (stableHash(p.id) % 25);
  const trustMult = 0.7 + (p.trust / 10) * 0.6; // 0.7–1.3
  return Math.min(9999, Math.round(perDay * ageDays * trustMult));
}

export function getListingAnalytics(propertyId: string): ListingAnalytics {
  ensureSeeded();
  const p = getProperty(propertyId);
  const views = p ? estimatedViews(p) : 0;
  const saves = readJSON<SavedListing[]>(STORAGE_KEYS.saved, []).filter(
    (s) => s.propertyId === propertyId,
  ).length;
  const leads = readJSON<Lead[]>(STORAGE_KEYS.leads, []).filter(
    (l) => l.propertyId === propertyId,
  ).length;
  return {
    propertyId,
    views,
    saves,
    leads,
    conversion: views > 0 ? leads / views : 0,
  };
}

// Aggregate analytics across all of an owner's listings.
export function getOwnerAnalytics(ownerId: string): {
  views: number;
  saves: number;
  leads: number;
  conversion: number;
  perListing: { property: Property; analytics: ListingAnalytics }[];
} {
  const listings = getPropertiesByOwner(ownerId);
  const perListing = listings.map((property) => ({
    property,
    analytics: getListingAnalytics(property.id),
  }));
  const views = perListing.reduce((s, x) => s + x.analytics.views, 0);
  const saves = perListing.reduce((s, x) => s + x.analytics.saves, 0);
  const leads = perListing.reduce((s, x) => s + x.analytics.leads, 0);
  return {
    views,
    saves,
    leads,
    conversion: views > 0 ? leads / views : 0,
    perListing,
  };
}

export function createLead(input: Omit<Lead, "id" | "createdAt" | "status">): Lead {
  ensureSeeded();
  const all = readJSON<Lead[]>(STORAGE_KEYS.leads, []);
  const lead: Lead = {
    ...input,
    id: `l-${Date.now()}`,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  all.push(lead);
  writeJSON(STORAGE_KEYS.leads, all);
  return lead;
}

export function updateLeadStatus(id: string, status: Lead["status"]) {
  ensureSeeded();
  const all = readJSON<Lead[]>(STORAGE_KEYS.leads, []);
  const idx = all.findIndex((l) => l.id === id);
  if (idx >= 0) {
    const lead = all[idx];
    lead.status = status;
    writeJSON(STORAGE_KEYS.leads, all);

    // A completed lead = the renter actually moved in → create a confirmed
    // tenancy (idempotent). This is what later lets the renter review the place
    // and the owner review the renter (two-sided trust, T-4).
    if (status === "completed") {
      const tenancies = readJSON<Tenancy[]>(STORAGE_KEYS.tenancies, []);
      const exists = tenancies.some(
        (t) => t.propertyId === lead.propertyId && t.userId === lead.renterId,
      );
      if (!exists) {
        tenancies.push({
          id: `ten-${Date.now()}`,
          propertyId: lead.propertyId,
          userId: lead.renterId,
          moveInDate: new Date().toISOString(),
          monthsLived: 0,
        });
        writeJSON(STORAGE_KEYS.tenancies, tenancies);
      }
    }
  }
}

// ---------- Users ----------

export function getUser(id: string): User | undefined {
  ensureSeeded();
  return readJSON<User[]>(STORAGE_KEYS.users, seedUsers).find((u) => u.id === id);
}

// Public-facing profile for an owner/landlord: derived from their account + the
// listings they own + reviews on those listings. Renter-only accounts (no
// listings) get a minimal profile. Phone is never included — it's private.
export type PublicProfile = {
  id: string;
  name: string;
  initials: string;
  verified: boolean;
  trust: number;
  trustBreakdown?: import("./types").TrustBreakdown; // computed owner-trust explainability
  responseRate?: number;
  memberSince: string; // ISO
  isOwner: boolean;
  listings: Property[];
  reviews: { review: import("./types").Review; property: Property }[];
  totalReviews: number;
  avgRating?: number;
};

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2);
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function getPublicProfile(id: string): PublicProfile | undefined {
  ensureSeeded();
  const listings = getPropertiesByOwner(id).filter((p) => p.status === "published");
  const account = getUser(id);
  // Fall back to landlord info embedded in listings when there's no user row
  // (seed listings reference landlords that may not have full user records).
  const landlord = listings[0]?.landlord;
  if (!account && !landlord) return undefined;

  const name = account?.name ?? landlord?.name ?? "صاحب البيت";
  const reviews = listings.flatMap((property) =>
    property.reviews.map((review) => ({ review, property })),
  );
  const totalReviews = reviews.length;
  const avgRating = totalReviews
    ? reviews.reduce((s, r) => s + r.review.rating, 0) / totalReviews
    : undefined;

  return {
    id,
    name,
    initials: account ? initialsOf(name) : landlord?.initials ?? initialsOf(name),
    verified: account?.verified ?? landlord?.verified ?? false,
    trust: landlord?.trust ?? account?.trust ?? 6.5,
    trustBreakdown: account?.trustBreakdown,
    responseRate: account?.responseRate ?? landlord?.responseRate,
    memberSince: account?.createdAt ?? listings[0]?.createdAt ?? new Date().toISOString(),
    isOwner: listings.length > 0,
    listings,
    reviews,
    totalReviews,
    avgRating,
  };
}

// ── Occupant ↔ account linking (privacy-safe, consent-based) ──
// We deliberately do NOT offer a browse/search over users: substring search by
// name or partial phone let any owner enumerate the user base and harvest phone
// numbers. Instead an owner *invites* their tenant by exact full phone number,
// we never reveal whether an account exists or who owns the number, and the
// link only becomes real once the renter confirms it.

function normalizePhone(raw: string): string {
  const d = raw.replace(/\D/g, "");
  // 01XXXXXXXXX (11 digits) or 201XXXXXXXXX (12, with country code)
  if (d.length === 12 && d.startsWith("20")) return "+" + d;
  if (d.length === 11 && d.startsWith("01")) return "+20" + d.slice(1);
  return "";
}

function findUserByExactPhone(phone: string): User | undefined {
  const target = normalizePhone(phone);
  if (!target) return undefined;
  return readJSON<User[]>(STORAGE_KEYS.users, seedUsers).find(
    (u) => normalizePhone(u.phone) === target,
  );
}

// Owner invites a tenant to link their Beitco account by exact phone.
// Returns only whether the input was a valid phone — never whether an account
// exists (no existence oracle). If an account exists, the caller stores the
// occupant link as `pending` and the renter is notified to confirm.
export function resolveInvitePhone(phone: string): { valid: boolean; userId?: string } {
  const normalized = normalizePhone(phone);
  if (!normalized) return { valid: false };
  const u = findUserByExactPhone(phone);
  // userId is used internally to create the pending link; it is NOT surfaced to
  // the owner along with any profile data.
  return { valid: true, userId: u?.id };
}

// Context for a renter to confirm/decline an owner's link request.
export type PendingOccupantLink = {
  propertyId: string;
  propertyTitle: string;
  ownerName: string;
  unitLabel: string;
  moveInDate?: string;
  ref:
    | { kind: "whole" }
    | { kind: "room"; roomId: string }
    | { kind: "bed"; roomId: string; bedId: string };
};

export function getPendingOccupantLinks(userId: string): PendingOccupantLink[] {
  ensureSeeded();
  const out: PendingOccupantLink[] = [];
  for (const p of getAllProperties()) {
    const base = { propertyId: p.id, propertyTitle: p.title, ownerName: p.landlord.name };
    if (p.wholeOccupant?.userId === userId && p.wholeOccupant.linkStatus === "pending") {
      out.push({ ...base, unitLabel: "الشقة", moveInDate: p.wholeOccupant.moveInDate, ref: { kind: "whole" } });
    }
    for (const room of p.rooms ?? []) {
      if (room.occupant?.userId === userId && room.occupant.linkStatus === "pending") {
        out.push({ ...base, unitLabel: room.name, moveInDate: room.occupant.moveInDate, ref: { kind: "room", roomId: room.id } });
      }
      for (const bed of room.beds ?? []) {
        if (bed.occupant?.userId === userId && bed.occupant.linkStatus === "pending") {
          out.push({ ...base, unitLabel: bed.label, moveInDate: bed.occupant.moveInDate, ref: { kind: "bed", roomId: room.id, bedId: bed.id } });
        }
      }
    }
  }
  return out;
}

// Renter confirms or declines a pending link. Confirming creates a tenancy
// (so the renter can later review). Declining clears the account link but keeps
// the owner's private free-text notes about the tenant.
export function resolveOccupantLink(
  userId: string,
  link: Pick<PendingOccupantLink, "propertyId" | "ref">,
  action: "confirm" | "decline",
): void {
  const all = getAllProperties();
  const idx = all.findIndex((p) => p.id === link.propertyId);
  if (idx < 0) return;
  const p = all[idx];

  const apply = (occ: import("./types").Occupant | undefined): import("./types").Occupant | undefined => {
    if (!occ || occ.userId !== userId || occ.linkStatus !== "pending") return occ;
    if (action === "confirm") return { ...occ, linkStatus: "confirmed" };
    // decline: drop the account link, keep owner's private notes
    const { userId: _u, linkStatus: _l, ...rest } = occ;
    return rest;
  };

  if (link.ref.kind === "whole") {
    p.wholeOccupant = apply(p.wholeOccupant);
  } else if (link.ref.kind === "room") {
    const { roomId } = link.ref;
    p.rooms = (p.rooms ?? []).map((r) =>
      r.id === roomId ? { ...r, occupant: apply(r.occupant) } : r,
    );
  } else {
    const { roomId, bedId } = link.ref;
    p.rooms = (p.rooms ?? []).map((r) =>
      r.id === roomId
        ? { ...r, beds: r.beds.map((b) => (b.id === bedId ? { ...b, occupant: apply(b.occupant) } : b)) }
        : r,
    );
  }

  all[idx] = p;
  writeJSON(STORAGE_KEYS.properties, all);

  // On confirm, create a tenancy if one doesn't already exist for this property.
  if (action === "confirm") {
    const tenancies = readJSON<Tenancy[]>(STORAGE_KEYS.tenancies, []);
    if (!tenancies.some((t) => t.userId === userId && t.propertyId === link.propertyId)) {
      tenancies.push({
        id: `ten-${Date.now()}`,
        propertyId: link.propertyId,
        userId,
        moveInDate: new Date().toISOString(),
        monthsLived: 0,
      });
      writeJSON(STORAGE_KEYS.tenancies, tenancies);
    }
  }
}

// Upsert a user record (and keep the active session in sync).
export function saveUser(user: User) {
  ensureSeeded();
  const all = readJSON<User[]>(STORAGE_KEYS.users, seedUsers);
  const idx = all.findIndex((u) => u.id === user.id);
  if (idx >= 0) all[idx] = user;
  else all.push(user);
  writeJSON(STORAGE_KEYS.users, all);
  // If editing the logged-in user, refresh the cached session copy too.
  if (isBrowser) {
    const curRaw = localStorage.getItem("beitco:currentUser");
    if (curRaw) {
      try {
        const cur = JSON.parse(curRaw) as User;
        if (cur.id === user.id) localStorage.setItem("beitco:currentUser", JSON.stringify(user));
      } catch {
        /* ignore */
      }
    }
  }
}

export function updateUserProfile(userId: string, profile: RenterProfile): User | undefined {
  const u = getUser(userId);
  if (!u) return undefined;
  const updated: User = { ...u, profile: { ...profile, updatedAt: new Date().toISOString() } };
  saveUser(updated);
  return updated;
}

// ---------- Verification ----------
// `verified` is the legacy boolean; `verificationStatus` adds the pending state.
export function getVerificationStatus(u: Pick<User, "verified" | "verificationStatus">): VerificationStatus {
  return u.verificationStatus ?? (u.verified ? "verified" : "unverified");
}

// Submit account for verification (mock — in production this uploads docs for review).
export function submitVerification(userId: string): User | undefined {
  const u = getUser(userId);
  if (!u) return undefined;
  const updated: User = { ...u, verificationStatus: "pending" };
  saveUser(updated);
  return updated;
}

// ---------- Notifications (derived) ----------
// We don't store a notification table; we derive a feed from existing activity
// (leads, unread threads, review eligibility, verification). Read-state is a
// single per-user "last seen" timestamp used to compute the unread count.

export type AppNotification = {
  id: string;
  type: "lead" | "message" | "review" | "verification" | "link";
  title: string;
  body: string;
  date: string; // ISO
  propertyId?: string;
  threadId?: string;
};

const KEY_NOTIF_SEEN = "beitco:notifSeen:";

export function getNotificationsForUser(userId: string): AppNotification[] {
  ensureSeeded();
  const u = getUser(userId);
  if (!u) return [];
  const out: AppNotification[] = [];

  // Owner: new viewing requests (leads) on their listings.
  if (u.role === "owner" || u.role === "both") {
    for (const lead of getLeadsForOwner(userId)) {
      if (lead.status !== "pending") continue;
      const p = getProperty(lead.propertyId);
      out.push({
        id: `lead-${lead.id}`,
        type: "lead",
        title: "طلب معاينة جديد",
        body: `${lead.renterName} عايز يعاين «${p?.title ?? "شقتك"}»`,
        date: lead.createdAt,
        propertyId: lead.propertyId,
      });
    }
  }

  // Both sides: threads with unread messages for me.
  for (const t of getThreadsForUser(userId)) {
    if (t.unreadFor !== userId) continue;
    const p = getProperty(t.propertyId);
    const last = t.messages[t.messages.length - 1];
    out.push({
      id: `msg-${t.id}`,
      type: "message",
      title: "رسالة جديدة",
      body: last?.body?.slice(0, 80) ?? `محادثة عن «${p?.title ?? "شقة"}»`,
      date: t.lastMessageAt,
      threadId: t.id,
    });
  }

  // Renter: tenancies that just became review-eligible (≥30 days).
  for (const ten of getTenanciesForUser(userId)) {
    if (!canUserReview(userId, ten.propertyId)) continue;
    const p = getProperty(ten.propertyId);
    out.push({
      id: `rev-${ten.id}`,
      type: "review",
      title: "تقدر تكتب رأيك دلوقتي",
      body: `عدّى 30 يوم على سكنك في «${p?.title ?? "المكان"}» — رأيك بيساعد ناس كتير.`,
      date: ten.moveInDate,
      propertyId: ten.propertyId,
    });
  }

  // Renter: an owner asked to link this account to a unit (needs consent).
  for (const link of getPendingOccupantLinks(userId)) {
    out.push({
      id: `link-${link.propertyId}-${JSON.stringify(link.ref)}`,
      type: "link",
      title: "صاحب شقة سجّلك ساكن",
      body: `${link.ownerName} سجّلك في «${link.unitLabel}» بـ«${link.propertyTitle}». أكّد لو ده صح.`,
      date: new Date().toISOString(),
      propertyId: link.propertyId,
    });
  }

  // Verification status updates.
  const status = getVerificationStatus(u);
  if (status === "verified") {
    out.push({
      id: "verif-done",
      type: "verification",
      title: "حسابك اتوثّق ✅",
      body: "مبروك! دلوقتي عندك علامة موثّق وبتظهر للناس بثقة أكتر.",
      date: u.createdAt,
    });
  } else if (status === "pending") {
    out.push({
      id: "verif-pending",
      type: "verification",
      title: "طلب التوثيق بيتراجع",
      body: "استلمنا مستنداتك وبنراجعها. هنبلّغك أول ما يخلص.",
      date: u.createdAt,
    });
  }

  return out.sort((a, b) => +new Date(b.date) - +new Date(a.date));
}

export function getLastSeenNotifications(userId: string): number {
  if (!isBrowser) return 0;
  const raw = localStorage.getItem(KEY_NOTIF_SEEN + userId);
  return raw ? Number(raw) : 0;
}

export function getUnreadNotificationCount(userId: string): number {
  const seen = getLastSeenNotifications(userId);
  return getNotificationsForUser(userId).filter((n) => +new Date(n.date) > seen).length;
}

export function markNotificationsSeen(userId: string) {
  if (!isBrowser) return;
  localStorage.setItem(KEY_NOTIF_SEEN + userId, String(Date.now()));
}

// 0–100 measure of how filled-in a renter profile is — drives the "complete your profile" nudge.
const PROFILE_FIELDS: (keyof RenterProfile)[] = [
  "budgetMax",
  "areas",
  "lookingFor",
  "moveInBy",
  "mustHaveAmenities",
  "nearMetro",
  "furnishedPref",
  "occupation",
  "bio",
];

export function profileCompleteness(profile?: RenterProfile): number {
  if (!profile) return 0;
  let filled = 0;
  for (const f of PROFILE_FIELDS) {
    const v = profile[f];
    if (Array.isArray(v) ? v.length > 0 : v !== undefined && v !== null && v !== "") filled += 1;
  }
  return Math.round((filled / PROFILE_FIELDS.length) * 100);
}

// ---------- Matching engine ----------
// The pure scoring logic lives in `./matching` (testable in isolation). Here we
// only do the storage-bound part: pick the right inventory and rank it.

export function getMatchesForUser(
  userId: string,
  limit = 24,
): { property: Property; match: MatchResult }[] {
  const u = getUser(userId);
  if (!u?.profile) return [];
  // Match by intent: buyers see for-sale listings, renters see rentals.
  const wantSale = (u.profile.intent ?? "rent") === "buy";
  return getPublishedProperties()
    .filter((property) => ((property.listingType ?? "rent") === "sale") === wantSale)
    .map((property) => ({ property, match: scoreMatch(property, u.profile!) }))
    .filter(({ match }) => match.eligible)
    .sort((a, b) => b.match.score - a.match.score)
    .slice(0, limit);
}

// ---------- Tenancies (review eligibility) ----------

export function getTenanciesForUser(userId: string): Tenancy[] {
  ensureSeeded();
  return readJSON<Tenancy[]>(STORAGE_KEYS.tenancies, []).filter((t) => t.userId === userId);
}

export function canUserReview(userId: string, propertyId: string): boolean {
  const tenancies = getTenanciesForUser(userId);
  return tenancies.some((t) => {
    if (t.propertyId !== propertyId) return false;
    const moveIn = new Date(t.moveInDate);
    const daysSince = (Date.now() - +moveIn) / (1000 * 60 * 60 * 24);
    return daysSince >= 30;
  });
}

// ---------- Renter reputation (two-sided trust, T-4) ----------
// Owners review renters they've actually hosted (a confirmed tenancy). The
// reputation SCORE is visible to owners on leads, but the individual review
// TEXT from other owners is never exposed (anti-retaliation) — TRUST_SPEC §6.

export function getRenterReviews(renterId: string): RenterReview[] {
  ensureSeeded();
  return readJSON<RenterReview[]>(STORAGE_KEYS.renterReviews, [])
    .filter((r) => r.renterId === renterId)
    .sort((a, b) => +new Date(b.createdAtISO ?? b.date) - +new Date(a.createdAtISO ?? a.date));
}

// The renter's most recent confirmed tenancy at any property this owner owns.
export function getOwnerRenterTenancy(ownerId: string, renterId: string): Tenancy | undefined {
  const ownerPropIds = new Set(getPropertiesByOwner(ownerId).map((p) => p.id));
  return readJSON<Tenancy[]>(STORAGE_KEYS.tenancies, [])
    .filter((t) => t.userId === renterId && ownerPropIds.has(t.propertyId))
    .sort((a, b) => +new Date(b.moveInDate) - +new Date(a.moveInDate))[0];
}

// An owner may review a renter once per confirmed tenancy between them.
export function canOwnerReviewRenter(ownerId: string, renterId: string): boolean {
  if (ownerId === renterId) return false;
  const tenancy = getOwnerRenterTenancy(ownerId, renterId);
  if (!tenancy) return false;
  return !readJSON<RenterReview[]>(STORAGE_KEYS.renterReviews, []).some(
    (r) => r.tenancyId === tenancy.id && r.ownerId === ownerId,
  );
}

// Recompute + persist a renter's reputation from all owner reviews of them.
function recomputeRenterReputation(renterId: string): void {
  const reviews = readJSON<RenterReview[]>(STORAGE_KEYS.renterReviews, []).filter(
    (r) => r.renterId === renterId,
  );
  const renter = getUser(renterId);
  if (!renter) return;
  if (reviews.length === 0) {
    renter.renterReputation = undefined;
    renter.renterReviewsCount = 0;
  } else {
    const { score, count } = computeRenterReputation(reviews.map((r) => r.rating));
    renter.renterReputation = score;
    renter.renterReviewsCount = count;
  }
  saveUser(renter);
}

export type RenterReviewInput = {
  rating: number;
  body: string;
  scores: { reliability: number; cleanliness: number; communication: number };
};

export function postRenterReview(
  ownerId: string,
  renterId: string,
  input: RenterReviewInput,
): RenterReview | undefined {
  const tenancy = getOwnerRenterTenancy(ownerId, renterId);
  if (!tenancy) return undefined;
  const now = new Date();
  const review: RenterReview = {
    id: `rr-${Date.now()}`,
    tenancyId: tenancy.id,
    renterId,
    ownerId,
    propertyId: tenancy.propertyId,
    rating: input.rating,
    scores: input.scores,
    body: input.body,
    date: now.toLocaleDateString("ar-EG-u-nu-latn", { year: "numeric", month: "long" }),
    createdAtISO: now.toISOString(),
  };
  const all = readJSON<RenterReview[]>(STORAGE_KEYS.renterReviews, []);
  all.unshift(review);
  writeJSON(STORAGE_KEYS.renterReviews, all);
  recomputeRenterReputation(renterId);
  return review;
}

// Reputation for display: prefers the persisted value, else computes on the fly.
export function getRenterReputation(
  renterId: string,
): { score: number; count: number } | undefined {
  const reviews = readJSON<RenterReview[]>(STORAGE_KEYS.renterReviews, []).filter(
    (r) => r.renterId === renterId,
  );
  if (reviews.length === 0) return undefined;
  return computeRenterReputation(reviews.map((r) => r.rating));
}

// ---------- Saved listings ----------

export function getSavedForUser(userId: string): string[] {
  ensureSeeded();
  return readJSON<SavedListing[]>(STORAGE_KEYS.saved, [])
    .filter((s) => s.userId === userId)
    .map((s) => s.propertyId);
}

export function toggleSaved(userId: string, propertyId: string): boolean {
  ensureSeeded();
  const all = readJSON<SavedListing[]>(STORAGE_KEYS.saved, []);
  const idx = all.findIndex((s) => s.userId === userId && s.propertyId === propertyId);
  if (idx >= 0) {
    all.splice(idx, 1);
    writeJSON(STORAGE_KEYS.saved, all);
    return false;
  }
  all.push({ userId, propertyId, savedAt: new Date().toISOString() });
  writeJSON(STORAGE_KEYS.saved, all);
  return true;
}

// ---------- Saved searches (FE-6) ----------
// A renter saves a filter set ("أوضة في المعادي تحت 6000") to revisit later.
// Prototype = localStorage; the same shape will back email/push alerts later.

const fmtEGP = (n: number) => n.toLocaleString("ar-EG-u-nu-latn");

// Build a human, Egyptian-dialect label from the filter set.
export function describeSavedSearch(p: SavedSearchParams): string {
  const parts: string[] = [];
  if (p.purpose === "sale") parts.push("للبيع");
  parts.push(p.type ?? "سكن");
  if (p.area) parts.push(`في ${p.area}`);
  else if (p.q) parts.push(`«${p.q}»`);

  if (p.minPrice != null && p.maxPrice != null)
    parts.push(`بين ${fmtEGP(p.minPrice)} و${fmtEGP(p.maxPrice)}`);
  else if (p.maxPrice != null) parts.push(`تحت ${fmtEGP(p.maxPrice)}`);
  else if (p.minPrice != null) parts.push(`فوق ${fmtEGP(p.minPrice)}`);

  if (p.gender === "male_only") parts.push("· شباب");
  if (p.gender === "female_only") parts.push("· بنات");
  if (p.freeOnly) parts.push("· فاضية");
  if (p.verifiedOnly) parts.push("· موثّقة");
  return parts.join(" ");
}

// Strip empty/undefined values so two equivalent searches compare equal.
function normalizeSearchParams(p: SavedSearchParams): SavedSearchParams {
  const out: SavedSearchParams = {};
  if (p.q?.trim()) out.q = p.q.trim();
  if (p.type) out.type = p.type;
  if (p.purpose) out.purpose = p.purpose;
  if (p.gender) out.gender = p.gender;
  if (p.area?.trim()) out.area = p.area.trim();
  if (p.freeOnly) out.freeOnly = true;
  if (p.verifiedOnly) out.verifiedOnly = true;
  if (p.minPrice != null) out.minPrice = p.minPrice;
  if (p.maxPrice != null) out.maxPrice = p.maxPrice;
  if (p.sort) out.sort = p.sort;
  return out;
}

function sameSearch(a: SavedSearchParams, b: SavedSearchParams): boolean {
  const ka = normalizeSearchParams(a);
  const kb = normalizeSearchParams(b);
  // Sort is a view preference, not part of the search identity.
  delete ka.sort;
  delete kb.sort;
  return JSON.stringify(ka) === JSON.stringify(kb);
}

export function getSavedSearches(userId: string): SavedSearch[] {
  ensureSeeded();
  return readJSON<SavedSearch[]>(STORAGE_KEYS.savedSearches, [])
    .filter((s) => s.userId === userId)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

// Whether the user already saved an equivalent search (ignoring sort).
export function hasSavedSearch(userId: string, params: SavedSearchParams): boolean {
  return getSavedSearches(userId).some((s) => sameSearch(s.params, params));
}

// Save a search; returns the record. No-op (returns existing) if a duplicate.
export function saveSearch(userId: string, params: SavedSearchParams): SavedSearch {
  ensureSeeded();
  const clean = normalizeSearchParams(params);
  const all = readJSON<SavedSearch[]>(STORAGE_KEYS.savedSearches, []);
  const existing = all.find((s) => s.userId === userId && sameSearch(s.params, clean));
  if (existing) return existing;
  const rec: SavedSearch = {
    id: `ss-${Date.now()}`,
    userId,
    label: describeSavedSearch(clean),
    params: clean,
    createdAt: new Date().toISOString(),
  };
  all.push(rec);
  writeJSON(STORAGE_KEYS.savedSearches, all);
  return rec;
}

export function deleteSavedSearch(userId: string, id: string): void {
  ensureSeeded();
  const all = readJSON<SavedSearch[]>(STORAGE_KEYS.savedSearches, []).filter(
    (s) => !(s.userId === userId && s.id === id),
  );
  writeJSON(STORAGE_KEYS.savedSearches, all);
}

// ---------- Trust engine (T-1) ----------
// Recompute and persist explainable trust. The pure formulas live in `trust.ts`;
// here we read activity from storage, apply them, and write results back to the
// listing (quality + trust + breakdown) and the owner (trust + the denormalized
// `landlord` object on each of their listings). Runs on seed and after any
// trust-moving action (new review, verification change).

// Response rate fed to the engine. Source of truth is real behavior (response
// events, T-3); falls back to the owner record, then the denormalized landlord
// value on the listing (seed), then undefined (neutral).
function ownerResponseRate(owner: User | undefined, p: Property): number | undefined {
  if (owner) {
    const computed = computeOwnerResponseRate(owner.id);
    if (computed != null) return computed;
    if (typeof owner.responseRate === "number") return owner.responseRate;
  }
  return p.landlord?.responseRate;
}

// The response rate to persist on an owner: real events first, else any existing
// value, else the seed value carried on one of their listings.
function effectiveOwnerResponseRate(owner: User, listings: Property[]): number | undefined {
  const computed = computeOwnerResponseRate(owner.id);
  if (computed != null) return computed;
  if (typeof owner.responseRate === "number") return owner.responseRate;
  return listings.find((l) => typeof l.landlord?.responseRate === "number")?.landlord
    ?.responseRate;
}

// Mutate a property in place with freshly computed quality + trust.
function applyListingTrust(p: Property, owner: User | undefined): void {
  p.quality = computeQualityFromReviews(p.reviews, p.quality);
  p.internet = p.quality.internet; // keep the card shortcut in sync
  const breakdown = computeListingTrust({
    verified: p.verified,
    reviews: p.reviews,
    responseRate: ownerResponseRate(owner, p),
  });
  p.trust = breakdown.score;
  p.trustBreakdown = breakdown;
}

// Mutate an owner + the landlord snapshot on each of their listings.
function applyOwnerTrust(owner: User, listings: Property[]): void {
  // Persist the real (event-derived) response rate so it's the source of truth.
  owner.responseRate = effectiveOwnerResponseRate(owner, listings);
  const breakdown = computeOwnerTrust({
    verified: owner.verified,
    listingTrusts: listings.map((l) => l.trust),
    responseRate: owner.responseRate,
    accountCreatedAt: owner.createdAt,
  });
  owner.trust = breakdown.score;
  owner.trustBreakdown = breakdown;
  for (const l of listings) {
    l.landlord = {
      ...l.landlord,
      trust: owner.trust,
      verified: owner.verified,
      responseRate:
        typeof owner.responseRate === "number" ? owner.responseRate : l.landlord.responseRate,
    };
  }
}

// Recompute everything (used on seed / version refresh). Uses readJSON/writeJSON
// directly so it never recurses through ensureSeeded.
function recomputeAllTrust(): void {
  const props = readJSON<Property[]>(STORAGE_KEYS.properties, []);
  const users = readJSON<User[]>(STORAGE_KEYS.users, seedUsers);
  const userById = new Map(users.map((u) => [u.id, u]));

  const byOwner = new Map<string, Property[]>();
  for (const p of props) {
    const arr = byOwner.get(p.ownerId) ?? [];
    arr.push(p);
    byOwner.set(p.ownerId, arr);
  }

  // Pre-pass: persist each owner's real response rate so both passes are consistent.
  for (const u of users) u.responseRate = effectiveOwnerResponseRate(u, byOwner.get(u.id) ?? []);

  // Pass 1: listing trust (reads owner.responseRate).
  for (const p of props) applyListingTrust(p, userById.get(p.ownerId));

  // Pass 2: owner trust (aggregates the freshly computed listing trusts).
  for (const u of users) applyOwnerTrust(u, byOwner.get(u.id) ?? []);

  writeJSON(STORAGE_KEYS.properties, props);
  writeJSON(STORAGE_KEYS.users, users);
}

// Seed believable response events for demo owners so the computed response rate
// (and the trust it feeds) is genuinely event-derived, not a hardcoded number.
// Reproduces each owner's seed `landlord.responseRate` as N past threads.
function seedResponseEvents(): void {
  const props = readJSON<Property[]>(STORAGE_KEYS.properties, seedProperties);
  const ownerRate = new Map<string, number>();
  for (const p of props) {
    if (!ownerRate.has(p.ownerId) && typeof p.landlord?.responseRate === "number") {
      ownerRate.set(p.ownerId, p.landlord.responseRate);
    }
  }
  const TOTAL = 25; // virtual past threads per owner (fine-grained rate fidelity)
  const events: ResponseEvent[] = [];
  let seq = 0;
  for (const [ownerId, rate] of ownerRate) {
    const fast = Math.round((rate / 100) * TOTAL);
    for (let i = 0; i < TOTAL; i++) {
      const start = new Date(Date.now() - (i + 1) * 86400000).toISOString();
      const answeredFast = i < fast; // first `fast` answered within 2h, rest at 48h
      events.push({
        id: `re-seed-${ownerId}-${seq++}`,
        ownerId,
        threadId: `seed-thread-${ownerId}-${i}`,
        firstRenterMessageAt: start,
        firstOwnerReplyAt: new Date(
          +new Date(start) + (answeredFast ? 2 : 48) * 3600000,
        ).toISOString(),
      });
    }
  }
  writeJSON(STORAGE_KEYS.responseEvents, events);
}

// Seed a few confirmed tenancies + owner→renter reviews so demo renters have a
// real (computed) reputation that shows on leads. Owners review renters they
// actually hosted; reputation is the Bayesian-smoothed average of those ratings.
function seedRenterReviews(): void {
  const props = readJSON<Property[]>(STORAGE_KEYS.properties, seedProperties);
  const ownerOf = (propertyId: string) => props.find((p) => p.id === propertyId)?.ownerId;

  // (renterId, propertyId, rating, scores, body)
  const specs: {
    renterId: string;
    propertyId: string;
    rating: number;
    scores: { reliability: number; cleanliness: number; communication: number };
    body: string;
  }[] = [
    {
      renterId: "u-renter-ahmed",
      propertyId: "1",
      rating: 9,
      scores: { reliability: 9, cleanliness: 9, communication: 8 },
      body: "ساكن محترم، بيدفع في معاده وسايب الأوضة نضيفة. أرشّحه لأي حد.",
    },
    {
      renterId: "u-renter-ahmed",
      propertyId: "3",
      rating: 9,
      scores: { reliability: 10, cleanliness: 8, communication: 9 },
      body: "تعامل راقي طول مدة الإيجار، ملوش أي مشاكل.",
    },
    {
      renterId: "u-renter-omar",
      propertyId: "2",
      rating: 8,
      scores: { reliability: 8, cleanliness: 8, communication: 8 },
      body: "كويس وملتزم، بيرد بسرعة وبيحافظ على المكان.",
    },
    {
      renterId: "u-renter-sara",
      propertyId: "5",
      rating: 9,
      scores: { reliability: 9, cleanliness: 10, communication: 9 },
      body: "من أحسن الساكنين اللي مرّوا عليّا — نضيفة ومنظّمة وبتحترم المواعيد.",
    },
    {
      renterId: "u-renter-mona",
      propertyId: "4",
      rating: 6,
      scores: { reliability: 6, cleanliness: 7, communication: 5 },
      body: "كويسة بس اتأخرت في الإيجار مرتين، غير كده مفيش مشاكل.",
    },
  ];

  const tenancies = readJSON<Tenancy[]>(STORAGE_KEYS.tenancies, []);
  const reviews: RenterReview[] = [];
  let seq = 0;
  for (const s of specs) {
    const ownerId = ownerOf(s.propertyId);
    if (!ownerId) continue;
    const tenancyId = `ten-seed-${s.renterId}-${s.propertyId}`;
    if (!tenancies.some((t) => t.id === tenancyId)) {
      const monthsAgo = 4 + (seq % 6);
      tenancies.push({
        id: tenancyId,
        propertyId: s.propertyId,
        userId: s.renterId,
        moveInDate: new Date(Date.now() - monthsAgo * 30 * 86400000).toISOString(),
        moveOutDate: new Date(Date.now() - 14 * 86400000).toISOString(),
        monthsLived: monthsAgo,
      });
    }
    reviews.push({
      id: `rr-seed-${seq++}`,
      tenancyId,
      renterId: s.renterId,
      ownerId,
      propertyId: s.propertyId,
      rating: s.rating,
      scores: s.scores,
      body: s.body,
      date: new Date(Date.now() - 10 * 86400000).toLocaleDateString("ar-EG-u-nu-latn", {
        year: "numeric",
        month: "long",
      }),
      createdAtISO: new Date(Date.now() - 10 * 86400000).toISOString(),
    });
  }
  writeJSON(STORAGE_KEYS.tenancies, tenancies);
  writeJSON(STORAGE_KEYS.renterReviews, reviews);

  // Persist each reviewed renter's computed reputation onto their user record.
  const users = readJSON<User[]>(STORAGE_KEYS.users, seedUsers);
  const byRenter = new Map<string, number[]>();
  for (const r of reviews) {
    const arr = byRenter.get(r.renterId) ?? [];
    arr.push(r.rating);
    byRenter.set(r.renterId, arr);
  }
  for (const u of users) {
    const ratings = byRenter.get(u.id);
    if (ratings && ratings.length) {
      const { score, count } = computeRenterReputation(ratings);
      u.renterReputation = score;
      u.renterReviewsCount = count;
    }
  }
  writeJSON(STORAGE_KEYS.users, users);
}

// Seed the moderation queue (MOD-1): a couple of listings from a NEW, unverified
// owner that are waiting on approval, so the admin queue isn't empty in the demo.
function seedModerationQueue(): void {
  const all = readJSON<Property[]>(STORAGE_KEYS.properties, seedProperties);
  // Don't double-seed.
  if (all.some((p) => p.id.startsWith("pending-"))) return;

  const base = all.find((p) => p.id === "1");
  if (!base) return;

  const pendingOwner = {
    id: "u-newowner",
    name: "إسلام ر.",
    initials: "إ.ر",
    trust: 5.0,
    responseRate: 0,
    verified: false,
  };

  const drafts: { id: string; title: string; area: string; address: string; price: number }[] = [
    {
      id: "pending-1",
      title: "شقة جديدة في مدينة نصر مستنية الموافقة",
      area: "القاهرة · مدينة نصر",
      address: "شارع مكرم عبيد، مدينة نصر، القاهرة",
      price: 12000,
    },
    {
      id: "pending-2",
      title: "أوضة للإيجار في فيصل — لسه بتتراجع",
      area: "الجيزة · فيصل",
      address: "شارع فيصل الرئيسي، الجيزة",
      price: 4500,
    },
  ];

  for (const d of drafts) {
    all.push({
      ...base,
      id: d.id,
      ownerId: pendingOwner.id,
      title: d.title,
      area: d.area,
      address: d.address,
      status: "pending_approval",
      price: d.price,
      priceFrom: d.price,
      wholePrice: d.price,
      trust: 5.0,
      verified: false,
      reviewsCount: 0,
      residents: 0,
      reviews: [],
      qa: [],
      trustBreakdown: undefined,
      rejectionReason: undefined,
      moderatedAt: undefined,
      landlord: { ...pendingOwner },
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    });
  }

  writeJSON(STORAGE_KEYS.properties, all);

  // Make sure the unverified owner exists as a user so their dashboard works.
  const users = readJSON<User[]>(STORAGE_KEYS.users, seedUsers);
  if (!users.some((u) => u.id === pendingOwner.id)) {
    users.push({
      id: pendingOwner.id,
      phone: "+201234567890",
      name: pendingOwner.name,
      role: "owner",
      trust: 5.0,
      verified: false,
      verificationStatus: "unverified",
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    });
    writeJSON(STORAGE_KEYS.users, users);
  }
}

export function recomputeOwnerTrust(ownerId: string): void {
  const owner = getUser(ownerId);
  if (!owner) return;
  const props = getAllProperties();
  const listings = props.filter((p) => p.ownerId === ownerId);
  applyOwnerTrust(owner, listings);
  saveUser(owner);
  writeJSON(STORAGE_KEYS.properties, props);
}

// Recompute a single listing + its owner after a trust-moving action.
export function recomputeListingTrust(propertyId: string): void {
  const props = getAllProperties();
  const p = props.find((x) => x.id === propertyId);
  if (!p) return;
  applyListingTrust(p, getUser(p.ownerId));
  writeJSON(STORAGE_KEYS.properties, props);
  recomputeOwnerTrust(p.ownerId);
}

// ---------- Reviews ----------

export function postReview(
  propertyId: string,
  review: Omit<import("./types").Review, "id" | "propertyId" | "date">,
) {
  const all = getAllProperties();
  const idx = all.findIndex((p) => p.id === propertyId);
  if (idx < 0) return;
  const newReview: import("./types").Review = {
    ...review,
    id: `r-${Date.now()}`,
    propertyId,
    date: new Date().toLocaleDateString("ar-EG-u-nu-latn", { year: "numeric", month: "long" }),
    createdAtISO: new Date().toISOString(),
  };
  all[idx].reviews.unshift(newReview);
  all[idx].reviewsCount += 1;
  writeJSON(STORAGE_KEYS.properties, all);

  // The whole point of the wedge: a real review moves the score.
  recomputeListingTrust(propertyId);
}

// ---------- Q&A ----------

export function postQuestion(propertyId: string, asker: string, q: string) {
  const all = getAllProperties();
  const idx = all.findIndex((p) => p.id === propertyId);
  if (idx < 0) return;
  all[idx].qa.unshift({
    id: `q-${Date.now()}`,
    propertyId,
    asker,
    q,
    date: new Date().toLocaleDateString("ar-EG-u-nu-latn"),
  });
  writeJSON(STORAGE_KEYS.properties, all);
}

export function answerQuestion(propertyId: string, qaId: string, answerer: string, a: string) {
  const all = getAllProperties();
  const idx = all.findIndex((p) => p.id === propertyId);
  if (idx < 0) return;
  const qaIdx = all[idx].qa.findIndex((q) => q.id === qaId);
  if (qaIdx < 0) return;
  all[idx].qa[qaIdx].answerer = answerer;
  all[idx].qa[qaIdx].a = a;
  writeJSON(STORAGE_KEYS.properties, all);
}

// Toggle a "مفيد" vote on a review. We track which reviews a user voted on in a
// per-user local set so the count doesn't double-increment.
const KEY_HELPFUL = "beitco:helpfulVotes:";

export function hasVotedHelpful(userId: string, reviewId: string): boolean {
  if (!isBrowser) return false;
  const raw = localStorage.getItem(KEY_HELPFUL + userId);
  return raw ? (JSON.parse(raw) as string[]).includes(reviewId) : false;
}

export function toggleReviewHelpful(userId: string, propertyId: string, reviewId: string): boolean {
  const all = getAllProperties();
  const idx = all.findIndex((p) => p.id === propertyId);
  if (idx < 0) return false;
  const review = all[idx].reviews.find((r) => r.id === reviewId);
  if (!review) return false;

  const voted = hasVotedHelpful(userId, reviewId);
  review.helpful = Math.max(0, (review.helpful ?? 0) + (voted ? -1 : 1));
  writeJSON(STORAGE_KEYS.properties, all);

  if (isBrowser) {
    const raw = localStorage.getItem(KEY_HELPFUL + userId);
    const set = new Set<string>(raw ? JSON.parse(raw) : []);
    if (voted) set.delete(reviewId);
    else set.add(reviewId);
    localStorage.setItem(KEY_HELPFUL + userId, JSON.stringify([...set]));
  }
  return !voted;
}

// Owner replies to a review on their listing.
export function replyToReview(propertyId: string, reviewId: string, body: string) {
  const all = getAllProperties();
  const idx = all.findIndex((p) => p.id === propertyId);
  if (idx < 0) return;
  const review = all[idx].reviews.find((r) => r.id === reviewId);
  if (!review) return;
  review.ownerReply = {
    body,
    date: new Date().toLocaleDateString("ar-EG-u-nu-latn"),
  };
  writeJSON(STORAGE_KEYS.properties, all);
}

// ---------- Utility ----------

export function resetAllData() {
  if (!isBrowser) return;
  Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
  ensureSeeded();
}

// Egyptian-colloquial "time ago" for publish dates (Latin digits).
export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const days = Math.floor((Date.now() - then) / 86400000);
  if (days <= 0) return "النهارده";
  if (days === 1) return "إمبارح";
  if (days < 7) return `من ${days} أيام`;
  if (days < 14) return "من أسبوع";
  if (days < 30) return `من ${Math.floor(days / 7)} أسابيع`;
  if (days < 60) return "من شهر";
  if (days < 365) return `من ${Math.floor(days / 30)} شهور`;
  if (days < 730) return "من سنة";
  return `من ${Math.floor(days / 365)} سنين`;
}

// Absolute publish date — "د/شهر/سنة" in Arabic with Latin digits.
export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("ar-EG-u-nu-latn", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export const EGYPT_AREAS = [
  "القاهرة الجديدة · التجمع الخامس",
  "المعادي · شارع 9",
  "الشيخ زايد · الحي التاني",
  "مدينة نصر · عباس العقاد",
  "الدقي · شارع التحرير",
  "سموحة · إسكندرية",
  "الزمالك",
  "المهندسين",
  "6 أكتوبر",
  "مدينتي",
  "العاصمة الإدارية",
] as const;

// Structured city → districts list for the listing wizard's area picker.
// Stored `area` stays a single "المدينة · المنطقة" string (back-compatible with
// search's substring match and the matching engine's "·" split).
export const EGYPT_LOCATIONS: { city: string; districts: string[] }[] = [
  {
    city: "القاهرة الجديدة",
    districts: [
      "التجمع الخامس",
      "التجمع الأول",
      "التجمع الثالث",
      "الرحاب",
      "مدينتي",
      "القرنفل",
      "اللوتس",
      "الأندلس",
      "بيت الوطن",
      "النرجس",
      "جنوب الأكاديمية",
    ],
  },
  {
    city: "القاهرة",
    districts: [
      "المعادي",
      "المقطم",
      "مدينة نصر",
      "مصر الجديدة",
      "الزمالك",
      "وسط البلد",
      "جاردن سيتي",
      "العباسية",
      "شبرا",
      "حلوان",
      "عين شمس",
      "النزهة",
      "الماظة",
      "حدائق القبة",
    ],
  },
  {
    city: "الجيزة",
    districts: [
      "المهندسين",
      "الدقي",
      "العجوزة",
      "الهرم",
      "فيصل",
      "إمبابة",
      "بولاق الدكرور",
      "حدائق الأهرام",
      "المنيب",
      "العمرانية",
    ],
  },
  {
    city: "الشيخ زايد",
    districts: [
      "الحي الأول",
      "الحي الثاني",
      "الحي الثالث",
      "الحي الرابع",
      "بيفرلي هيلز",
      "الكرمة",
      "زايد 2000",
      "داون تاون",
    ],
  },
  {
    city: "6 أكتوبر",
    districts: [
      "الحي الأول",
      "الحي السابع",
      "الحي المتميز",
      "أشجار سيتي",
      "حدائق أكتوبر",
      "دريم لاند",
      "الموازين",
      "المحور المركزي",
    ],
  },
  {
    city: "الإسكندرية",
    districts: [
      "سموحة",
      "سيدي جابر",
      "ميامي",
      "المنتزه",
      "العجمي",
      "سان ستيفانو",
      "لوران",
      "كامب شيزار",
      "محطة الرمل",
      "أبو قير",
      "العصافرة",
      "سيدي بشر",
      "ستانلي",
      "كليوباترا",
    ],
  },
  {
    city: "العاصمة الإدارية",
    districts: ["R7", "R8", "الحي الحكومي", "داون تاون", "المجاورة الأولى"],
  },
  {
    city: "الساحل الشمالي",
    districts: ["مارينا", "العلمين الجديدة", "سيدي عبد الرحمن", "هاسيندا", "مراسي", "تيلال"],
  },
  {
    city: "الغردقة",
    districts: ["الممشى", "الكوثر", "السقالة", "الأحياء", "مبارك"],
  },
  {
    city: "شرم الشيخ",
    districts: ["نعمة باي", "هضبة أم السيد", "نبق", "رأس نصراني"],
  },
  { city: "المنصورة", districts: [] },
  { city: "طنطا", districts: [] },
  { city: "الزقازيق", districts: [] },
  { city: "بنها", districts: [] },
  { city: "دمنهور", districts: [] },
  { city: "كفر الشيخ", districts: [] },
  { city: "دمياط", districts: [] },
  { city: "بورسعيد", districts: [] },
  { city: "الإسماعيلية", districts: [] },
  { city: "السويس", districts: [] },
  { city: "الفيوم", districts: [] },
  { city: "بني سويف", districts: [] },
  { city: "المنيا", districts: [] },
  { city: "أسيوط", districts: [] },
  { city: "سوهاج", districts: [] },
  { city: "قنا", districts: [] },
  { city: "الأقصر", districts: [] },
  { city: "أسوان", districts: [] },
];

// Build the canonical "المدينة · المنطقة" string the rest of the app stores.
export function formatArea(city: string, district?: string): string {
  return district && district.trim() ? `${city} · ${district.trim()}` : city;
}

// Split a stored area string back into its city / district parts.
export function parseArea(area?: string): { city: string; district: string } {
  const parts = (area ?? "").split("·").map((s) => s.trim());
  return { city: parts[0] ?? "", district: parts[1] ?? "" };
}

// A flat, de-duplicated list of every city + district for the renter's
// "preferred areas" picker — far richer than the small EGYPT_AREAS list.
// Matching uses substring, so a district like "المعادي" still matches a
// listing stored as "القاهرة · المعادي".
export const AREA_OPTIONS: string[] = Array.from(
  new Set(EGYPT_LOCATIONS.flatMap((l) => [l.city, ...l.districts])),
);

// Building / structural amenities — apply whether the place is furnished or not.
export const GENERAL_AMENITIES = [
  "نت 100 ميجا",
  "نت 200 ميجا",
  "تكييف",
  "أسانسير",
  "جراج",
  "جراج مغطى",
  "أمن 24 ساعة",
  "حمام سباحة",
  "جيم",
  "حديقة",
  "مطبخ مشترك",
  "نضافة أسبوعية",
  "مكان شغل",
  "بلكونة",
  "إطلالة بحر",
] as const;

// Appliances & furniture — only relevant when the apartment is furnished.
export const APPLIANCE_AMENITIES = [
  "غسالة",
  "نشافة",
  "ميكروويف",
  "تلاجة",
  "بوتاجاز",
  "سخان",
  "تليفزيون",
] as const;

// Combined list (used where furnishing doesn't matter, e.g. renter must-haves).
export const ALL_AMENITIES = [...GENERAL_AMENITIES, ...APPLIANCE_AMENITIES] as const;

// Apartment-level / room-level option lists for the listing wizard.
export const UNIT_TYPES: UnitType[] = ["شقة", "استوديو", "دوبلكس", "روف", "فيلا"];

export const ROOM_FEATURES = [
  "تكييف",
  "حمام خاص",
  "بلكونة",
  "نافذة كبيرة",
  "دولاب",
  "مكتب",
  "تليفزيون",
  "تلاجة صغيرة",
] as const;

// Renter-profile option lists.
export const OCCUPATIONS = ["طالب", "موظف", "شغل ريموت", "حر", "غير ده"] as const;
export const GENDER_PREFS = ["ذكر", "أنثى", "مايفرقش"] as const;
export const FURNISHED_PREFS: { id: "furnished" | "unfurnished" | "any"; label: string }[] = [
  { id: "furnished", label: "مفروشة" },
  { id: "unfurnished", label: "مش مفروشة" },
  { id: "any", label: "مايفرقش" },
];

// Nearby / transit options for the "قريب من" section.
export const NEARBY_TYPES = [
  "مترو",
  "جامعة",
  "مواصلات",
  "مول",
  "مستشفى",
  "سوبر ماركت",
  "حاجة تانية",
] as const;

// Cairo Metro lines with their main stations, used to pick a metro station.
export const CAIRO_METRO_LINES: Record<string, string[]> = {
  "الخط الأول": [
    "حلوان",
    "المعادي",
    "ثكنات المعادي",
    "دار السلام",
    "السيدة زينب",
    "الأنفوشي",
    "السادات",
    "جمال عبد الناصر",
    "العتبة",
    "غمرة",
    "الدمرداش",
    "حدائق المطرية",
    "المطرية",
    "عين شمس",
    "المرج",
    "المرج الجديدة",
  ],
  "الخط الثاني": [
    "شبرا الخيمة",
    "كلية الزراعة",
    "روض الفرج",
    "مسرة",
    "محمد نجيب",
    "العتبة",
    "الأوبرا",
    "الدقي",
    "البحوث",
    "جامعة القاهرة",
    "فيصل",
    "الجيزة",
    "أم المصريين",
    "ساقية مكي",
    "المنيب",
  ],
  "الخط الثالث": [
    "عدلي منصور",
    "هايكستب",
    "عمر بن الخطاب",
    "هليوبوليس",
    "ألف مسكن",
    "الأهرام",
    "كلية البنات",
    "العباسية",
    "عبده باشا",
    "باب الشعرية",
    "العتبة",
    "ناصر",
    "ماسبيرو",
    "الزمالك",
    "كيت كات",
    "السودان",
    "إمبابة",
    "البوهي",
    "المطبعة",
    "رود الفرج",
  ],
};

