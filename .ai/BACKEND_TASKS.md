# Backend Task Board — Beitco

> **Active board for backend (`apps/api`) work.** Branch: `dev`. Update as work happens.
> Created June 17, 2026 · Aligned with `.ai/PRD.md`, `.ai/TRUST_SPEC.md`, and the working frontend (`apps/web`).
>
> **Context:** The frontend is a feature-complete prototype on a localStorage mock (`apps/web/src/lib/beitco/`). The backend was originally a social/video platform; on `dev` we removed the social modules and kept the housing-relevant ones — but they target a **pre-pivot Prisma schema**. The mission of this phase: make the trust-first bed-level marketplace **real on a server**, with the frontend reading/writing the API instead of localStorage.
>
> **North star:** the frontend's mock store (`store.ts`) and pure engines (`trust.ts`, `matching.ts`) are the **executable spec** for the API. Port their shapes and logic; don't reinvent them.

---

## 🟢 In Progress

_(Backend B-0→MOD-1 done. **FE wiring pass:** reads (B-1) + saved-listings (1) + saved-searches (2) + renter-leads (3) + Q&A (4) + reviews (5) + create/edit listing (6a) + owner-leads & renter-reviews (6b) + admin moderation (6c) + dashboard management/overview (6d) wired behind the flag. **The whole flag-on app is now interactive against the backend.** Next: the matching-engine port + renter-preferences persistence, then port/retire the `_unported/` modules.)_

> **Known seed-fidelity note (not a wiring bug):** properties carry a hand-set display `reviewsCount` (e.g. 32) larger than their actual seeded review rows. The trust recompute counts real rows, so after the first real review the count snaps to the true value. Fix later by seeding more reviews or setting `reviewsCount = reviews.length` in the seed.

---

## ✅ Done

### FE-WIRE (slice 6d) · Dashboard management + overview on the API ✅ (June 23)
- **New owner-view read:** `GET /properties/mine` now returns **full `Property` objects with owner-only occupant data** (was summaries). `serializeProperty(p, { includeOccupants })` adds bed/room/whole `occupant` blocks **only** for the owner view; an `ownerInclude` (beds+rooms+whole occupant, questions) feeds it. The **public** `/properties/:id` still omits occupant data (privacy verified).
- **New mutation endpoint:** `PATCH /properties/:id/manage` (`ManageListingDto`) — one concern per call: `listingStatus` (pause/unpause, only on a live listing), `saleStatus`, or `whole`/`room`/`bed` occupancy (status + optional occupant). A private `setOccupant()` upserts/clears the 1:1 occupant (available → clear). Ownership-checked (403).
- `api.ts`: `apiListMine` now returns `Property[]`; `apiManageListing(id, patch)`. `queries.ts`: `useOwnerProperties` returns `Property[]`; flag-aware `manageListingStatus`/`manageSaleStatus`/`manageWholeOccupancy`/`manageRoomOccupancy`/`manageBedOccupancy` (mock upserts via `saveProperty`, API hits `/manage`).
- **Analytics decision (no events table yet):** mock keeps `getOwnerAnalytics` (real saves+leads, estimate views). New `ownerAnalyticsFromData(properties, leads)` powers API mode — **leads are real** (from the owner-leads API), views/saves stay deterministic estimates. Documented as the seam where a real analytics/events module slots in later.
- Wired `dashboard/listings.tsx` (grid + pause + whole/room/bed/sale occupancy via the flag-aware helpers + invalidate `ownerProperties`), `dashboard/index.tsx` (headline stats + analytics from `useOwnerProperties`/`useOwnerLeads`; `responseRate` from the auth user), `dashboard/reviews.tsx` (`useOwnerProperties`).
- **Verified (curl):** `/properties/mine` returns full bed-level data + occupants; pause→`paused`, unpause→`published`; occupy a bed → `occupied` + Arabic occupant (name/phone/moveIn/notes) persisted; free → `available` + occupant cleared; **public `/properties/2` never leaks occupant data**; cross-owner manage → **403**. Re-seeded. `tsc` both apps + 31 web tests; flag-on `/dashboard`, `/dashboard/listings`, `/dashboard/reviews` render 200. Flag OFF unchanged.

