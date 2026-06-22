// Read hooks that route through TanStack Query so the UI is identical whether
// data comes from the localStorage mock or the API (B-1). The VITE_USE_API flag
// (in api.ts) decides the source:
//   - flag OFF (default): `initialData` returns the mock synchronously, so there
//     is zero loading flash — behaviour is byte-identical to the pre-API app.
//   - flag ON: data is fetched from the NestJS API.

import { useQuery } from "@tanstack/react-query";
import { getPublishedProperties } from "./store";
import { apiListProperties, USE_API } from "./api";
import type { Property, PropertySummary } from "./types";

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
