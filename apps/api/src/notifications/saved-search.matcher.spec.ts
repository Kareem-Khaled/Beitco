import {
  propertyMatchesSavedSearch,
  type MatchableListing,
} from './saved-search.matcher';

function listing(overrides: Partial<MatchableListing> = {}): MatchableListing {
  return {
    title: 'شقة منوّرة في المعادي',
    area: 'المعادي · شارع 9',
    address: 'شارع 9، المعادي',
    type: 'شقة',
    listingType: 'rent',
    rentToGender: null,
    verified: true,
    price: 8000,
    beds: { available: 2 },
    ...overrides,
  };
}

describe('propertyMatchesSavedSearch', () => {
  it('an empty search matches everything', () => {
    expect(propertyMatchesSavedSearch(listing(), {})).toBe(true);
  });

  it('matches q against title / area / address (case-insensitive)', () => {
    expect(propertyMatchesSavedSearch(listing(), { q: 'المعادي' })).toBe(true);
    expect(propertyMatchesSavedSearch(listing(), { q: 'الزمالك' })).toBe(false);
  });

  it('filters by Arabic type', () => {
    expect(propertyMatchesSavedSearch(listing({ type: 'سرير' }), { type: 'سرير' })).toBe(true);
    expect(propertyMatchesSavedSearch(listing({ type: 'شقة' }), { type: 'أوضة' })).toBe(false);
  });

  it('filters by purpose (listingType, default rent)', () => {
    expect(propertyMatchesSavedSearch(listing({ listingType: undefined }), { purpose: 'rent' })).toBe(true);
    expect(propertyMatchesSavedSearch(listing({ listingType: 'rent' }), { purpose: 'sale' })).toBe(false);
  });

  it('filters by gender policy', () => {
    expect(propertyMatchesSavedSearch(listing({ rentToGender: 'female_only' }), { gender: 'female_only' })).toBe(true);
    expect(propertyMatchesSavedSearch(listing({ rentToGender: 'male_only' }), { gender: 'female_only' })).toBe(false);
  });

  it('filters by area substring', () => {
    expect(propertyMatchesSavedSearch(listing(), { area: 'المعادي' })).toBe(true);
    expect(propertyMatchesSavedSearch(listing(), { area: 'مدينة نصر' })).toBe(false);
  });

  it('freeOnly requires an available bed', () => {
    expect(propertyMatchesSavedSearch(listing({ beds: { available: 0 } }), { freeOnly: true })).toBe(false);
    expect(propertyMatchesSavedSearch(listing({ beds: { available: 1 } }), { freeOnly: true })).toBe(true);
  });

  it('verifiedOnly requires verified', () => {
    expect(propertyMatchesSavedSearch(listing({ verified: false }), { verifiedOnly: true })).toBe(false);
  });

  it('respects min/max price (inclusive)', () => {
    expect(propertyMatchesSavedSearch(listing({ price: 8000 }), { minPrice: 5000, maxPrice: 10000 })).toBe(true);
    expect(propertyMatchesSavedSearch(listing({ price: 12000 }), { maxPrice: 10000 })).toBe(false);
    expect(propertyMatchesSavedSearch(listing({ price: 3000 }), { minPrice: 5000 })).toBe(false);
  });

  it('requires ALL present constraints (AND)', () => {
    const p = listing({ type: 'سرير', area: 'المعادي · شارع 9', price: 3000, verified: true, beds: { available: 1 } });
    const params = { type: 'سرير', area: 'المعادي', maxPrice: 4000, freeOnly: true, verifiedOnly: true };
    expect(propertyMatchesSavedSearch(p, params)).toBe(true);
    // one mismatch (price too high) flips it
    expect(propertyMatchesSavedSearch(listing({ ...p, price: 9000 }), params)).toBe(false);
  });
});
