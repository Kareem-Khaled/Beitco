// Read hooks that route through TanStack Query so the UI is identical whether
// data comes from the localStorage mock or the API (B-1). The VITE_USE_API flag
// (in api.ts) decides the source:
//   - flag OFF (default): `initialData` returns the mock synchronously, so there
//     is zero loading flash — behaviour is byte-identical to the pre-API app.
//   - flag ON: data is fetched from the NestJS API.

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  getPublishedProperties,
  getSavedForUser,
  getProperty,
  toggleSaved,
  getSavedSearches,
  saveSearch,
  deleteSavedSearch,
  describeSavedSearch,
  sameSearch,
  getLeadsForRenter,
  createLead as storeCreateLead,
  postQuestion as storePostQuestion,
  answerQuestion as storeAnswerQuestion,
  canUserReview,
  getVotedReviewIds,
  postReview as storePostReview,
  toggleReviewHelpful as storeToggleHelpful,
  replyToReview as storeReplyToReview,
  getPropertiesByOwner,
  saveProperty as storeSaveProperty,
  deleteProperty as storeDeleteProperty,
  getLeadsForOwner,
  updateLeadStatus as storeUpdateLeadStatus,
  getRenterReputation,
  canOwnerReviewRenter,
  postRenterReview as storePostRenterReview,
  getPendingListings,
  getPendingListingsCount,
  getPlatformStats,
  getAdminUsers,
  getAdminUser,
  adminUpdateUser as storeAdminUpdateUser,
  adminUserAction as storeAdminUserAction,
  getAdminListings,
  getAdminListing,
  adminTakedownListing as storeAdminTakedownListing,
  adminRestoreListing as storeAdminRestoreListing,
  adminSetListingVerified as storeAdminSetListingVerified,
  adminDeleteListing as storeAdminDeleteListing,
  approveListing as storeApproveListing,
  rejectListing as storeRejectListing,
  getMatchesForUser,
  getThreadsForUser,
  getThread as storeGetThread,
  findOrCreateThread as storeFindOrCreateThread,
  postMessage as storePostMessage,
  getNotificationsForUser,
  getLastSeenNotifications,
  getUnreadNotificationCount,
  markNotificationsSeen as storeMarkNotificationsSeen,
  submitVerification as storeSubmitVerification,
  type AppNotification,
} from "./store";
import {
  apiListProperties,
  apiGetSaved,
  apiToggleSaved,
  apiListSavedSearches,
  apiCreateSavedSearch,
  apiDeleteSavedSearch,
  apiCreateLead,
  apiListRenterLeads,
  apiAskQuestion,
  apiAnswerQuestion,
  apiPostReview,
  apiToggleReviewHelpful,
  apiReplyToReview,
  apiGetReviewMeta,
  apiCreateProperty,
  apiUpdateProperty,
  apiDeleteProperty,
  apiListMine,
  apiManageListing,
  apiListOwnerLeads,
  apiUpdateLeadStatus,
  apiReviewRenter,
  apiListPendingListings,
  apiModerationCount,
  apiAdminStats,
  apiAdminUsers,
  apiAdminUser,
  apiAdminUpdateUser,
  apiAdminUserAction,
  type AdminUsersParams,
  apiAdminListings,
  apiAdminListing,
  apiAdminListingTakedown,
  apiAdminListingRestore,
  apiAdminUpdateListing,
  apiAdminDeleteListing,
  type AdminListingsParams,
  apiApproveListing,
  apiRejectListing,
  apiGetMatches,
  apiListThreads,
  apiGetThread,
  apiFindOrCreateThread,
  apiSendMessage,
  apiListNotifications,
  apiNotificationsUnreadCount,
  apiMarkNotificationsSeen,
  apiSubmitVerification,
  apiListPendingVerifications,
  apiVerificationCount,
  apiApproveVerification,
  apiRejectVerification,
  type VerificationDocs,
  type PropertyFilters,
  USE_API,
} from "./api";
import type {
  Property,
  PropertySummary,
  SavedSearch,
  SavedSearchParams,
  Lead,
  Review,
  Occupant,
  BedStatus,
  SaleStatus,
  Thread,
  Message,
  PlatformStats,
  AdminUser,
  AdminUserDetail,
  AdminListing,
} from "./types";
import type { MatchResult } from "./matching";

