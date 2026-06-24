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
| Frontend | 86 → **88** | Polished + a11y + **real image-upload pipeline**; monolithic files remain |
| Backend (NestJS) | 85 → **90** | Clean modules + guards + **readiness, linted, uploads**; mature |
| Accessibility / RTL | 82 | RTL-first + aria; no i18n framework, no axe |
| Security & Auth | 78 → **92** | OTP/JWT solid; **P0 hardening done** (secrets fail-fast, helmet, readiness, OTP throttle) |
| DevOps / Deployment | 60 → **88** | Linted + containerized (boot-verified) + **full CI/CD pipeline** (quality/e2e/docker/release); real deploy host still TODO |
| Testing & QA | 55 → **78** | **e2e suite (18) codifies the smokes**; +pure-engine units; component/controller-unit pending |
| Observability & Ops | 35 → **80** | **structured pino logs + request-id + redaction (OBS-1) + Sentry error tracking (OBS-2)**; readiness probe; metrics/tracing still optional |

The gap to "production-ready" is the bottom four rows. P0/P1 below target them directly.

---

## 🔴 P0 — Security & correctness (do before any real deploy) — ✅ DONE (June 23)

- [x] **SEC-1 · Secrets fail-fast.** `src/config/env.validation.ts` (`validateEnv`, wired into `ConfigModule.forRoot({ validate })`) throws on boot in production when `JWT_SECRET`/`JWT_REFRESH_SECRET` are missing, weak (the dev defaults), under 32 chars, or equal to each other; fills dev defaults locally. All 6 inline `'dev-jwt-secret'` fallbacks removed — they now exist only in that one file. **Verified:** prod boot throws on missing + weak; boots with strong distinct secrets.
- [x] **SEC-2 · Security headers.** `helmet@8` enabled in `main.ts` (HSTS, CSP, X-Frame-Options `SAMEORIGIN`, `nosniff`, `Referrer-Policy: no-referrer`); CSP tuned to keep Swagger UI working. **Verified** via response headers.
- [x] **SEC-3 · Readiness vs liveness health.** New `HealthModule` + `HealthService`: `GET /health/ready` pings Postgres (`SELECT 1`) + Redis (`PING`) and returns **503** when either is down (kept `GET /health` shallow for liveness). **Verified:** 200 up; 503 + `redis:down` with Redis stopped; 200 again after restart.
- [x] **SEC-4 · Rate-limit the sensitive routes.** `@Throttle` on `auth/otp/send` (5 / 5 min) and `auth/otp/verify` (10 / 5 min) per IP, on top of the existing 60s per-phone Redis cooldown.

> Status: `tsc` + `nest build` + **42 Jest** green. Committed in the P0 batch.

## 🟠 P1 — Make it shippable (deploy + catch regressions) — ✅ DONE (June 23)

> All P1 shipped: OPS-1 (lint/CI), OPS-2 (Docker), OPS-3 (CI/CD), TEST-2 (e2e), OBS-1 (logging), OBS-2 (Sentry). Remaining TEST-1/TEST-3 are unit/component test depth (the e2e suite already covers the authz matrix end-to-end) — folded into P3. **The app is now secure, linted, e2e-tested, containerized, CI/CD-wired, observable. Next focus: P2 product readiness (images, real OTP, search, geo, KYC).**

