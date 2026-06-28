# Current State — Beitco

> **Last updated:** June 24, 2026 · branch: `dev`
> Honest snapshot of what's actually built and verified. For the prioritized "what's next" read **`.ai/NEXT_STEPS.md`**; for the **go-live checklist + deploy runbook** read **`.ai/PROD_READINESS.md`**; for the product vision read `.ai/PRD.md`; for the backend build log read `.ai/BACKEND_TASKS.md`.

---

## TL;DR

- **Full-stack, end-to-end.** The trust-first bed-level marketplace is real on a server. The frontend talks to a NestJS + Postgres API across **every core surface** — browse, auth, listings CRUD + moderation, leads, Q&A, reviews, matching, the owner dashboard, live chat, and notifications.
- **Behind a feature flag.** `VITE_USE_API` toggles the data source: **OFF (default)** = the byte-identical localStorage mock; **ON** = the live API. Both paths are kept identical so the prototype still runs with no backend.
- **The trust wedge is proven, not cosmetic.** Reviews move a listing's computed score (verified 8.3 → 5.2); an owner's first chat reply moves it up via real response-rate tracking (8.1 → 8.6). Nothing buys a higher score; every score is explainable.
- **Production-hardening is done.** P0 security (secrets fail-fast, helmet, readiness, OTP throttle), P1 shippability (API lint, CI/CD, Docker, e2e, pino logs, Sentry), and P2 product readiness (image uploads, real OTP/SMS, Meilisearch, PostGIS geo, KYC) are all shipped + verified.
- **What remains before launch:** **test depth** (most services lack isolated unit tests) and **a real deploy host** (the CI/CD pipeline + staging skeleton exist; the target isn't wired). See **`.ai/PROD_READINESS.md`**.

---

## Git & Branches

| Branch | Purpose |
|---|---|
| `old` | Full snapshot of everything before the June cleanup (social/video API, `web-old`, legacy docs). Nothing lost; restore from here if ever needed. |
| `main` | Production branch (promote from `dev` when ready). |
| `dev` | **Active.** All current work lives here. |

---

## ✅ Frontend — `apps/web/` (`tanstack_start_ts`)

**Stack:** TanStack Start (Vite + React 19), TypeScript strict, Tailwind v4, shadcn/ui, Arabic RTL (Egyptian dialect), Leaflet (maps), TanStack Query, socket.io-client, Vitest. Runs on `pnpm web` → http://localhost:8080. 40 routes, 70+ components.

**Built and wired (flag-aware via `lib/beitco/queries.ts`):**
- **Browse:** home, search (filters + URL state + sort + **server-side `q`** and **"قريب مني" geo radius** in API mode), property detail (gallery, trust section, quality scores, amenities, bed/room/whole occupancy, reviews, Q&A, map, nearby).
- **Auth:** phone-OTP login → profile completion; session via httpOnly cookie; `useAuth` branches mock/API.
- **Listings:** the `حط شقتك` multi-step wizard (create + edit, photos via the presigned-upload pipeline), owner dashboard (listings grid + pause/occupancy/sale-status, overview analytics, reviews, leads).
- **Engagement:** save listing, save search, request viewing / book specific beds-rooms, Q&A ask + owner answer, post review + helpful + owner reply, owner→renter review.
- **Matching:** renter preferences page → `/me/matches` (ranked, explainable).
- **Chat:** `/messages` + thread view, "كلّم صاحب الشقة", live updates via Socket.io.
- **Notifications:** bell badge + `/notifications` feed (leads, messages, review-eligibility, verification, saved-search alerts).
- **Verification (KYC):** `dashboard/verify` (upload ID/selfie/ownership docs → pending) + admin `dashboard/verifications` queue (approve/reject).
- **Admin:** moderation queue (`/dashboard/moderation`) + verifications queue, gated on `isPlatformAdmin`. **Operator portal** (`/admin`) — a 7-section control room for the Beitco team: overview/KPIs, analytics (time-series/funnel/supply-demand), users (ban/verify/make-admin), listings (force-takedown), reviews (remove→recompute trust), reports triage; every action audit-logged.
- **Platform:** dark mode, PWA manifest, mobile bottom-nav, accessibility pass (skip link, aria, focus management), maps (Leaflet pin-drop + Google embeds), public profiles.

**Tests:** 62 Vitest — pure engines (trust + matching) + the **flag-aware mock data layer** (browse + admin users/listings/content/analytics) + **component tests** (Testing Library + jsdom: `TrustBadge`/`EmptyState` renders, `BeitcoListingCard` listing render, `ReportButton` full report-flow interaction). `tsc` clean.

---

## ✅ Backend — `apps/api/` (NestJS 11)

**Stack:** NestJS 11, Prisma 6, PostgreSQL 16 + PostGIS, Redis (OTP + read-state), Meilisearch (search), S3/R2 (uploads), JWT/Passport (httpOnly cookies), Socket.io, class-validator, pino logs, Sentry, Swagger. Runs on `pnpm api` → http://localhost:3001 (`/api/v1`, Swagger at `/api/docs`).

**Modules (all built, type-check + build clean):**

| Module | What it does |
|---|---|
| `auth` | Phone OTP (Redis, dev code `123456`) + JWT access/refresh in httpOnly cookies; global `JwtAuthGuard` + `@Public()`; `complete-profile`, `me`, `refresh`, `logout`. |
| `listings` | Public reads (cursor-paginated, filterable + serializer) + writes (create/edit/delete, `GET /properties/mine` with owner-only occupant data, `PATCH /:id/manage` for pause/sale/occupancy). Moderation-gated on create. |
| `engagement` | Saved listings, saved searches, leads (create → owner approve → complete → tenancy), Q&A. Ownership-checked. |
| `reviews` | Resident review (30-day tenancy gate, moves trust), helpful toggle, owner reply, owner→renter review, `review-meta` (eligibility + helpful votes), `GET /:id/trust`. |
| `trust` | Pure engine (`trust.engine.ts`) + service that recomputes & persists from Prisma (listing/owner/renter scores, response rate from `ResponseEvent`s). |
| `matching` | Pure engine (`matching.engine.ts`) + `GET /me/matches`; renter-preferences persistence via `PATCH /users/me`. |
| `chat` | REST threads/messages (find-or-create, mark-read) + Socket.io gateway (`/ws/chat`, cookie-JWT auth) for live delivery. T-3 response events feed owner trust. |
| `notifications` | Derived feed (leads/messages/reviews/verification) + Redis last-seen marker + persisted **saved-search alerts** on publish/approve. |
| `admin` | Moderation queue + KYC review + **operator portal** (`AdminGuard`): listing approve/reject; verification approve/reject; **`/admin/stats`** (overview) + **`/admin/analytics`** (time-series, funnel, supply/demand); **`/admin/users`** (search/filter, ban/reinstate, verify, make/revoke admin, trust override); **`/admin/listings`** (search all statuses, force-takedown/restore, verify, delete); **`/admin/reviews`** (soft-remove/restore reviews + Q&A → recompute trust); **`GET /admin/audit`** (append-only admin action log). |
| `reports` | Abuse reports (ADMIN-5): `POST /reports` (any user, target-validated + dedup), `GET/PATCH /admin/reports` (+`/count`) triage queue (`AdminGuard`), audit-logged. |
| `verification` | KYC (PROD-5): `POST/GET /me/verification` (submit ID/selfie/ownership docs → pending), admin queue + approve (→ `verified` + trust recompute + notification) / reject. |
| `uploads` | Image pipeline (PROD-1): `POST /uploads/presign` → presigned S3/R2 PUT + public URL (content-type/size validated); `GET /uploads/config`. Config-gated; base64 fallback when unset. |
| `search` | Meilisearch (PROD-3): config-gated client; indexes published listings on boot + keeps them in sync; powers typo-tolerant Arabic `?q=` with a DB `contains` fallback. |
| `users` | `PATCH /users/me` (profile + preferences). |
| `redis` | Shared `RedisService` (POLISH-3): one `ioredis` client injected by auth/notifications/health; live `ready` getter + `ping()`. |
| `common` | Global response-envelope interceptor + all-exceptions filter (Sentry-reporting). |
| `health` | Liveness (`GET /health`) + **readiness** (`GET /health/ready`, pings Postgres + Redis, 503 when either is down). |

**Tests:** 182 Jest unit + **19 e2e** (Supertest, real Postgres/Redis). Every service with real logic now has a mocked-Prisma spec (incl. `listings`, `users`, `trust`, `notifications`, `matching`, `search` + all admin/reports). A **CI coverage floor** (`jest.config.js` `coverageThreshold`, ~57% stmts/45% branches on the logic files) blocks regressions. 0 hand-written `any`. Strict `ValidationPipe` (whitelist + forbidNonWhitelisted).

**Schema:** 24 models, 23 enums, UUID PKs, snake_case `@map`, soft deletes (incl. content moderation), 30+ indexes/uniques. 6 migrations applied (bed-level/trust, saved-search-notification, geo-point, admin-audit-and-ban, reports, content-moderation). Idempotent seed (12 users, 7 properties).

---

## Permission model (⚠️ doc correction)

Older docs describe a **5-tier permission system** (`@RequireTier`). **That was never implemented and is not the design.** The real, simpler model is:

- **Admin** — `User.isAdmin`; passes `AdminGuard` for the moderation queue.
- **Verified owner/renter** — `verified` / `verificationStatus`; verified owners auto-publish, unverified ones go to the moderation queue.
- **Ownership** — every write checks the resource owner (403 otherwise): listings, leads, threads (participants), reviews-reply.
- **Auth** — global `JwtAuthGuard`; `@Public()` opens browse + health.

Treat this section as the source of truth over any `@RequireTier` references elsewhere.

---

## Infra (`docker-compose.yml`)

- **Postgres 16 + PostGIS** (`beitco-postgres`). Dev runs on **host port 5433** via the gitignored `docker-compose.override.yml` (a native Postgres occupies 5432). A trigger-maintained, **GiST-indexed `geog` column** (derived from `lat`/`lng`) powers `ST_DWithin` radius search (PROD-4).
- **Redis 7** (`beitco-redis`) — OTP store + notification last-seen marker.
- **Meilisearch v1.11** (`beitco-meilisearch`) — **integrated** (PROD-3): typo-tolerant, Arabic-aware `?q=` with relevance ordering + a DB `contains` fallback when it's unreachable/unset.

---

## Known gaps (tracked in `.ai/NEXT_STEPS.md`)

> **The hardening backlog (P0 security → P1 shippable → P2 product) is complete.** What remains is optional polish + the business phases.

- **Security / shippable / observability:** ✅ done — secrets fail-fast + `helmet` + readiness (DB+Redis) + OTP throttle; API ESLint + CI/CD + Dockerfiles; e2e suite (19); structured pino logs + Sentry.
- **Product:** ✅ image-upload pipeline (PROD-1), real OTP/SMS gateway (PROD-2), Meilisearch (PROD-3), PostGIS geo (PROD-4), verification/KYC (PROD-5).
- **Still open (optional):** **Launch blocker** — a real deploy host (DEPLOY-1); see `.ai/PROD_READINESS.md`. _(TEST-1 service specs + a CI coverage floor and TEST-3 web component tests are done; the empty shared packages + `_unported/` are deleted.)_ **P3 polish** — decompose the monolith FE files, a BullMQ worker for saved-search alerts, the occupant-link consent flow, a11y automation, the admin tail (RBAC roles, trust controls, billing). **P4 business** — payments (Paymob/Stripe EGP) + Capacitor mobile wrap.

---

## Doc map

| Doc | Purpose |
|---|---|
| `NEXT_STEPS.md` | **The active backlog — what's next, prioritized.** |
| `PROD_READINESS.md` | **Go-live checklist + deploy runbook + go/no-go.** |
| `ADMIN_PLAN.md` | **Operator-portal feature spec (ADMIN-1…13).** |
| `ROADMAP.md` | Phased plan (what's done / what's next). |
| `PRD.md` | Product vision, personas, scope. |
| `TRUST_SPEC.md` | Trust engine (T-1→T-5). |
| `BACKEND_TASKS.md` | Backend build log (B-0 → POLISH-3). |
| `ARCHITECTURE.md` | Current system design. |
| `DB_SCHEMA.md` | Schema reference (source of truth: `apps/api/prisma/schema.prisma`). |
| `API_SPEC.md` | Current endpoint inventory. |
| `AI_RULES.md` | Coding standards. |
