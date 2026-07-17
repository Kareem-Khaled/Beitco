# Task Board — Beitoon (Frontend)

> Frontend (`apps/web`) board. **Last updated: June 24, 2026.**
>
> ➡️ **The active backlog for the whole project is now `.ai/NEXT_STEPS.md`** (production hardening — security, testing, deploy, observability). The backend build log is `.ai/BACKEND_TASKS.md`. Current status is `.ai/CURRENT_STATE.md`.
>
> **Reality note (updated):** Both the frontend **and the backend are done end-to-end.** The frontend is fully wired to a real NestJS + Postgres API behind the `VITE_USE_API` flag (browse, auth, listings + moderation, leads, Q&A, reviews, matching, owner dashboard, live chat, notifications + saved-search alerts). The trust wedge is computed and proven on the server. **There is no remaining core FE feature work** — the items below are historical (shipped) or optional polish. **For "what's next," go to `.ai/NEXT_STEPS.md`** (e.g. POLISH-1 decompose `list/new.tsx`/`property.$id.tsx`, TEST-3 component tests, PROD-1 image uploads).

---

## 🟢 In Progress

_(nothing in flight on the frontend — it's feature-complete and wired to the API. Active work is the hardening backlog in `.ai/NEXT_STEPS.md`.)_

---

## ✅ Recently shipped (this cycle)

- **Web component tests (TEST-3)** — stood up `@testing-library/react` + jsdom (own `vitest.config.ts` + `src/test/setup.ts` with jest-dom + a matchMedia stub), then **+31 tests** (31→62): the flag-aware **mock data layer** (`store.test.ts` — browse published, admin users/listings/content/analytics filters + takedown/restore round-trips), **component renders** (`TrustBadge`/`EmptyState`/`BeitoonListingCard` with the router `Link` mocked), and a **real interaction** (`ReportButton.test.tsx` — logged-out→login redirect; logged-in→dialog→pick reason→submit→assert the report landed in the mock store). Next: the listing wizard validation + `property.$id` actions.
- **Server-side search + "قريب مني" geo (FE wiring for PROD-3/PROD-4)** — the `/search` page now sends `q` + all filters + `lat`/`lng`/`radiusKm` to `GET /properties` in `VITE_USE_API` mode via a new `useSearchProperties` hook (server does typo-tolerant Meili text + PostGIS radius, returns the final set). A **"قريب مني"** control uses the browser geolocation API to drive a radius search (2/5/10/25 كم selector, distance-ordered, "مرتّبة بالأقرب ليك"). Mock mode keeps full client-side filtering + a **haversine** radius fallback (seed properties got real coords), so the prototype works offline. Saved-search params are unaffected (geo keys are whitelisted out by `normalizeSearchParams`).
- **Trust engine — wedge complete (T-1 → T-5)** — `lib/beitco/trust.ts` + `store.ts`: Bayesian-smoothed listing, owner, **and renter** scores; verification cap; quality from review categories; **real response-rate** from message behavior (`ResponseEvent`); **two-sided renter reputation** (`RenterReview`, owner-side flow, privacy-safe lead badges). Recompute on review/reply/seed, persisted breakdowns. Acceptance verified on the real module. Only the owner "raise your score" checklist remains.
- **Trust transparency (T-5)** — "ليه الدرجة دي؟" popover shows live computed contributions; owner "بترد بسرعة" dashboard card; renter "سمعتك كساكن" card.
- **Frontend polish** — role-aware `/me` (FE-1), loading skeletons (FE-2), owner analytics (FE-3), property map (FE-4), review UX (FE-5), saved searches (FE-6), share button, dark mode, dynamic per-listing `<head>`, favicon/OG, dead-code cleanup, and an accessibility pass (FE-7).

---

## 🔥 Phase A — Make the Wedge Real (highest leverage)

> ✅ **Largely done.** The differentiator is now **computed, not cosmetic**. The trust engine (`lib/beitco/trust.ts`) derives listing, owner, and renter scores from real activity (reviews, verification, response behavior, tenancies); seed numbers are recomputed on load. Spec: `.ai/TRUST_SPEC.md`. Only the owner "raise your score" checklist (T-5 tail) remains.

### T-1 · Trust-score engine (prototype, localStorage) — ✅ Done
- ✅ `TRUST_WEIGHTS` + `TRUST_TUNING` config and `computeListingTrust` / `computeOwnerTrust` in `lib/beitco/trust.ts`.
- ✅ Bayesian-smoothed review quality (verified: 40×8.5 listing **outscores** a 1×10★ listing — fake-review exploit closed).
- ✅ Verification cap: unverified hard-capped at 7.0 (`capped` flag) and excluded from "موثّق بس".
- ✅ Recompute synchronously on review/verification actions (`recomputeListingTrust`/`recomputeOwnerTrust`) + recompute-all on seed; breakdown persisted on `Property.trustBreakdown` / `User.trustBreakdown`.
- ✅ **DoD met:** posting a property's first review visibly moves its trust score (verified on the real module).

### T-2 · Derive quality scores from reviews — ✅ Done
- ✅ `computeQualityFromReviews` averages each category from `Review.scores`; seed value is the fallback only when no review has rated that category.

### T-3 · Response rate from real behavior — ✅ Done
- ✅ `ResponseEvent` tracking in messaging (`recordResponseEvent` in `postMessage`): opened on the renter's first message, closed on the owner's first reply.
- ✅ `computeOwnerResponseRate` (% answered within 24h); persisted onto `User.responseRate` via `effectiveOwnerResponseRate` (real events → account → seed fallback) and fed into both listing & owner trust.
- ✅ Recomputes owner trust the moment they reply; demo owners get seeded events so their rate is genuinely event-derived. Surfaced as the "بترد بسرعة" card on the dashboard (trust-linked nudge) + the property/profile stats + trust popover.
- **Verified:** an owner who never answers drops to ~6.7 owner-trust vs ~9.2 for a 100% responder.

### T-4 · Renter reputation (two-sided trust) — ✅ Done
- ✅ `RenterReview` model + owner-side review flow on the leads page ("قيّم الساكن" on completed leads, gated by `canOwnerReviewRenter` = a confirmed tenancy). Completing a lead now creates that tenancy.
- ✅ `computeRenterReputation` (Bayesian-smoothed) persisted to `User.renterReputation`; seeded for demo renters.
- ✅ Reputation **score + count** shown on every incoming lead (never the other owners' text — anti-retaliation, TRUST_SPEC §6); renters see their own "سمعتك كساكن" card on `/me`.

### T-5 · Trust transparency UI
- ✅ **Done:** "ليه الدرجة دي؟" breakdown popover (`TrustBadgeExplained`) now renders the **computed** component contributions (verification / reviews / responsiveness / tenure / recency) with weight bars, an "الأعلى" highlight, and a cap note — on the property trust section + `/u/$id` profile header.
- TODO: Owner dashboard "إزاي تعلّي درجتك" checklist driven by the weakest component.
- TODO: Wire `/trust` page explainer to the live components.

---

## 🟠 Phase B — Make the Product Coherent

### RO-1 · Finish role-awareness (owner vs renter vs both)
- ✅ **Done:** Settings supports `renter | owner | both`; nav, verification, and "حط شقتك"/dashboard CTAs are role-aware; `/me` overview shows owners an owner card instead of the renter matching hero (FE-1).
- Decided: keep strict roles (with "both") rather than a fully unified account — revisit if it causes friction (PRD §9.2).

### SALE-1 · Decide & gate the sale flow
- Strategic call (PRD §9.1): commit (update founding docs) or shelve behind a feature flag.
- If shelved: flag `للبيع` off in wizard + search + matching; keep the code.

### MOD-1 · Moderation / approval queue — ✅ Done
- ✅ Unverified owners' listings → `pending_approval` instead of instant publish (`getInitialListingStatus`); verified owners/admins auto-publish. Pending/rejected listings never appear in public search.
- ✅ Admin review queue at `/dashboard/moderation` (admin-gated): preview card + approve / reject-with-reason (quick-reason chips + free text). `approveListing` / `rejectListing` / `getPendingListings`.
- ✅ Owner feedback: "بنراجعها" pending notice + "اترفض" notice with the reason on `/dashboard/listings`; `rejected` status added. Admin nav link shows a live pending-count badge. Seeded admin (`فريق بيتون`, `+201000000000`) + a couple of pending demo listings.
- Directly addresses the fake-listing pain Beitoon claims to solve.

---

## 🔵 Phase C — Make It Real (backend)

### B-1 · Wire frontend ↔ API for listings
- NestJS `GET /api/v1/properties` (cursor-paginated) + `GET /:id`.
- Replace localStorage reads with TanStack Query; seed Postgres with current mock data so UI doesn't change.

### A-1 · Real phone OTP + JWT
- `/auth/request-otp`, `/auth/verify-otp` (Egyptian numbers, SMS gateway).
- Replace mock OTP in `auth.tsx`; JWT in httpOnly cookie.

### B-2 · Persist core writes
- Properties, reviews, Q&A, threads/messages, leads, tenancies, saved.
- Port matching + trust engine to NestJS services.

### N-1 · Notifications
- SMS/email/push for new leads & messages (response-rate metric depends on this).

### MED-1 · Media to object storage
- S3/R2 presigned upload; replace data-URL images.

---

## 🟣 Phase D — Grow & Monetize

### GROW-1 · Supply-seeding
- Bulk import / coliving-operator onboarding / "migrate your FB-group listing" flow.
- Pick a launch beachhead (PRD §9.4) and concentrate supply.

### S-1 · Meilisearch-backed search — ✅ Done (PROD-3 + FE wiring)
- ✅ Index properties; the web search page sends `q`/filters/geo to the API (replaces the in-memory filter in `VITE_USE_API` mode; URL filters already shareable). Mock mode keeps client-side filtering.

### PAY-1 · Monetization
- Verified-owner subscription (299 EGP/mo) + 5% success fee on ≥30-day move-ins.

### MOB-1 · Mobile shell (Capacitor).

---

## ⚪ Frontend Polish (remaining FE-only, no backend needed)

> The biggest FE bugs and the whole polish pass are shipped. What's left is the accessibility deep-pass and empty-state illustrations (FE-7 tail).

### FE-1 · `/me` overview role-awareness — ✅ Done
- Owners landing on `/me` see an owner card ("روح للوحتك") and the renter matching hero is hidden for `role === "owner"`.

### FE-2 · Loading skeletons — ✅ Done
- `PageSkeleton` (variants `detail` / `list`) renders on the property page while auth/data resolves; replaces the old blank "لحظة…".

### FE-3 · Owner analytics (subscription value prop) — ✅ Done
- "أداء إعلاناتك" section in the dashboard (`getOwnerAnalytics`): views (mock), saves + lead funnel (real). The core upsell surface for the 299 EGP/mo plan.

### FE-4 · Map on the property page — ✅ Done
- Key-free OpenStreetMap/Google embed (`LocationSection`) on the detail page, with an "افتح في الخرايط" deep link. No Mapbox key needed.
- ✅ **Owner sets the exact location** in the listing wizard via an interactive keyless map (`LocationPicker`: Leaflet + OSM tiles, draggable pin, click-to-set, "موقعي الحالي" GPS). `lat`/`lng` stored on the listing; the detail page shows the **exact owner-set pin** (OSM marker embed) and falls back to text-geocoding only when coordinates are missing. Leaflet is client-only (dynamic import in `useEffect`) so SSR/build stay clean.

### FE-5 · Review UX — ✅ Done
- Sort (newest / highest / lowest / most-helpful), "مفيد" helpful voting (per-user, persisted), and owner reply to a review (`replyToReview`). Store: `toggleReviewHelpful` / `hasVotedHelpful` / `replyToReview`.

### FE-6 · Saved searches / alerts UI — ✅ Done
- Renters save a filter set ("أوضة في المعادي تحت ٦٠٠٠") from `/search`; managed under "دوّراتك المحفوظة" on `/me` (one-tap re-run + delete). Store: `saveSearch` / `getSavedSearches` / `deleteSavedSearch` / `hasSavedSearch` / `describeSavedSearch`. (Email/push alerts deferred to backend.)

### FE-7 · Misc polish — ✅ Mostly done
- ✅ Working share button (`navigator.share` + clipboard fallback + toast); ✅ dark-mode toggle (`lib/beitco/theme.ts`, light/dark/system, FOUC-safe, in settings + UserMenu); ✅ favicon + branded OG image (`public/favicon.svg`, `public/og.svg`, head meta with `summary_large_image`); ✅ dynamic per-listing `<head>` (title + OG image from loader); ✅ deleted 7 dead/English-leak components.
- ✅ **Accessibility pass:** skip-to-content link (`__root.tsx`, focus-visible, marks active `<main>` as `#main-content`); notification toggles → accessible Radix `Switch` (role=switch); `prefers-reduced-motion` guard in `styles.css`; `PageSkeleton` is `role=status`/`aria-busy`; search results count is an `aria-live` region; **gallery lightbox** now `role=dialog` + `aria-modal` with focus trap + restore.
- ✅ **Testing:** Vitest wired (`pnpm test`); `lib/beitco/trust.test.ts` (18 tests) + `lib/beitco/matching.test.ts` (13 tests) = **31 passing** — cover the trust engine (smoothing, cap, quality, response-rate, reputation) and the matching engine (gender eligibility, preference weighting, fallbacks, bounds). Matching logic extracted into a pure `lib/beitco/matching.ts` (mirrors `trust.ts`).
- ✅ **Form a11y:** associated single-input labels via `htmlFor`/`id` (settings, listing wizard prices, preferences).
- ✅ **Mobile bottom-tab nav** (`BottomNav`): fixed, safe-area-aware, active state + unread badge, center "حط شقتك" FAB; body clearance via `@media (max-width:767px)`.
- ✅ **Empty states**: reusable `EmptyState` (icon-in-soft-circle + title + hint + CTA) on home, search, notifications, saved, applications, matches.
- ✅ **Responsive images** (`OptimizedImage`): Unsplash `srcset`/`sizes`, lazy + async-decode + fade-in, full-res in the lightbox; data-URLs/local assets pass through.
- ✅ **PWA**: `public/manifest.webmanifest` (ar/RTL, standalone, theme color, SVG icons) linked in `__root.tsx`.
- TODO: formal color-contrast audit; component-level tests (needs jsdom); raster icons for older PWA targets.

---

## 🛠 Tech Debt / Cleanup

- [ ] Reconcile/trim `.ai/DB_SCHEMA.md`, `.ai/API_SPEC.md`, `.ai/ARCHITECTURE.md` to the bed-level + trust model.
- [ ] Delete `apps/web-old/` and `frontend-candidates/` once confirmed redundant.
- [ ] Trim legacy `docs/` folder.
- [ ] Fix Redis/Meilisearch startup errors on `pnpm api`.
- [ ] Add `.env.example` (SMS gateway, object storage, Mapbox).
- [x] ✅ Frontend tests: Vitest wired; `trust.test.ts` (18) + `matching.test.ts` (13) = 31 passing. (UI/component tests still TODO — needs jsdom.)
- [x] ✅ Split the `store.ts` god object: extracted `seed-data.ts` (demo data) + `listing-derivation.ts` (pure `summarizeListing`/`normalizeProperty`), alongside the already-pure `trust.ts`/`matching.ts`. `store.ts` 2610 → 2042 lines; deleted dead `PropertyCard.tsx`. Further feature-module splits best done during the backend port.

---

## 📌 Board Conventions

- Prefix by area: `T-` trust, `RO-` roles, `SALE-` sale flow, `MOD-` moderation, `FE-` frontend polish, `B-` backend, `A-` auth, `N-` notifications, `MED-` media, `GROW-` growth, `S-` search, `PAY-` payments, `MOB-` mobile.
- Start work → move to **In Progress** + add owner.
- Done → move to **✅ Shipped** (trim quarterly).

---

## ✅ Shipped (prototype — frontend + localStorage)

**Foundation**
- ✅ Monorepo (Turbo + pnpm), NestJS scaffold, TanStack Start frontend.
- ✅ Full Arabic RTL + Egyptian dialect; design system (Cairo/IBM Plex fonts, trust palette, custom Select / NumberInput / DatePicker).

**Discovery**
- ✅ Home (hero, featured grid, quick filters); search with purpose / type / area / price / sort; structured City→District area data.
- ✅ Listing cards: trust / verified / gender badges, mode-aware pricing, room-grouped availability, publish date.

**Listing detail**
- ✅ Gallery + lightbox, trust section, quality bars, amenities, specs, nearby/transit, rooms & pricing, reviews (gated post), Q&A, sticky pricing sidebar.

**Owner**
- ✅ 8-step list/edit wizard (location → specs → offer → pricing → amenities → photos → description → review), draft autosave, edit mode.
- ✅ Dashboard: listings mgmt, 3-state occupancy + occupant linking, leads, reviews, pause/delete.

**Renter**
- ✅ `/me` hub, adaptive preferences (rent vs buy intent), explainable matches, saved, applications, tenancies.

**Identity, Trust & Safety** *(shipped since the last board)*
- ✅ Settings (`/me/settings`): name, role switch (renter/owner/both), notification prefs, danger zone.
- ✅ Account verification (`/dashboard/verify`): owner-only ownership doc + ID card + selfie-with-ID (KYC); pending/verified states.
- ✅ Public profile (`/u/$id`): listings + reviews received; owner names link here; phone never exposed.
- ✅ "ليه الدرجة دي؟" trust-breakdown popover (`TrustBadgeExplained`).
- ✅ Consent-based occupant linking (invite-by-exact-phone, renter confirms) — removed the `searchUsers` enumeration vector.
- ✅ Auth-gated detail pages (teaser + sign-in CTA for logged-out visitors).

**Booking & Discovery** *(shipped since the last board)*
- ✅ Bed/room-level booking — multi-select units, sticky total, unit-aware request; owner leads show the exact units.
- ✅ Gender search filter ("السكن لمين؟"); nightly-rate option (whole/room/bed, defaults off).

**App shell & polish** *(shipped since the last board)*
- ✅ Functional mobile menu (Sheet drawer) + working header search.
- ✅ Global toasts (`sonner`, RTL) on key actions.
- ✅ Notifications page + header bell with unread count.
- ✅ Privacy + Terms pages; Help WhatsApp/email contact; footer cleanup; consistent header/footer; global cursor-pointer; sticky footers.

**Cross-cutting**
- ✅ Mock OTP auth + required gender at registration; owner↔renter messaging + viewing requests; gender policy for shared units; sale (`للبيع`) flow end-to-end (pending strategic decision).
