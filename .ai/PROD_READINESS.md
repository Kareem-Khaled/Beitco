# Production Readiness — Beitoon

> **The go-live checklist + deploy runbook.** · branch: `dev` · created June 24, 2026
> Companion to `.ai/CURRENT_STATE.md` (what's built) and `.ai/NEXT_STEPS.md` (the backlog). This doc answers one question: **what does it take to safely put Beitoon in front of real users, and are we there yet?**

---

## Verdict — **Not yet. Two hard blockers.**

The app is **feature-complete and hardened** (overall **84/100**, deep code scan June 24). Security, data model, and code quality are genuinely production-grade. **Two things stand between the current state and a safe public launch — neither is a rewrite:**

1. **🔴 No live deploy target.** The CI/CD pipeline builds + pushes the API image and there's a `deploy-staging` job, but it's a **placeholder** — nothing is actually deployed anywhere. (**DEPLOY-1**)
2. **🟠 Thin automated test depth.** The 19-test e2e suite covers the happy paths + the authz matrix end-to-end, but **most services have no isolated unit tests** and there are **no web component tests** and **no coverage gate**. Enough to ship a closed beta; raise it before a public launch. (**TEST-1 / TEST-3**)

Everything else below is either ✅ done or a documented, accepted risk for v1.

---

## Hard blockers (must do before public launch)

| # | Blocker | Why it blocks | Effort |
|---|---|---|---|
| **DEPLOY-1** | Wire `deploy-staging` → a real host (Fly/Render/Railway/managed k8s) | Nothing is deployed; there is no running prod URL | ~1 day |
| **TEST-1** | Service unit tests (mock Prisma) for the 5–6 heaviest services + CI coverage floor | Business logic (trust moves, moderation gate, ownership) is only e2e-covered | ~2 days |
| **PROVISION-1** | Provision managed Postgres+PostGIS, Redis, Meilisearch, object storage (S3/R2), an SMS provider | The app needs real backing services + a live SMS gateway for OTP | ~0.5 day |
| **SECRETS-1** | Generate strong, distinct prod secrets + load them via the host's secret manager | `validateEnv` will (correctly) refuse to boot otherwise | ~1 hr |

> A **closed beta** (invited users, your own seeded supply) is safe to run after DEPLOY-1 + PROVISION-1 + SECRETS-1. A **public launch** should also have TEST-1 + the recommended items below.

---

## ✅ Already production-grade (done + verified)

**Security & auth**
- [x] Phone-OTP + JWT **access+refresh in httpOnly cookies** (`secure` in prod, `sameSite=lax`); refresh rotation + Redis blacklist on logout.
- [x] **Secrets fail-fast** (`validateEnv`): prod boot throws on missing/weak/short/duplicate `JWT_SECRET`/`JWT_REFRESH_SECRET`. Dev defaults live in exactly one file.
- [x] **helmet** (HSTS, CSP, `nosniff`, frame/referrer policy); CORS credentialed + origin-allowlisted.
- [x] **Rate limiting:** OTP send 5/5min, verify 10/5min per IP + a 60s per-phone Redis cooldown; global 120/60s throttle.
- [x] Strict `ValidationPipe` (`whitelist` + `forbidNonWhitelisted`) on every DTO; ownership/participant/admin checks in services.
- [x] WebSocket re-verifies the cookie JWT on connect.

**Shippability & ops**
- [x] **CI** (`.github/workflows/ci.yml`): quality (type-check/lint/unit) + **e2e against real Postgres+Redis** + **API image build** on every PR; image push to GHCR on `v*` tags.
- [x] **Dockerfiles** (API boot-verified in prod mode) + `docker-compose.prod.yml` (api/web/postgres/redis, healthchecks, secret-gated env).
- [x] **Migrations on deploy** pattern (`prisma migrate deploy`; the CLI is bundled in the image).
- [x] **Readiness probe** `GET /health/ready` (Postgres + Redis; 503 when either is down) for the traffic gate; shallow `GET /health` for liveness.
- [x] **Structured logging** (pino: JSON in prod, request-id correlation, secret redaction) + **Sentry** error tracking (API + web; no-op without DSN).

**Product surface**
- [x] Image uploads (presigned S3/R2 + base64 fallback), real OTP/SMS gateway abstraction, Meilisearch search, PostGIS geo search, KYC verification — all flag/config-gated with graceful fallbacks.

---

## Deploy runbook (DEPLOY-1)

A real `deploy-staging` (then `deploy-prod`) job should:

1. **Provision** (once): managed **Postgres 16 + PostGIS**, **Redis 7**, **Meilisearch**, an **S3/R2 bucket**, and an **SMS provider** account.
2. **Configure secrets** in the host's secret manager (see the env matrix below). `JWT_SECRET` ≠ `JWT_REFRESH_SECRET`, both ≥32 random chars.
3. **Release** (already automated on a `v*` tag): build + push `ghcr.io/<repo>-api:<tag>`.
4. **Migrate:** run `prisma migrate deploy` against the prod DB (the image bundles the Prisma CLI). Seed is **not** run in prod.
5. **Roll out** the new image tag (the chosen host's deploy primitive).
6. **Gate traffic** on `GET /api/v1/health/ready` returning `200` before shifting traffic.
7. **Web:** build with `VITE_USE_API=true` + `VITE_API_URL=https://api.<domain>/api/v1` (+ `VITE_SENTRY_DSN`). The web's natural target is Cloudflare/static hosting; the Dockerfile is a portable fallback.
8. **Rollback:** redeploy the previous image tag. Migrations are forward-only — prefer **expand/contract** (additive) migrations so a rollback never needs a down-migration.

### Environment matrix (prod)

| Variable | Required | Notes |
|---|:--:|---|
| `NODE_ENV=production` | ✅ | flips cookie `secure`, JSON logs, secret enforcement |
| `DATABASE_URL` | ✅ | managed Postgres **+ PostGIS extension enabled** |
| `REDIS_URL` | ✅ | managed Redis (OTP, refresh blacklist, read-state) |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | ✅ | ≥32 chars, **distinct**; secret manager |
| `CORS_ORIGINS` | ✅ | the web origin(s), comma-separated |
| `SMS_PROVIDER=http` + `SMS_HTTP_URL` (+`SMS_HTTP_TOKEN`/`SMS_SENDER_ID`) | ✅ | real OTP delivery (else codes never reach users) |
| `MEILISEARCH_URL` + `MEILISEARCH_API_KEY` | ⬜ | search degrades to DB `contains` if unset |
| `S3_ENDPOINT` / `S3_PUBLIC_URL` / `AWS_*` | ⬜ | uploads degrade to base64 if unset |
| `SENTRY_DSN` / `VITE_SENTRY_DSN` | ⬜ (recommended) | error tracking; no-op without |
| `LOG_LEVEL` | ⬜ | defaults sensible per env |

Full annotated list: `.env.example`.

---

## Pre-launch checklist

**Infra / deploy**
- [ ] DEPLOY-1: a running staging URL, traffic-gated on `/health/ready`.
- [ ] PROVISION-1: managed Postgres+PostGIS / Redis / Meilisearch / object storage / SMS provider.
- [ ] SECRETS-1: strong distinct secrets in the host secret manager.
- [ ] DB backups + point-in-time recovery enabled; a tested restore.
- [ ] A custom domain + TLS for the API and web.

**Quality gates**
- [ ] TEST-1: service unit tests for the heaviest services + a CI coverage floor.
- [ ] TEST-3 (recommended): web component tests for search / property detail / the wizard.
- [ ] A real SMS round-trip verified end-to-end in staging (a live phone receives the OTP).
- [ ] A real image upload verified end-to-end against the prod bucket/CDN.

**Operational**
- [ ] Sentry projects (API + web) wired with real DSNs + alerting.
- [ ] Uptime monitoring hitting `/health/ready` + an alert channel.
- [ ] A seeded launch supply (the first ~100 real listings — see `.ai/ROADMAP.md`).
- [ ] An admin account (`isAdmin`) created for the moderation + KYC queues.
- [ ] A rollback runbook rehearsed once.

**Legal / trust (the product is "trust" — get this right)**
- [ ] Privacy policy + terms (KYC docs = PII: define retention + access).
- [ ] KYC document storage is access-controlled + encrypted at rest.
- [ ] A reporting/abuse path + a content-moderation policy for reviews.

---

## Accepted risks / explicitly deferred for v1

These are **known and fine to launch without** — tracked in `.ai/NEXT_STEPS.md` (P3/P4):

- **Payments** (PAY-1) — no monetization in v1 (free launch is the strategy; see `.ai/BUSINESS_MODEL.md`).
- **Mobile app** (MOBILE-1) — the web app is mobile-first PWA; Capacitor wrap later.
- **Metrics/tracing** — Sentry covers errors; Prometheus/OpenTelemetry can wait.
- **BullMQ fan-out** (POLISH-4) — saved-search alerts run synchronously on publish (correct + instant at current volume).
- **Occupant-link consent** (POLISH-5), **a11y automation + i18n seam** (POLISH-6).
- **Monolith files** (POLISH-1) + **empty shared packages / `_unported/`** (POLISH-2) — internal hygiene, not user-facing.
- **CSRF** — mitigated by `sameSite=lax` cookies + a JSON API for v1; add tokens if a cross-site form surface appears.

---

## Definition of "launched"

> A tagged release builds + pushes images, runs `prisma migrate deploy` against managed Postgres, deploys to a host, passes the `/health/ready` gate, and serves real users on a custom domain — with Sentry + uptime alerting live, a real SMS provider delivering OTPs, and an admin able to moderate. **TEST-1 green + a coverage floor in CI** turns "closed beta" into "public launch."