// Home + search consume the full published set (they filter/sort client-side).
export function usePublishedProperties() {
  return useQuery<(Property | PropertySummary)[]>({
    queryKey: ["properties", { source: USE_API ? "api" : "mock" }],
    queryFn: async () => {
      if (USE_API) {
        const { items } = await apiListProperties({ limit: 50 });
        return items;
      }
      return getPublishedProperties();
    },
    // Mock is synchronous -> hydrate immediately (no flash). API -> normal fetch.
    initialData: USE_API ? undefined : () => getPublishedProperties(),
    staleTime: USE_API ? 30_000 : Infinity,
  });
}

// Search page (FE-SEARCH): server-side text + geo. In API mode the backend does
// the filtering/sorting (PROD-3 typo-tolerant `q`, PROD-4 PostGIS `lat/lng/radiusKm`)
// and returns the final set (`mode: "server"`). In mock mode we return the full
// published set and the page filters/sorts/ranks client-side (`mode: "client"`),
// so the prototype keeps working with no backend.
export type SearchResult =
  | { items: Property[]; mode: "client" }
  | { items: PropertySummary[]; mode: "server" };

export function useSearchProperties(params: PropertyFilters) {
  return useQuery<SearchResult>({
    // API mode keys by params (each filter set is a distinct server query); mock
    // mode is param-independent (the page filters in-memory) so it caches once.
    queryKey: USE_API ? ["search", "api", params] : ["search", "mock"],
    queryFn: async () => {
      if (USE_API) {
        const { items } = await apiListProperties({ ...params, limit: 50 });
        return { items, mode: "server" };
      }
      return { items: getPublishedProperties(), mode: "client" };
    },
    // Mock can hydrate synchronously (no flash); API fetches normally.
    initialData: USE_API ? undefined : () => ({ items: getPublishedProperties(), mode: "client" }),
    staleTime: USE_API ? 15_000 : Infinity,
  });
}

// Saved listings for /me/saved. Mock resolves ids -> properties synchronously;
// API returns summaries directly from GET /me/saved.
export function useSavedListings(userId: string | undefined) {
  return useQuery<(Property | PropertySummary)[]>({
    queryKey: ["saved", userId, { source: USE_API ? "api" : "mock" }],
    enabled: !!userId,
    queryFn: async () => {
      if (USE_API) return apiGetSaved();
      if (!userId) return [];
      return getSavedForUser(userId)
        .map((id) => getProperty(id))
        .filter((p): p is Property => !!p);
    },
    initialData:
      USE_API || !userId
        ? undefined
        : () =>
            getSavedForUser(userId)
              .map((id) => getProperty(id))
              .filter((p): p is Property => !!p),
    staleTime: USE_API ? 15_000 : Infinity,
  });
}

// Toggle save state. Returns the new state (true = saved). Branches on the flag.
export async function toggleSavedListing(userId: string, propertyId: string): Promise<boolean> {
  if (USE_API) return apiToggleSaved(propertyId);
  return toggleSaved(userId, propertyId);
}

// ── Saved searches ──────────────────────────────────────────────────────────
export function useSavedSearches(userId: string | undefined) {
  return useQuery<SavedSearch[]>({
    queryKey: ["savedSearches", userId, { source: USE_API ? "api" : "mock" }],
    enabled: !!userId,
    queryFn: async () => {
      if (USE_API) return apiListSavedSearches();
      if (!userId) return [];
      return getSavedSearches(userId);
    },
    initialData: USE_API || !userId ? undefined : () => getSavedSearches(userId),
    staleTime: USE_API ? 15_000 : Infinity,
  });
}

