# Beitco — Database Schema

> **Last updated:** June 24, 2026 · **Source of truth: `apps/api/prisma/schema.prisma`** (always defer to it). This is a navigable map, not a copy.
> PostgreSQL 16 + PostGIS via Prisma 6. **22 models, 21 enums.** Migrations in `apps/api/prisma/migrations/`.

---

## Conventions (enforced across every model)

- **UUID** primary keys (`@default(uuid())`).
- **snake_case** DB columns via Prisma `@map` / `@@map`; **camelCase** in TypeScript.
- **Soft deletes** via `deleted_at` (`deletedAt DateTime?`) on user-facing entities (`User`, `Property`).
- **Timestamps:** `createdAt @default(now())`, `updatedAt @updatedAt` where mutated.
- **JSON columns** for flexible/embedded data: `Property.costs`, `Property.quality`, `Property.trustBreakdown`, `User.notificationPrefs`, `SavedSearch.params`, `Review.scores`, `Review.ownerReply`.
- **30 indexes/uniques** — every foreign key + hot filter column (`status`, `ownerId`, `type`, `listingType`, `area`, `userId`) is indexed; natural keys are `@@unique` (e.g. `Thread @@unique([propertyId, renterId])`, `ReviewHelpfulVote @@unique([reviewId, userId])`, `SavedListing @@unique([userId, propertyId])`).

---

## Models by domain

### Identity & preferences
- **User** — phone-identity (no passwords). `isAdmin`, `verified`, `verificationStatus`, `trust`, `trustBreakdown`, `responseRate`, `renterReputation`, `renterReviewsCount`, `notificationPrefs`, `gender`, `role`. Soft-deletable. Hub of most relations.
- **RenterProfile** — 1:1 with User; the matching inputs (`budgetMin/Max`, `areas[]`, `lookingFor[]`, `nearMetro`, `metroLines[]`, `maxWalkMinutes`, `mustHaveAmenities[]`, `furnishedPref`, `housematesGender`, `occupation`, `intent`, …).
- **VerificationRequest** — KYC docs (`idDocUrl`, `selfieUrl`, optional `ownershipDocUrl`) + review state. Submit → pending → admin approve/reject (PROD-5, ✅).

### Listings (bed-level model)
- **Property** — the listing. Card-facing derived fields (`type`, `priceFrom`, `trust`, `verified`, `reviewsCount`) + structured fields (`rentalMode`, `unitType`, `bedrooms`, prices, `wholeStatus`, `saleStatus`, `rentToGender`, `images[]`, `amenities[]`, `costs` JSON, `quality` JSON, `lat`/`lng`, `status`, `rejectionReason`). Soft-deletable.
- **Room** — a room in a property (`by_room`/`by_bed` modes); optional price/status + an optional `Occupant`.
- **Bed** — a bed in a room (`by_bed`); price/status/features + an optional `Occupant`.
- **Occupant** — owner-only renter details attached to a bed/room/whole-unit (1:1 unique on each link). **Never serialized publicly.**
- **NearbyPlace** / **CustomSpec** — listing extras (transit/landmarks; free-form specs).

### Trust & reviews (the wedge)
- **Review** — resident → property. `rating`, `body`, `scores` JSON, `helpful`, `ownerReply` JSON. Gated by a 30-day tenancy; moves listing trust.
- **ReviewHelpfulVote** — one helpful vote per (review, user).
- **RenterReview** — owner → renter (T-4). Gated by a confirmed tenancy; moves renter reputation.
- **ResponseEvent** — 1:1 per thread; opened on the renter's first message, closed on the owner's first reply. Powers the **real response rate** (T-3) that feeds owner trust.

### Engagement
- **Lead** — viewing/booking request (`pending → approved/declined → completed`). Completing creates a `Tenancy`.
- **LeadUnit** — the specific bed(s)/room(s) a booking lead targets.
- **Tenancy** — confirmed residency; the gate for reviews + reputation.
- **Question** — public Q&A on a listing (`asker`, `body`, optional `answer`/`answerer`).
- **SavedListing** / **SavedSearch** — renter saves (search stores `params` JSON, matched by NOTIF-2).

### Messaging & notifications
- **Thread** — per (property, renter); `lastMessageAt`, `unreadForId`; one `ResponseEvent`.
- **Message** — `body`, `type` (`text` | `viewing_request`), sender.
- **Notification** — persisted rows (currently the **saved-search alerts**); merged with the derived feed (leads/messages/reviews/verification) at read time.

---

## Enums (21)

`UserRole · Gender · GenderPref · RentalGenderPolicy · VerificationStatus · PropertyType · UnitType · PropertyStatus · RentalMode · ListingType · SaleStatus · BedStatus · FurnishedPref · Occupation · NearbyType · LinkStatus · LeadStatus · LeadIntent · LeadUnitKind · MessageType · NotificationType`

> **Latin enum values in the DB; Arabic at the UI edge.** The frontend uses Arabic enums (`شقة`/`أوضة`/`سرير`, occupations, gender prefs); the API stores Latin (`apartment`/`room`/`bed`, …) and translates at the serializer / mapper boundary (`listings.serializer.ts`, `matching/renter-profile.mapper.ts`). Keep that translation in one place.

---

## Migrations

| Migration | Adds |
|---|---|
| `20260621160438_init_bed_level_trust` | The whole bed-level + trust schema (the post-pivot rewrite, task B-0). |
| `20260623105042_add_saved_search_notification` | `saved_search` value on `NotificationType` (NOTIF-2). |
| `20260624120000_add_geo_point` | PostGIS `geog geography(Point,4326)` column + GiST index + lat/lng sync trigger + backfill (PROD-4). |

Seed: `apps/api/prisma/seed.ts` — idempotent (children-first reset), 12 users + 7 properties (whole/by-room/by-bed/sale/nightly). Run `pnpm --filter ... db:seed` (or `npm run db:seed` in `apps/api`).

---

## Notes / planned

- **`lat`/`lng` are plain `Float`s**, but a **`geog geography(Point,4326)`** column (mapped in Prisma as `Unsupported(...)`) is derived from them by a DB trigger and **GiST-indexed** — `GET /properties?lat&lng&radiusKm` does PostGIS `ST_DWithin` radius search (PROD-4, ✅).
- **`images String[]`** holds object-storage URLs from the presigned upload pipeline (PROD-1, ✅), with a base64 fallback when uploads aren't configured.
