# Current State — Beitco

> **Last updated:** June 23, 2026 · branch: `dev`
> Honest snapshot of what's actually built and verified. For the prioritized "what's next" read **`.ai/NEXT_STEPS.md`**; for the product vision read `.ai/PRD.md`; for the backend build log read `.ai/BACKEND_TASKS.md`.

---

## TL;DR

- **Full-stack, end-to-end.** The trust-first bed-level marketplace is real on a server. The frontend talks to a NestJS + Postgres API across **every core surface** — browse, auth, listings CRUD + moderation, leads, Q&A, reviews, matching, the owner dashboard, live chat, and notifications.
- **Behind a feature flag.** `VITE_USE_API` toggles the data source: **OFF (default)** = the byte-identical localStorage mock; **ON** = the live API. Both paths are kept identical so the prototype still runs with no backend.
- **The trust wedge is proven, not cosmetic.** Reviews move a listing's computed score (verified 8.3 → 5.2); an owner's first chat reply moves it up via real response-rate tracking (8.1 → 8.6). Nothing buys a higher score; every score is explainable.
- **What remains is hardening, not features:** automated test depth, deployment/CI, observability, security headers, real OTP/SMS, an image-upload pipeline, and payments. See `.ai/NEXT_STEPS.md`.

---

## Git & Branches

| Branch | Purpose |
|---|---|
| `old` | Full snapshot of everything before the June cleanup (social/video API, `web-old`, legacy docs). Nothing lost; restore from here if ever needed. |
| `main` | Production branch (promote from `dev` when ready). |
| `dev` | **Active.** All current work lives here. |

---

## ✅ Frontend — `apps/web/` (`tanstack_start_ts`)

**Stack:** TanStack Start (Vite + React 19), TypeScript strict, Tailwind v4, shadcn/ui, Arabic RTL (Egyptian dialect), Leaflet (maps), TanStack Query, socket.io-client, Vitest. Runs on `pnpm web` → http://localhost:8080. 32 routes, 69 components.

**Built and wired (flag-aware via `lib/beitco/queries.ts`):**
- **Browse:** home, search (filters + URL state + sort), property detail (gallery, trust section, quality scores, amenities, bed/room/whole occupancy, reviews, Q&A, map, nearby).
- **Auth:** phone-OTP login → profile completion; session via httpOnly cookie; `useAuth` branches mock/API.
- **Listings:** the `حط شقتك` multi-step wizard (create + edit), owner dashboard (listings grid + pause/occupancy/sale-status, overview analytics, reviews, leads).
- **Engagement:** save listing, save search, request viewing / book specific beds-rooms, Q&A ask + owner answer, post review + helpful + owner reply, owner→renter review.
- **Matching:** renter preferences page → `/me/matches` (ranked, explainable).
- **Chat:** `/messages` + thread view, "كلّم صاحب الشقة", live updates via Socket.io.
- **Notifications:** bell badge + `/notifications` feed (leads, messages, review-eligibility, verification, saved-search alerts).
- **Admin:** moderation queue (`/dashboard/moderation`) gated on `isPlatformAdmin`.
- **Platform:** dark mode, PWA manifest, mobile bottom-nav, accessibility pass (skip link, aria, focus management), maps (Leaflet pin-drop + Google embeds), public profiles.

**Tests:** 31 Vitest (trust + matching pure engines). `tsc` clean.

---

## ✅ Backend — `apps/api/` (NestJS 11)

**Stack:** NestJS 11, Prisma 6, PostgreSQL 16 + PostGIS, Redis (OTP + read-state), JWT/Passport (httpOnly cookies), Socket.io, class-validator, Swagger. Runs on `pnpm api` → http://localhost:3001 (`/api/v1`, Swagger at `/api/docs`).

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
| `admin` | Moderation queue (`AdminGuard`): pending list/count, approve (→ publish + alerts), reject (reason). |
| `users` | `PATCH /users/me` (profile + preferences). |
| `common` | Global response-envelope interceptor + all-exceptions filter. |
| `health` | Liveness check (shallow — see NEXT_STEPS). |

**Tests:** 41 Jest (17 trust + 13 matching + 10 saved-search matcher + 1 health). 0 `any`. Strict `ValidationPipe` (whitelist + forbidNonWhitelisted).

**Schema:** 22 models, 21 enums, UUID PKs, snake_case `@map`, soft deletes, 30 indexes/uniques. 2 migrations applied. Idempotent seed (12 users, 7 properties).

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

- **Postgres 16 + PostGIS** (`beitco-postgres`). Dev runs on **host port 5433** via the gitignored `docker-compose.override.yml` (a native Postgres occupies 5432). `lat`/`lng` are plain floats today — PostGIS geometry/spatial search is not yet used.
- **Redis 7** (`beitco-redis`) — OTP store + notification last-seen marker.
- **Meilisearch v1.11** (`beitco-meilisearch`) — running but **not integrated**; search is in-memory client-side filtering today.

---

## Known gaps (tracked in `.ai/NEXT_STEPS.md`)

- **Security:** hardcoded `dev-jwt-secret` fallbacks; no `helmet`; OTP is a dev stub (no SMS gateway).
- **Testing:** only the pure engines are unit-tested; no controller/service/e2e/component tests (the curl smokes aren't codified).
- **DevOps:** no Dockerfiles for the apps; CI only type-checks/lints/tests (the API has no ESLint config, so its lint step fails); no CD/migrations-on-deploy.
- **Observability:** no Sentry/metrics/structured logs; health check never pings Postgres/Redis.
- **Product:** no image-upload pipeline (wizard stores base64 data URLs); payments not built; Meilisearch + PostGIS unused.

---

## Doc map

| Doc | Purpose |
|---|---|
| `NEXT_STEPS.md` | **The active backlog — what's next, prioritized.** |
| `ROADMAP.md` | Phased plan (what's done / what's next). |
| `PRD.md` | Product vision, personas, scope. |
| `TRUST_SPEC.md` | Trust engine (T-1→T-5). |
| `BACKEND_TASKS.md` | Backend build log (B-0 → CHAT-3/NOTIF-2). |
| `ARCHITECTURE.md` | Current system design. |
| `DB_SCHEMA.md` | Schema reference (source of truth: `apps/api/prisma/schema.prisma`). |
| `API_SPEC.md` | Current endpoint inventory. |
| `AI_RULES.md` | Coding standards. |