### FE-WIRE (slice 6c) · Admin moderation queue on the API ✅ (June 22)
- `api.ts`: `apiListPendingListings`/`apiModerationCount`/`apiApproveListing`/`apiRejectListing` (hit the AdminGuard-protected `/admin/moderation*`). `queries.ts`: `usePendingListings()` (returns full `Property[]` — the card needs landlord/address/description), `useModerationCount()` (nav badge), `approveListing(id)`/`rejectListing(id, reason)` (flag-aware; aliased over the store fns).
- `dashboard/moderation.tsx`: queue via `usePendingListings` (hook moved above the admin gate), approve/reject call the flag-aware helpers + invalidate `pendingListings`/`moderationCount`. `dashboard/route.tsx`: the admin nav badge uses `useModerationCount`. `isPlatformAdmin(user)` works in both modes (pure on the user object; API `apiMe` carries `isAdmin`).
- **Backend fix:** `listMine` was hardcoding `rejectionReason: undefined` — the owner couldn't see why a listing was rejected. Now it returns the real `rejectionReason` (the dashboard listings card shows it).
- **Verified (curl):** unverified owner creates 2 pending → **non-admin queue = 403** → admin sees queue (size 2, full landlord data) + `count=2` → **approve → published + public 200 + leaves queue** → **reject(reason) → public 404** → owner sees `status=rejected, reason="الصور مش واضحة"` on `/properties/mine` → queue `count=0`. Re-seeded. `tsc` both apps + 31 web tests; flag-on `/dashboard/moderation`, `/dashboard`, `/dashboard/leads` render 200. Flag OFF unchanged.

### FE-WIRE (slice 6b) · Owner leads + owner→renter reviews on the API ✅ (June 22)
- **Backend enrichment:** `listOwnerLeads` now attaches, per lead, the renter's `renterReputation` ({score,count}|null) and `canReview` (a confirmed owner↔renter tenancy not yet reviewed — mirrors the mock's `canOwnerReviewRenter`), batched (no N+1). So the owner leads page needs no extra per-renter calls.
- **Seed fix (real bug):** the reset only deleted a handful of tables and relied on cascades, but `renter_reviews.property_id` is `ON DELETE RESTRICT` — so once any renter-review existed, `npm run db:seed` failed at `property.deleteMany()`. Reset is now comprehensive (all engagement/review/thread tables, children-first) and re-runnable.
- `api.ts`: `apiReviewRenter(renterId, dto)`. `queries.ts`: `useOwnerLeads(userId)` (flag-aware) + `setLeadStatus(id, status)` + `submitRenterReview(ownerId, renterId, input)` + pure flag-aware helpers `renterReputationOf(lead)` / `ownerCanReview(ownerId, lead)` (API reads the enriched lead; mock reads the store). Lead type gained optional `renterReputation`/`canReview`.
- `dashboard/leads.tsx`: list via `useOwnerLeads`, property titles via `useOwnerProperties`, approve/decline/complete via `setLeadStatus` + invalidate `ownerLeads`, renter-review dialog via `submitRenterReview`; the reputation badge + "قيّم الساكن" gate use the flag-aware helpers.
- **Verified (the full owner loop, curl):** renter creates a lead → owner sees it (reputation null, canReview false) → approve → **complete creates a tenancy** → `canReview` flips **true** → owner reviews the renter → reputation **{score 7.8, count 1}**, `canReview` back to **false**; cross-owner status PATCH → **403**. Re-seeded cleanly (seed fix). `tsc` both apps + 31 web tests; flag-on `/dashboard/leads`, `/dashboard`, `/me` render 200. Flag OFF unchanged.

