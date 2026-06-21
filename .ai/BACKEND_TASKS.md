# Backend Task Board — Beitco

> **Active board for backend (`apps/api`) work.** Branch: `dev`. Update as work happens.
> Created June 17, 2026 · Aligned with `.ai/PRD.md`, `.ai/TRUST_SPEC.md`, and the working frontend (`apps/web`).
>
> **Context:** The frontend is a feature-complete prototype on a localStorage mock (`apps/web/src/lib/beitco/`). The backend was originally a social/video platform; on `dev` we removed the social modules and kept the housing-relevant ones — but they target a **pre-pivot Prisma schema**. The mission of this phase: make the trust-first bed-level marketplace **real on a server**, with the frontend reading/writing the API instead of localStorage.
>
> **North star:** the frontend's mock store (`store.ts`) and pure engines (`trust.ts`, `matching.ts`) are the **executable spec** for the API. Port their shapes and logic; don't reinvent them.

---

## 🟢 In Progress

_(B-0 done — next up: B-0.1 seed parity, then B-1 listings read)_

---

## ✅ Done

### B-0 · Rewrite the Prisma schema to the bed-level + trust model ✅ (June 17)
- New `apps/api/prisma/schema.prisma`: **22 models, 21 enums**, mirroring `apps/web/src/lib/beitco/types.ts`. UUID PKs, `snake_case` columns via `@map`, soft deletes (`deleted_at`), PostGIS extension preserved.
- Models: `User`, `RenterProfile`, `Property` → `Room` → `Bed`, `Occupant` (consent link), `NearbyPlace`, `CustomSpec`, `Review` + `ReviewHelpfulVote`, `RenterReview`, `ResponseEvent`, `Question`, `Thread` + `Message`, `Lead` + `LeadUnit`, `Tenancy`, `SavedListing`, `SavedSearch`, `Notification`, `VerificationRequest`. Enums use Latin values (Arabic mapped in the app layer).
- `prisma validate` ✅, `prisma format` ✅, `prisma generate` ✅ (client exposes the new models; old social models gone).
- **Minimal compiling core:** the legacy social-coupled services were moved to `apps/api/src/_unported/` (excluded from `tsconfig` + `tsconfig.build`), `app.module.ts` trimmed to infra (Config, Throttler, Prisma, Health). `tsc --noEmit` ✅, `nest build` ✅ (dist = app.module/common/health/main/prisma only). The `_unported` modules are ported back onto the new schema one at a time (A-1, B-1, B-2, MOD-1…).
- ⏳ **`prisma migrate dev` not yet run** — needs a running Postgres (`docker compose up -d postgres`). The schema is validated and the client is generated; the first migration lands with B-0.1/B-1 once the DB is up.

---

## 🔥 Phase 0 — Foundation (do first, unblocks everything)

### B-0.1 · Seed parity ⭐ **NEXT**
- Port `apps/web/src/lib/beitco/seed-data.ts` into a Prisma seed so the API serves the same demo listings/users the frontend shows today (smooth swap from mock → API). Run the first `prisma migrate dev` here (needs Postgres up).

### B-0.2 · API response envelope + conventions
- Enforce `{ success, data, meta?: { cursor, hasMore }, error?: { code, message } }` globally (interceptor + exception filter). Cursor pagination only. `camelCase` JSON.

---

## 🔵 Phase 1 — Read path (frontend renders from the API)

### B-1 · Listings read API + wire the frontend
- Rework `listings` module to the new schema: `GET /properties` (cursor-paginated, filters mirroring search.tsx: type, purpose, gender, area, price, freeOnly, verifiedOnly, nightly), `GET /properties/:id`, `GET /properties/:id/similar`.
- Frontend: introduce a typed API client + TanStack Query; replace `getPublishedProperties`/`getProperty` reads. **UI must not change** — seed parity makes this invisible.
- **DoD:** home, search, and property detail render from Postgres; localStorage reads for listings removed.

