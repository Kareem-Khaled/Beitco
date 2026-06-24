# Roadmap — Beitco

> **Last updated:** June 24, 2026. Bias toward shipping the smallest thing that proves trust > supply.
> For the granular, prioritized backlog see **`.ai/NEXT_STEPS.md`**; for the go-live checklist see **`.ai/PROD_READINESS.md`**. This file is the high-level phase view.

---

## Where we are

Phases 0–3 are **functionally done** — the trust-first bed-level marketplace works end-to-end against a real NestJS + Postgres backend (behind the `VITE_USE_API` flag). The trust wedge is computed and proven (reviews and response-rate move scores). What's left to launch is **hardening** (Phase 3.5), then **payments** (Phase 4) and **mobile** (Phase 5).

---

## Phase 0 · Foundation ✅
- Monorepo (Turborepo + pnpm), design system, Arabic RTL, mock UI for browse + detail.

## Phase 1 · Make It Real ✅
**A logged-in renter browses real listings backed by Postgres; an owner posts one.**
- ✅ Listings read API (`GET /properties`, `/properties/:id`), cursor-paginated + filterable.
- ✅ Frontend wired via TanStack Query behind `VITE_USE_API` (mock kept as the default fallback).
- ✅ Phone-OTP auth + JWT in httpOnly cookies; profile completion.
- ✅ Post/edit listing (the `حط شقتك` wizard) → DB → moderation gate.
- ✅ **Photo upload** — presigned S3/R2 pipeline with a downscaled-base64 fallback (**PROD-1**).

## Phase 2 · Make It Trustworthy ✅
**Trust is computed, not hardcoded; reviews are gated by real residency.**
- ✅ Tenancy model (lead-complete → confirmed tenancy).
- ✅ Resident review posting, gated by a 30-day tenancy — **and it moves the score**.
- ✅ Trust engine (T-1→T-5): listing/owner/renter scores, Bayesian smoothing, verification cap, real response-rate (T-3 `ResponseEvent`s), two-sided reputation (T-4), transparency popover (T-5). Recompute on the relevant writes.
- ✅ Q&A on property pages.
- ✅ **Verification (KYC)** — submit ID/selfie/ownership docs → admin review → `verified` + trust bonus (**PROD-5**).

## Phase 3 · Make It Match ✅
**Search + messaging close the loop from browse to move-in.**
- ✅ Filters with shareable URL state.
- ✅ Messaging: thread per property, "اطلب معاينة" creates a structured first message; **live delivery via Socket.io**; T-3 response events feed trust.
- ✅ Notifications: in-app derived feed + **saved-search "هنبلّغك" alerts** on publish/approve.
- ✅ Owner dashboard: leads, response-rate, listing management + analytics.
- ✅ Matching engine: ranked, explainable `/me/matches` from saved renter preferences.
- ✅ **Meilisearch** (typo-tolerant Arabic `q`, **PROD-3**) + **PostGIS geo** radius / "قريب مني" (`lat`/`lng`/`radiusKm`, **PROD-4**) — both **live**. **SMS** gateway on OTP — **PROD-2**.

---

## Phase 3.5 · Make It Solid ✅
**Goal:** production-grade hardening so the end-to-end app can safely go live. **The full hardening backlog (P0→P2) is complete — see `.ai/NEXT_STEPS.md`.**
- ✅ **P0 security:** secrets fail-fast, `helmet`, readiness health (DB+Redis), OTP rate-limit.
- ✅ **P1 shippable:** API ESLint + fixed CI, Dockerfiles (boot-verified), CD + migrations-on-deploy, e2e suite (19), structured pino logging + Sentry.
- ✅ **P2 product:** image-upload pipeline (PROD-1), real OTP/SMS gateway (PROD-2), Meilisearch (PROD-3), PostGIS geo (PROD-4), verification/KYC (PROD-5).
- **Definition of done:** a tagged release builds images, runs migrations + an e2e suite against a real DB, deploys to staging, and reports errors/metrics. _(Remaining: a real deploy host + P3 polish — both optional.)_

## Phase 4 · Make It Pay (after hardening) 💸
- Paymob/Stripe (EGP) for verified-owner subscriptions; success-fee plumbing; move-in/match events; SEO landing pages for top areas (Maadi, 5th Settlement…). See `.ai/BUSINESS_MODEL.md`.
- **Definition of done:** first paid owner subscription processed; first invoiced success fee.

## Phase 5 · Make It Mobile 📱
- Capacitor wrap → iOS/Android stores; native push (FCM); camera capture for listing photos.

---

## Long-Term Bets (2027+)
- Compound-level reputation pages (Madinaty, Mountain View, Palm Hills…).
- Neighborhood community feeds · Mux video tours · in-app deposit escrow (regulatory permitting).
- Expansion to Dubai / Saudi for Egyptian expat coliving.
- Trust-score API for banks/HR doing tenant background checks.

---

## What Could Kill This (and how we mitigate)

| Risk | Mitigation |
|---|---|
| Owners refuse to give up control to a "trust score" | Free for the first 6 months + clear explainer + only positive scores published initially. |
| Fake reviews | Tenancy gate (30 days) + admin moderation + ban policy. |
| Insufficient supply at launch | Seed the first 100 listings manually via a field team in Maadi/5th Settlement. |
| Facebook groups stay stickier | SEO + Egyptian-Arabic content moat + the verified badge as a status symbol. |
| Regulatory pressure on online rentals | Long-term only; no escrow in v1; partner with a licensed brokerage for v2. |
