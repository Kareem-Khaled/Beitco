// Typed API client for the Beitco backend (B-1). Behind the VITE_USE_API flag:
// when off (default), the app keeps reading from the localStorage mock so the
// prototype works with no backend. When on, reads come from the NestJS API.
// The returned shapes match lib/beitco/types.ts exactly (the API serializer
// mirrors the frontend Property shape), so callers don't change.

import type { Property, PropertySummary } from "./types";

export const USE_API =
  (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_USE_API === "true";

const API_BASE =
  (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_API_URL ??
  "http://localhost:3001/api/v1";

type Envelope<T> = {
  success: boolean;
  data: T;
  meta?: { cursor: string | null; hasMore: boolean };
  error?: { code: string; message: string };
};

async function getJSON<T>(path: string): Promise<Envelope<T>> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Accept: "application/json" },
    credentials: "include",
  });
  const body = (await res.json()) as Envelope<T>;
  if (!res.ok || !body.success) {
    throw new Error(body.error?.message ?? `Request failed (${res.status})`);
  }
  return body;
}

// Build a query string from the frontend's search params (drops empties).
export type PropertyFilters = {
  q?: string;
  type?: string;
  purpose?: "rent" | "sale";
  gender?: "male_only" | "female_only";
  area?: string;
  freeOnly?: boolean;
  verifiedOnly?: boolean;
  nightly?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sort?: "trust" | "price_asc" | "price_desc" | "newest";
  limit?: number;
  cursor?: string;
};

function toQuery(f: PropertyFilters = {}): string {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.type) p.set("type", f.type);
  if (f.purpose) p.set("purpose", f.purpose);
  if (f.gender) p.set("gender", f.gender);
  if (f.area) p.set("area", f.area);
  if (f.freeOnly) p.set("freeOnly", "true");
  if (f.verifiedOnly) p.set("verifiedOnly", "true");
  if (f.nightly) p.set("nightly", "true");
  if (f.minPrice != null) p.set("minPrice", String(f.minPrice));
  if (f.maxPrice != null) p.set("maxPrice", String(f.maxPrice));
  if (f.sort) p.set("sort", f.sort);
  if (f.limit != null) p.set("limit", String(f.limit));
  if (f.cursor) p.set("cursor", f.cursor);
  const s = p.toString();
  return s ? `?${s}` : "";
}

export async function apiListProperties(
  filters: PropertyFilters = {},
): Promise<{ items: PropertySummary[]; cursor: string | null; hasMore: boolean }> {
  const body = await getJSON<PropertySummary[]>(`/properties${toQuery({ limit: 50, ...filters })}`);
  return {
    items: body.data,
    cursor: body.meta?.cursor ?? null,
    hasMore: body.meta?.hasMore ?? false,
  };
}

export async function apiGetProperty(id: string): Promise<Property | undefined> {
  try {
    const body = await getJSON<Property>(`/properties/${encodeURIComponent(id)}`);
    return body.data;
  } catch {
    return undefined;
  }
}

// ── Auth ──────────────────────────────────────────────────────────────────
async function postJSON<T>(path: string, payload?: unknown): Promise<Envelope<T>> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    credentials: "include",
    body: payload ? JSON.stringify(payload) : undefined,
  });
  const body = (await res.json()) as Envelope<T>;
  if (!res.ok || !body.success) {
    throw new Error(body.error?.message ?? `Request failed (${res.status})`);
  }
  return body;
}

export async function apiRequestOtp(phone: string): Promise<{ devCode?: string }> {
  const body = await postJSON<{ expiresIn: number; devCode?: string }>("/auth/otp/send", { phone });
  return { devCode: body.data.devCode };
}

export async function apiVerifyOtp(
  phone: string,
  code: string,
): Promise<{ user: import("./types").User; isNewUser: boolean }> {
  const body = await postJSON<{ user: import("./types").User; isNewUser: boolean }>(
    "/auth/otp/verify",
    { phone, code },
  );
  return { user: body.data.user, isNewUser: body.data.isNewUser };
}

export async function apiCompleteProfile(payload: {
  name: string;
  role: "renter" | "owner" | "both";
  gender: "male" | "female";
}): Promise<import("./types").User> {
  const body = await postJSON<import("./types").User>("/auth/complete-profile", payload);
  return body.data;
}

