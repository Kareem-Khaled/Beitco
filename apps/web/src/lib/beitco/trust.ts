// Trust engine (T-1 / T-2). Pure, deterministic functions that turn real
// activity — verification, resident reviews, tenure, responsiveness, recency —
// into an explainable 0–10 trust score. No localStorage here: `store.ts` calls
// these and persists the result. Spec: `.ai/TRUST_SPEC.md`.
//
// Principle: trust must be earned, computed, and explainable. Money can never
// buy a higher score, and every score exposes *why* via `TrustBreakdown`.

import type { Review, QualityScores, TrustBreakdown } from "./types";

// ── Tunable weights (sum to 1.0) ──────────────────────────────────────────────
// Calibrate here without touching formulas. Resident reviews dominate because
// they are the hardest signal to fake and the most predictive of real quality.
export const TRUST_WEIGHTS = {
  verification: 0.22,
  reviews: 0.42,
  tenure: 0.12,
  responsiveness: 0.16,
  recency: 0.08,
} as const;

// ── Tuning constants ──────────────────────────────────────────────────────────
export const TRUST_TUNING = {
  globalMeanRating: 7.5, // m — prior mean every listing is pulled toward
  confidence: 5, // C — "virtual" reviews; higher = slower to trust low volume
  tenureCapMonths: 24, // months-lived that counts as a full tenure signal
  verificationCap: 7.0, // unverified listings/owners can't exceed this
  recencyHalfLifeDays: 180, // a review's recency weight halves every ~6 months
  recencyFloor: 0.3, // never let recency fully zero out an established place
  neutralTenure: 0.5, // when there are no reviews to measure tenure
  neutralRecency: 0.7, // when no machine-readable review date exists
  neutralResponsiveness: 0.7, // when an owner has no response-rate signal yet
} as const;

// ── Small numeric helpers ─────────────────────────────────────────────────────
const clamp01 = (n: number): number => Math.max(0, Math.min(1, n));
const round1 = (n: number): number => Math.round(n * 10) / 10;
const round2 = (n: number): number => Math.round(n * 100) / 100;

/**
 * Bayesian-smoothed mean of 0–10 ratings. Pulls low-volume listings toward the
 * global mean until they earn enough reviews — this is what kills the
 * "1 fake 10-star review looks perfect" exploit.
 *
 *   smoothed = (C·m + Σ ratings) / (C + n)
 */
export function bayesianMean(
  ratings: number[],
  m: number = TRUST_TUNING.globalMeanRating,
  C: number = TRUST_TUNING.confidence,
): number {
  const n = ratings.length;
  const sum = ratings.reduce((s, r) => s + r, 0);
  return (C * m + sum) / (C + n);
}

const QUALITY_KEYS = ["internet", "safety", "noise", "maintenance", "cleanliness"] as const;

/**
 * (T-2) Derive per-category quality from review `scores`, averaging each
 * category across the reviews that supplied it. Falls back to the seed/hand-set
 * quality for any category no review has rated yet.
 */
export function computeQualityFromReviews(
  reviews: Pick<Review, "scores">[],
  fallback: QualityScores,
): QualityScores {
  const out = { ...fallback };
  for (const key of QUALITY_KEYS) {
    const vals = reviews
      .map((r) => r.scores?.[key])
      .filter((v): v is number => typeof v === "number");
    if (vals.length > 0) {
      out[key] = round1(vals.reduce((s, v) => s + v, 0) / vals.length);
    }
  }
  return out;
}

/** Recency weight from the newest machine-readable review date (exp. decay). */
function recencyFromReviews(reviews: Pick<Review, "createdAtISO">[]): number {
  const times = reviews
    .map((r) => (r.createdAtISO ? new Date(r.createdAtISO).getTime() : NaN))
    .filter((t) => !Number.isNaN(t));
  if (times.length === 0) return TRUST_TUNING.neutralRecency;
  const newest = Math.max(...times);
  const ageDays = Math.max(0, (Date.now() - newest) / 86400000);
  const decayed = Math.pow(0.5, ageDays / TRUST_TUNING.recencyHalfLifeDays);
  return Math.max(TRUST_TUNING.recencyFloor, clamp01(decayed));
}

export type ListingTrustInput = {
  verified: boolean;
  reviews: Pick<Review, "rating" | "monthsLived" | "createdAtISO">[];
  responseRate?: number; // owner's 0–100 response rate
};

/**
 * (T-1) Compute a listing's 0–10 trust score with a transparent breakdown.
 * Unverified listings are hard-capped at `verificationCap`, so verification is
 * a real gate — not just a badge.
 */
