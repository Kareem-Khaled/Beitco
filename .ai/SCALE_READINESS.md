# Scale & Production Readiness — Beitco

> **"Will it survive thousands of real users, real money, and real attacks?"** · created June 25, 2026 · branch: `dev`
> Companion to `.ai/PROD_READINESS.md` (the go-live runbook) and `.ai/NEXT_STEPS.md` (the backlog). Derived from an evidence-based code review (June 25). Each item is tracked in NEXT_STEPS under **P0.5 — Scale & correctness**.

---

## Verdict by scale tier

| Scale | Ready? | Gating work |
|---|:--:|---|
| **Demo / local** | ✅ today | nothing — fully works |
| **Closed beta** (10s–100s, invited) | 🟡 ~2 days | ~~BUG-1~~ ✅ + DEPLOY-1 (host) + provision managed DB/Redis/SMS + secrets |
| **Public launch** (1,000s) | 🟠 ~1–2 wks | the above **+** SCALE-1 (BullMQ) + SCALE-2 (paginate) + OBS-3 (metrics) + OPS-4 (backups) + OPS-5 (load test) |
| **Scale** (10,000s+) | 🔴 more | + read replicas/caching, image CDN, PgBouncer, DATA-1 (tx-race audit) |

**The product is genuinely strong on the hard stuff** (security core, data model, code quality, tests, operator portal) and missing the **operational** stuff (deploy, observability, async jobs) — the normal gap at this stage.

---

## 🔴 Hard blockers — before ANY real users

