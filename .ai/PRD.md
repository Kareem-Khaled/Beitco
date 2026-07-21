# Beitoon  -  Product Requirements Document (PRD)

> **Status:** Living document · **Last updated:** June 16, 2026
> **Scope:** This PRD captures the full business vision, every feature currently built in the prototype, and the gap between them. It is the working source of truth for planning. Where it contradicts older `.ai/` docs, prefer this file and `ENTRY_PROMPT.md`.
>
> **Honesty rule:** "Built" means working in the prototype (frontend + localStorage). It does **not** mean backed by a real API. See §8 for the truth about the backend.

---

## 1. Product Summary

**Beitoon is a trust-first housing marketplace for Egypt that rents at the bed level  -  not just the apartment level.**

The unit of inventory can be a whole apartment (**شقة**), a private room (**أوضة**), or a single bed in a shared room (**سرير**). The defensible wedge is **trust**, made visible and earned: verification status, a trust score, real reviews from past residents (gated to 30+ days lived), per-listing quality scores, landlord response rate, and public Q&A.

- **Frontend:** TanStack Start (Vite + React 19), Tailwind v4, shadcn/ui  -  `apps/web/`
- **Backend (planned):** NestJS 11 + Prisma + PostgreSQL 16/PostGIS  -  `apps/api/` (scaffold only)
- **Current data layer:** localStorage mock store (`apps/web/src/lib/beitco/store.ts`)
- **Language/UX:** Arabic-first, RTL, Egyptian colloquial dialect, Latin digits

---

## 2. Goals & Non-Goals

### 2.1 Goals
1. Make the **invisible shared-housing market** (beds/rooms) searchable and bookable.
2. Make **trust visible and earned**  -  the core differentiator vs OLX / Property Finder / Aqarmap.
3. Match renters to the right place by **need + profile**, with **explainable** ranking.
4. Give owners a **single dashboard** to manage units, occupancy, leads, and reputation.
5. Egyptian-dialect, mobile-first UX that "reads like a friend giving advice."

### 2.2 Non-Goals (per founding strategy  -  see §9 open decisions)
- ❌ Short-term / vacation rentals (long-term only, 1+ months).
- ❌ Brokerage commissions on the lease itself (we monetize the *match*, not the contract).
- ❌ Pay-to-rank above trust score.
- ⚠️ **Buy/sell real estate**  -  originally a non-goal, but a `للبيع` flow has been prototyped. **This is an open strategic decision (§9).**

---

## 3. Personas

| Persona | Needs | Beitoon value |
|---|---|---|
| **University student** | Cheap, safe, shared housing near campus | Bed-level supply, area/university proximity, real reviews |
| **Young professional (22–32)** | Private room in a good area, reliable flatmates | أوضة listings, gender policy, quality scores |
| **Remote worker / nomad** | Coliving with strong internet | نت quality score, "مكان شغل" amenity, transport prefs |
| **Relocating Egyptian** | Trustworthy place sight-unseen in a new city | Verification + reviews + Q&A before moving |
| **Investor landlord (1–10 units)** | Maximize occupancy, build reputation | Free listing, occupancy mgmt, trust score that grows |
| **Coliving operator (8–20 beds)** | Manage many beds, fill vacancies | Bed-level dashboard, availability management |

---

## 4. Domain Model (as built)

Source of truth: `apps/web/src/lib/beitco/types.ts`.

### 4.1 Core entities
- **Property**  -  an apartment listing. Holds specs, pricing, trust footprint, media, amenities, nearby places, and the structured unit model.
- **Room**  -  a room inside a property. Either rented whole (price + status) or split into beds.
- **Bed**  -  one bed in a shared room (price + status + optional occupant).
- **User**  -  `renter | owner | both`, with `verified`, `trust`, and an optional renter `profile`.
- **Review**  -  resident review with overall rating + category scores; gated by tenancy.
- **QA**  -  public question/answer on a listing.
- **Thread / Message**  -  owner↔renter messaging, including `viewing_request` messages.
- **Lead**  -  a viewing request (`pending | approved | declined | completed`).
- **Tenancy**  -  records that a user lived at a property (gates review eligibility at ≥30 days).
- **SavedListing**  -  renter bookmarks.
- **Occupant**  -  owner-private record of who reserved/took a unit (optionally linked to a Beitoon account).

