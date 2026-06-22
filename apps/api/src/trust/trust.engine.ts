// Trust engine (T-1..T-4) ported from apps/web/src/lib/beitco/trust.ts.
// Pure, deterministic, framework-free. trust.service.ts reads from Prisma,
// calls these, and persists the result. Spec: .ai/TRUST_SPEC.md.

export interface QualityScores {
  internet: number;
  safety: number;
  noise: number;
  maintenance: number;
  cleanliness: number;
}

export interface TrustBreakdown {
  score: number;
  components: {
    verification: number;
    reviews: number;
    tenure: number;
    responsiveness: number;
    recency: number;
  };
  reviewsCount: number;
  capped: boolean;
  updatedAt: string;
}

// Weights sum to 1.0. Resident reviews dominate (hardest to fake).
export const TRUST_WEIGHTS = {
  verification: 0.22,
  reviews: 0.42,
  tenure: 0.12,
  responsiveness: 0.16,
  recency: 0.08,
} as const;

export const TRUST_TUNING = {
  globalMeanRating: 7.5,
  confidence: 5,
  tenureCapMonths: 24,
  verificationCap: 7.0,
  recencyHalfLifeDays: 180,
  recencyFloor: 0.3,
  neutralTenure: 0.5,
  neutralRecency: 0.7,
  neutralResponsiveness: 0.7,
} as const;

const OWNER_WEIGHTS = {
  verification: 0.15,
  listings: 0.5,
  tenure: 0.1,
  responsiveness: 0.25,
} as const;

const clamp01 = (n: number): number => Math.max(0, Math.min(1, n));
const round1 = (n: number): number => Math.round(n * 10) / 10;
const round2 = (n: number): number => Math.round(n * 100) / 100;

// Bayesian-smoothed mean: pulls low-volume listings toward the global prior,
// killing the "1 fake 10-star looks perfect" exploit.
export function bayesianMean(
  ratings: number[],
  m: number = TRUST_TUNING.globalMeanRating,
  C: number = TRUST_TUNING.confidence,
): number {
  const n = ratings.length;
  const sum = ratings.reduce((s, r) => s + r, 0);
  return (C * m + sum) / (C + n);
}

const QUALITY_KEYS: (keyof QualityScores)[] = [
  'internet',
  'safety',
  'noise',
  'maintenance',
  'cleanliness',
];

// (T-2) Average each quality category across reviews that scored it; fall back
// per-category to the provided defaults.
export function computeQualityFromReviews(
  reviews: { scores?: Partial<QualityScores> | null }[],
  fallback: QualityScores,
): QualityScores {
  const out: QualityScores = { ...fallback };
  for (const key of QUALITY_KEYS) {
    const vals = reviews
      .map((r) => r.scores?.[key])
      .filter((v): v is number => typeof v === 'number');
    if (vals.length > 0) {
      out[key] = round1(vals.reduce((s, v) => s + v, 0) / vals.length);
    }
  }
  return out;
}

function recencyFromReviews(reviews: { createdAtISO?: string | null }[]): number {
  const times = reviews
    .map((r) => (r.createdAtISO ? new Date(r.createdAtISO).getTime() : NaN))
    .filter((t) => !Number.isNaN(t));
  if (times.length === 0) return TRUST_TUNING.neutralRecency;
  const newest = Math.max(...times);
  const ageDays = Math.max(0, (Date.now() - newest) / 86400000);
  const decayed = Math.pow(0.5, ageDays / TRUST_TUNING.recencyHalfLifeDays);
  return Math.max(TRUST_TUNING.recencyFloor, clamp01(decayed));
}

export interface ListingTrustInput {
  verified: boolean;
  reviews: { rating: number; monthsLived: number; createdAtISO?: string | null }[];
  responseRate?: number;
}

// (T-1) Listing trust 0-10 with an explainable breakdown. Unverified listings
// are hard-capped at the verification cap.
export function computeListingTrust(input: ListingTrustInput): TrustBreakdown {
  const { verified, reviews, responseRate } = input;
  const n = reviews.length;

  const verificationNorm = verified ? 1 : 0;
  const reviewsNorm = clamp01(bayesianMean(reviews.map((r) => r.rating)) / 10);
  const tenureNorm =
    n > 0
      ? clamp01(reviews.reduce((s, r) => s + r.monthsLived, 0) / n / TRUST_TUNING.tenureCapMonths)
      : TRUST_TUNING.neutralTenure;
  const responsivenessNorm =
    typeof responseRate === 'number'
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

  return { score, components, reviewsCount: n, capped, updatedAt: new Date().toISOString() };
}

export interface OwnerTrustInput {
  verified: boolean;
  listingTrusts: number[];
  responseRate?: number;
  accountCreatedAt?: string | Date;
}

// (T-1) Owner trust: blend of their listings' aggregate trust, responsiveness,
// verification, and account age.
export function computeOwnerTrust(input: OwnerTrustInput): TrustBreakdown {
  const { verified, listingTrusts, responseRate, accountCreatedAt } = input;

  const verificationNorm = verified ? 1 : 0;
  const listingsNorm =
    listingTrusts.length > 0
      ? clamp01(listingTrusts.reduce((s, t) => s + t, 0) / listingTrusts.length / 10)
      : 0.6;
  const responsivenessNorm =
    typeof responseRate === 'number'
      ? clamp01(responseRate / 100)
      : TRUST_TUNING.neutralResponsiveness;
  const created = accountCreatedAt ? new Date(accountCreatedAt).getTime() : NaN;
  const accountYears = Number.isNaN(created)
    ? NaN
    : Math.max(0, (Date.now() - created) / (365 * 86400000));
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

  return { score, components, reviewsCount: listingTrusts.length, capped, updatedAt: new Date().toISOString() };
}

// (T-4) Renter reputation: Bayesian-smoothed mean of owner ratings.
export function computeRenterReputation(ownerRatings: number[]): { score: number; count: number } {
  return { score: round1(bayesianMean(ownerRatings)), count: ownerRatings.length };
}

// Response rate (T-3): % of response events answered within 24h.
const RESPONSE_THRESHOLD_MS = 24 * 60 * 60 * 1000;
export function computeResponseRate(
  events: { firstRenterMessageAt: Date | string; firstOwnerReplyAt?: Date | string | null }[],
): number | undefined {
  if (events.length === 0) return undefined;
  const fast = events.filter(
    (e) =>
      e.firstOwnerReplyAt &&
      +new Date(e.firstOwnerReplyAt) - +new Date(e.firstRenterMessageAt) <= RESPONSE_THRESHOLD_MS,
  ).length;
  return Math.round((fast / events.length) * 100);
}