export async function apiMe(): Promise<import("./types").User | null> {
  try {
    const body = await getJSON<import("./types").User>("/auth/me");
    return body.data;
  } catch {
    return null;
  }
}

export async function apiLogout(): Promise<void> {
  try {
    await postJSON("/auth/logout");
  } catch {
    // ignore — clearing local state is enough
  }
}

// ── Writes (B-2) ──────────────────────────────────────────────────────────
async function patchJSON<T>(path: string, payload: unknown): Promise<Envelope<T>> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  const body = (await res.json()) as Envelope<T>;
  if (!res.ok || !body.success) throw new Error(body.error?.message ?? `Request failed (${res.status})`);
  return body;
}

async function delJSON<T>(path: string): Promise<Envelope<T>> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
    headers: { Accept: "application/json" },
    credentials: "include",
  });
  const body = (await res.json()) as Envelope<T>;
  if (!res.ok || !body.success) throw new Error(body.error?.message ?? `Request failed (${res.status})`);
  return body;
}

export async function apiUpdateMe(
  patch: Partial<import("./types").User>,
): Promise<import("./types").User> {
  // Only the fields the /users/me endpoint accepts.
  const payload: Record<string, unknown> = {};
  if (patch.name !== undefined) payload.name = patch.name;
  if (patch.role !== undefined) payload.role = patch.role;
  if (patch.avatar !== undefined) payload.avatar = patch.avatar;
  if (patch.notifications !== undefined) payload.notifications = patch.notifications;
  // Renter preferences — the API upserts the profile + saves selfGender on the user.
  if (patch.profile !== undefined) payload.profile = patch.profile;
  const body = await patchJSON<import("./types").User>("/users/me", payload);
  return body.data;
}

export async function apiToggleSaved(propertyId: string): Promise<boolean> {
  const body = await postJSON<{ saved: boolean }>(`/properties/${encodeURIComponent(propertyId)}/save`);
  return body.data.saved;
}

export async function apiGetSaved(): Promise<import("./types").PropertySummary[]> {
  const body = await getJSON<import("./types").PropertySummary[]>("/me/saved");
  return body.data;
}

export async function apiListSavedSearches(): Promise<import("./types").SavedSearch[]> {
  const body = await getJSON<import("./types").SavedSearch[]>("/me/searches");
  return body.data;
}

export async function apiCreateSavedSearch(
  label: string,
  params: import("./types").SavedSearchParams,
): Promise<import("./types").SavedSearch> {
  const body = await postJSON<import("./types").SavedSearch>("/me/searches", { label, params });
  return body.data;
}

export async function apiDeleteSavedSearch(id: string): Promise<void> {
  await delJSON(`/me/searches/${encodeURIComponent(id)}`);
}

// ── Leads (FE-WIRE slice 3) ─────────────────────────────────────────────────
export async function apiCreateLead(
  propertyId: string,
  payload: {
    intent?: "viewing" | "booking";
    units?: import("./types").LeadUnit[];
    preferredDate?: string;
    note?: string;
  },
): Promise<import("./types").Lead> {
  const body = await postJSON<import("./types").Lead>(
    `/properties/${encodeURIComponent(propertyId)}/leads`,
    payload,
  );
  return body.data;
}

export async function apiListRenterLeads(): Promise<import("./types").Lead[]> {
  const body = await getJSON<import("./types").Lead[]>("/me/leads");
  return body.data;
}

export async function apiListOwnerLeads(): Promise<import("./types").Lead[]> {
  const body = await getJSON<import("./types").Lead[]>("/me/owner-leads");
  return body.data;
}

export async function apiUpdateLeadStatus(
  id: string,
  status: import("./types").Lead["status"],
): Promise<import("./types").Lead> {
  const body = await patchJSON<import("./types").Lead>(
    `/leads/${encodeURIComponent(id)}/status`,
    { status },
  );
  return body.data;
}

// Owner reviews a renter (two-sided trust, T-4). Moves the renter's reputation.
export async function apiReviewRenter(
  renterId: string,
  payload: { rating: number; body: string; scores: Record<string, number> },
): Promise<void> {
  await postJSON(`/users/${encodeURIComponent(renterId)}/reviews`, payload);
}

// ── Q&A (FE-WIRE slice 4) ───────────────────────────────────────────────────
export async function apiAskQuestion(propertyId: string, body: string): Promise<void> {
  await postJSON(`/properties/${encodeURIComponent(propertyId)}/questions`, { body });
}