### 4.2 Key enums / dimensions
- **PropertyType:** `شقة | أوضة | سرير`
- **RentalMode:** `whole | by_room | by_bed`
- **ListingType:** `rent | sale` *(sale = prototyped; see §9)*
- **BedStatus:** `available | reserved | occupied`
- **SaleStatus:** `available | sold`
- **RentalGenderPolicy:** `male_only | female_only` (shared rentals only)
- **UnitType:** `شقة | استوديو | دوبلكس | روف | فيلا`
- **QualityScores:** internet, safety, noise, maintenance, cleanliness

### 4.3 Renter profile (powers matching)
`intent (rent|buy)`, budget range, preferred areas, lookingFor types, move-in date, must-have amenities, near-metro + preferred lines + max walk minutes + near-transit, furnished preference, self gender, occupation, smoker, bio.

---

## 5. Features  -  What's Built (Prototype)

> Legend: ✅ working in prototype · 🟡 partial · 🔲 not built

### 5.1 Discovery & Search
- ✅ Home page with hero, featured listings grid, quick filters.
- ✅ Search page (`/search`): filter by **purpose (rent/sale)**, type, area, price range, free-only, verified-only; sort by trust / price / newest.
- ✅ Structured **City → District** area dataset (`EGYPT_LOCATIONS`, `AREA_OPTIONS`) covering Greater Cairo, Alexandria, new cities, coastal, and governorate capitals.
- ✅ Listing cards: trust badge, verified (موثّق) badge, gender tag, type, price (rent shows /شهر, sale shows total), room/bed availability grouped by room, publish date ("اتنشر من…").

### 5.2 Listing Detail (`/property/$id`)
- ✅ Image gallery with fixed-size mosaic + fullscreen lightbox (keyboard + RTL-correct nav).
- ✅ Trust & verification section (icon-beside-label stat cards).
- ✅ Quality scores (ScoreBar per category) + average.
- ✅ Description, amenities (icon set), apartment specs, nearby/transit (on-theme icons), custom specs.
- ✅ Rooms & pricing section (mode-aware: whole / by-room / by-bed); sale listings hide rental-only sections.
- ✅ Reviews (with months-lived) + post-review (gated by tenancy ≥30 days).
- ✅ Q&A (ask + owner answer).
- ✅ Sticky pricing sidebar (rent: monthly + cost breakdown; sale: total + negotiable).
- ✅ Owner sees "عدّل الإعلان"; renter sees "اطلب معاينة" + "كلّم صاحب الشقة" + save.

### 5.3 Listing Creation / Edit (`/list/new`, `?edit=<id>`)
8-step wizard:
1. ✅ **Location**  -  searchable city→district picker + free-text address.
2. ✅ **Apartment specs**  -  unit type, bedrooms/bathrooms (editable steppers), floor, size, furnished, nearby places (per-type placeholders + metro line/station), custom specs.
3. ✅ **Offer type**  -  rent vs sell; for rent: whole/by-room/by-bed + gender policy (shared only).
4. ✅ **Pricing**  -  whole price / per-room / per-bed, or sale price + negotiable + status.
5. ✅ **Amenities**  -  general always; **appliances only when furnished** (auto-pruned otherwise); custom amenities.
6. ✅ **Photos**  -  upload (downscaled), choose/replace **main image**, 3–8 photos.
7. ✅ **Title + description.**
8. ✅ **Review & publish** (preview card, mode/sale-aware).
- ✅ Edit mode hydrates from existing property; saves with history-replace so Back doesn't return to the form.
- ✅ Draft autosave for new listings (localStorage).

### 5.4 Owner Dashboard (`/dashboard`)
- ✅ Overview, **listings management**, leads, reviews.
- ✅ Per-unit occupancy management (3-state) with optional **occupant details** + link to an existing user (search/autofill).
- ✅ Sale listings get a متاحة/اتباعت toggle instead of occupancy.
- ✅ Pause/resume, edit, delete; publish date shown.

### 5.5 Renter Hub (`/me`)
- ✅ Overview with matching hero / profile-completeness nudge.
- ✅ **Preferences** (`/me/preferences`)  -  **adaptive by intent**:
  - Rent vs Buy toggle reshapes the whole form.
  - Rent: budget/شهر, type, areas, move-in, must-haves, transport, furnishing, "عنك إنت" (occupation/smoker[shared only]/bio).
  - Buy: only intent, budget (total), areas, transport  -  everything renter-specific hidden.