### FE-WIRE (slice 6a) · Create/edit listing on the API ✅ (June 22)
- `api.ts`: `apiCreateProperty`/`apiUpdateProperty`/`apiDeleteProperty`/`apiListMine` + a `propertyToListingPayload(p)` mapper that sends only the `CreateListingDto` input subset (Arabic `spec.unitType`/`nearby.type` pass through; `type`/`priceFrom`/bed-counts/`trust`/`status` are all derived server-side).
- `queries.ts`: `useOwnerProperties(userId)` (flag-aware: mock full Property[], API summaries+status from `GET /properties/mine`) + `saveListing(property, {isEdit, editId})` (POST create / PATCH edit; returns the authoritative saved Property) + `deleteListing(id)`.
- `list/new.tsx` (the "حط شقتك" wizard): edit hydration is now **flag-aware async** (`apiGetProperty` in API mode, fetched once into `existingProp` and reused by the ownership guard + publish); publish calls `saveListing` and uses the **server-decided status** for the toast/redirect; added a `publishing` guard (disables the button, error toast on failure) to prevent double-submit on the API round-trip. `me/index.tsx` listings count → `useOwnerProperties`.
- **Scope:** the dashboard **management** grid (`/dashboard/listings` pause/unit-status partial updates, `/dashboard` analytics, `/dashboard/reviews`, `/dashboard/leads`) is **slice 6b** — it needs full owner properties + a few status mutations the create DTO doesn't carry.
- **Verified (curl):** verified owner (مصطفى) create → **published** (type `شقة`, `priceFrom` derived) → shows in `/properties/mine` → edit title → **stays published**; unverified owner (أحمد عبده) create → **pending_approval**; cross-owner edit → **403**; delete own → 200 then public GET **404**. Re-seeded to canonical. `tsc` both apps + 31 web tests; flag-on `/list/new` + `/me` render 200 (edit URL 307→login when logged-out, expected). Flag OFF unchanged.

### FE-WIRE (slice 5) · Reviews on the API ✅ (June 22)
- **New backend read:** `GET /properties/:id/review-meta` (authenticated) → `{ canReview, votedReviewIds }` — `canReview` mirrors the mock's `canUserReview` (a 30+ day tenancy here); `votedReviewIds` = the reviews on this listing the user marked helpful. (Post/helpful/reply endpoints already existed in B-2b.)
- `store.ts`: added `getVotedReviewIds(userId)` so the flag-aware hook returns one shape in both modes.
- `api.ts`: `apiPostReview`/`apiToggleReviewHelpful`/`apiReplyToReview`/`apiGetReviewMeta`. `queries.ts`: `useReviewMeta(propertyId, userId)` (flag-aware, zero-flash) + `submitReview`/`toggleHelpful`/`replyReview`.
- `property.$id.tsx`: eligibility + helpful-vote state now come from `useReviewMeta`; `ReviewCard` takes a `voted` prop (from `votedReviewIds`) instead of a direct store read; post/helpful/reply call the flag-aware helpers and run a shared `onReviewChange()` = `refreshDetail()` (loader re-run/store re-read) **+ invalidate `reviewMeta`** so the count, the helpful state, and eligibility all update.
- **Verified (the wedge, end-to-end):** seeded a 60-day tenancy → `review-meta` `canReview:true` → posted a review that **moved trust 8.1 → 7.3** (real computed value) → review appears in the read list → renter toggled helpful (`voted:true`, count 1, `votedReviewIds` now lists it) → **owner (بيتكو كولايفنج) replied** and the reply shows on read-back → **stranger (no tenancy) `canReview:false`, post = 403**. Re-seeded to restore canonical state. `tsc` both apps + 31 web tests; flag-on `/property/1,2` + `/me/applications` render 200. Flag OFF unchanged.