export async function apiAnswerQuestion(questionId: string, body: string): Promise<void> {
  await postJSON(`/questions/${encodeURIComponent(questionId)}/answer`, { body });
}

// ── Reviews (FE-WIRE slice 5) ───────────────────────────────────────────────
export async function apiPostReview(
  propertyId: string,
  payload: { rating: number; body: string; scores?: Record<string, number> },
): Promise<void> {
  await postJSON(`/properties/${encodeURIComponent(propertyId)}/reviews`, payload);
}

export async function apiToggleReviewHelpful(reviewId: string): Promise<boolean> {
  const body = await postJSON<{ voted: boolean; helpful: number }>(
    `/reviews/${encodeURIComponent(reviewId)}/helpful`,
  );
  return body.data.voted;
}

export async function apiReplyToReview(reviewId: string, body: string): Promise<void> {
  await postJSON(`/reviews/${encodeURIComponent(reviewId)}/reply`, { body });
}

export async function apiGetReviewMeta(
  propertyId: string,
): Promise<{ canReview: boolean; votedReviewIds: string[] }> {
  const body = await getJSON<{ canReview: boolean; votedReviewIds: string[] }>(
    `/properties/${encodeURIComponent(propertyId)}/review-meta`,
  );
  return body.data;
}

// ── Listings write (FE-WIRE slice 6a) ───────────────────────────────────────
// The create/edit DTO is a subset of Property: `type`, `priceFrom`, bed counts,
// `trust`, and `status` are all DERIVED server-side, so we only send inputs.
type ListingPayload = {
  title: string;
  area: string;
  address?: string;
  lat?: number;
  lng?: number;
  listingType?: "rent" | "sale";
  rentalMode?: "whole" | "by_room" | "by_bed";
  description?: string;
  spec?: { unitType: string; bedrooms: number; bathrooms: number; floor?: number; sizeM2?: number; furnished: boolean };
  wholePrice?: number;
  wholeStatus?: string;
  nightlyPrice?: number;
  salePrice?: number;
  saleStatus?: string;
  negotiable?: boolean;
  rentToGender?: "male_only" | "female_only";
  images?: string[];
  amenities?: string[];
  costs?: { label: string; amount: number }[];
  rooms?: { name: string; features: string[]; sizeM2?: number; price?: number; status?: string; beds?: { label: string; status: string; price: number; features?: string[] }[] }[];
  nearby?: { type: string; name: string; line?: string; minutes?: number }[];
  customSpecs?: { label: string; value: string }[];
};

function propertyToListingPayload(p: Property): ListingPayload {
  return {
    title: p.title,
    area: p.area,
    address: p.address || undefined,
    lat: p.lat ?? undefined,
    lng: p.lng ?? undefined,
    listingType: p.listingType ?? "rent",
    rentalMode: p.rentalMode ?? undefined,
    description: p.description || undefined,
    spec: p.spec
      ? {
          unitType: p.spec.unitType,
          bedrooms: p.spec.bedrooms,
          bathrooms: p.spec.bathrooms,
          floor: p.spec.floor,
          sizeM2: p.spec.sizeM2,
          furnished: p.spec.furnished,
        }
      : undefined,
    wholePrice: p.wholePrice ?? undefined,
    wholeStatus: p.wholeStatus ?? undefined,
    nightlyPrice: p.nightlyPrice ?? undefined,
    salePrice: p.salePrice ?? undefined,
    saleStatus: p.saleStatus ?? undefined,
    negotiable: p.negotiable ?? undefined,
    rentToGender: p.rentToGender ?? undefined,
    images: p.images ?? undefined,
    amenities: p.amenities ?? undefined,
    costs: p.costs?.map((c) => ({ label: c.label, amount: c.amount })),
    rooms: p.rooms?.map((r) => ({
      name: r.name,
      features: r.features ?? [],
      sizeM2: r.sizeM2,
      price: r.price,
      status: r.status,
      beds: r.beds?.map((b) => ({ label: b.label, status: b.status, price: b.price, features: b.features })),
    })),
    nearby: p.nearby?.map((n) => ({ type: n.type, name: n.name, line: n.line, minutes: n.minutes })),
    customSpecs: p.customSpecs?.map((c) => ({ label: c.label, value: c.value })),
  };
}

