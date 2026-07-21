# Beitoon  -  Architecture

> **Last updated:** June 25, 2026 · Current system design (post-pivot, full-stack + operator portal).
> Companion docs: `.ai/DB_SCHEMA.md` (data), `.ai/API_SPEC.md` (endpoints), `.ai/CURRENT_STATE.md` (status), `.ai/NEXT_STEPS.md` (backlog), `.ai/ADMIN_PLAN.md` (operator portal), `.ai/PROD_READINESS.md` (go-live).

---

## 1. Shape

A **Turborepo + pnpm** monorepo:

```
apps/
  web/   TanStack Start (Vite + React 19)  -  the Arabic-RTL frontend
  api/   NestJS 11  -  the trust-first marketplace API
infra:   docker-compose.yml  (Postgres 16+PostGIS, Redis 7, Meilisearch v1.11)
.ai/     the documentation / knowledge base
```

> A monorepo with no shared `packages/` today  -  the frontend `lib/beitco/types.ts` is the shape spec, the API serializers mirror it (the pre-pivot `@beitoon/*` packages were unused and removed, POLISH-2). Add a shared package later only if a real contract emerges.

Run: `pnpm web` (→ :8080) · `pnpm api` (→ :3001) · `pnpm dev` (both).

---

## 2. The core pattern: `VITE_USE_API`

The frontend was built first as a **feature-complete prototype on a localStorage mock**, which is the **executable spec** for the API. Every data access goes through one flag-aware layer so the two backends are interchangeable:

```
UI route/component
  → lib/beitco/queries.ts      (TanStack Query hooks; the only data entrypoint)
      if VITE_USE_API:  lib/beitco/api.ts   → fetch → NestJS
      else:             lib/beitco/store.ts → localStorage mock
```

- **OFF (default):** mock resolves synchronously; hooks hydrate via `initialData` → zero loading flash, byte-identical to the pre-API app.
- **ON:** the same hooks fetch from the API; shapes match exactly (the API serializers reproduce the mock's `types.ts` shapes, Arabic enums and all).

This let the backend be built and verified slice-by-slice without ever breaking the prototype. **Keep new data access on this pattern** (never call `api.ts` or `store.ts` directly from a component).

---

## 3. Frontend (`apps/web`)

- **Routing:** TanStack Router file-based routes in `src/routes/` (33 routes); tree auto-generated (`routeTree.gen.ts`).
- **Data:** TanStack Query everywhere via `lib/beitco/queries.ts`. Mutations invalidate the relevant query keys.
- **State of truth for shapes:** `lib/beitco/types.ts` (frontend)  -  mirrored by the API serializers.
- **Pure engines (also ported to the API):** `lib/beitco/trust.ts`, `lib/beitco/matching.ts`  -  framework-free, unit-tested (Vitest).
- **Realtime:** `lib/beitco/socket.ts` + `useChatSocket.ts`  -  a single Socket.io connection (cookie auth, `withCredentials`); `message:new` triggers query invalidation (Query stays the source of truth).
- **UI:** Tailwind v4 + shadcn/ui; Arabic RTL with **CSS logical properties only** (`ms`/`me`/`ps`/`pe`/`start`/`end`); dark mode; PWA manifest; mobile bottom-nav; Leaflet maps.

## 4. Backend (`apps/api`)

NestJS  -  **one module per feature**, services inject `PrismaService`. Cross-cutting:

- **Bootstrap (`main.ts`):** `cookie-parser`, CORS (credentialed, origins from `CORS_ORIGINS`), `/api` prefix + URI versioning (`v1`), global `AllExceptionsFilter` + `ResponseEnvelopeInterceptor`, strict `ValidationPipe` (`whitelist` + `forbidNonWhitelisted` + transform), Swagger at `/api/docs`.
- **Response envelope (always):** `{ success, data, meta?: { cursor, hasMore }, error?: { code, message } }`.
- **Auth:** global `JwtAuthGuard` (skips `@Public()`); access+refresh JWTs in **httpOnly cookies** (`beitco_at`); OTP + refresh state + blacklist in Redis.
- **Authz:** ownership checks in services (403); `AdminGuard` (`isAdmin`) for moderation; chat is participant-checked; the WS gateway re-verifies the cookie JWT.
- **Trust/matching:** pure engines (`trust/trust.engine.ts`, `matching/matching.engine.ts`) + services that read Prisma, compute, and persist. Trust recompute is triggered by the writes that should move a score (review, owner reply via `ResponseEvent`, verification).

**Module map:** `auth · listings · engagement · reviews · trust · matching · chat · notifications · admin · reports · verification · uploads · search · users · redis · common · health`. The **`admin` module** is the operator portal (overview/stats, audit log, users, listings, content moderation, analytics)  -  every mutation writes an `AdminAuditLog` row. See `.ai/CURRENT_STATE.md` for each module's responsibility and `.ai/API_SPEC.md` for routes.

## 5. Data & infra

- **PostgreSQL 16 + PostGIS** via Prisma. 24 models, 23 enums, UUID PKs, snake_case `@map`, soft deletes (`deleted_at` + content-moderation `removed_at`), 30+ indexes/uniques. Source of truth: `apps/api/prisma/schema.prisma` (see `.ai/DB_SCHEMA.md`). Dev runs on **port 5433** (gitignored override; native pg holds 5432). **PostGIS geo search is live**  -  a trigger-maintained, GiST-indexed `geog` column powers `ST_DWithin` radius search (PROD-4). An append-only **`AdminAuditLog`** records operator actions; **`Report`** backs the abuse queue.
- **Redis 7**  -  OTP store, refresh/blacklist, notification last-seen marker.
- **Meilisearch v1.11**  -  **integrated** (PROD-3): typo-tolerant, Arabic-aware `?q=` with relevance ordering + a DB `contains` fallback. The web search page sends `q` + filters + geo to the API in `VITE_USE_API` mode (mock mode filters client-side).

---

## 6. Request lifecycles (examples)

**Browse (public):** `GET /api/v1/properties` → `JwtAuthGuard` skips (`@Public`) → `ListingsService.list` (Prisma, cursor-paginated) → serializer → envelope with `meta.cursor`.

**Post a review (the wedge):** `POST /properties/:id/reviews` → auth → `ReviewsService.create` checks a 30-day tenancy (403 otherwise) → persists → `TrustService.recomputeListing` → response. The listing's computed trust visibly drops/rises.

**Send a chat message:** `POST /threads/:id/messages` → participant check → persist + flip `unreadForId` → maintain `ResponseEvent` (owner's first reply closes it → `recomputeOwner`) → `ChatGateway.notifyNewMessage` emits `message:new` to both `user:<id>` rooms → clients invalidate and refetch.

**Saved-search alert:** owner/admin publishes a listing → `NotificationsService.notifyForNewListing` serializes it, runs the pure `propertyMatchesSavedSearch` over all saved searches, and persists one `Notification` per matching user (owner excluded, deduped). Appears in their feed + bell.

---

## 7. Conventions (enforced)

- TypeScript strict, **no `any`** (API has zero).
- Cursor-based pagination (no offset).
- Arabic-first, Egyptian colloquial dialect in all UI copy.
- CSS logical properties only (RTL-safe).
- New feature → new Nest module; new data access → a flag-aware hook in `queries.ts`.

See `.ai/AI_RULES.md` for the full coding standards.