### FE-WIRE (slice 4) · Q&A on the API ✅ (June 22)
- **Read serializer fix:** `listings.serializer.ts` was hardcoding `qa: []` — now maps real `questions` (added `questions` to the read `detailInclude` + a `QuestionRow` type). Q&A `date` uses a new `arDate()` helper matching the mock's `toLocaleDateString("ar-EG-u-nu-latn")` format. So with the flag on, the property-detail loader returns the listing's real Q&A.
- `api.ts`: `apiAskQuestion(propertyId, body)` / `apiAnswerQuestion(questionId, body)`. `queries.ts`: `submitQuestion`/`submitAnswer` (flag-aware; return void — callers re-read).
- `property.$id.tsx`: ask + owner-answer now call the flag-aware helpers; added a shared `refreshDetail()` that **re-runs the route loader via `router.invalidate()` in API mode** (so new Q&A shows) and falls back to the local `refresh()` in mock mode. (This loader-invalidate pattern is what slice 5 reviews will reuse.)
- **Verified:** `tsc` (both apps) + 31 web tests; flag-on `/property/1` & `/property/2` render 200 with real Q&A; full curl flow — renter asks → read-back shows the unanswered Q → **owner (مصطفى حسن) answers** → read-back shows q+a+answerer (Arabic date `22‏/6‏/2026`) → **non-owner answer = 403**. Flag OFF unchanged.

### FE-WIRE (slice 3) · Renter leads on the API ✅ (June 22)
- `api.ts`: `apiCreateLead`/`apiListRenterLeads` (+ `apiListOwnerLeads`/`apiUpdateLeadStatus` ready for the owner slice).
- `queries.ts`: `useRenterLeads(userId)` (flag-aware, zero-flash `initialData`) + `submitLead(input)` (same input shape as the mock `createLead`; API reads propertyId from the URL and takes renterId/name from the session) + `usePropertyLookup()` (flag-aware id→property resolver: mock uses the full store lookup, API resolves from the cached published set).
- Wired the renter surfaces: property-detail "اطلب معاينة"/booking submit (`submitLead` + invalidate `["renterLeads"]`), `/me/applications` (list via `useRenterLeads`, property via `usePropertyLookup`), `/me` overview pending count.
- **Scope note:** owner-side lead management (`/dashboard/leads`, `/dashboard` overview) is deferred to the owner-dashboard slice (slice 6) since it's entangled with owner properties (`/properties/mine`), renter-reputation badges, and owner→renter reviews. Chat thread/message side-effects stay on the mock (chat isn't ported yet).
- **Verified:** `tsc` + 31 web tests green; flag-on web serves `/`, `/search`, `/property/1`, `/me/applications` all 200 (no SSR errors); full curl round-trip — verify OTP → `POST /properties/1/leads` (Arabic note + renterName round-trip) → `GET /me/leads` returns the `pending` viewing lead. Flag OFF unchanged.

### FE-WIRE (slice 2) · Saved searches on the API ✅ (June 22)
- `lib/beitco/queries.ts`: `useSavedSearches(userId)` (flag-aware: mock returns `getSavedSearches` sync with zero-flash `initialData`; API hits `GET /me/searches`) + `createSavedSearch(userId, params)` (branches mock `saveSearch`/`apiCreateSavedSearch`, deriving the label via `describeSavedSearch`) + `removeSavedSearch` + `alreadySavedIn(list, params)` (dedup via the now-exported `sameSearch`).
- `store.ts`: `sameSearch` promoted to an export (shared dedup helper).
- `routes/search.tsx`: the "save this search" banner now reads `useSavedSearches(user?.id)` for its saved/not-saved state and calls `createSavedSearch` + invalidates `["savedSearches", user.id]` on save (replaces the direct `hasSavedSearch`/`saveSearch` store calls + the old `savedTick` re-render hack).
- **Verified:** `tsc` + 31 web tests green; full curl round-trip against the live API — send/verify OTP → `POST /me/searches` (Arabic label **and** `params.area` round-trip through the Prisma JSON column) → `GET /me/searches` → `DELETE` → list-after-delete correct; ownership scoped to `userId`. Flag OFF unchanged.