- ✅ **Matches** (`/me/matches`)  -  explainable results (reasons/misses), intent-filtered (buyers see sale, renters see rent), gender-eligibility gated.
- ✅ Saved, applications (viewing requests), tenancies.

### 5.6 Matching Engine (`store.ts`)
- ✅ Weighted, **explainable** scoring: areas, budget, type, metro (lines + walk time), transit, must-have amenities, furnished, gender-fit.
- ✅ Hard gates: gender eligibility, intent (rent vs sale).
- ✅ Profile completeness meter drives nudges.

### 5.7 Messaging, Leads & Bed-Level Booking
- ✅ Threads list + conversation (`/messages`), owner↔renter.
- ✅ Viewing requests create a lead + a `viewing_request` message; owner manages in dashboard leads.
- ✅ **Bed/room-level booking**  -  each available unit on the property page is multi-selectable (whole row clickable); a sticky "اخترت N · إجمالي X · اطلب الحجز" bar opens a unit-aware request dialog. The lead carries `intent: booking` + `units[]` (with room context), and the owner's leads show the exact unit chips + total.

### 5.8 Auth, Identity & Account
- 🟡 Mock phone-OTP (`auth.tsx`)  -  any 4+ digit code; no real SMS.
- ✅ Registration captures name + **role** + **gender (required, set at sign-up only)**; gender feeds matching.
- ✅ Session + per-user demo seeding; profile updates persist.
- ✅ **Settings** (`/me/settings`)  -  edit name, switch role (renter/owner/both), notification prefs, verification status, logout, reset demo data. (Gender is intentionally NOT editable  -  set at sign-up only.)
- ✅ **Account verification** (`/dashboard/verify`)  -  owner-only proof-of-ownership + **ID card + selfie-with-ID** (front camera) KYC; pending/verified states; status badge in dashboard nav. Renters verify identity only (no ownership doc).
- ✅ **Public profile** (`/u/$id`)  -  name, avatar, موثّق badge, trust, member-since, their published listings, and reviews received. Owner names on listings link here. Phone never exposed.

