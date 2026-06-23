# Next Steps — Beitco

> **The active backlog. Start here.** · branch: `dev` · created June 23, 2026
> Derived from the full-codebase audit (June 23). The product is **feature-complete end-to-end** (see `.ai/CURRENT_STATE.md`); what remains is **hardening for production**, then payments and mobile. Items are ordered by priority. Check them off as you go.

---

## Audit scorecard (June 23, 2026) — overall **79 / 100**

| Area | Score | Verdict |
|---|:--:|---|
| Product completeness / UX | 90 | Every core flow works end-to-end behind the flag |
| Documentation | 90 | Strong `.ai/` base; some stale pre-pivot docs being fixed |
| Type safety / code quality | 90 | API 0 `any`; web `any` only in generated file |
| Database (Prisma/PostGIS) | 88 | Clean schema/indexes; PostGIS unused for geo |
| Architecture / monorepo | 87 | Great flag pattern; 3 dead shared packages |
| Frontend | 86 | Polished + a11y; monolithic files; no image pipeline |
| Backend (NestJS) | 85 | Clean modules + guards; shallow health; unlinted |
| Accessibility / RTL | 82 | RTL-first + aria; no i18n framework, no axe |
| Security & Auth | 78 → **92** | OTP/JWT solid; **P0 hardening done** (secrets fail-fast, helmet, readiness, OTP throttle) |
| DevOps / Deployment | 60 | Good dev infra; no Dockerfiles, no CD, CI lint breaks API |
| Testing & QA | 55 | Engines tested; no controller/component/e2e tests |
| Observability & Ops | 35 | No Sentry/metrics/structured logs/readiness probe |

The gap to "production-ready" is the bottom four rows. P0/P1 below target them directly.

---

## 🔴 P0 — Security & correctness (do before any real deploy) — ✅ DONE (June 23)

- [x] **SEC-1 · Secrets fail-fast.** `src/config/env.validation.ts` (`validateEnv`, wired into `ConfigModule.forRoot({ validate })`) throws on boot in production when `JWT_SECRET`/`JWT_REFRESH_SECRET` are missing, weak (the dev defaults), under 32 chars, or equal to each other; fills dev defaults locally. All 6 inline `'dev-jwt-secret'` fallbacks removed — they now exist only in that one file. **Verified:** prod boot throws on missing + weak; boots with strong distinct secrets.
- [x] **SEC-2 · Security headers.** `helmet@8` enabled in `main.ts` (HSTS, CSP, X-Frame-Options `SAMEORIGIN`, `nosniff`, `Referrer-Policy: no-referrer`); CSP tuned to keep Swagger UI working. **Verified** via response headers.
- [x] **SEC-3 · Readiness vs liveness health.** New `HealthModule` + `HealthService`: `GET /health/ready` pings Postgres (`SELECT 1`) + Redis (`PING`) and returns **503** when either is down (kept `GET /health` shallow for liveness). **Verified:** 200 up; 503 + `redis:down` with Redis stopped; 200 again after restart.
- [x] **SEC-4 · Rate-limit the sensitive routes.** `@Throttle` on `auth/otp/send` (5 / 5 min) and `auth/otp/verify` (10 / 5 min) per IP, on top of the existing 60s per-phone Redis cooldown.

> Status: `tsc` + `nest build` + **42 Jest** green. Committed in the P0 batch.

## 🟠 P1 — Make it shippable (deploy + catch regressions)