export async function createSavedSearch(
  userId: string,
  params: SavedSearchParams,
): Promise<SavedSearch> {
  if (USE_API) return apiCreateSavedSearch(describeSavedSearch(params), params);
  return saveSearch(userId, params);
}

export async function removeSavedSearch(userId: string, id: string): Promise<void> {
  if (USE_API) return apiDeleteSavedSearch(id);
  return deleteSavedSearch(userId, id);
}

// Whether a saved search equivalent to `params` exists in `list` (flag-agnostic).
export function alreadySavedIn(list: SavedSearch[], params: SavedSearchParams): boolean {
  return list.some((s) => sameSearch(s.params, params));
}

// ── Leads (FE-WIRE slice 3, renter side) ────────────────────────────────────
// A renter's own viewing/booking requests. Mock resolves synchronously
// (zero-flash); API hits GET /me/leads.
export function useRenterLeads(userId: string | undefined) {
  return useQuery<Lead[]>({
    queryKey: ["renterLeads", userId, { source: USE_API ? "api" : "mock" }],
    enabled: !!userId,
    queryFn: async () => {
      if (USE_API) return apiListRenterLeads();
      if (!userId) return [];
      return getLeadsForRenter(userId);
    },
    initialData: USE_API || !userId ? undefined : () => getLeadsForRenter(userId),
    staleTime: USE_API ? 15_000 : Infinity,
  });
}

// Create a viewing/booking request. Same input shape as the mock store's
// createLead so call sites barely change; the API ignores renterId/renterName
// (taken from the session) and reads propertyId from the URL.
export async function submitLead(input: Omit<Lead, "id" | "createdAt" | "status">): Promise<Lead> {
  if (USE_API) {
    return apiCreateLead(input.propertyId, {
      intent: input.intent,
      units: input.units,
      preferredDate: input.preferredDate,
      note: input.note,
    });
  }
  return storeCreateLead(input);
}

// Flag-aware property resolver for surfaces that render a property by id
// (e.g. the renter's applications list). Mock uses the full store lookup; API
// resolves from the already-cached published set (the common case for leads).
export function usePropertyLookup() {
  const { data: published = [] } = usePublishedProperties();
  return useMemo(() => {
    const map = new Map(published.map((p) => [p.id, p]));
    return (id: string): Property | PropertySummary | undefined =>
      USE_API ? map.get(id) : getProperty(id);
  }, [published]);
}

// ── Q&A (FE-WIRE slice 4) ───────────────────────────────────────────────────
// Both mutate a property's Q&A; callers re-read via router.invalidate() (API)
// or a local refresh() (mock) afterwards, so these return void.
export async function submitQuestion(
  propertyId: string,
  askerName: string,
  question: string,
): Promise<void> {
  if (USE_API) return apiAskQuestion(propertyId, question);
  storePostQuestion(propertyId, askerName, question);
}

export async function submitAnswer(
  propertyId: string,
  questionId: string,
  answererName: string,
  answer: string,
): Promise<void> {
  if (USE_API) return apiAnswerQuestion(questionId, answer);
  storeAnswerQuestion(propertyId, questionId, answererName, answer);
}

// ── Reviews (FE-WIRE slice 5) ───────────────────────────────────────────────
// Per-user review context for a listing: eligibility (30-day tenancy) + which
// reviews the user marked helpful. Flag-aware + zero-flash for the mock.
export function useReviewMeta(propertyId: string, userId: string | undefined) {
  return useQuery<{ canReview: boolean; votedReviewIds: string[] }>({
    queryKey: ["reviewMeta", propertyId, userId, { source: USE_API ? "api" : "mock" }],
    enabled: !!userId,
    queryFn: async () => {
      if (USE_API) return apiGetReviewMeta(propertyId);
      if (!userId) return { canReview: false, votedReviewIds: [] };
      return {
        canReview: canUserReview(userId, propertyId),
        votedReviewIds: getVotedReviewIds(userId),
      };
    },
    initialData:
      USE_API || !userId
        ? undefined
        : () => ({
            canReview: canUserReview(userId, propertyId),
            votedReviewIds: getVotedReviewIds(userId),
          }),
    staleTime: USE_API ? 15_000 : Infinity,
  });
}