### BUG-1 · Banned users can still log in 🐛 (correctness) — ✅ FIXED (June 25)
**Severity: high · Effort: ~½ day.** ADMIN-2's ban sets `User.bannedAt` + notifies — but `auth.service` (`verifyOtp`, `refresh`) and `jwt.strategy` only checked `deletedAt`, **never `bannedAt`**. A banned user kept access until their token expired AND could re-login by OTP.
- **Fixed:** `bannedAt` guards in `jwt.strategy` (every request → 401 `ACCOUNT_BANNED`), `verifyOtp` (re-login → 403 + ban reason), and `refresh` (→ 401); `AdminUsersService.ban` calls `AuthService.revokeAllSessions` (clears `rt:userId:*`); the public listings `list`/`findOne` exclude banned owners. e2e: ban → live session 401 → re-login 403. _(Search-index sync on ban is a later nicety — the DB-fallback + list filter cover browse; a banned owner's id may linger in Meili until the next reindex.)_

### DEPLOY-1 · No live host (already tracked) 🟠
**Severity: blocker · Effort: ~1 day + your account.** Nothing is deployed; `deploy-staging` is placeholder lines. Until this is done the user count is literally zero. Runbook in `PROD_READINESS.md`. _(Postponed by request — but it's the true #1 for going live.)_

---

## 🟠 Will break at "thousands" — before public launch

### SCALE-1 · Async the saved-search fan-out (BullMQ) — was POLISH-4
**Severity: high at volume · Effort: ~1 day.** On publish, `notifyForNewListing` loads **every** `savedSearch` into memory (no limit), loops in JS, and does a **sequential** `findFirst` + `create` per match (N+1 awaited in a loop). Fine at 100s; at 1,000s a publish blocks for seconds + hammers Postgres.
- **Fix:** a **BullMQ** queue — publish enqueues `{propertyId}`; a worker does the matching + inserts in batches. Needs a shared Redis (already have `RedisModule`). Add a `dead-letter` + retry. This also unblocks future async work (emails, SMS campaigns, reindex).

### SCALE-2 · Paginate / cap the unbounded reads
**Severity: high at volume · Effort: ~1 day.** ~30 of 37 `findMany` calls have **no `take`** — the notification feed, owner leads, saved searches, admin lists (some), chat threads. A power user (or scraper) with thousands of rows turns one request into a full scan.
- **Fix:** add `take` + cursor pagination to the hot read paths (notifications feed, owner-leads, threads, saved-searches); the public listing list already paginates — extend the pattern. Bound the analytics raw queries.

### OBS-3 · Metrics + tracing (you're flying blind)
**Severity: high · Effort: ~1–2 days.** Sentry catches errors, but there are **no metrics/traces** — you can't see p95 latency, request rate, error rate, or DB load. At scale that's operating blind.
- **Fix:** Prometheus (`prom-client`) `/metrics` (HTTP duration histogram, in-flight, DB pool) + (optional) OpenTelemetry traces. Wire to a dashboard (Grafana/hosted). Add **uptime monitoring** hitting `/health/ready` + an alert channel.

### OPS-4 · Backups + restore drill
**Severity: high · Effort: ~½ day (host-dependent).** No documented DB backups or a tested restore. Losing the DB = losing the trust graph (the whole moat).
- **Fix:** enable managed-Postgres PITR/automated backups; **rehearse a restore once**; document it in `PROD_READINESS.md`.

### OPS-5 · Load test
**Severity: medium · Effort: ~½ day.** No load test — we don't know where it breaks.
- **Fix:** a `k6`/`autocannon` script against the hot paths (browse, search, geo, login, lead) on staging; capture p95 + the breaking concurrency; set the Prisma `connection_limit` accordingly (PERF-1).

---

## 🟡 Real but not launch-blocking

### SEC-5 · CSRF defense-in-depth
**Effort: ~½ day.** Auth is httpOnly cookies + `sameSite=lax` (reasonable for a JSON API), but no CSRF token. Add a double-submit token (or `sameSite=strict` where UX allows) before any state-changing browser form surface grows.

### SEC-6 · KYC PII handling (legal + technical)
**Effort: ~1–2 days + legal.** We store ID/selfie/ownership doc URLs — **regulated PII**. Needs: private bucket + signed-URL-only access, encryption at rest, a **retention/deletion policy**, access logging, and a privacy policy/terms. Don't take real KYC docs at scale without this.

### DATA-1 · Transaction-race audit (double-booking)
**Effort: ~1 day.** Only 2 `$transaction`s today. The bed/room/whole **occupancy** + **lead→tenancy** paths can race under concurrency (two renters booking the last bed). Audit + wrap the occupancy transitions in a transaction with the right isolation / a conditional update.

### PERF-1 · Connection pool + caching
**Effort: ~½ day.** No explicit Prisma `connection_limit` — the default can exhaust Postgres under concurrency (esp. behind PgBouncer). Set it from the OPS-5 numbers. Later: cache the hot read paths (listing detail, trust breakdown, analytics) in Redis with short TTLs.

### TEST-3 (tail) · Booking/wizard component tests
**Effort: ~1 day.** The web component tests don't yet cover the booking flow or the listing wizard's validation — the highest-risk user surfaces.

---

## ✅ Already production-grade (don't re-litigate)

- **Security core:** httpOnly cookies + refresh rotation + Redis blacklist, env fail-fast, helmet + CSP, OTP throttle (5/5min send · 10/5min verify) + global throttle, ownership/admin guards, **audit log on every operator mutation**, self-action guards.
- **Data:** 24 models, PostGIS+GiST geo, 30+ indexes, soft deletes, content-moderation filtering that keeps the trust wedge honest.
- **Quality:** 0 hand-written `any`, **182 API unit + 19 e2e + 62 web** tests, a CI coverage floor, clean tsc/lint/build.
- **Resilience:** Redis/Meili/S3/SMS all degrade gracefully when unconfigured; readiness probe gates traffic.
- **Operator portal:** 7-section control room (overview/analytics/users/listings/reviews/reports + moderation/KYC).

---

## Suggested order

1. **BUG-1** (ban login) — small, high-value correctness fix; do first, no host needed.
2. **SCALE-2** (paginate) then **SCALE-1** (BullMQ) — the two "breaks at thousands" items; both doable without a deploy.
3. **DEPLOY-1** + provision (when you're ready to go live) → **OPS-4** (backups) + **OBS-3** (metrics) + **OPS-5** (load test) as part of standing up staging.
4. **SEC-6** (KYC PII) before taking real verification docs; **DATA-1** + **PERF-1** as concurrency rises.
5. **SEC-5**, **TEST-3 tail**, caching — as capacity allows.

> Items 1–2 are fully autonomous (no account/host). Item 3 needs your hosting decision. Track these in `.ai/NEXT_STEPS.md` under **P0.5**.
