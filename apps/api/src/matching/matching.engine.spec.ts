// Mirrors apps/web/src/lib/beitco/matching.test.ts (Vitest) as Jest, so the
// ported engine is provably behaviour-identical to the frontend's.
import {
  scoreMatch,
  isGenderEligible,
  type MatchProperty,
  type MatchProfile,
} from './matching.engine';

// Minimal MatchProperty factory  -  sensible defaults, override per test.
function makeProperty(overrides: Partial<MatchProperty> = {}): MatchProperty {
  return {
    area: 'القاهرة الجديدة · التجمع الخامس',
    type: 'شقة',
    price: 8000,
    trust: 8,
    amenities: [],
    beds: { available: 1 },
    ...overrides,
  };
}

describe('isGenderEligible', () => {
  it('allows any renter when the listing has no gender policy', () => {
    expect(isGenderEligible(makeProperty(), { selfGender: 'ذكر' })).toBe(true);
  });

  it('blocks a male renter from a female-only listing', () => {
    const p = makeProperty({ rentToGender: 'female_only' });
    expect(isGenderEligible(p, { selfGender: 'ذكر' })).toBe(false);
  });

  it('allows a female renter into a female-only listing', () => {
    const p = makeProperty({ rentToGender: 'female_only' });
    expect(isGenderEligible(p, { selfGender: 'أنثى' })).toBe(true);
  });

  it('does not exclude when the renter gender is unknown', () => {
    const p = makeProperty({ rentToGender: 'male_only' });
    expect(isGenderEligible(p, {})).toBe(true);
  });
});

describe('scoreMatch - hard constraints', () => {
  it('marks a gender-mismatched listing ineligible with a clear miss', () => {
    const p = makeProperty({ rentToGender: 'female_only' });
    const m = scoreMatch(p, { selfGender: 'ذكر', budgetMax: 10000 });
    expect(m.eligible).toBe(false);
    expect(m.score).toBe(0);
    expect(m.misses.join(' ')).toContain('بنات');
  });
});

describe('scoreMatch - preference weighting', () => {
  it('rewards a listing inside preferred area + budget + type', () => {
    const p = makeProperty({ area: 'المعادي · شارع 9', type: 'أوضة', price: 5000 });
    const prof: MatchProfile = { areas: ['المعادي'], budgetMax: 6000, lookingFor: ['أوضة'] };
    const m = scoreMatch(p, prof);
    expect(m.eligible).toBe(true);
    expect(m.score).toBeGreaterThan(90);
    expect(m.reasons).toContain('في منطقة بتحبها');
    expect(m.reasons).toContain('في حدود ميزانيتك');
  });

  it('penalizes an out-of-area, over-budget, wrong-type listing', () => {
    const p = makeProperty({ area: 'الإسكندرية · سموحة', type: 'شقة', price: 20000 });
    const prof: MatchProfile = { areas: ['المعادي'], budgetMax: 6000, lookingFor: ['أوضة'] };
    const m = scoreMatch(p, prof);
    expect(m.score).toBeLessThan(40);
    expect(m.misses).toContain('بره مناطقك المفضلة');
    expect(m.misses).toContain('أغلى من ميزانيتك');
  });

  it('gives partial credit when slightly over budget (within 15%)', () => {
    const p = makeProperty({ price: 6600, area: 'x', type: 'شقة' });
    const m = scoreMatch(p, { budgetMax: 6000 });
    expect(m.reasons).toContain('قريب من ميزانيتك شوية');
    expect(m.score).toBeGreaterThan(0);
  });

  it('scales must-have amenities by the fraction satisfied', () => {
    const p = makeProperty({ amenities: ['نت', 'تكييف'] });
    const prof: MatchProfile = { mustHaveAmenities: ['نت', 'تكييف', 'غسالة', 'أسانسير'] };
    const m = scoreMatch(p, prof);
    expect(m.reasons.join(' ')).toContain('2');
    expect(m.score).toBeGreaterThan(0);
    expect(m.score).toBeLessThan(100);
  });
});

describe('scoreMatch - fallbacks & bounds', () => {
  it('falls back to trust x10 when the renter set no preferences', () => {
    const p = makeProperty({ trust: 9 });
    const m = scoreMatch(p, {});
    expect(m.score).toBe(90);
    expect(m.reasons).toEqual([]);
    expect(m.eligible).toBe(true);
  });

  it('never returns a score above 100', () => {
    const p = makeProperty({
      area: 'المعادي',
      type: 'أوضة',
      price: 4000,
      amenities: ['نت', 'تكييف'],
      spec: { furnished: true },
      nearby: [{ type: 'مترو', name: 'المعادي', minutes: 5, line: 'الأول' }],
      rentToGender: 'male_only',
      beds: { available: 2 },
    });
    const prof: MatchProfile = {
      areas: ['المعادي'],
      budgetMax: 5000,
      lookingFor: ['أوضة'],
      nearMetro: true,
      metroLines: ['الأول'],
      maxWalkMinutes: 10,
      mustHaveAmenities: ['نت', 'تكييف'],
      furnishedPref: 'furnished',
      selfGender: 'ذكر',
    };
    const m = scoreMatch(p, prof);
    expect(m.score).toBeLessThanOrEqual(100);
    expect(m.score).toBeGreaterThan(95);
  });

  it('adds the availability nudge + reason when beds are free', () => {
    const p = makeProperty({ beds: { available: 1 }, area: 'x' });
    const m = scoreMatch(p, { budgetMax: 9000 });
    expect(m.reasons).toContain('فيه أماكن فاضية دلوقتي');
  });

  it('uses priceFrom over price when present (bed-level pricing)', () => {
    const p = makeProperty({ price: 20000, priceFrom: 3000, area: 'x' });
    const m = scoreMatch(p, { budgetMax: 4000 });
    expect(m.misses).not.toContain('أغلى من ميزانيتك');
    expect(m.reasons).toContain('في حدود ميزانيتك');
  });
});
