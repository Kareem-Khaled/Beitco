import {
  bayesianMean,
  computeQualityFromReviews,
  computeListingTrust,
  computeOwnerTrust,
  computeRenterReputation,
  computeResponseRate,
  TRUST_TUNING,
  TRUST_WEIGHTS,
  type QualityScores,
} from './trust.engine';

const fresh = () => new Date().toISOString();
const r = (rating: number, monthsLived = 8, createdAtISO?: string) => ({ rating, monthsLived, createdAtISO });

describe('bayesianMean', () => {
  it('returns the prior with no ratings', () => {
    expect(bayesianMean([])).toBe(TRUST_TUNING.globalMeanRating);
  });
  it('pulls a single extreme toward the prior', () => {
    const m = bayesianMean([10]);
    expect(m).toBeGreaterThan(TRUST_TUNING.globalMeanRating);
    expect(m).toBeLessThan(10);
  });
});

describe('computeQualityFromReviews (T-2)', () => {
  const fb: QualityScores = { internet: 8, safety: 8, noise: 8, maintenance: 8, cleanliness: 8 };
  it('uses fallback when no review scored a category', () => {
    expect(computeQualityFromReviews([{ scores: null }], fb)).toEqual(fb);
  });
  it('averages supplied categories', () => {
    const q = computeQualityFromReviews(
      [
        { scores: { internet: 9, safety: 7, noise: 6, maintenance: 8, cleanliness: 9 } },
        { scores: { internet: 7, safety: 9, noise: 8, maintenance: 8, cleanliness: 7 } },
      ],
      fb,
    );
    expect(q.internet).toBe(8);
    expect(q.noise).toBe(7);
  });
});

describe('computeListingTrust (T-1)', () => {
  it('first review moves the score (DoD)', () => {
    const before = computeListingTrust({ verified: true, reviews: [], responseRate: 90 });
    const after = computeListingTrust({ verified: true, reviews: [r(9, 8, fresh())], responseRate: 90 });
    expect(after.score).not.toBe(before.score);
  });
  it('Bayesian: 40x8.5 beats a single 10-star', () => {
    const one = computeListingTrust({ verified: true, reviews: [r(10, 6)], responseRate: 90 });
    const many = computeListingTrust({ verified: true, reviews: Array.from({ length: 40 }, () => r(8.5, 12)), responseRate: 90 });
    expect(many.score).toBeGreaterThan(one.score);
  });
  it('verification cap: unverified cannot exceed the cap', () => {
    const t = computeListingTrust({ verified: false, reviews: Array.from({ length: 40 }, () => r(9.5, 18, fresh())), responseRate: 95 });
    expect(t.score).toBeLessThanOrEqual(TRUST_TUNING.verificationCap);
    expect(t.capped).toBe(true);
  });
  it('verified with same inputs is not capped', () => {
    const t = computeListingTrust({ verified: true, reviews: Array.from({ length: 40 }, () => r(9.5, 18, fresh())), responseRate: 95 });
    expect(t.capped).toBe(false);
    expect(t.score).toBeGreaterThan(TRUST_TUNING.verificationCap);
  });
  it('higher response rate -> higher score', () => {
    const base = { verified: true, reviews: Array.from({ length: 10 }, () => r(8, 10, fresh())) };
    expect(computeListingTrust({ ...base, responseRate: 98 }).score).toBeGreaterThan(
      computeListingTrust({ ...base, responseRate: 40 }).score,
    );
  });
  it('weights sum to 1', () => {
    const total = TRUST_WEIGHTS.verification + TRUST_WEIGHTS.reviews + TRUST_WEIGHTS.tenure + TRUST_WEIGHTS.responsiveness + TRUST_WEIGHTS.recency;
    expect(Math.abs(total - 1)).toBeLessThan(1e-9);
  });
});

describe('computeOwnerTrust', () => {
  const accountCreatedAt = new Date(Date.now() - 2 * 365 * 86400000).toISOString();
  it('responsiveness affects score', () => {
    const hi = computeOwnerTrust({ verified: true, listingTrusts: [8.5, 8.2], responseRate: 100, accountCreatedAt });
    const lo = computeOwnerTrust({ verified: true, listingTrusts: [8.5, 8.2], responseRate: 0, accountCreatedAt });
    expect(hi.score).toBeGreaterThan(lo.score);
  });
  it('caps an unverified owner', () => {
    const t = computeOwnerTrust({ verified: false, listingTrusts: [9.5, 9.4], responseRate: 99, accountCreatedAt });
    expect(t.score).toBeLessThanOrEqual(TRUST_TUNING.verificationCap);
    expect(t.capped).toBe(true);
  });
});

describe('computeRenterReputation (T-4)', () => {
  it('smooths a single perfect review below 10', () => {
    const { score } = computeRenterReputation([10]);
    expect(score).toBeLessThan(10);
    expect(score).toBeGreaterThan(TRUST_TUNING.globalMeanRating);
  });
  it('weak renter sits below the prior', () => {
    expect(computeRenterReputation([4, 5, 5]).score).toBeLessThan(TRUST_TUNING.globalMeanRating);
  });
});

describe('computeResponseRate (T-3)', () => {
  it('undefined with no events', () => {
    expect(computeResponseRate([])).toBeUndefined();
  });
  it('100% when all answered within 24h', () => {
    const now = Date.now();
    const events = [{ firstRenterMessageAt: new Date(now - 3600000), firstOwnerReplyAt: new Date(now) }];
    expect(computeResponseRate(events)).toBe(100);
  });
  it('0% when answered late', () => {
    const now = Date.now();
    const events = [{ firstRenterMessageAt: new Date(now - 48 * 3600000), firstOwnerReplyAt: new Date(now) }];
    expect(computeResponseRate(events)).toBe(0);
  });
});