// Post a resident review. Same input shape as the mock store's postReview; the
// API takes only { rating, body, scores } (author/months derived server-side)
// and recomputes trust. Callers re-read via refreshDetail() + invalidate meta.
export async function submitReview(
  propertyId: string,
  review: Omit<Review, "id" | "propertyId" | "date">,
): Promise<void> {
  if (USE_API) {
    return apiPostReview(propertyId, {
      rating: review.rating,
      body: review.body,
      scores: review.scores,
    });
  }
  storePostReview(propertyId, review);
}

// Toggle a helpful vote. Returns the new voted state.
export async function toggleHelpful(
  propertyId: string,
  reviewId: string,
  userId: string,
): Promise<boolean> {
  if (USE_API) return apiToggleReviewHelpful(reviewId);
  return storeToggleHelpful(userId, propertyId, reviewId);
}

// Owner replies to a review.
export async function replyReview(
  propertyId: string,
  reviewId: string,
  body: string,
): Promise<void> {
  if (USE_API) return apiReplyToReview(reviewId, body);
  storeReplyToReview(propertyId, reviewId, body);
}

// ── Listings write (FE-WIRE slice 6a) ───────────────────────────────────────
// Owner's own listings (all statuses) for the dashboard/count/management grid.
// Both modes return FULL Property objects (with owner-only occupant data); the
// API path hits GET /properties/mine (ownership-checked).
export function useOwnerProperties(userId: string | undefined) {
  return useQuery<Property[]>({
    queryKey: ["ownerProperties", userId, { source: USE_API ? "api" : "mock" }],
    enabled: !!userId,
    queryFn: async () => {
      if (USE_API) return apiListMine();
      if (!userId) return [];
      return getPropertiesByOwner(userId);
    },
    initialData: USE_API || !userId ? undefined : () => getPropertiesByOwner(userId),
    staleTime: USE_API ? 15_000 : Infinity,
  });
}

// Create or edit a listing. The mock upserts the full Property locally; the API
// sends only the input subset (status/type/price derived server-side) and
// returns the authoritative saved Property (with the server-decided status).
export async function saveListing(
  property: Property,
  opts: { isEdit: boolean; editId?: string },
): Promise<Property> {
  if (USE_API) {
    return opts.isEdit && opts.editId
      ? apiUpdateProperty(opts.editId, property)
      : apiCreateProperty(property);
  }
  storeSaveProperty(property);
  return property;
}

export async function deleteListing(id: string): Promise<void> {
  if (USE_API) return apiDeleteProperty(id);
  storeDeleteProperty(id);
}

// ── Listing management (FE-WIRE slice 6d) ───────────────────────────────────
// Granular status/occupancy mutations from the dashboard grid. Each takes the
// full `property` (so the mock can upsert) but the API only needs its id + the
// one changed concern. Pause/unpause, sale status, and whole/room/bed occupancy.
export async function manageListingStatus(
  property: Property,
  status: "published" | "paused",
): Promise<void> {
  if (USE_API) {
    await apiManageListing(property.id, { listingStatus: status });
    return;
  }
  storeSaveProperty({ ...property, status });
}

export async function manageSaleStatus(property: Property, saleStatus: SaleStatus): Promise<void> {
  if (USE_API) {
    await apiManageListing(property.id, { saleStatus });
    return;
  }
  storeSaveProperty({ ...property, saleStatus });
}

