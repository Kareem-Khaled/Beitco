# بيتون · Beitoon

> **The trust-first housing marketplace for Egypt.** Rent a bed, a private room, or a whole apartment — with verification, real reviews, and quality scores you can actually trust.

---

## What This Is

Most Egyptian housing today is rented through Facebook groups, ghost brokers, and 30%-fake OLX listings. Shared housing (the reality for most students and young professionals) is invisible — there's no platform built for it.

Beitoon changes that:

- **Bed-level inventory.** Owners list how many beds are available *right now*. Renters book a bed, a room, or a whole apartment — whatever fits.
- **Trust as the product.** Every listing carries a verification badge, a 0–10 trust score, real reviews from past residents (gated by 30+ day tenancy), per-listing quality scores (internet / safety / noise / maintenance / cleanliness), landlord response rate, and a public Q&A.
- **Egyptian-first.** Arabic by default, Egyptian colloquial dialect throughout. Prices in ج.م. Areas Egyptians actually search.

---

## Quick Start

### Prerequisites
- Node.js ≥20
- pnpm ≥9.15
- Docker (for Postgres + PostGIS, Redis, Meilisearch)

### Install
```bash
pnpm install
```

### Start the data services
```bash
docker compose up -d        # Postgres + PostGIS · Redis · Meilisearch
```

### Start the backend
```bash
pnpm api                    # NestJS on http://localhost:3001 (Swagger at /api/docs)
```
First run: `pnpm --filter @beitoon/api exec prisma migrate deploy && pnpm --filter @beitoon/api db:seed` (12 users, 7 properties).

### Start the frontend
```bash
pnpm web                    # http://localhost:8080
```
By default the web app runs on a **localStorage mock** (no backend needed). To read/write the live API, create `apps/web/.env` with `VITE_USE_API=true`.

### Run everything (Turbo)
```bash
pnpm dev
```

### Log in
Dev OTP is always **`123456`**. Phone `+201000000000` = admin ("فريق بيتون", `/admin` portal); any other phone = a regular user.

> **Full local runbook (DB, OTP, ports, gotchas):** [.ai/RUN_LOCALLY.md](./.ai/RUN_LOCALLY.md)
> ⚠️ Postgres runs in Docker on **5433** (a native pg may sit on 5432). Use 5433.

---

## Repo Layout

```
Beitoon/
├── apps/
│   ├── web/              ← TanStack Start frontend (live, fully wired)
│   └── api/              ← NestJS backend (live, 16 modules)
├── .ai/                  ← strategy + engineering docs (source of truth)
├── .github/workflows/    ← CI/CD (quality · e2e · docker · release)
├── docker-compose.yml    ← local services
└── docker-compose.prod.yml ← prod-parity build (api · web · postgres · redis)
```

---

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | TanStack Start (Vite + React 19) · Tailwind v4 · shadcn/ui · TanStack Query |
| Backend | NestJS 11 · TypeScript strict · Prisma 6 |
| Database | PostgreSQL 16 + PostGIS (GiST geo search) |
| Search | Meilisearch (typo-tolerant Arabic) |
| Cache / Realtime | Redis · Socket.io |
| Auth | Phone OTP + JWT in httpOnly cookies |
| Observability | pino structured logs · Sentry |
| Video | Mux (deferred) |
| Mobile | Capacitor 6.x (deferred) |
| Monorepo | Turborepo + pnpm |

---

## Documentation

The `.ai/` folder is the source of truth for product, business, and engineering context:

- **[.ai/RUN_LOCALLY.md](./.ai/RUN_LOCALLY.md)** — **run the app + DB locally (recipe + every gotcha)**
- **[.ai/ENTRY_PROMPT.md](./.ai/ENTRY_PROMPT.md)** — start here, canonical context
- **[.ai/PROJECT_OVERVIEW.md](./.ai/PROJECT_OVERVIEW.md)** — product vision, personas, MVP scope
- **[.ai/CURRENT_STATE.md](./.ai/CURRENT_STATE.md)** — what's actually built today
- **[.ai/PROD_READINESS.md](./.ai/PROD_READINESS.md)** — **go-live checklist + deploy runbook**
- **[.ai/SCALE_READINESS.md](./.ai/SCALE_READINESS.md)** — scale review (will it survive thousands of users?)
- **[.ai/ADMIN_PLAN.md](./.ai/ADMIN_PLAN.md)** — operator-portal feature spec (ADMIN-1…13)
- **[.ai/NEXT_STEPS.md](./.ai/NEXT_STEPS.md)** — the prioritized backlog
- **[.ai/BUSINESS_MODEL.md](./.ai/BUSINESS_MODEL.md)** — how Beitoon makes money
- **[.ai/ROADMAP.md](./.ai/ROADMAP.md)** — phased plan
- **[.ai/AI_RULES.md](./.ai/AI_RULES.md)** — coding standards

---

## Status

**Full-stack and hardened.** The trust-first bed-level marketplace works end-to-end against a real NestJS + Postgres API — browse, phone-OTP auth, the `حط شقتك` listing wizard + moderation, leads → tenancy, gated reviews that move a computed trust score, matching, owner dashboard, live chat, notifications + saved-search alerts, image uploads, real OTP/SMS, Meilisearch + PostGIS geo search, and KYC verification.

The production-hardening backlog (security, CI/CD, Docker, e2e, structured logging, Sentry, readiness probes) is **complete**. What remains before launch is **test depth + a real deploy host** — see **[.ai/PROD_READINESS.md](./.ai/PROD_READINESS.md)**.

See [`.ai/CURRENT_STATE.md`](./.ai/CURRENT_STATE.md) for the honest breakdown.

---

## License

PROPRIETARY · © 2026 Beitoon
