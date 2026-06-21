# Trust System — Technical Spec

> **Status:** Prototype shipped (T-1 → T-5) · **Owner:** TBD · **Last updated:** June 17, 2026
> **Parent:** `.ai/PRD.md` §7. This spec turns the trust wedge from cosmetic (hardcoded seed values) into a real, computed, transparent system.
>
> **Build state:** The engine lives in `apps/web/src/lib/beitco/trust.ts` (pure functions) and is wired into `store.ts` (`recompute*Trust`, recompute-all on seed). Listing, owner & **renter** scores, Bayesian smoothing, the verification cap, quality-from-reviews, **real response-rate from `ResponseEvent` tracking (T-3)**, and **two-sided renter reputation (T-4)** are all **done**, with the transparency popover (T-5) showing live computed components. Only the owner "raise your score" actionable checklist remains before backend port.
>
> **Principle:** Trust must be *earned, computed, and explainable*. We never let money buy a higher score, and we always show *why* a score is what it is — same transparency ethos as the matching engine.

---

## 1. Problem

Today every `trust`, `responseRate`, and `quality.*` value is a hardcoded number in seed data (`store.ts`). Posting a review does **not** change any score. The product's entire differentiator is therefore non-functional. This spec defines the data, formulas, triggers, and UI to make it real.

---

## 2. Scope

In scope:
1. **Listing trust score** (per property, 0–10).
2. **Owner/landlord trust score** (per owner, 0–10) — aggregates their listings + behavior.
3. **Renter reputation** (per renter, 0–10) — new, closes the two-sided loop.
4. **Quality scores** (per property) — derived from review category ratings, not hand-set.
5. **Response rate** (per owner) — derived from real message/lead behavior.
6. **Transparency UI** — "ليه الدرجة دي؟" breakdown.

Out of scope (later): ML ranking, fraud-detection models, cross-listing collusion detection.

---

## 3. Data Model Changes

### 3.1 Property (additions)
```ts
type TrustBreakdown = {
  score: number;            // 0–10 computed
  components: {
    verification: number;   // contribution
    reviews: number;
    tenure: number;         // months-lived weight
    responsiveness: number;
    recency: number;
  };
  updatedAt: string;
};
// Property.trust stays (denormalized for cards); add:
// Property.trustBreakdown?: TrustBreakdown
```

### 3.2 Owner (User additions)
```ts
// User.trust stays; add:
// User.trustBreakdown?: TrustBreakdown
// User.responseRate?: number      // 0–100, computed
// User.renterReputation?: number  // 0–10, when role includes renter
```

### 3.3 Quality scores
Stop hand-setting `Property.quality`. Derive each category as the average of that category across the property's reviews (`Review.scores`). Keep a seed fallback only when `reviewsCount === 0`.

### 3.4 New: RenterReview
```ts
type RenterReview = {
  id: string;
  tenancyId: string;        // ties to a confirmed tenancy
  renterId: string;         // who is being reviewed
  ownerId: string;          // author (the owner)
  propertyId: string;
  rating: number;           // 1–10 overall
  scores: {
    reliability: number;    // paid on time, honored commitments
    cleanliness: number;
    communication: number;
  };
  body: string;
  date: string;
};
```

### 3.5 New: ResponseEvent (for response rate)
```ts
type ResponseEvent = {
  id: string;
  ownerId: string;
  threadId: string;
  firstRenterMessageAt: string;
  firstOwnerReplyAt?: string;   // undefined = not yet answered
};
```
Response rate = % of `ResponseEvent` where `firstOwnerReplyAt - firstRenterMessageAt <= 24h`.

---

## 4. Formulas

> All weights are **tunable constants** in one config object (`TRUST_WEIGHTS`) so we can calibrate without code changes.

### 4.1 Listing trust score (0–10)
```
listingTrust =
    w_verify   * verificationScore     // 0 or 1 → strong floor/boost
  + w_reviews  * reviewQuality         // Bayesian-smoothed avg rating
  + w_tenure   * tenureWeight          // longer avg months-lived = higher
  + w_resp     * responsivenessScore   // owner's response rate, normalized
  + w_recency  * recencyScore          // recent positive activity
```