export async function manageWholeOccupancy(
  property: Property,
  status: BedStatus,
  occupant?: Occupant,
): Promise<void> {
  if (USE_API) {
    await apiManageListing(property.id, { whole: { status, occupant } });
    return;
  }
  storeSaveProperty({ ...property, wholeStatus: status, wholeOccupant: occupant });
}

export async function manageRoomOccupancy(
  property: Property,
  roomId: string,
  status: BedStatus,
  occupant?: Occupant,
): Promise<void> {
  if (USE_API) {
    await apiManageListing(property.id, { room: { roomId, status, occupant } });
    return;
  }
  storeSaveProperty({
    ...property,
    rooms: (property.rooms ?? []).map((r) => (r.id === roomId ? { ...r, status, occupant } : r)),
  });
}

export async function manageBedOccupancy(
  property: Property,
  roomId: string,
  bedId: string,
  status: BedStatus,
  occupant?: Occupant,
): Promise<void> {
  if (USE_API) {
    await apiManageListing(property.id, { bed: { bedId, status, occupant } });
    return;
  }
  storeSaveProperty({
    ...property,
    rooms: (property.rooms ?? []).map((r) =>
      r.id === roomId
        ? { ...r, beds: r.beds.map((b) => (b.id === bedId ? { ...b, status, occupant } : b)) }
        : r,
    ),
  });
}

// ── Owner leads + owner→renter reviews (FE-WIRE slice 6b) ───────────────────
// Incoming requests on the owner's listings. In API mode each lead is enriched
// with the renter's reputation + review eligibility (so the page needs no extra
// per-renter calls); in mock mode those come from the local store helpers below.
export function useOwnerLeads(userId: string | undefined) {
  return useQuery<Lead[]>({
    queryKey: ["ownerLeads", userId, { source: USE_API ? "api" : "mock" }],
    enabled: !!userId,
    queryFn: async () => {
      if (USE_API) return apiListOwnerLeads();
      if (!userId) return [];
      return getLeadsForOwner(userId);
    },
    initialData: USE_API || !userId ? undefined : () => getLeadsForOwner(userId),
    staleTime: USE_API ? 15_000 : Infinity,
  });
}

export async function setLeadStatus(id: string, status: Lead["status"]): Promise<void> {
  if (USE_API) {
    await apiUpdateLeadStatus(id, status);
    return;
  }
  storeUpdateLeadStatus(id, status);
}

export async function submitRenterReview(
  ownerId: string,
  renterId: string,
  input: {
    rating: number;
    body: string;
    scores: { reliability: number; cleanliness: number; communication: number };
  },
): Promise<void> {
  if (USE_API) {
    await apiReviewRenter(renterId, {
      rating: input.rating,
      body: input.body,
      scores: input.scores,
    });
    return;
  }
  storePostRenterReview(ownerId, renterId, input);
}

// The reputation badge + "review this renter" gate: API leads carry the values;
// mock reads the local store. Pure helpers (flag-aware), used per-lead.
export function renterReputationOf(lead: Lead): { score: number; count: number } | null {
  if (USE_API) return lead.renterReputation ?? null;
  return getRenterReputation(lead.renterId) ?? null;
}

export function ownerCanReview(ownerId: string, lead: Lead): boolean {
  if (USE_API) return !!lead.canReview;
  return canOwnerReviewRenter(ownerId, lead.renterId);
}

// ── Admin moderation (FE-WIRE slice 6c) ─────────────────────────────────────
// The review queue: listings awaiting approval. Admin-only (the page/badge gate
// on isPlatformAdmin); in API mode the endpoint is AdminGuard-protected too.
// Both modes return FULL Property objects (the card needs landlord/address/etc.).
export function usePendingListings() {
  return useQuery<Property[]>({
    queryKey: ["pendingListings", { source: USE_API ? "api" : "mock" }],
    queryFn: async () => {
      if (USE_API) return apiListPendingListings();
      return getPendingListings();
    },
    initialData: USE_API ? undefined : () => getPendingListings(),
    staleTime: USE_API ? 15_000 : Infinity,
  });
}