export async function apiCreateProperty(p: Property): Promise<Property> {
  const body = await postJSON<Property>("/properties", propertyToListingPayload(p));
  return body.data;
}

export async function apiUpdateProperty(id: string, p: Property): Promise<Property> {
  const body = await patchJSON<Property>(
    `/properties/${encodeURIComponent(id)}`,
    propertyToListingPayload(p),
  );
  return body.data;
}

export async function apiDeleteProperty(id: string): Promise<void> {
  await delJSON(`/properties/${encodeURIComponent(id)}`);
}

// Owner's own listings (all statuses) — FULL Property objects with owner-only
// occupant data (the dashboard management grid edits availability + tenants).
export async function apiListMine(): Promise<Property[]> {
  const body = await getJSON<Property[]>("/properties/mine");
  return body.data;
}

// Granular status/occupancy mutation from the management grid. Each call sends
// exactly one concern; the API returns the full updated Property.
export type ManageListingPatch = {
  listingStatus?: "published" | "paused";
  saleStatus?: "available" | "sold";
  whole?: { status: string; occupant?: import("./types").Occupant };
  room?: { roomId: string; status: string; occupant?: import("./types").Occupant };
  bed?: { bedId: string; status: string; occupant?: import("./types").Occupant };
};

export async function apiManageListing(id: string, patch: ManageListingPatch): Promise<Property> {
  const body = await patchJSON<Property>(`/properties/${encodeURIComponent(id)}/manage`, patch);
  return body.data;
}

// ── Admin moderation (FE-WIRE slice 6c) ─────────────────────────────────────
export async function apiListPendingListings(): Promise<Property[]> {
  const body = await getJSON<Property[]>("/admin/moderation");
  return body.data;
}

export async function apiModerationCount(): Promise<number> {
  const body = await getJSON<{ count: number }>("/admin/moderation/count");
  return body.data.count;
}

export async function apiApproveListing(id: string): Promise<void> {
  await postJSON(`/admin/moderation/${encodeURIComponent(id)}/approve`);
}

export async function apiRejectListing(id: string, reason: string): Promise<void> {
  await postJSON(`/admin/moderation/${encodeURIComponent(id)}/reject`, { reason });
}

// ── Matching (T-MATCH) ──────────────────────────────────────────────────────
export async function apiGetMatches(): Promise<
  { property: import("./types").PropertySummary; match: import("./matching").MatchResult }[]
> {
  const body = await getJSON<
    { property: import("./types").PropertySummary; match: import("./matching").MatchResult }[]
  >("/me/matches");
  return body.data;
}

// ── Chat (CHAT-2) ───────────────────────────────────────────────────────────
export async function apiListThreads(): Promise<import("./types").Thread[]> {
  const body = await getJSON<import("./types").Thread[]>("/me/threads");
  return body.data;
}

export async function apiGetThread(id: string): Promise<import("./types").Thread | undefined> {
  try {
    const body = await getJSON<import("./types").Thread>(`/threads/${encodeURIComponent(id)}`);
    return body.data;
  } catch {
    return undefined;
  }
}

export async function apiFindOrCreateThread(propertyId: string): Promise<import("./types").Thread> {
  const body = await postJSON<import("./types").Thread>("/threads", { propertyId });
  return body.data;
}

export async function apiSendMessage(
  threadId: string,
  messageBody: string,
  type: import("./types").Message["type"] = "text",
): Promise<import("./types").Message> {
  const body = await postJSON<import("./types").Message>(
    `/threads/${encodeURIComponent(threadId)}/messages`,
    { body: messageBody, type },
  );
  return body.data;
}

// ── Notifications (NOTIF-1) ─────────────────────────────────────────────────
// AppNotification lives in store.ts (the derived-feed type). The API computes
// the same feed server-side + a Redis-backed last-seen marker.
export async function apiListNotifications(): Promise<{
  items: import("./store").AppNotification[];
  lastSeen: number;
}> {
  const body = await getJSON<{ items: import("./store").AppNotification[]; lastSeen: number }>(
    "/me/notifications",
  );
  return body.data;
}

export async function apiNotificationsUnreadCount(): Promise<number> {
  const body = await getJSON<{ count: number }>("/me/notifications/unread-count");
  return body.data.count;
}

export async function apiMarkNotificationsSeen(): Promise<void> {
  await postJSON("/me/notifications/seen");
}