**reviewQuality (Bayesian smoothing — avoids 1-review listings looking perfect):**
```
reviewQuality = (C * m + Σ ratings) / (C + n)
  where n = review count,
        m = global mean rating (e.g. 7.5),
        C = confidence constant (e.g. 5 "virtual" average reviews)
```
This pulls low-volume listings toward the mean until they earn enough reviews — directly fixes the "1 fake 10-star review" exploit.

**tenureWeight:** normalize avg months-lived across reviews to 0–1 (e.g. cap at 24 months).

**verificationScore:** `verified ? 1 : 0`. Unverified listings are capped (e.g. can't exceed 7.0) so verification is a real gate, not just a badge.

### 4.2 Owner trust score
Weighted blend of: average of their listings' trust, their response rate, their account tenure, and a penalty for unresolved reports.

### 4.3 Renter reputation
Bayesian-smoothed average of `RenterReview.rating`, same smoothing as listings. Shown to owners on incoming leads (privacy rules in §6).

---

## 5. Recompute Triggers

| Event | Recomputes |
|---|---|
| New review posted | property quality scores + property trust + owner trust |
| New renter review posted | renter reputation |
| Owner replies to a thread | response event closed → owner response rate + owner trust |
| Verification status changes | property trust + owner trust |
| Listing edited (status/price) | nothing (edits don't affect trust) |
| Nightly job (backend phase) | recency decay for all scores |

**Prototype:** recompute synchronously in `store.ts` on the triggering action.
**Backend phase:** BullMQ job + event-driven recompute; persist breakdown.

---

## 6. Privacy & Anti-Abuse

- **Renter reputation visibility:** owners see a renter's reputation *score* on a lead, but not individual review text from other owners (prevents blacklisting/retaliation chains). Renter can see their own reviews.
- **One review per tenancy** (both directions). Editable for 14 days.
- **Verification gate:** unverified listings capped at 7.0; never appear in "موثّق بس" filter.
- **No pay-to-rank:** promoted listings (future) respect a trust floor and are labeled.
- **Report/flag path** → moderation queue (separate spec).
- **Mutual-review reveal:** owner↔renter reviews hidden until both submit or a window closes (prevents tit-for-tat), à la Airbnb.

---

## 7. Transparency UI

- ✅ **Built (display-only):** the **"ليه الدرجة دي؟"** popover (`TrustBadgeExplained`) shows the component breakdown (verification, reviews count, response rate, residents) — live on the property trust section + `/u/$id` profile header. ⚠️ It currently surfaces the **hardcoded** values; once §4 lands it shows computed components.
- TODO: Property page link "إزاي بنحسب الثقة" → `/trust` wired to real components.
- TODO: Owner dashboard "إزاي تعلّي درجتك" actionable checklist driven by the *weakest* component.

---

## 8. Build Plan

**Prototype (localStorage, do first — proves the wedge):**
1. Add `TRUST_WEIGHTS` config + `computeListingTrust`, `computeOwnerTrust`, `computeRenterReputation` in `store.ts`.
2. Derive `quality` from reviews; Bayesian-smooth ratings.
3. Recompute on review/Q&A/response actions; persist breakdown in the property/user records.
4. Add `ResponseEvent` tracking in messaging.
5. Add renter-review flow (owner side, gated by tenancy).
6. Transparency popover + owner "raise your score" checklist.
7. Seed data: keep numbers but mark them as *initial*; let actions move them.

**Backend phase:** port formulas to a NestJS `TrustModule`; BullMQ recompute jobs; persist `trust_breakdown` JSON; expose `GET /properties/:id/trust`.

---

## 9. Acceptance Criteria

- Posting a property's **first** review **visibly changes** its trust score and quality bars.
- A 1-review 10-star listing scores **lower** than a 40-review 8.5-avg listing (Bayesian smoothing works).
- An unverified listing **cannot** exceed the verification cap and is **excluded** from "موثّق بس".
- An owner who never answers messages has a **falling** response rate and owner trust.
- Owners can review renters after a confirmed tenancy; renters have a visible reputation on leads.
- Every score has a **breakdown** the user can open.
