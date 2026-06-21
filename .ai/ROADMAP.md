# Roadmap — Beitco

> 90-day plan from June 2026.
> Bias toward shipping the smallest thing that proves trust > supply.

---

## Phase 0 · Foundation (✅ done)
- Repo, monorepo, frontend design system, Arabic RTL, mock UI for browse + detail.

---

## Phase 1 · Make It Real (June – July 2026)
**Goal:** A logged-in renter can browse real listings backed by Postgres, and an owner can post a listing.

### Milestones
- [ ] **M1.1 — API live**: `GET /properties`, `GET /properties/:id` returning seeded data.
- [ ] **M1.2 — Frontend wired**: TanStack Query consuming API; mock file deleted.
- [ ] **M1.3 — Phone OTP auth**: signup/login flow live; JWT in cookies.
- [ ] **M1.4 — Post listing**: `/list/new` multi-step form → DB row → moderation queue.
- [ ] **M1.5 — Photo upload**: S3/R2 presigned URLs; up to 8 photos per listing.

**Definition of done:** A real owner can sign up, list an apartment with beds, and a real renter can find and view it.

---

## Phase 2 · Make It Trustworthy (Aug 2026)
**Goal:** Trust score is computed, not hardcoded. Reviews are gated by real residency.

### Milestones
- [ ] **M2.1 — Tenancy model**: `tenancy` table tracks who lived where, when (manually entered for beta).
- [ ] **M2.2 — Review posting**: gated by tenancy ≥30d; renter form on property page.
- [ ] **M2.3 — Trust score engine**: BullMQ hourly job; persisted score; explainer popover ("Why this score?").
- [ ] **M2.4 — Verification flow**: owner uploads ID + property doc → admin approves → verified badge.
- [ ] **M2.5 — Q&A**: post questions/answers on property pages.

**Definition of done:** A property's trust score visibly improves when its first 5-star review lands.

---

## Phase 3 · Make It Match (Sept 2026)
**Goal:** Search and messaging close the loop from "browse" to "move-in".

### Milestones
- [ ] **M3.1 — Meilisearch**: full-text + faceted search live; <100ms p95.
- [ ] **M3.2 — Filters with URL state**: shareable filtered URLs.
- [ ] **M3.3 — Messaging**: thread per property; "اطلب معاينة" creates structured first message.
- [ ] **M3.4 — Notifications**: SMS to owner on new lead; email to renter on owner reply.
- [ ] **M3.5 — Owner dashboard**: leads, response-rate, listing analytics.

**Definition of done:** A renter searches "أوضة في المعادي تحت 5000", finds 3 results, messages an owner, and gets an SMS-prompted reply within 24h.

---

## Phase 4 · Make It Pay (Oct – Nov 2026)
**Goal:** Verified subscription live, success-fee plumbing in place.

### Milestones
- [ ] **M4.1 — Stripe / Paymob integration** for owner subscriptions (EGP).
- [ ] **M4.2 — Verified subscription tier** with priority placement.
- [ ] **M4.3 — Move-in tracking**: when review eligibility unlocks, log a "match" event.
- [ ] **M4.4 — Success fee invoice generation** (manually settled in v1).
- [ ] **M4.5 — Public marketing site / SEO landing pages** for top areas (Maadi, 5th Settlement, etc.).

**Definition of done:** First paid owner subscription processed; first invoiced success fee.

---

## Phase 5 · Make It Mobile (Dec 2026 +)
- [ ] Capacitor wrap → iOS + Android stores
- [ ] Native push notifications
- [ ] Camera capture for listing photos

---

## Long-Term Bets (2027+)
- Compound-level reputation pages (Madinaty, Mountain View, Palm Hills, etc.)
- Neighborhood community feeds
- Mux video tours
- In-app deposit escrow (regulatory permitting)
- Expansion to Dubai / Saudi for Egyptian expat coliving
- Trust score API for banks/HR doing tenant background checks

---

## What Could Kill This (and how we mitigate)

| Risk | Mitigation |
|---|---|
| Owners refuse to give up control to a "trust score" | Free for first 6 months + clear explainer + only positive scores published initially |
| Fake reviews | Tenancy gate + admin moderation + ban policy |
| Insufficient supply at launch | Seed first 100 listings manually via field team in Maadi/5th Settlement |
| Facebook groups remain stickier | SEO + Egyptian Arabic content moat + verified badge becomes status symbol |
| Regulatory pressure on online rentals | Stay long-term only; no escrow; partner with a licensed brokerage for v2 |