export function computeListingTrust(input: ListingTrustInput): TrustBreakdown {
  const { verified, reviews, responseRate } = input;
  const n = reviews.length;

  // Normalized 0–1 factors.
  const verificationNorm = verified ? 1 : 0;
  const reviewsNorm = clamp01(bayesianMean(reviews.map((r) => r.rating)) / 10);
  const tenureNorm =
    n > 0
      ? clamp01(
          reviews.reduce((s, r) => s + r.monthsLived, 0) / n / TRUST_TUNING.tenureCapMonths,
        )
      : TRUST_TUNING.neutralTenure;
  const responsivenessNorm =
    typeof responseRate === "number"
      ? clamp01(responseRate / 100)
      : TRUST_TUNING.neutralResponsiveness;
  const recencyNorm = recencyFromReviews(reviews);

  const components = {
    verification: round2(TRUST_WEIGHTS.verification * verificationNorm * 10),
    reviews: round2(TRUST_WEIGHTS.reviews * reviewsNorm * 10),
    tenure: round2(TRUST_WEIGHTS.tenure * tenureNorm * 10),
    responsiveness: round2(TRUST_WEIGHTS.responsiveness * responsivenessNorm * 10),
    recency: round2(TRUST_WEIGHTS.recency * recencyNorm * 10),
  };

  const raw =
    components.verification +
    components.reviews +
    components.tenure +
    components.responsiveness +
    components.recency;

  const capped = !verified && raw > TRUST_TUNING.verificationCap;
  const score = round1(capped ? TRUST_TUNING.verificationCap : raw);

  return {
    score,
    components,
    reviewsCount: n,
    capped,
    updatedAt: new Date().toISOString(),
  };
}

export type OwnerTrustInput = {
  verified: boolean;
  listingTrusts: number[]; // computed 0–10 trust of each listing they own
  responseRate?: number; // 0–100
  accountCreatedAt?: string; // ISO
};

// Owner-side weights (sum to 1.0). Their listings' aggregate trust dominates.
const OWNER_WEIGHTS = {
  verification: 0.15,
  listings: 0.5, // maps to the `reviews` breakdown slot
  tenure: 0.1, // account age
  responsiveness: 0.25,
} as const;

/**
 * (T-1) Owner/landlord trust: a blend of how trusted their listings are, how
 * responsive they are, whether they're verified, and account tenure. Reuses the
 * shared `TrustBreakdown` shape (the `reviews` slot carries listings-aggregate,
 * `recency` is left neutral for owners).
 */
export function computeOwnerTrust(input: OwnerTrustInput): TrustBreakdown {
  const { verified, listingTrusts, responseRate, accountCreatedAt } = input;

  const verificationNorm = verified ? 1 : 0;
  const listingsNorm =
    listingTrusts.length > 0
      ? clamp01(listingTrusts.reduce((s, t) => s + t, 0) / listingTrusts.length / 10)
      : 0.6;
  const responsivenessNorm =
    typeof responseRate === "number"
      ? clamp01(responseRate / 100)
      : TRUST_TUNING.neutralResponsiveness;
  const accountYears = accountCreatedAt
    ? Math.max(0, (Date.now() - new Date(accountCreatedAt).getTime()) / (365 * 86400000))
    : NaN;
  const tenureNorm = Number.isNaN(accountYears) ? 0.5 : clamp01(accountYears / 2);

  const components = {
    verification: round2(OWNER_WEIGHTS.verification * verificationNorm * 10),
    reviews: round2(OWNER_WEIGHTS.listings * listingsNorm * 10),
    tenure: round2(OWNER_WEIGHTS.tenure * tenureNorm * 10),
    responsiveness: round2(OWNER_WEIGHTS.responsiveness * responsivenessNorm * 10),
    recency: 0,
  };

  const raw =
    components.verification + components.reviews + components.tenure + components.responsiveness;

  const capped = !verified && raw > TRUST_TUNING.verificationCap;
  const score = round1(capped ? TRUST_TUNING.verificationCap : raw);

  return {
    score,
    components,
    reviewsCount: listingTrusts.length,
    capped,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * (T-4) Renter reputation: a 0–10 Bayesian-smoothed average of the overall
 * ratings owners gave the renter. Same smoothing as listings, so a renter with
 * one glowing review doesn't outrank one with a long solid history, and a
 * brand-new renter sits near the neutral prior rather than at 0.
 */
export function computeRenterReputation(ownerRatings: number[]): {
  score: number;
  count: number;
} {
  const count = ownerRatings.length;
  const score = round1(bayesianMean(ownerRatings));
  return { score, count };
}