- [ ] **OPS-1 · Fix API lint + CI.** `apps/api` has **no `eslint.config.js`**, so `pnpm lint` errors and CI's lint step is unreliable. Add a flat ESLint config for the API (mirror the web one) so the backend is actually linted in CI.
- [ ] **OPS-2 · Dockerfiles + compose for the apps.** Add multi-stage Dockerfiles for `apps/api` and `apps/web`, and extend compose (or a `docker-compose.prod.yml`) to run them alongside Postgres/Redis. Today only the data services are containerized.
- [ ] **OPS-3 · CD pipeline.** Extend CI to build the images, run `prisma migrate deploy` against a real test DB, run the e2e suite (TEST-2), and deploy on a tagged release. Wire a staging environment.
- [ ] **TEST-1 · Controller/service tests.** The 72 tests cover only pure functions. Add NestJS controller tests (mocked services) for the authz matrix (401/403 paths) + service tests with a mocked Prisma for the trust-moving paths (review, owner reply, lead-complete→tenancy).
- [ ] **TEST-2 · e2e suite (codify the curl smokes).** Stand up a `@nestjs/testing` + Supertest e2e run against an ephemeral Postgres (Testcontainers or a CI service container) covering the flows already smoke-tested by hand: auth, listings CRUD + moderation, leads loop, reviews-move-trust, matching, chat (incl. the Socket.io live path), saved-search alerts.
- [ ] **TEST-3 · Frontend component tests.** Add React Testing Library tests for the highest-risk surfaces: the flag-aware query hooks (`queries.ts`), `property.$id` actions, and the listing wizard validation.
- [ ] **OBS-1 · Structured logging + request IDs.** Replace Nest's default logger with `pino` (JSON, levels, redaction) + a correlation-id middleware. Remove the 2 stray `console.log`s in API src.
- [ ] **OBS-2 · Error tracking.** Wire Sentry (or equivalent) in both apps — the web already has a `lovable-error-reporting` hook to bridge, and the API needs an exception-filter integration.

## 🟡 P2 — Product enhancements (real-world readiness)

- [ ] **PROD-1 · Image-upload pipeline.** The wizard stores images as **base64 data URLs** (`FileReader.readAsDataURL` in `list/new.tsx`) — in API mode these inline blobs land in `Property.images String[]`. Wire S3/R2 presigned uploads (env vars already exist) + an image CDN/resizer; store URLs, not blobs.
- [ ] **PROD-2 · Real OTP / SMS gateway.** OTP is a fixed dev code (`123456`). Integrate an Egyptian SMS provider behind the existing `auth.sendOtp` stub; keep the dev code for non-prod.
- [ ] **PROD-3 · Meilisearch integration.** It runs in compose but is unused (search is in-memory client filtering). Index published listings, back `GET /properties` search with it, and add faceted filters.
- [ ] **PROD-4 · PostGIS geo search.** `lat`/`lng` are plain floats. Add a geometry column + GiST index and a radius / "قريب مني" search to use the PostGIS image you're already running.
- [ ] **PROD-5 · Verification flow (KYC) backend.** `VerificationRequest` model + UI exist; wire owner doc upload → admin review → `verificationStatus` transition (and the trust recompute it triggers).

## 🟢 P3 — Polish & scale (nice-to-have)

- [ ] **POLISH-1 · Decompose monolith files.** `list/new.tsx` (2,290 LOC) and `property.$id.tsx` (1,454 LOC) → step/section components.
- [ ] **POLISH-2 · Shared packages or delete them.** `@beitco/types|utils|validators` have **0 imports**; types are duplicated between `apps/web/lib/beitco/types.ts` and the API serializers. Either make them the shared contract or remove them.
- [ ] **POLISH-3 · RedisModule provider.** Redis clients are instantiated inline + duplicated in `auth.service` and `notifications.service`. Extract one shared provider.
- [ ] **POLISH-4 · BullMQ worker for saved-search alerts.** `notifyForNewListing` scans all saved searches synchronously on publish (correct + instant now). Move to a queue before volume grows.
- [ ] **POLISH-5 · Occupant-link consent flow.** Owner registers a tenant on a bed/room → renter confirms the link (the `link` notification type + `LinkStatus` exist; the action flow isn't wired).
- [ ] **POLISH-6 · a11y automation + i18n seam.** Add `axe`/`jest-axe` checks; if a second language is ever planned, introduce an i18n framework (strings are hardcoded Arabic today — fine for now).

## ⚫ P4 — Phase 4+ (business)

- [ ] **PAY-1 · Payments** (Paymob/Stripe EGP) — verified-owner subscription + success-fee plumbing. See `.ai/BUSINESS_MODEL.md`.
- [ ] **MOBILE-1 · Capacitor wrap** → iOS/Android + native push (FCM env vars already stubbed).

---

## Suggested order

1. **SEC-1 → SEC-3** (an afternoon; biggest risk reduction).
2. **OPS-1** (unblocks reliable CI) → **TEST-1/TEST-2** (regression safety net).
3. **OPS-2 → OPS-3** (deployable) + **OBS-1/OBS-2** (you can see prod).
4. **PROD-1 → PROD-2** (images + real OTP are the two hard blockers for a real beta).
5. Everything else as capacity allows.

> When you finish an item, move its one-line outcome into `.ai/BACKEND_TASKS.md` (build log) and tick the box here.
