// Read hooks that route through TanStack Query so the UI is identical whether
// data comes from the localStorage mock or the API (B-1). The VITE_USE_API flag
// (in api.ts) decides the source:
//   - flag OFF (default): `initialData` returns the mock synchronously, so there
//     is zero loading flash — behaviour is byte-identical to the pre-API app.
//   - flag ON: data is fetched from the NestJS API.

import { useQuery } from "@tanstack/react-query";
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
} from "./store";
import {
  apiListProperties,
  apiGetSaved,
  apiToggleSaved,
  apiListSavedSearches,
  apiCreateSavedSearch,
  apiDeleteSavedSearch,
  USE_API,
} from "./api";
import type { Property, PropertySummary, SavedSearch, SavedSearchParams } from "./types";

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
    initialData:
      USE_API || !userId ? undefined : () => getSavedSearches(userId),
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