### A-1 · Real phone OTP + JWT
- `auth` module already has OTP/JWT scaffolding — align to Egyptian numbers + the housing user/tier model. `POST /auth/otp/send`, `POST /auth/otp/verify` (real SMS gateway, dev bypass code), JWT in httpOnly cookie + refresh.
- Frontend: replace mock OTP in `lib/beitco/auth.tsx`; keep the same `useAuth` surface.
- **DoD:** real login issues a session; protected routes enforce it server-side.

---

## 🟠 Phase 2 — Write path (persist everything)

### B-2 · Persist core writes
- Endpoints + services for: create/edit listing (moderation-gated by verification — port `getInitialListingStatus`), reviews, Q&A (ask/answer), leads (viewing + bed-level booking), tenancies, saved listings, saved searches, occupant consent-linking.
- Frontend: swap each `store.ts` mutation for a mutation hook; optimistic where it makes sense.
- **DoD:** a full owner+renter journey persists across sessions/devices.

### MOD-1 · Moderation queue (server-side)
- Port the frontend's MOD-1: unverified owners' listings → `pending_approval`; admin queue endpoints (`GET /admin/moderation`, approve, reject-with-reason); only `published` appears in public reads. `moderation`/`admin` modules already have most of this — align to listing approval.

### T-PORT · Port the trust + matching engines to services
- Move `trust.ts` (T-1→T-5) and `matching.ts` into NestJS services (they're already pure — near-direct port). Recompute on review/reply/verification/booking; persist `trustBreakdown`. Expose `GET /properties/:id/trust`.
- Add the **same unit tests** (Jest) the frontend has (Vitest) — Bayesian smoothing, verification cap, response rate, reputation, matching eligibility.
- **DoD:** posting a review via the API moves the score; the 31-equivalent tests pass server-side.

### N-1 · Notifications (real)
- Derive/persist notifications for leads, messages, review-eligibility, verification, occupant links. SMS/email/push channels (response-rate metric depends on real message timing).

---

## 🟣 Phase 3 — Scale & monetize

### S-1 · Meilisearch-backed search
- Reindex bed-level listings; move search filters/sort from in-memory to Meilisearch. `search` module exists — point it at the new `Property` index.

### MED-1 · Media to object storage
- S3/R2 presigned upload for listing photos + KYC docs; replace data-URL images. Serve responsive sizes (frontend already has `OptimizedImage`).

### PAY-1 · Payments
- Build out the stub `payments` module: verified-owner subscription (299 EGP/mo) + 5% success fee on ≥30-day move-ins. Egyptian gateway (Paymob/Fawry).

### RT-1 · Realtime chat
- Wire the `chat` Socket.io gateway to the frontend messaging; presence + unread; feeds `ResponseEvent` timing for T-3.

---

## 🛠 Backend Tech Debt / Cleanup

- [x] ✅ Removed social/video modules (posts, comments, social, likes, feed, groups, videos) on `dev`.
- [ ] Rewrite `schema.prisma` (B-0) — until then the schema still carries dead social models.
- [ ] Trim `admin`/`moderation` report types to housing (drop post/comment/video reports).
- [ ] Reconcile/rewrite `.ai/ARCHITECTURE.md`, `DB_SCHEMA.md`, `API_SPEC.md` (currently pre-pivot — flagged stale).
- [ ] `docker compose up -d` reliability for Redis/Meilisearch; add a `pnpm api:infra` helper.
- [ ] Delete `apps/api/test-auth-flow.mjs` if superseded by proper e2e tests.
- [ ] Port frontend's Vitest engine tests to Jest in the API (T-PORT).

---

## Build order (recommended)

1. **B-0** schema rewrite → **B-0.1** seed → **B-0.2** envelope
2. **B-1** listings read + wire FE → **A-1** auth
3. **B-2** writes → **MOD-1** moderation → **T-PORT** trust/matching → **N-1** notifications
4. **S-1** search → **MED-1** media → **PAY-1** payments → **RT-1** realtime

> Keep the frontend green at every step: each phase swaps a slice of `store.ts` for the API behind the same hook surface, so the UI never regresses.
