# بيتكو · Beitco

> **The trust-first housing marketplace for Egypt.** Rent a bed, a private room, or a whole apartment — with verification, real reviews, and quality scores you can actually trust.

---

## What This Is

Most Egyptian housing today is rented through Facebook groups, ghost brokers, and 30%-fake OLX listings. Shared housing (the reality for most students and young professionals) is invisible — there's no platform built for it.

Beitco changes that:

- **Bed-level inventory.** Owners list how many beds are available *right now*. Renters book a bed, a room, or a whole apartment — whatever fits.
- **Trust as the product.** Every listing carries a verification badge, a 0–10 trust score, real reviews from past residents (gated by 30+ day tenancy), per-listing quality scores (internet / safety / noise / maintenance / cleanliness), landlord response rate, and a public Q&A.
- **Egyptian-first.** Arabic by default, Egyptian colloquial dialect throughout. Prices in ج.م. Areas Egyptians actually search.

---

## Quick Start

### Prerequisites
- Node.js ≥20
- pnpm ≥9.15
- Docker (for Postgres, Redis, Meilisearch)

### Install
```bash
pnpm install
```

### Start the frontend
```bash
pnpm web
```
Opens on http://localhost:8080

### Start the backend (optional, currently scaffold)
```bash
docker compose up -d        # Postgres + PostGIS + Redis + Meilisearch
pnpm api                    # NestJS on port 3001
```

### Run everything (Turbo)
```bash
pnpm dev
```

---

## Repo Layout

```
Beitco/
├── apps/
│   ├── web/              ← TanStack Start frontend (live)
│   └── api/              ← NestJS backend (scaffold)
├── packages/             ← shared types & utils
├── .ai/                  ← strategy docs (source of truth)
├── docs/                 ← legacy long-form docs
└── docker-compose.yml    ← local services
```

---

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | TanStack Start (Vite + React 19) · Tailwind v4 · shadcn/ui |
| Backend | NestJS 11 · TypeScript · Prisma |
| Database | PostgreSQL 16 + PostGIS |
| Search | Meilisearch |
| Cache / Jobs | Redis · BullMQ |
| Video | Mux (deferred) |
| Mobile | Capacitor 6.x (deferred) |
| Monorepo | Turborepo + pnpm |

---

## Documentation

The `.ai/` folder is the source of truth for product, business, and engineering context:

- **[.ai/ENTRY_PROMPT.md](./.ai/ENTRY_PROMPT.md)** — start here, canonical context
- **[.ai/PROJECT_OVERVIEW.md](./.ai/PROJECT_OVERVIEW.md)** — product vision, personas, MVP scope
- **[.ai/CURRENT_STATE.md](./.ai/CURRENT_STATE.md)** — what's actually built today
- **[.ai/BUSINESS_MODEL.md](./.ai/BUSINESS_MODEL.md)** — how Beitco makes money
- **[.ai/ROADMAP.md](./.ai/ROADMAP.md)** — phased plan
- **[.ai/TASKS.md](./.ai/TASKS.md)** — active task board
- **[.ai/AI_RULES.md](./.ai/AI_RULES.md)** — coding standards

---

## Status

Currently in **Phase 1: Make It Real** — wiring frontend to API, adding auth, building the post-a-listing flow.

The frontend is fully designed (Arabic RTL, Egyptian dialect) but consumes mock data. The backend exists as a scaffold but isn't wired up yet.

See [`.ai/CURRENT_STATE.md`](./.ai/CURRENT_STATE.md) for the honest breakdown.

---

## License

PROPRIETARY · © 2026 Beitco