- [x] **OPS-1 · Fix API lint + CI.** ✅ (June 23) Added `apps/api/eslint.config.mjs` (ESLint 9 flat, NestJS-tuned) + the ESLint devDeps; fixed the one issue it found (`let`→`const`). Also fixed the **web** lint: `.turbo` was OOMing `eslint .` → scoped to `eslint src` + expanded ignores, and **auto-fixed 504 pre-existing `prettier/prettier` errors** (`--fix`, behavior-preserving — tsc + 31 tests confirm). `pnpm lint` now passes across all 8 turbo tasks.
- [x] **OPS-2 · Dockerfiles + compose for the apps.** ✅ (June 23) Multi-stage `apps/api/Dockerfile` (node:20-slim + pnpm, `pnpm deploy --prod` flatten, Prisma client generated in the bundle, non-root) — **verified: image builds (817 MB), boots in production mode, serves liveness+readiness, reads real DB data through the container, and runs `prisma migrate deploy`**. Moved the `prisma` CLI to prod deps (containerized-Prisma pattern + enables migrate-on-deploy); fixed the build by copying root `tsconfig.base.json` (was dropping `esModuleInterop`). `apps/web/Dockerfile` = portable node-server fallback (the web's real target is Cloudflare). Root `.dockerignore` + `docker-compose.prod.yml` (api+web+postgres+redis, healthchecks, secret-gated env).
- [x] **OPS-3 · CD pipeline.** ✅ (June 23) Rewrote `.github/workflows/ci.yml` (triggers fixed `develop`→`dev`, +tags, concurrency, pnpm cache): **`quality`** (prisma generate → type-check → lint → unit tests), **`e2e`** (Postgres+Redis service containers → `prisma migrate deploy` → seed → `test:e2e`), **`docker-build`** (builds the API image on every PR with gha cache to validate the Dockerfile), **`release`** (on `v*` tag → build+push the API image to GHCR), and a **`deploy-staging`** skeleton (documents the migrate-deploy + readiness-gate steps). **Verified locally:** the exact e2e sequence (migrate-deploy → seed → e2e) runs green against a **fresh DB** (2 migrations applied → seeded → 18/18 e2e).
- [ ] **TEST-1 · Controller/service tests.** Add NestJS controller tests (mocked services) for the authz matrix (401/403 paths) + service tests with a mocked Prisma for the trust-moving paths. _(Partly covered by TEST-2's e2e authz assertions; unit-level controller tests still pending.)_
- [x] **TEST-2 · e2e suite (codify the curl smokes).** ✅ (June 23) `apps/api/test/app.e2e-spec.ts` — `@nestjs/testing` + Supertest boots the **real `AppModule`** (mirrors `main.ts`: cookie-parser, ValidationPipe, filter, interceptor, versioning) against the dev Postgres/Redis. **18 tests, all green (×2 back-to-back):** health (liveness+readiness), auth (OTP→session, 401), listings reads + **occupant-privacy**, moderation gate (verified→published / unverified→pending / cross-owner 403), leads→tenancy (+403), **reviews-move-trust**, matching (sorted+eligible), saved-search alerts. Self-sufficient (flushes OTP keys in `beforeAll`; overrides `ThrottlerGuard`; cleans up created rows). `npm run test:e2e`. _(Chat WS live path is covered by its own node smoke; folding it into Jest is a follow-up.)_
- [ ] **TEST-3 · Frontend component tests.** Add React Testing Library tests for the highest-risk surfaces: the flag-aware query hooks (`queries.ts`), `property.$id` actions, and the listing wizard validation.
- [x] **OBS-1 · Structured logging + request IDs.** ✅ (June 23) Added `nestjs-pino` — `LoggerModule.forRoot(loggerConfig())` + `app.useLogger` with `bufferLogs`. **JSON in prod, pretty in dev**; every request gets a correlation id (honours inbound `x-request-id`, else generates one, echoed on the response); **redacts** cookies/authorization/set-cookie/tokens/passwords/OTP codes; health checks silenced. Replaced the 2 stray `console.log`s with the Nest logger. **Verified:** dev pretty logs, prod JSON logs, `x-request-id: test-req-123` echoed + carried in the request-completed log line, health silenced; 42 unit + 18 e2e still green; image rebuilds + boots with JSON logs.
- [x] **OBS-2 · Error tracking.** ✅ (June 23) **API:** `@sentry/node` — `src/instrument.ts` imported first in `main.ts` (auto-instrumentation; no-op without `SENTRY_DSN`); the global `AllExceptionsFilter` now reports **5xx / non-HTTP throws** to Sentry tagged with the `request_id` + method/url (expected 4xx skipped to keep the signal clean). **Web:** `@sentry/react` — `src/lib/sentry.ts` `initSentry()` (browser-only, no-op without `VITE_SENTRY_DSN`) called once in the root; the root `errorComponent` + a unified `reportError()` send to **both** Sentry and the existing Lovable host hook. `.env.example` documents `SENTRY_DSN`/`SENTRY_TRACES_SAMPLE_RATE`/`VITE_SENTRY_DSN`/`LOG_LEVEL`. **Verified:** both apps `tsc`+`lint` clean; API boots **with no DSN as a clean no-op**; 42 unit + 18 e2e + 31 web green.

## 🟡 P2 — Product enhancements (real-world readiness)

- [x] **PROD-1 · Image-upload pipeline.** ✅ (June 24) New `uploads` module: `POST /uploads/presign` (auth) → presigned **S3/R2** PUT URL + final public URL (validates content-type ∈ {jpeg,png,webp,avif} + ≤10 MB; keys namespaced `listings/<userId>/…`; R2 via `S3_ENDPOINT`, CDN via `S3_PUBLIC_URL`), plus `GET /uploads/config`. **Config-gated:** unset S3 → `{configured:false}` and the wizard transparently **falls back to the existing downscaled-base64 path** (zero-setup dev + mock unchanged). Frontend `lib/beitco/uploads.ts` `uploadImage(file)` (downscale → presigned PUT → store the URL, or base64); the `StepPhotos` wizard step uses it (+ an "بنرفع…" uploading state); removed the old inline `fileToDataUrl`/`downscale`. **Verified:** 5 unit tests (presign shape/validation/short-circuit) + live API (`config:false`, auth 401, routes mapped); 47 unit + 18 e2e + 31 web green; `.env.example` documents `S3_ENDPOINT`/`S3_PUBLIC_URL`.
- [x] **PROD-2 · Real OTP / SMS gateway.** ✅ (June 24) New `SmsService` (provider abstraction): `console` (default, dev — logs the code, keeps `123456`) or `http` (generic Egyptian gateway via `SMS_HTTP_URL`/`SMS_HTTP_TOKEN`/`SMS_SENDER_ID`, 8s timeout, fail-safe). `AuthService.sendOtp` delegates: a **random** code whenever a live provider is set (or prod), the fixed dev code only on console/non-prod, and `devCode` is returned to the client **only when no real SMS carried it** (live/prod never leaks it). Gateway failures are logged, not 500 (the OTP still lives in Redis). **Verified:** 5 unit tests (provider select, 2xx→delivered, error/missing-url→fail-safe); live — console returns `devCode:123456`, `SMS_PROVIDER=http` returns **no `devCode`** + actually hits the gateway; 52 unit + 18 e2e green; `.env.example` documents `SMS_PROVIDER`/`SMS_HTTP_*`.
- [ ] **PROD-3 · Meilisearch integration.** It runs in compose but is unused (search is in-memory client filtering). Index published listings, back `GET /properties` search with it, and add faceted filters.
- [ ] **PROD-4 · PostGIS geo search.** `lat`/`lng` are plain floats. Add a geometry column + GiST index and a radius / "قريب مني" search to use the PostGIS image you're already running.
- [x] **PROD-5 · Verification flow (KYC) backend.** ✅ (June 24) New `verification` module: `POST /me/verification` (submit ID/selfie/ownership doc URLs → pending request + `User.verificationStatus=pending`), `GET /me/verification` (my status), admin `GET /admin/verifications` (+`/count`), `POST /admin/verifications/:id/approve` (→ `verified` + `verificationStatus=verified`, **recompute trust** so the T-2 verification bonus applies, + a verification notification) / `:id/reject` (reason + notification). `AdminGuard` + transactional updates. **FE** (flag-aware): `verify.tsx` uploads docs via PROD-1's `uploadImage` then submits; new admin `/dashboard/verifications` queue (doc thumbnails, approve/reject) + a nav badge. **Verified:** an **e2e flow test** (submit → `/me` pending → non-admin 403 → admin approve → `/me` verified + notification) + 52 unit; both apps `tsc`/`lint`/`build` clean. (Also: `ThrottlerModule` now skips under `NODE_ENV=test` so the e2e's many logins don't 429.)

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