### FE-WIRE (slice 1) · Saved listings on the API ✅ (June 22)
- `lib/beitco/queries.ts`: `useSavedListings(userId)` (TanStack Query, flag-aware: mock resolves ids→properties sync with zero-flash `initialData`; API hits `GET /me/saved`) + `toggleSavedListing(userId, propertyId)` (branches mock/`apiToggleSaved`).
- Wired all three surfaces to the shared query cache: `/me/saved` (list + unsave), property-detail save button (optimistic heart via cache + invalidate), `/me` overview saved count.
- **Verified:** `tsc` + 31 tests green; flag-on web serves `/`, `/search`, `/me/saved`, `/property/1` all 200 against the live API, no client errors. Flag OFF unchanged.

### B-2c + MOD-1 · Create/edit listings + admin moderation ✅ (June 22)
- **Listings write** (`apps/api/src/listings/listings.write.service.ts`): `POST /properties` (create — nested rooms→beds, server-derived `type`/`priceFrom`, **moderation-gated status** via `getInitialListingStatus`: admin/verified → `published`, else `pending_approval`; recomputes trust), `PATCH /properties/:id` (edit own — re-runs the gate for draft/rejected, keeps live ones live), `GET /properties/mine` (owner, all statuses), `DELETE /properties/:id` (soft). Ownership enforced (403).
- **MOD-1 admin** (`apps/api/src/admin/`, `AdminGuard` = `isAdmin`): `GET /admin/moderation` (pending queue, oldest first), `GET /admin/moderation/count` (nav badge), `POST /admin/moderation/:id/approve` (→ published + recompute), `POST /admin/moderation/:id/reject` (reason).
- **Verified (curl):** verified owner create → **published**; unverified → **pending_approval** (correct type/priceFrom derivation); non-admin queue → **403**; admin sees queue, approve → published + **publicly visible (200)** + count decrements; reject-with-reason persists (owner sees it on `/properties/mine`); cross-owner edit → **403**. Seed data intact after cleanup. `tsc` green both apps; 17 Jest + 31 web tests pass.