export function useModerationCount() {
  return useQuery<number>({
    queryKey: ["moderationCount", { source: USE_API ? "api" : "mock" }],
    queryFn: async () => (USE_API ? apiModerationCount() : getPendingListingsCount()),
    initialData: USE_API ? undefined : () => getPendingListingsCount(),
    staleTime: USE_API ? 30_000 : Infinity,
  });
}

// ADMIN-1: platform-operator overview snapshot (GET /admin/stats / mock equiv).
export function useAdminStats() {
  return useQuery<PlatformStats>({
    queryKey: ["adminStats", { source: USE_API ? "api" : "mock" }],
    queryFn: async () => (USE_API ? apiAdminStats() : getPlatformStats()),
    initialData: USE_API ? undefined : () => getPlatformStats(),
    staleTime: USE_API ? 30_000 : Infinity,
  });
}

// ADMIN-2: operator user management.
export function useAdminUsers(params: AdminUsersParams) {
  return useQuery<AdminUser[]>({
    queryKey: ["adminUsers", params, { source: USE_API ? "api" : "mock" }],
    queryFn: async () => {
      if (USE_API) {
        const { items } = await apiAdminUsers(params);
        return items;
      }
      return getAdminUsers(params);
    },
    initialData: USE_API ? undefined : () => getAdminUsers(params),
    staleTime: USE_API ? 15_000 : Infinity,
  });
}

export function useAdminUser(id: string | undefined) {
  return useQuery<AdminUserDetail | undefined>({
    queryKey: ["adminUser", id, { source: USE_API ? "api" : "mock" }],
    enabled: !!id,
    queryFn: async () => {
      if (!id) return undefined;
      return USE_API ? apiAdminUser(id) : getAdminUser(id);
    },
    initialData: USE_API || !id ? undefined : () => getAdminUser(id),
    staleTime: USE_API ? 10_000 : Infinity,
  });
}

export async function adminUpdateUser(
  id: string,
  patch: { role?: string; verified?: boolean; trust?: number; reason?: string },
): Promise<AdminUserDetail | undefined> {
  if (USE_API) return apiAdminUpdateUser(id, patch);
  return storeAdminUpdateUser(id, patch);
}

export async function adminUserAction(
  id: string,
  action: "ban" | "reinstate" | "make-admin" | "revoke-admin",
  reason?: string,
): Promise<AdminUserDetail | undefined> {
  if (USE_API) return apiAdminUserAction(id, action, reason ? { reason } : undefined);
  return storeAdminUserAction(id, action, reason);
}

// ADMIN-3: operator listing management.
export function useAdminListings(params: AdminListingsParams) {
  return useQuery<AdminListing[]>({
    queryKey: ["adminListings", params, { source: USE_API ? "api" : "mock" }],
    queryFn: async () => {
      if (USE_API) {
        const { items } = await apiAdminListings(params);
        return items;
      }
      return getAdminListings(params);
    },
    initialData: USE_API ? undefined : () => getAdminListings(params),
    staleTime: USE_API ? 15_000 : Infinity,
  });
}

export function useAdminListing(id: string | undefined) {
  return useQuery<Property | undefined>({
    queryKey: ["adminListing", id, { source: USE_API ? "api" : "mock" }],
    enabled: !!id,
    queryFn: async () => {
      if (!id) return undefined;
      return USE_API ? apiAdminListing(id) : getAdminListing(id);
    },
    initialData: USE_API || !id ? undefined : () => getAdminListing(id),
    staleTime: USE_API ? 10_000 : Infinity,
  });
}

export async function adminTakedownListing(id: string, reason: string): Promise<void> {
  if (USE_API) {
    await apiAdminListingTakedown(id, reason);
    return;
  }
  storeAdminTakedownListing(id, reason);
}

