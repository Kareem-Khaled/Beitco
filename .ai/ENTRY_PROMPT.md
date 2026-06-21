# Beitco — Entry Prompt (Single Source of Truth)

> **Read this first.** Every other doc serves this one. If anything contradicts this file, this file wins.

---

## What Beitco Is

**Beitco is a trust-first housing marketplace for Egypt that rents at the bed level, not just the apartment level.**

Think Airbnb meets Glassdoor for Egyptian housing — but the unit of inventory is a **bed in a shared apartment**, not the apartment itself. Owners list how many beds are available *right now*. Renters filter by what they actually need (budget, area, vibe) and book a bed, a private room, or a whole apartment.

The product wedge isn't price or supply — it's **trust**. Every listing carries verification status, a trust score, real reviews from past residents (with months-lived), quality scores (internet, safety, noise, maintenance, cleanliness), landlord response rate, and a public Q&A.

---

## Core Loop

```
Owner posts apartment + marks N beds available
            ↓
Renter says "I need X" (budget, area, type, profile)
            ↓
Beitco matches & ranks by trust score
            ↓
Renter sees real reviews + verification + quality scores
            ↓
Renter requests viewing or messages landlord
            ↓
After move-in & 30+ days → renter unlocks ability to review
            ↓
Trust score updates → loop strengthens
```

---

## Three Listing Types

| Arabic | English | Inventory unit |
|---|---|---|
| **شقة** | Apartment | Whole unit, single tenant/family |
| **أوضة** | Private room | Room inside shared flat |
| **سرير** | Bed | One bed in a shared room (coliving / student housing) |

---

## Why This Wins in Egypt

1. **Bed-level supply matches real demand.** Students, young professionals, and remote workers in Cairo/Alex/Zayed already share apartments. Existing portals (OLX, Property Finder) only sell whole units — the shared market is invisible and runs on Facebook groups and word-of-mouth.
2. **Trust is the #1 unsolved pain.** Egyptian renters get burned by fake listings, ghost landlords, hidden fees, and unsafe buildings. We make trust visible and earned.
3. **Arabic-first, Egyptian dialect.** Not stiff MSA — copy reads like a friend giving advice. ("لاقي سريرك في مصر", "حط شقتك", "متأكدين منه").

---

## Two-Sided Value

| Owner gets | Renter gets |
|---|---|
| Free listing with verification badge | Browse by area, type, budget |
| Trust score that grows with good reviews | Filter "أسرّة فاضية بس" (only available beds) |
| Higher response rate = better ranking | Real reviews from past residents |
| Single dashboard for all their beds | Quality scores per listing |
| Built-in messaging + viewing requests | Public Q&A before contacting |

---

## Tech Stack (current, do not change without discussion)

- **Frontend:** TanStack Start (Vite + React 19) + Tailwind v4 + shadcn/ui · path: `apps/web/`
- **Backend:** NestJS 11 + TypeScript 5.x + Prisma · path: `apps/api/`
- **DB:** PostgreSQL 16 + PostGIS
- **Cache/Queues:** Redis + BullMQ
- **Search:** Meilisearch
- **Video/Media:** Mux (deferred)
- **Mobile:** Capacitor 6.x wrapping the web app (deferred)
- **Monorepo:** Turborepo + pnpm

Run frontend: `pnpm web` (port 8080)
Run backend: `pnpm api` (port 3001)

---

## Hard Coding Rules

- **TypeScript strict mode.** Never use `any`.
- **API responses:** `{ success: boolean, data: T, meta?: { cursor, hasMore }, error?: { code, message } }`.
- **DB:** UUID PKs, `snake_case` columns (Prisma `@map`), `camelCase` in TS, soft-delete via `deleted_at`.
- **Pagination:** cursor-based only. No offset.
- **i18n:** Arabic-first, RTL default, Egyptian colloquial dialect (not MSA).
- **Layout:** CSS logical properties (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`) — never `ml-`/`mr-`/`left-`/`right-`.
- **Frontend:** Server Components default; `'use client'` only for interactivity.
- **NestJS:** one module per feature, services inject `PrismaService`.

---

## Permission Tiers (planned, not yet implemented)

| Tier | Role | Powers |
|---|---|---|
| 1 | Admin | Full access |
| 2 | Verified Owner/Renter | Auto-publish listings, post reviews after 30 days |
| 3 | Trusted Member | Listings need approval, can comment & ask Q&A |
| 4 | New User | Browse only, limited messaging |
| 5 | Restricted | Read-only |

Guard: `@RequireTier(2)` decorator on controllers.

---

## Reference Files

- `.ai/PROJECT_OVERVIEW.md` — product vision, personas, MVP scope
- `.ai/CURRENT_STATE.md` — what's actually built right now (start here)
- `.ai/PRD.md` — product requirements + feature inventory + roadmap
- `.ai/TRUST_SPEC.md` — the computed trust system (T-1→T-5)
- `.ai/BUSINESS_MODEL.md` — monetization & unit economics
- `.ai/TASKS.md` — frontend task board
- `.ai/BACKEND_TASKS.md` — **backend task board (current focus)**
- `.ai/ROADMAP.md` — 90-day plan
- `.ai/AI_RULES.md` — detailed coding standards
- `.ai/ARCHITECTURE.md` — system design (⚠️ pre-pivot, see CURRENT_STATE + BACKEND_TASKS)
- `.ai/DB_SCHEMA.md` — Prisma schema (⚠️ pre-pivot; rewrite tracked as B-0)
- `.ai/API_SPEC.md` — endpoint contracts (⚠️ pre-pivot; new plan in BACKEND_TASKS)