### 5.9 Trust Footprint (display + transparency)
- ✅ Trust badge, verified (موثّق) badge, quality ScoreBars, response rate, reviews count, residents  -  **surfaced everywhere**.
- ✅ **`TrustBadgeExplained`**  -  "ليه الدرجة دي؟" popover breaking the score into components (verification, reviews, response rate, residents). Live on the property trust section + profile header.
- 🔲 **Underlying values are still hardcoded seed data  -  no calculation engine yet.** (Critical gap  -  §6. The popover explains *components* but they're not computed.)

### 5.10 Notifications
- ✅ **Notifications page** (`/notifications`)  -  derived feed from real activity: new leads (owner), unread messages, review-eligible tenancies (≥30 days), verification updates, and consent-link requests. Each deep-links to the right place.
- ✅ **Bell in the header** with unread count; per-user "last seen" tracking; mark-seen on view.
- 🔲 No external delivery (SMS/email/push)  -  in-app only.

### 5.11 Privacy & Safety
- ✅ **Consent-based occupant linking**  -  owners invite a tenant by *exact full phone* (no user search/enumeration, no existence oracle). The link stays `pending` until the renter confirms from `/me/tenancies`; confirming creates a tenancy (which gates reviews). Replaced the old `searchUsers` data-harvesting vector.
- ✅ **Gender policy** for shared rentals (شباب/بنات) enforced in matching eligibility + shown on cards/detail; searchable via the "السكن لمين؟" filter.
- ✅ **Auth-gated detail pages**  -  logged-out visitors see a teaser (cover, title, area, price, trust) with the full details (reviews, owner, rooms, contact) locked behind a sign-in CTA. Soft gate (no hard redirect) preserves shareable links.

### 5.12 Navigation & Feedback (app shell)
- ✅ **Functional mobile menu**  -  hamburger opens a Sheet drawer with auth-aware nav (was a dead button).
- ✅ **Header search** routes to `/search` (was a dead button).
- ✅ **Global toasts** (`sonner`, RTL, top-center) on key actions: publish/edit listing, save/unsave, post review/question, save preferences/name, submit verification, confirm/decline tenancy, approve/decline leads.
- ✅ Consistent `SiteHeader`/`SiteFooter` on every page; sticky-footer layout; global `cursor-pointer` for buttons; logical-CSS RTL throughout.

### 5.13 Legal & Static
- ✅ About, Trust, Help pages (Egyptian dialect); Help has **real WhatsApp + email contact** (was a dead link).
- ✅ **Privacy** (`/privacy`) and **Terms** (`/terms`) pages with real content; linked from the footer's "قانوني" group and the login consent line.
- ✅ Footer cleaned to 3 real-destination columns (الثقة / بيتون / قانوني); removed the redundant "اكتشف" filter-links group.

### 5.14 Short-stay (nice-to-have)
- ✅ Optional **nightly rate** toggle ("بتأجّر بالليلة كمان؟", defaults to لأ) in the pricing step for any rental mode; shown as a secondary "أو X ج.م/الليلة" pill on the property page. Deliberately minimal  -  no calendar/availability engine; monthly stays the focus.

### 5.15 Design System
- ✅ Cairo + IBM Plex Sans Arabic fonts, trust-green palette, bumped type scale, custom **Select / NumberInput / DatePicker** (Arabic-digit-safe), Sheet drawer, Popover, AlertDialog, Toaster  -  all matched to the system.

---

## 6. Critical Gaps (ranked by business impact)

> Updated June 16, 2026. Items resolved since the first PRD are struck through with a note.

| # | Gap | Why it matters | Effort |
|---|---|---|---|
| 1 | **Trust score is fake**  -  no engine; reviews don't feed back. (The "ليه الدرجة دي؟" popover now *explains* components, but they're still hardcoded seed values.) | The entire wedge is non-functional; "trust-first" is currently cosmetic | High |
| 2 | **No renter reputation**  -  owners can't rate/vouch for renters. (Consent-based tenancy linking now exists as the foundation, but owner→renter reviews aren't built.) | Trust loop is one-sided | Med |
| 3 | ~~Role experience blended~~ → **Partially fixed.** Settings supports renter/owner/both; nav/verify/list CTAs are role-aware. Still TODO: `/me` overview should show owners a dashboard card instead of the renter matching hero. | Owners still see some renter-centric content on `/me` | Low |
| 4 | **No supply-seeding path**  -  no bulk import / operator onboarding / FB-migration | Cold-start kills 2-sided marketplaces | Med |
| 5 | **Backend not wired**  -  100% mock/localStorage | Nothing is durable beyond the browser | High |
| 6 | **Sale vs strategy conflict**  -  `للبيع` contradicts "rentals only" | Open decision (§9.1)  -  still unresolved | Decision |
| 7 | **No moderation / approval pipeline**  -  anyone publishes instantly | Fake-listing risk is the exact pain Beitoon claims to solve | Med |
| 8 | ~~No notifications~~ → **In-app done.** Bell + `/notifications` feed (leads, messages, reviews, verification, links). Still TODO: external delivery (SMS/email/push). | External delivery still needed for real-time reach | Med |
| 9 | **No payments**  -  subscriptions & success fees unbuilt | No revenue mechanism | High |
| 10 | **No owner analytics** (views/saves/lead funnel) | This is literally the paid-subscription value prop (§10) | Med |
| 11 | **No loading skeletons / map**  -  minor UX polish gaps | Perceived quality; renters expect a map | Low |

---

## 7. Trust System  -  Requirements (the wedge, to be built)

This is the most important unbuilt system. Target behavior:

### 7.1 Listing/Owner trust score (0–10)
Computed from, e.g.:
- **Verification** (ID + ownership docs)  -  weighted floor/boost.
- **Reviews**  -  average rating × volume confidence (more reviews = more weight).
- **Months-lived** on reviews  -  longer tenancies weigh more.
- **Response rate**  -  % of leads/messages answered within 24h.
- **Recency**  -  recent good behavior counts more.

Requirements:
- Recompute on: new review, lead answered/ignored, verification change.
- Never allow paid boosting above the trust floor.
- Surface the *components* (transparency)  -  show *why* a score is what it is, like the matching engine does.

### 7.2 Renter reputation (new)
- Owners confirm a tenancy and can leave a **renter review** (reliability, cleanliness, communication).
- Renter trust score shown to owners on leads (with consent/privacy rules).
- Closes the two-sided loop.

