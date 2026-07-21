import { describe, it, expect } from "vitest";
import {
  bayesianMean,
  computeQualityFromReviews,
  computeListingTrust,
  computeOwnerTrust,
  computeRenterReputation,
  TRUST_TUNING,
  TRUST_WEIGHTS,
  type ListingTrustInput,
} from "./trust";
import type { Review, QualityScores } from "./types";

// Helper to build a minimal review for listing-trust inputs.
const r = (rating: number, monthsLived = 8, createdAtISO?: string) =>
  ({ rating, monthsLived, createdAtISO }) as Pick<
    Review,
    "rating" | "monthsLived" | "createdAtISO"
  >;

const fresh = () => new Date().toISOString();

describe("bayesianMean", () => {
  it("returns the global prior when there are no ratings", () => {
    expect(bayesianMean([])).toBe(TRUST_TUNING.globalMeanRating);
  });

  it("pulls a single extreme rating toward the prior", () => {
    const m = bayesianMean([10]);
    // With C=5 virtual reviews at m=7.5: (5*7.5 + 10) / 6 = 7.916…
    expect(m).toBeGreaterThan(TRUST_TUNING.globalMeanRating);
    expect(m).toBeLessThan(10);
  });

  it("converges toward the true mean as volume grows", () => {
    const many = bayesianMean(Array.from({ length: 100 }, () => 9));
    expect(many).toBeGreaterThan(8.7); // close to 9, prior barely matters now
  });
});

describe("computeQualityFromReviews (T-2)", () => {
  const fallback: QualityScores = {
    internet: 8,
    safety: 8,
    noise: 8,
    maintenance: 8,
    cleanliness: 8,
  };

  it("uses the fallback when no review scored a category", () => {
    const q = computeQualityFromReviews([{ scores: undefined }], fallback);
    expect(q).toEqual(fallback);
  });

  it("averages each category across reviews that supplied it", () => {
    const q = computeQualityFromReviews(
      [
        { scores: { internet: 9, safety: 7, noise: 6, maintenance: 8, cleanliness: 9 } },
        { scores: { internet: 7, safety: 9, noise: 8, maintenance: 8, cleanliness: 7 } },
      ],
      fallback,
    );
    expect(q.internet).toBe(8); // (9+7)/2
    expect(q.safety).toBe(8); // (7+9)/2
    expect(q.noise).toBe(7); // (6+8)/2
  });

  it("falls back per-category when only some reviews score it", () => {
    const q = computeQualityFromReviews([{ scores: { internet: 6 } as QualityScores }], fallback);
    expect(q.internet).toBe(6); // supplied
    expect(q.safety).toBe(8); // fallback
  });
});

describe("computeListingTrust (T-1)", () => {
  it("DoD: posting the first review moves the score", () => {
    const before = computeListingTrust({ verified: true, reviews: [], responseRate: 90 });
    const after = computeListingTrust({
      verified: true,
      reviews: [r(9, 8, fresh())],
      responseRate: 90,
    });
    expect(after.score).not.toBe(before.score);
  });

  it("Bayesian smoothing: a 40×8.5 listing outscores a single 10★", () => {
    const oneTen = computeListingTrust({ verified: true, reviews: [r(10, 6)], responseRate: 90 });
    const manySolid = computeListingTrust({
      verified: true,
      reviews: Array.from({ length: 40 }, () => r(8.5, 12)),
      responseRate: 90,
    });
    expect(manySolid.score).toBeGreaterThan(oneTen.score);
  });

  it("verification cap: an unverified listing cannot exceed the cap", () => {
    const strongUnverified = computeListingTrust({
      verified: false,
      reviews: Array.from({ length: 40 }, () => r(9.5, 18, fresh())),
      responseRate: 95,
    });
    expect(strongUnverified.score).toBeLessThanOrEqual(TRUST_TUNING.verificationCap);
    expect(strongUnverified.capped).toBe(true);
  });

  it("a verified listing with the same inputs is NOT capped", () => {
    const verified = computeListingTrust({
      verified: true,
      reviews: Array.from({ length: 40 }, () => r(9.5, 18, fresh())),
      responseRate: 95,
    });
    expect(verified.capped).toBe(false);
    expect(verified.score).toBeGreaterThan(TRUST_TUNING.verificationCap);
  });

  it("exposes a breakdown whose components sum (≈) to the score when uncapped", () => {
    const b = computeListingTrust({
      verified: true,
      reviews: Array.from({ length: 10 }, () => r(8, 10, fresh())),
      responseRate: 88,
    });
    const sum =
      b.components.verification +
      b.components.reviews +
      b.components.tenure +
      b.components.responsiveness +
      b.components.recency;
    expect(Math.abs(sum - b.score)).toBeLessThanOrEqual(0.1);
  });

  it("a higher response rate yields a higher (or equal) score, all else equal", () => {
    const base: Omit<ListingTrustInput, "responseRate"> = {
      verified: true,
      reviews: Array.from({ length: 10 }, () => r(8, 10, fresh())),
    };
    const low = computeListingTrust({ ...base, responseRate: 40 });
    const high = computeListingTrust({ ...base, responseRate: 98 });
    expect(high.score).toBeGreaterThan(low.score);
  });

  it("weights sum to 1.0 (calibration invariant)", () => {
    const total =
      TRUST_WEIGHTS.verification +
      TRUST_WEIGHTS.reviews +
      TRUST_WEIGHTS.tenure +
      TRUST_WEIGHTS.responsiveness +
      TRUST_WEIGHTS.recency;
    expect(Math.abs(total - 1)).toBeLessThan(1e-9);
  });
});

describe("computeOwnerTrust (T-1/T-3)", () => {
  const accountCreatedAt = new Date(Date.now() - 2 * 365 * 86400000).toISOString();

  it("responsiveness materially affects owner trust", () => {
    const responsive = computeOwnerTrust({
      verified: true,
      listingTrusts: [8.5, 8.2],
      responseRate: 100,
      accountCreatedAt,
    });
    const ghoster = computeOwnerTrust({
      verified: true,
      listingTrusts: [8.5, 8.2],
      responseRate: 0,
      accountCreatedAt,
    });
    expect(responsive.score).toBeGreaterThan(ghoster.score);
    expect(responsive.components.responsiveness).toBeGreaterThan(ghoster.components.responsiveness);
  });

  it("caps an unverified owner at the verification cap", () => {
    const t = computeOwnerTrust({
      verified: false,
      listingTrusts: [9.5, 9.4],
      responseRate: 99,
      accountCreatedAt,
    });
    expect(t.score).toBeLessThanOrEqual(TRUST_TUNING.verificationCap);
    expect(t.capped).toBe(true);
  });
});

describe("computeRenterReputation (T-4)", () => {
  it("smooths a single perfect review below 10", () => {
    const { score, count } = computeRenterReputation([10]);
    expect(count).toBe(1);
    expect(score).toBeLessThan(10);
    expect(score).toBeGreaterThan(TRUST_TUNING.globalMeanRating);
  });

  it("a long solid history outranks one glowing review", () => {
    const oneGreat = computeRenterReputation([10]).score;
    const longGood = computeRenterReputation([9, 9, 9, 8, 9, 9, 8, 9]).score;
    expect(longGood).toBeGreaterThan(oneGreat);
  });

  it("a weak renter sits below the neutral prior", () => {
    const { score } = computeRenterReputation([4, 5, 5]);
    expect(score).toBeLessThan(TRUST_TUNING.globalMeanRating);
  });
});