export async function adminRestoreListing(id: string): Promise<void> {
  if (USE_API) {
    await apiAdminListingRestore(id);
    return;
  }
  storeAdminRestoreListing(id);
}

export async function adminSetListingVerified(id: string, verified: boolean): Promise<void> {
  if (USE_API) {
    await apiAdminUpdateListing(id, verified);
    return;
  }
  storeAdminSetListingVerified(id, verified);
}

export async function adminDeleteListing(id: string, reason?: string): Promise<void> {
  if (USE_API) {
    await apiAdminDeleteListing(id, reason);
    return;
  }
  storeAdminDeleteListing(id);
}

export async function approveListing(id: string): Promise<void> {
  if (USE_API) return apiApproveListing(id);
  storeApproveListing(id);
}

export async function rejectListing(id: string, reason: string): Promise<void> {
  if (USE_API) return apiRejectListing(id, reason);
  storeRejectListing(id, reason);
}

// ── Matching (T-MATCH) ──────────────────────────────────────────────────────
// Ranked, explainable matches for the renter's saved preferences. Mock computes
// locally (getMatchesForUser); API hits GET /me/matches. Both return the same
// { property, match } shape. Disabled until the user is known.
export function useMatches(userId: string | undefined) {
  return useQuery<{ property: Property | PropertySummary; match: MatchResult }[]>({
    queryKey: ["matches", userId, { source: USE_API ? "api" : "mock" }],
    enabled: !!userId,
    queryFn: async () => {
      if (USE_API) return apiGetMatches();
      if (!userId) return [];
      return getMatchesForUser(userId);
    },
    initialData: USE_API || !userId ? undefined : () => getMatchesForUser(userId),
    staleTime: USE_API ? 30_000 : Infinity,
  });
}

// ── Chat (CHAT-2) ───────────────────────────────────────────────────────────
// A user's conversations (owner or renter), newest first. Mock reads the store
// synchronously (zero-flash); API hits GET /me/threads (threads embed a property
// summary so the list needs no extra fetch).
export function useThreads(userId: string | undefined) {
  return useQuery<Thread[]>({
    queryKey: ["threads", userId, { source: USE_API ? "api" : "mock" }],
    enabled: !!userId,
    queryFn: async () => {
      if (USE_API) return apiListThreads();
      if (!userId) return [];
      return getThreadsForUser(userId);
    },
    initialData: USE_API || !userId ? undefined : () => getThreadsForUser(userId),
    staleTime: USE_API ? 10_000 : Infinity,
  });
}

// One thread with its full message history. API marks it read server-side.
export function useThread(threadId: string, userId: string | undefined) {
  return useQuery<Thread | undefined>({
    queryKey: ["thread", threadId, userId, { source: USE_API ? "api" : "mock" }],
    enabled: !!threadId && !!userId,
    queryFn: async () => {
      if (USE_API) return apiGetThread(threadId);
      return storeGetThread(threadId);
    },
    initialData: USE_API ? undefined : () => storeGetThread(threadId),
    staleTime: USE_API ? 5_000 : Infinity,
  });
}

// Start (or re-open) a thread about a listing — returns the thread (callers
// navigate to thread.id). Flag-aware: mock upserts locally, API is idempotent.
export async function startThread(propertyId: string, renterId: string): Promise<Thread> {
  if (USE_API) return apiFindOrCreateThread(propertyId);
  return storeFindOrCreateThread(propertyId, renterId);
}

export async function sendChatMessage(
  threadId: string,
  senderId: string,
  body: string,
  type: Message["type"] = "text",
): Promise<Message> {
  if (USE_API) return apiSendMessage(threadId, body, type);
  return storePostMessage(threadId, senderId, body, type);
}

