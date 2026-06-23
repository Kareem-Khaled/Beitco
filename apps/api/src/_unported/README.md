# `_unported/` — pending ports

These modules were built for the **pre-pivot social/video platform** and target
the old Prisma schema. They are **excluded from the TypeScript build**
(`tsconfig.json` / `tsconfig.build.json` `exclude`) and from the Nest runtime —
nothing in `src/` imports them.

## Status (June 23, 2026)

The 5 dead modules were **retired** (deleted) this session — they were either
superseded or will be rebuilt fresh when needed:

| Module | Why retired |
|---|---|
| `moderation` | Old social-post flagging. **Listing** moderation already shipped as MOD-1 (`src/admin`). |
| `analytics` | Old social analytics. Dashboard analytics now computed by `ownerAnalyticsFromData` (web). A real events/analytics module slots in later. |
| `payments` | 34-line stub. Re-add when monetization (`.ai/BUSINESS_MODEL.md`) is built. |
| `search` | Old Meilisearch social search. Listings search is client-side filtering today (B-1); a real listings index is a future enhancement. |
| `users` | Old social users module (follows/profiles). Superseded by the wired `src/users` (`PATCH /users/me`). |

## Remaining — to **port from the frontend mock** (the executable spec)

Consistent with how listings/trust/matching were ported (frontend mock, not the
old backend, is the spec), these two are kept only as **infra scaffolding**
(e.g. the Socket.io gateway) for dedicated future slices:

- **`chat`** — powers "كلّم صاحب الشقة". Schema has `Thread` + `Message`. The web
  mock (`store.ts`: `findOrCreateThread`, `postMessage`, `getThreadsForUser`) is
  the spec. Port = REST + WS gateway, then wire `/messages` behind `VITE_USE_API`.
- **`notifications`** — saved-search/lead alerts. Schema has `Notification`. Spec:
  the web notification prefs + the saved-search "هنبلّغك" promise. Pairs with a
  BullMQ job that matches new listings against saved searches.

When porting, rebuild against the new bed-level + trust schema; treat the old
files here as reference for the transport/infra only, not the data model.