### T-PORT + B-2b · Trust engine port + reviews that move the score ✅ (June 22)
- **Trust engine** ported to `apps/api/src/trust/trust.engine.ts` (pure, framework-free — mirrors `apps/web/src/lib/beitco/trust.ts`): `bayesianMean`, `computeQualityFromReviews`, `computeListingTrust`, `computeOwnerTrust`, `computeRenterReputation`, `computeResponseRate`. **17 Jest tests pass** (mirror the frontend Vitest cases: smoothing, verification cap, DoD, response rate, reputation).
- **`TrustService`** (global module): recomputes + persists from Prisma — owner response rate from `ResponseEvent`s (T-3), listing quality+trust (T-1/T-2), owner trust, renter reputation (T-4). `GET /properties/:id/trust` exposes the live breakdown.
- **`reviews` module** (B-2b): `POST /properties/:id/reviews` (gated by a 30-day tenancy; **triggers a trust recompute**), `POST /reviews/:id/helpful` (toggle, dedup vote), `POST /reviews/:id/reply` (owner), `POST /users/:renterId/reviews` (owner→renter, T-4; **recomputes reputation**).
- **Verified (curl):** posting a review **moved a listing's trust 8.3 → 5.2** (real computed value vs the hand-set seed); breakdown endpoint returns components; helpful toggle (1 vote); owner reply persists; 30-day gate rejects non-residents (**403**); owner→renter review set reputation to **7.8** (Bayesian-smoothed). Test data cleaned. `tsc` green; 17 Jest + 31 web tests pass.
- **Deferred:** the **matching engine** port (pairs with renter-preferences persistence — it's heavy on Arabic string literals, its own task). Frontend wiring of review actions behind the flag (with the saved/leads/Q&A wiring).

### B-2 (slice) · Persist core writes — API + profile wiring ✅ (June 22)
- **API** (auth-protected, ownership-checked):
  - `users` module: `PATCH /users/me` (name/role/avatar/notificationPrefs).
  - `engagement` module: saved listings (`GET /me/saved`, `POST /properties/:id/save` toggle), saved searches (`GET/POST /me/searches`, `DELETE /me/searches/:id`), leads (`POST /properties/:id/leads`, `GET /me/leads`, `GET /me/owner-leads`, `PATCH /leads/:id/status`), Q&A (`POST /properties/:id/questions`, `POST /questions/:id/answer`). Completing a lead creates a confirmed tenancy (idempotent). Owner-only actions enforce ownership (403 otherwise).
- **Frontend:** `lib/beitco/api.ts` write calls; `auth.tsx` `updateUser` now persists settings to `PATCH /users/me` in API mode (completes the A-1 gap, optimistic).
- **Verified (curl, authenticated):** save toggle + list, saved search create/list/delete, profile update, lead create → owner approve → complete → **tenancy created**, Q&A ask → owner answer; cross-user approve → **403**. Test data cleaned. `tsc` green both apps; 31 web tests pass.
- **Remaining (B-2 cont.):** wire saved-listings/saved-searches/leads/Q&A **on the frontend** behind the flag (sync→async call-site refactor). Reviews + helpful + owner-reply and **create/edit listing** are **B-2b** (pair with **T-PORT** trust recompute). Renter-preferences (`profile`) persistence pairs with the matching-engine port.

### A-1 · Real phone OTP + JWT ✅ (June 22)
- **API** (`apps/api/src/auth/`, rebuilt on the new schema — `_unported/auth` retired): `POST /auth/otp/send` (6-digit OTP in Redis, 5-min TTL, 60s cooldown; dev returns a fixed `123456` + logs it, prod stub for an SMS gateway), `POST /auth/otp/verify` (find-or-create user by phone → issues access+refresh JWTs as **httpOnly cookies** + returns `{ user, isNewUser }`), `POST /auth/complete-profile` (name/role/gender for new users), `GET /auth/me`, `POST /auth/refresh`, `POST /auth/logout` (revoke via Redis blacklist). JWT strategy reads the cookie or Bearer; `serializeUser` → frontend `User` shape (no tiers — `isAdmin` + verification replace the old 5-tier model). `cookie-parser` added; CORS allows credentialed requests from the web origin.
- **Guard:** global `JwtAuthGuard` restored (skips `@Public()`); health + listings marked `@Public()` so browsing stays open.
- **Frontend** (behind `VITE_USE_API`): `lib/beitco/auth.tsx` branches each method on the flag — same `useAuth` surface. API mode: `apiMe()` hydrates the session from the cookie, `requestOtp`/`verifyOtp`/`completeProfile`/`logout` hit the API (gender mapped Arabic ↔ male/female; `credentials: include`). Mock mode unchanged (default). `updateUser` stays local in API mode until the user-update endpoint (B-2).
- **Verified:** dev OTP → verify (existing user مصطفى + new-user stub) → `beitco_at` cookie set → `GET /me` returns the user; protected routes 401 without auth; listings stay public; CORS allows creds from `localhost:8080`. Flag-on web serves login+home 200. `tsc` green both apps; 31 web tests pass.

### B-1 · Listings read API + wire the frontend ✅ (June 22)
- **API** (`apps/api/src/listings/`, rebuilt on the new schema): `GET /api/v1/properties` (cursor-paginated; filters `type`/`purpose`/`gender`/`area`/`minPrice`/`maxPrice`/`verifiedOnly`/`nightly`/`freeOnly`/`sort`) returns `PropertySummary`-shaped rows; `GET /api/v1/properties/:id` returns the full `Property` shape (rooms → beds, nearby, landlord, reviews, computed `beds` counts). A serializer maps Prisma rows → the frontend's Arabic-enum shape (`type`/`unitType`/`nearby.type` mapped back to Arabic; bed summary mirrors `summarizeListing`). Public (no auth yet). Wired into `app.module.ts`.
- **Frontend** (behind `VITE_USE_API`, default OFF → mock): `lib/beitco/api.ts` (typed client) + `lib/beitco/queries.ts` (`usePublishedProperties` with `initialData` so the mock path is zero-flash/byte-identical). Home + search use the hook; property detail's loader is API-aware (keeps `head()`/SEO working). `PropertySummary` gained `address` + `createdAt` (search filters/sort need them) across types + mock + API serializer.
- **Verified:** API returns correct data (sale→#7, nightly→#4, bed+freeOnly→#3/5/2; detail #2 has 3 rooms/8 beds/landlord/review, bed counts match `summarizeListing`). With `VITE_USE_API=true` the property-detail SSR loader fetches the API and renders the correct dynamic Arabic title; home/search/property all 200. Flag OFF (default) unchanged. `tsc` green both apps; 31 web tests pass.

### B-0.2 · Response envelope + conventions ✅ (June 22)
- `ResponseEnvelopeInterceptor` (global) wraps success responses in `{ success: true, data, meta? }` (lifts `{ data, meta }` from paginated handlers; passes through handlers that already envelope). The existing `AllExceptionsFilter` emits `{ success: false, error: { code, message } }`. Wired in `main.ts`. Cursor-pagination DTO already in `common/`.

### B-0.1 · Seed parity ✅ (June 17)
- First migration applied: `prisma/migrations/20260621160438_init_bed_level_trust` (26 tables incl. PostGIS) against Postgres.
- `prisma/seed.ts` ports `apps/web/src/lib/beitco/seed-data.ts`: **12 users** (admin + 6 owners + 5 renters), **7 properties** (all published) with **17 rooms, 24 beds** (9 available), **4 reviews**, 1 consent-linked occupant, 8 nearby places, the sale listing (#7) and the nightly listing (#4). Arabic display strings preserved; only enum fields mapped to Latin (`type`, `unitType`, `nearby.type`). Idempotent (wipes demo tables first). Configured via `package.json#prisma.seed` (`ts-node --transpile-only`) → `pnpm --filter @beitco/api db:seed`.
- **Local DB note:** this machine runs a native Postgres on 5432, so the Beitco container is exposed on **5433** via `docker-compose.override.yml`; `apps/api/.env` `DATABASE_URL` points at 5433. The committed `docker-compose.yml` keeps 5432 for clean envs.

### B-0 · Rewrite the Prisma schema to the bed-level + trust model ✅ (June 17)
- New `apps/api/prisma/schema.prisma`: **22 models, 21 enums**, mirroring `apps/web/src/lib/beitco/types.ts`. UUID PKs, `snake_case` columns via `@map`, soft deletes (`deleted_at`), PostGIS extension preserved.
- Models: `User`, `RenterProfile`, `Property` → `Room` → `Bed`, `Occupant` (consent link), `NearbyPlace`, `CustomSpec`, `Review` + `ReviewHelpfulVote`, `RenterReview`, `ResponseEvent`, `Question`, `Thread` + `Message`, `Lead` + `LeadUnit`, `Tenancy`, `SavedListing`, `SavedSearch`, `Notification`, `VerificationRequest`. Enums use Latin values (Arabic mapped in the app layer).
- `prisma validate` ✅, `prisma format` ✅, `prisma generate` ✅ (client exposes the new models; old social models gone).
- **Minimal compiling core:** the legacy social-coupled services were moved to `apps/api/src/_unported/` (excluded from `tsconfig` + `tsconfig.build`), `app.module.ts` trimmed to infra (Config, Throttler, Prisma, Health). `tsc --noEmit` ✅, `nest build` ✅ (dist = app.module/common/health/main/prisma only). The `_unported` modules are ported back onto the new schema one at a time (A-1, B-1, B-2, MOD-1…).
- ⏳ **`prisma migrate dev` not yet run** — needs a running Postgres (`docker compose up -d postgres`). The schema is validated and the client is generated; the first migration lands with B-0.1/B-1 once the DB is up.

---

## 🟠 Phase 2 — Write path (persist everything)

### B-2 · Persist core writes ⭐ **NEXT**
- Endpoints + services for: create/edit listing (moderation-gated by verification — port `getInitialListingStatus`), reviews, Q&A (ask/answer), leads (viewing + bed-level booking), tenancies, saved listings, saved searches, occupant consent-linking, **user profile update** (settings/preferences — also completes A-1's `updateUser` in API mode).
- Frontend: swap each `store.ts` mutation for a mutation hook; optimistic where it makes sense.
- **DoD:** a full owner+renter journey persists across sessions/devices.

### T-PORT · Port the trust + matching engines to services
- Move `trust.ts` (T-1→T-5) and `matching.ts` into NestJS services (they're already pure — near-direct port). Recompute on review/reply/verification/booking; persist `trustBreakdown`. Expose `GET /properties/:id/trust`.
- Add the **same unit tests** (Jest) the frontend has (Vitest) — Bayesian smoothing, verification cap, response rate, reputation, matching eligibility.
- **DoD:** posting a review via the API moves the score; the 31-equivalent tests pass server-side.

### N-1 · Notifications (real)
- Derive/persist notifications for leads, messages, review-eligibility, verification, occupant links. SMS/email/push channels (response-rate metric depends on real message timing).

---

## 🟣 Phase 3 — Scale & monetize

### S-1 · Meilisearch-backed search
- Reindex bed-level listings; move search filters/sort from in-memory to Meilisearch. `search` module exists — point it at the new `Property` index.

### MED-1 · Media to object storage
- S3/R2 presigned upload for listing photos + KYC docs; replace data-URL images. Serve responsive sizes (frontend already has `OptimizedImage`).

### PAY-1 · Payments
- Build out the stub `payments` module: verified-owner subscription (299 EGP/mo) + 5% success fee on ≥30-day move-ins. Egyptian gateway (Paymob/Fawry).

### RT-1 · Realtime chat
- Wire the `chat` Socket.io gateway to the frontend messaging; presence + unread; feeds `ResponseEvent` timing for T-3.

---

## 🛠 Backend Tech Debt / Cleanup

- [x] ✅ Removed social/video modules (posts, comments, social, likes, feed, groups, videos) on `dev`.
- [ ] Rewrite `schema.prisma` (B-0) — until then the schema still carries dead social models.
- [ ] Trim `admin`/`moderation` report types to housing (drop post/comment/video reports).
- [ ] Reconcile/rewrite `.ai/ARCHITECTURE.md`, `DB_SCHEMA.md`, `API_SPEC.md` (currently pre-pivot — flagged stale).
- [ ] `docker compose up -d` reliability for Redis/Meilisearch; add a `pnpm api:infra` helper.
- [ ] Delete `apps/api/test-auth-flow.mjs` if superseded by proper e2e tests.
- [ ] Port frontend's Vitest engine tests to Jest in the API (T-PORT).

---

## Build order (recommended)

1. **B-0** schema rewrite → **B-0.1** seed → **B-0.2** envelope
2. **B-1** listings read + wire FE → **A-1** auth
3. **B-2** writes → **MOD-1** moderation → **T-PORT** trust/matching → **N-1** notifications
4. **S-1** search → **MED-1** media → **PAY-1** payments → **RT-1** realtime

> Keep the frontend green at every step: each phase swaps a slice of `store.ts` for the API behind the same hook surface, so the UI never regresses.