### 7.3 Review integrity
- Only verified tenants (≥30 days) can review (already gated).
- One review per tenancy; editable window; report/flag path (needs moderation).

---

## 8. Technical State (honest)

- **Frontend:** real, polished, working  -  `apps/web/`.
- **Data:** localStorage mock in `lib/beitco/store.ts` with seed data + a `SEED_VERSION` refresh mechanism (refreshes demo data while preserving user-created records). `resetAllData()` available.
- **Backend:** `apps/api/` NestJS is **scaffold only**; not connected. Postgres/PostGIS/Redis/Meilisearch declared in docker-compose, not used by the app.
- **Auth:** mock OTP; no real SMS/JWT.
- **Media:** images stored as downscaled data URLs in localStorage (not S3/R2/Mux).
- **Tests:** none on the frontend prototype; typecheck (`tsc --noEmit`) is the current gate.

**Implication:** every "✅ built" feature is prototype-deep. The next real milestone is wiring a backend so data is durable and shared.

---

## 9. Open Strategic Decisions (need founder call)

1. **Sale (`للبيع`): commit or shelve?**
   - *Commit:* update founding docs, treat buy/sell as a real pillar, accept competing with Property Finder/Aqarmap.
   - *Shelve:* feature-flag it off until shared-rental is won; keep the code.
   - *Recommendation:* shelve behind a flag; win the wedge first.
2. **Role model:** keep strict `renter | owner | both`, or move to a **unified account** (everyone can browse + list)? Affects nav, `/me` vs `/dashboard`, registration.
3. **Monetization timing:** when to introduce verified-owner subscription + success fee (docs say months 4–6 / 7–12).
4. **Geographic launch wedge:** all of Greater Cairo, or a single beachhead (e.g. New Cairo student housing) to concentrate supply?
5. **Moderation:** manual review queue vs auto-publish-for-verified  -  what's the v1 anti-fake-listing stance?

---

## 10. Monetization (from BUSINESS_MODEL.md)

- **Free:** browsing, reviews, Q&A, basic listing (≤2), messaging, calls.
- **Verified Owner Subscription** (primary): 299 EGP/mo or 2,499/yr  -  badge, ≤5 listings, priority on ties, analytics, response badge.
- **Success fee:** 5% of first month's rent (cap 1,500 EGP) on a verified ≥30-day move-in.
- **Later:** promoted listings (respecting trust floor), coliving-operator plan.
- **Never:** sell renter contact info, pay-to-rank above trust, escrow/deposit fees in v1.

---

## 11. Success Metrics (first 6 months)

- 500 verified listings in Greater Cairo.
- 5,000 monthly active renters browsing.
- 200 match-to-move-in conversions.
- NPS ≥ 50 from moved-in renters.
- Higher-trust listings convert 2–3× better (validates the wedge).

---

## 12. Suggested Roadmap (working order)

**Phase A  -  Make the wedge real (highest leverage)**
1. Trust-score engine (listing + owner) wired to reviews/response/verification.
2. Renter reputation (two-sided trust).
3. Review→score feedback loop + transparency UI.

**Phase B  -  Make the product coherent**
4. Finish role-awareness (owner vs renter vs both) across nav, `/me`, registration.
5. Decide & implement the sale flag (§9.1).
6. Moderation / approval queue for unverified listings.

**Phase C  -  Make it real**
7. Wire NestJS backend (properties, auth, reviews, messaging) + replace localStorage.
8. Real phone OTP + JWT.
9. Notifications (SMS/email/push) for leads & messages.
10. Media to object storage.

**Phase D  -  Grow & monetize**
11. Supply-seeding (bulk import, operator onboarding).
12. Meilisearch-backed search.
13. Subscriptions + success-fee payments.
14. Mobile (Capacitor).

---

## 13. Reference Files

- `.ai/ENTRY_PROMPT.md`  -  canonical one-pager (start here).
- `.ai/PROJECT_OVERVIEW.md`  -  vision, personas, MVP scope.
- `.ai/BUSINESS_MODEL.md`  -  monetization & unit economics.
- `.ai/CURRENT_STATE.md`  -  older "what's built" snapshot (this PRD supersedes for feature truth).
- `apps/web/src/lib/beitco/types.ts`  -  domain model source of truth.
- `apps/web/src/lib/beitco/store.ts`  -  mock data layer + matching engine + helpers.
