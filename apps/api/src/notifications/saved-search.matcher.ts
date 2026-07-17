// Pure "does this property match a saved search?" predicate. Mirrors the
// client-side filter in apps/web/src/routes/search.tsx EXACTLY, so the
// saved-search alerts (NOTIF-2) fire on precisely the listings the renter would
// have seen had they re-run the search. Runs against the SERIALIZED property
// (Arabic `type`, computed `beds`), so it reuses listings.serializer's mapping.
import { arabicIncludes } from '@beitoon/shared';

// The fields the matcher reads off a serialized property.
export interface MatchableListing {
  title: string;
  area: string;
  address: string;
  type: string; // Arabic: shaqa / oda / sareer
  listingType?: string; // rent | sale
  rentToGender?: string | null;
  verified: boolean;
  price: number;
  beds: { available: number };
}

// The saved-search params (frontend SavedSearchParams shape). All optional;
// only the present fields constrain the match (an empty search matches all).
export interface SavedSearchParams {
  q?: string;
  type?: string;
  purpose?: 'rent' | 'sale';
  gender?: 'male_only' | 'female_only';
  area?: string;
  freeOnly?: boolean;
  verifiedOnly?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

export function propertyMatchesSavedSearch(
  p: MatchableListing,
  params: SavedSearchParams,
): boolean {
  if (params.q) {
    const hit =
      arabicIncludes(p.title, params.q) ||
      arabicIncludes(p.area, params.q) ||
      arabicIncludes(p.address, params.q);
    if (!hit) return false;
  }
  if (params.type && p.type !== params.type) return false;
  if (params.purpose && (p.listingType ?? 'rent') !== params.purpose) return false;
  if (params.gender && p.rentToGender !== params.gender) return false;
  if (params.area && !arabicIncludes(p.area, params.area)) return false;
  if (params.freeOnly && !(p.beds.available > 0)) return false;
  if (params.verifiedOnly && !p.verified) return false;
  if (params.minPrice != null && !(p.price >= params.minPrice)) return false;
  if (params.maxPrice != null && !(p.price <= params.maxPrice)) return false;
  return true;
}