// Normalized property summary for a thread (flag-agnostic): API embeds it on the
// thread; mock derives it from the store. Keeps the messages pages on one path.
export function threadPropertyOf(thread: Thread):
  | {
      id: string;
      title: string;
      image: string;
      area: string;
      landlord: { name: string; initials: string; verified: boolean };
    }
  | undefined {
  if (USE_API) return thread.property;
  const p = getProperty(thread.propertyId);
  if (!p) return undefined;
  return {
    id: p.id,
    title: p.title,
    image: p.image,
    area: p.area,
    landlord: {
      name: p.landlord.name,
      initials: p.landlord.initials,
      verified: p.landlord.verified,
    },
  };
}

// ── Notifications (NOTIF-1) ─────────────────────────────────────────────────
// A derived feed (+ last-seen marker). Mock computes locally; API hits
// GET /me/notifications. Both return { items, lastSeen }.
export function useNotifications(userId: string | undefined) {
  return useQuery<{ items: AppNotification[]; lastSeen: number }>({
    queryKey: ["notifications", userId, { source: USE_API ? "api" : "mock" }],
    enabled: !!userId,
    queryFn: async () => {
      if (USE_API) return apiListNotifications();
      if (!userId) return { items: [], lastSeen: 0 };
      return { items: getNotificationsForUser(userId), lastSeen: getLastSeenNotifications(userId) };
    },
    initialData:
      USE_API || !userId
        ? undefined
        : () => ({
            items: getNotificationsForUser(userId),
            lastSeen: getLastSeenNotifications(userId),
          }),
    staleTime: USE_API ? 20_000 : Infinity,
  });
}

// Unread count for the bell badge.
export function useNotificationUnreadCount(userId: string | undefined) {
  return useQuery<number>({
    queryKey: ["notificationsUnread", userId, { source: USE_API ? "api" : "mock" }],
    enabled: !!userId,
    queryFn: async () => {
      if (USE_API) return apiNotificationsUnreadCount();
      if (!userId) return 0;
      return getUnreadNotificationCount(userId);
    },
    initialData: USE_API || !userId ? undefined : () => getUnreadNotificationCount(userId),
    staleTime: USE_API ? 20_000 : Infinity,
  });
}

export async function markNotificationsSeen(userId: string): Promise<void> {
  if (USE_API) return apiMarkNotificationsSeen();
  storeMarkNotificationsSeen(userId);
}

// ── Verification / KYC (PROD-5) ─────────────────────────────────────────────
// Submit docs for review. API stores the doc URLs + flips status to pending;
// the mock just flips status (it doesn't persist docs). Callers also
// optimistically set the session user's verificationStatus to "pending".
export async function submitVerification(userId: string, docs: VerificationDocs): Promise<void> {
  if (USE_API) return apiSubmitVerification(docs);
  storeSubmitVerification(userId);
}

// Admin verification queue (flag-aware). Mock has no queue, so it returns [].
export function usePendingVerifications(enabled: boolean) {
  return useQuery<
    Array<{
      id: string;
      userId: string;
      idDocUrl?: string;
      selfieUrl?: string;
      ownershipDocUrl?: string;
      submittedAt: string;
      user?: { name: string; phone: string; role: string };
    }>
  >({
    queryKey: ["pendingVerifications", { source: USE_API ? "api" : "mock" }],
    enabled,
    queryFn: async () => (USE_API ? apiListPendingVerifications() : []),
    initialData: USE_API ? undefined : () => [],
    staleTime: USE_API ? 15_000 : Infinity,
  });
}

export function useVerificationCount(enabled: boolean) {
  return useQuery<number>({
    queryKey: ["verificationCount", { source: USE_API ? "api" : "mock" }],
    enabled,
    queryFn: async () => (USE_API ? apiVerificationCount() : 0),
    initialData: USE_API ? undefined : () => 0,
    staleTime: USE_API ? 30_000 : Infinity,
  });
}

export async function approveVerification(id: string): Promise<void> {
  if (USE_API) return apiApproveVerification(id);
}

export async function rejectVerification(id: string, reason: string): Promise<void> {
  if (USE_API) return apiRejectVerification(id, reason);
}
