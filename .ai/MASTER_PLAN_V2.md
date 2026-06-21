> ⚠️ **STALE — pre-pivot doc.** Beitco pivoted to a trust-first **bed-level housing marketplace** (June 2026). This doc was written before the pivot and references the old social-network/real-estate model. Trust `.ai/ENTRY_PROMPT.md`, `.ai/PROJECT_OVERVIEW.md`, `.ai/CURRENT_STATE.md`, `.ai/BUSINESS_MODEL.md`, `.ai/ROADMAP.md`, and `.ai/TASKS.md` instead. This file is kept for historical reference only and is on the cleanup list.

---

# Beitco — Master Plan (V2)

> **Based on: "Beitco Business Vision & Product Strategy V2"**  
> **Created: June 1, 2026**  
> **Status: PLANNING — Nothing built until this is approved**

---

## 📍 Current State Summary

### What EXISTS (already built):

**Backend (apps/api/) — 17 modules, 773 E2E tests:**
- Auth (OTP + JWT)
- Users (profiles, follow, block)
- Posts (CRUD, approval pipeline)
- Comments (nested, pinning)
- Social (follow, block)
- Likes (posts + comments)
- Feed (for-you, following, trending)
- Groups (CRUD, join, roles, feed)
- Listings (sale + rent, search, save)
- Moderation (3-stage AI pipeline)
- Videos (Mux upload, processing)
- Search (Meilisearch, Arabic)
- Chat (conversations, messages, WebSocket)
- Notifications (in-app, push stub)
- Admin (user mgmt, approval queue, reports)
- Analytics (basic)
- Payments (scaffolded)

**Frontend (apps/web/) — 40+ routes, mock data:**
- Auth/Onboarding (5 screens)
- Home Feed
- Explore
- Listings (browse + detail + create)
- Profile (own + others)
- Groups (browse + detail)
- Chat (list + conversation)
- Posts (detail)
- Settings (5 pages)
- Admin
- Search, Saved, Help, Notifications, Videos
- **NEW (this session):** Compounds, Areas, Developers, Discussions, Prices

**Infrastructure:**
- Monorepo: Turborepo + pnpm
- DB: PostgreSQL + PostGIS
- Cache: Redis
- Search: Meilisearch
- Video: Mux
- Jobs: BullMQ

### What does NOT exist:
- ❌ Shared Living (beds/rooms) — backend + frontend
- ❌ Landlord Profiles & Trust — backend + frontend
- ❌ Property/Landlord Reviews — backend + frontend
- ❌ Bed Availability Management — backend + frontend
- ❌ Housing Intelligence (internet, costs) — backend + frontend
- ❌ Frontend ↔ Backend integration (all pages use mock data)
- ❌ Mobile app (Capacitor not initialized)
- ❌ Real data / seed scripts

---

## 🏗️ Product Architecture (V2)

### Core Pillars (ordered by priority):

```
┌─────────────────────────────────────────────────────────┐
│                    BEITCO PLATFORM                        │
├─────────────┬──────────────┬──────────────┬─────────────┤
│  1. SHARED  │ 2. TRUST &   │ 3. PROPERTY  │ 4. HOUSING  │
│   LIVING    │   REVIEWS    │  MARKETPLACE │  COMMUNITY  │
│             │              │              │             │
│ • Beds      │ • Property   │ • Buy        │ • Groups    │
│ • Rooms     │ • Landlord   │ • Rent       │ • Q&A       │
│ • Apartments│ • Compound   │ • Commercial │ • Posts     │
│ • Occupancy │ • Area       │ • Search     │ • Area talk │
│ • Matching  │ • Trust Score│ • Save       │             │
└─────────────┴──────────────┴──────────────┴─────────────┘
                         │
              ┌──────────┴──────────┐
              │  5. INTELLIGENCE    │
              │                     │
              │ • Internet quality  │
              │ • Monthly costs     │
              │ • Area guides       │
              │ • Price estimates   │
              └─────────────────────┘
```

---

## 🗂️ Task Phases

### Phase 0: Planning & Schema (THIS PHASE)
### Phase 1: Core Backend — New Modules
### Phase 2: Frontend — New Pages
### Phase 3: Integration — Wire Frontend ↔ Backend
### Phase 4: Polish & Launch Prep
### Phase 5: Mobile (Capacitor)

---

## Phase 0: Planning & Schema

| ID | Task | Status | Notes |
|----|------|--------|-------|
| P0-001 | Finalize product requirements (this doc) | 🟡 In Progress | |
| P0-002 | Design new DB schema (shared living, reviews, landlords) | 🔴 Not Started | |
| P0-003 | Design API endpoints for new features | 🔴 Not Started | |
| P0-004 | Design navigation & information architecture | 🔴 Not Started | |
| P0-005 | Update BUSINESS_MODEL.md to V2 | 🔴 Not Started | |

---

## Phase 1: Core Backend — New Modules

### Epic 1.1: Shared Living

| ID | Task | Priority | Depends | Est. | Status |
|----|------|----------|---------|------|--------|
| T-201 | Create `SharedListing` model (beds, rooms, full apt) | P0 | P0-002 | 2h | 🔴 |
| T-202 | Create `BedAvailability` model (occupancy tracking) | P0 | T-201 | 2h | 🔴 |
| T-203 | SharedListings module — CRUD endpoints | P0 | T-201 | 4h | 🔴 |
| T-204 | Bed availability management endpoints | P0 | T-202 | 3h | 🔴 |
| T-205 | Shared listing search & filters (university proximity, price, type) | P0 | T-203 | 3h | 🔴 |
| T-206 | Roommate matching algorithm (preferences) | P1 | T-203 | 4h | 🔴 |
| T-207 | E2E tests for shared living | P0 | T-203,T-204 | 3h | 🔴 |

### Epic 1.2: Reviews & Ratings

| ID | Task | Priority | Depends | Est. | Status |
|----|------|----------|---------|------|--------|
| T-211 | Create `Review` model (polymorphic: property, landlord, compound, area) | P0 | P0-002 | 2h | 🔴 |
| T-212 | Create `ReviewRating` model (category ratings) | P0 | T-211 | 1h | 🔴 |
| T-213 | Reviews module — CRUD endpoints | P0 | T-211 | 4h | 🔴 |
| T-214 | Rating aggregation service (avg per category, overall) | P0 | T-212 | 3h | 🔴 |
| T-215 | Review verification (only actual tenants/residents can review) | P1 | T-213 | 3h | 🔴 |
| T-216 | Review helpfulness voting (upvote/downvote) | P1 | T-213 | 2h | 🔴 |
| T-217 | E2E tests for reviews | P0 | T-213 | 3h | 🔴 |

### Epic 1.3: Landlord Profiles & Trust

| ID | Task | Priority | Depends | Est. | Status |
|----|------|----------|---------|------|--------|
| T-221 | Create `Landlord` model (extends User or separate entity) | P0 | P0-002 | 2h | 🔴 |
| T-222 | Landlord trust score calculation engine | P0 | T-221, T-213 | 4h | 🔴 |
| T-223 | Landlord profile endpoints (public profile, properties, reviews) | P0 | T-221 | 3h | 🔴 |
| T-224 | Landlord verification (national ID, ownership docs) | P1 | T-221 | 3h | 🔴 |
| T-225 | Landlord dashboard endpoints (occupancy, analytics) | P1 | T-221 | 4h | 🔴 |
| T-226 | E2E tests for landlords | P0 | T-223 | 2h | 🔴 |

### Epic 1.4: Compounds & Developers

| ID | Task | Priority | Depends | Est. | Status |
|----|------|----------|---------|------|--------|
| T-231 | Create `Compound` model | P0 | P0-002 | 2h | 🔴 |
| T-232 | Create `Developer` model with trust score | P0 | P0-002 | 2h | 🔴 |
| T-233 | Compounds module — CRUD + reviews aggregation | P0 | T-231, T-213 | 4h | 🔴 |
| T-234 | Developers module — CRUD + trust score | P0 | T-232 | 3h | 🔴 |
| T-235 | Seed script — top 100 compounds + developers | P1 | T-231, T-232 | 3h | 🔴 |
| T-236 | E2E tests for compounds & developers | P0 | T-233, T-234 | 3h | 🔴 |

### Epic 1.5: Areas & Intelligence

| ID | Task | Priority | Depends | Est. | Status |
|----|------|----------|---------|------|--------|
| T-241 | Create `Area` model (with PostGIS polygon) | P0 | P0-002 | 2h | 🔴 |
| T-242 | Create `AreaIntelligence` model (internet, costs, amenities) | P1 | T-241 | 2h | 🔴 |
| T-243 | Areas module — CRUD + reviews aggregation | P0 | T-241, T-213 | 3h | 🔴 |
| T-244 | Internet quality reporting endpoint | P1 | T-241 | 2h | 🔴 |
| T-245 | Monthly cost data endpoint | P1 | T-242 | 2h | 🔴 |
| T-246 | Area seed script (top 30 areas in Greater Cairo) | P1 | T-241 | 2h | 🔴 |
| T-247 | E2E tests for areas | P0 | T-243 | 2h | 🔴 |

### Epic 1.6: Discussions (extend existing Posts)

| ID | Task | Priority | Depends | Est. | Status |
|----|------|----------|---------|------|--------|
| T-251 | Add `discussion` post type with category + tags | P0 | — | 2h | 🔴 |
| T-252 | Discussion answers (separate from comments — upvotable) | P0 | T-251 | 3h | 🔴 |
| T-253 | Expert answer badges | P1 | T-252 | 1h | 🔴 |
| T-254 | Discussion search & filtering | P0 | T-251 | 2h | 🔴 |
| T-255 | E2E tests for discussions | P0 | T-252 | 2h | 🔴 |

---

## Phase 2: Frontend — New Pages

### Epic 2.1: Navigation Restructure

| ID | Task | Priority | Depends | Est. | Status |
|----|------|----------|---------|------|--------|
| T-301 | Redesign bottom nav: Home, Search, Shared, Community, Profile | P0 | P0-004 | 3h | 🔴 |
| T-302 | Redesign Home page (housing-focused, not social-focused) | P0 | T-301 | 4h | 🔴 |
| T-303 | Redesign Search page (Buy / Rent / Shared tabs) | P0 | T-301 | 3h | 🔴 |

### Epic 2.2: Shared Living Pages

| ID | Task | Priority | Depends | Est. | Status |
|----|------|----------|---------|------|--------|
| T-311 | Shared living browse page (beds/rooms/apartments) | P0 | T-301 | 4h | 🔴 |
| T-312 | Shared listing detail page (bed info, occupancy, landlord) | P0 | T-311 | 4h | 🔴 |
| T-313 | Create shared listing form (owner flow) | P0 | T-311 | 4h | 🔴 |
| T-314 | Bed availability manager (owner dashboard) | P0 | T-313 | 3h | 🔴 |
| T-315 | Roommate matching UI | P1 | T-311 | 3h | 🔴 |
| T-316 | University housing hub page | P1 | T-311 | 3h | 🔴 |

### Epic 2.3: Landlord Pages

| ID | Task | Priority | Depends | Est. | Status |
|----|------|----------|---------|------|--------|
| T-321 | Landlord profile page (public — trust score, properties, reviews) | P0 | — | 4h | 🔴 |
| T-322 | Landlord dashboard page (manage properties, occupancy) | P1 | T-321 | 4h | 🔴 |
| T-323 | Write landlord review page | P0 | T-321 | 2h | 🔴 |

### Epic 2.4: Review System UI

| ID | Task | Priority | Depends | Est. | Status |
|----|------|----------|---------|------|--------|
| T-331 | Review form component (reusable for property/landlord/compound/area) | P0 | — | 3h | 🔴 |
| T-332 | Review display component (with category bars, avatar, verified badge) | P0 | — | 2h | 🔴 |
| T-333 | "Write a Review" flows from listing/compound/area detail pages | P0 | T-331 | 2h | 🔴 |

### Epic 2.5: Existing Pages Updates

| ID | Task | Priority | Depends | Est. | Status |
|----|------|----------|---------|------|--------|
| T-341 | Update listing detail — show landlord trust, property reviews, costs | P0 | T-321, T-331 | 3h | 🔴 |
| T-342 | Update compound detail — wire to review system | P0 | T-332 | 2h | 🔴 |
| T-343 | Update area detail — add intelligence data (internet, costs) | P0 | T-332 | 2h | 🔴 |
| T-344 | Update profile page — show trust score, reviews given/received | P0 | — | 2h | 🔴 |

---

## Phase 3: Integration (Frontend ↔ Backend)

| ID | Task | Priority | Depends | Est. | Status |
|----|------|----------|---------|------|--------|
| T-401 | Wire auth flow (login/register/OTP) | P0 | — | 4h | 🔴 |
| T-402 | Wire feed (real posts from API) | P0 | T-401 | 3h | 🔴 |
| T-403 | Wire listings (search, detail, create) | P0 | T-401 | 4h | 🔴 |
| T-404 | Wire shared living (browse, detail, create, availability) | P0 | T-203, T-311 | 4h | 🔴 |
| T-405 | Wire reviews (submit, display, aggregation) | P0 | T-213, T-331 | 3h | 🔴 |
| T-406 | Wire landlord profiles | P0 | T-223, T-321 | 3h | 🔴 |
| T-407 | Wire compounds & developers | P0 | T-233, T-234 | 3h | 🔴 |
| T-408 | Wire areas & intelligence | P0 | T-243 | 3h | 🔴 |
| T-409 | Wire discussions | P0 | T-252 | 2h | 🔴 |
| T-410 | Wire chat (WebSocket) | P0 | T-401 | 4h | 🔴 |
| T-411 | Wire notifications | P1 | T-401 | 2h | 🔴 |
| T-412 | Wire search (Meilisearch) | P0 | T-401 | 3h | 🔴 |
| T-413 | Wire groups | P1 | T-401 | 3h | 🔴 |
| T-414 | Wire profile (own + others) | P0 | T-401 | 3h | 🔴 |

---

## Phase 4: Polish & Launch Prep

| ID | Task | Priority | Depends | Est. | Status |
|----|------|----------|---------|------|--------|
| T-501 | Seed database (100 compounds, 30 areas, 50 developers, sample listings) | P0 | Phase 1 | 4h | 🔴 |
| T-502 | Error handling & loading states on all pages | P0 | Phase 3 | 4h | 🔴 |
| T-503 | Arabic copy review (Egyptian dialect, not fus'ha) | P0 | Phase 3 | 3h | 🔴 |
| T-504 | Performance optimization (image lazy loading, pagination) | P1 | Phase 3 | 3h | 🔴 |
| T-505 | SEO (meta tags, OG images, structured data) | P1 | Phase 3 | 3h | 🔴 |
| T-506 | PWA setup (offline, install prompt) | P1 | Phase 3 | 2h | 🔴 |
| T-507 | Analytics setup (events, funnels) | P1 | Phase 3 | 2h | 🔴 |
| T-508 | Security audit (rate limiting, input validation, XSS) | P0 | Phase 3 | 4h | 🔴 |
| T-509 | Deploy: Staging environment | P0 | Phase 3 | 4h | 🔴 |
| T-510 | Deploy: Production environment | P0 | T-509 | 3h | 🔴 |

---

## Phase 5: Mobile (Capacitor)

| ID | Task | Priority | Depends | Est. | Status |
|----|------|----------|---------|------|--------|
| T-601 | Initialize Capacitor in web app | P1 | Phase 4 | 2h | 🔴 |
| T-602 | Native plugins: Camera, Share, Haptics | P1 | T-601 | 3h | 🔴 |
| T-603 | Push notifications (FCM) | P1 | T-601 | 4h | 🔴 |
| T-604 | iOS build & TestFlight | P1 | T-601 | 3h | 🔴 |
| T-605 | Android build & internal testing | P1 | T-601 | 3h | 🔴 |

---

## 📐 New Database Schema (Draft)

### New Enums Needed:

```
SharedListingType: entire_property | private_room | bed
OccupancyStatus: available | occupied | reserved
ReviewTargetType: property | landlord | compound | area | developer
DiscussionCategory: price_check | area_comparison | developer_review | advice | general
TrustLevel: new | basic | verified | trusted | expert
VerificationType: national_id | property_ownership | residency | professional
```

### New Models Needed:

```
SharedListing       — Beds/rooms/apartments for sharing
BedSlot             — Individual bed within a shared listing
BedOccupancy        — Who's in which bed, move-in/out dates
RoommatePreference  — Matching preferences
Review              — Polymorphic (property, landlord, compound, area, developer)
ReviewCategory      — Per-category rating (security: 8, internet: 6, etc.)
Compound            — Residential compound
Developer           — Real estate developer
Area                — Geographic area (with PostGIS polygon)
AreaIntelligence    — Internet, costs, amenities data
InternetReport      — User-reported internet quality
CostReport          — User-reported monthly costs
Discussion          — Q&A thread (extends Post or separate)
DiscussionAnswer    — Answer to a discussion (upvotable)
Landlord            — Landlord profile (linked to User)
LandlordVerification — Verification documents
TrustScore          — Computed trust for any entity
```

---

## 📱 Navigation Architecture (V2)

### Bottom Navigation (5 tabs):

```
🏠 Home        → Housing feed + quick actions
🔍 Search      → Listings (Buy | Rent | Shared)
🛏️ Shared      → Shared living hub (beds, rooms)
💬 Community   → Discussions + Groups + Q&A
👤 Profile     → My profile + trust + settings
```

### Information Architecture:

```
/                           → Locale redirect
/[locale]                   → Home feed
/[locale]/search            → Search (tabs: buy, rent, shared)
/[locale]/shared            → Shared living hub
/[locale]/shared/[id]       → Shared listing detail
/[locale]/shared/create     → Create shared listing
/[locale]/shared/manage     → Owner: manage beds/occupancy
/[locale]/community         → Discussions + Groups
/[locale]/community/groups  → Groups list
/[locale]/community/groups/[id] → Group detail
/[locale]/discussions       → Discussion threads
/[locale]/discussions/[id]  → Thread detail
/[locale]/discussions/new   → New discussion
/[locale]/listings/[id]     → Listing detail
/[locale]/compounds         → Compounds directory
/[locale]/compounds/[slug]  → Compound detail
/[locale]/developers        → Developers directory
/[locale]/developers/[slug] → Developer detail
/[locale]/areas             → Areas directory
/[locale]/areas/[slug]      → Area detail
/[locale]/landlords/[id]    → Landlord profile
/[locale]/prices            → Price intelligence
/[locale]/profile           → My profile
/[locale]/profile/[id]      → Other user profile
/[locale]/chat              → Conversations
/[locale]/chat/[id]         → Chat thread
/[locale]/notifications     → Notifications
/[locale]/settings          → Settings hub
/[locale]/create/listing    → Create buy/rent listing
/[locale]/create/shared     → Create shared listing
/[locale]/admin             → Admin dashboard
```

---

## 📊 Metrics & Success Criteria

### MVP Success (3 months post-launch):

| Metric | Target |
|--------|--------|
| Registered users | 5,000 |
| Shared listings | 500 |
| Reviews submitted | 1,000 |
| Monthly active users | 2,000 |
| Average session duration | 4+ min |
| Landlord sign-ups | 100 |
| University coverage | AUC, GUC, Ain Shams, Cairo |

### Product-Market Fit Signal:
- Organic word-of-mouth (students sharing with each other)
- Landlords proactively creating profiles
- Users checking Beitco before signing a lease
- "Is this on Beitco?" becoming a question

---

## ⏱️ Timeline Estimate

| Phase | Duration | Parallel? |
|-------|----------|-----------|
| Phase 0: Planning | 2-3 days | — |
| Phase 1: Backend modules | 2-3 weeks | — |
| Phase 2: Frontend pages | 2-3 weeks | ✅ with Phase 1 |
| Phase 3: Integration | 1-2 weeks | After 1+2 |
| Phase 4: Polish & Deploy | 1 week | After 3 |
| Phase 5: Mobile | 1 week | After 4 |

**Total estimated: 7-10 weeks to MVP launch**

---

## 🚦 Immediate Next Steps

1. ✅ You approve this plan (or request changes)
2. Design the new Prisma schema additions (P0-002)
3. Design the API endpoints spec (P0-003)
4. Finalize navigation IA (P0-004)
5. Start Phase 1 (backend) + Phase 2 (frontend) in parallel

---

*This document supersedes: TASKS.md, STRATEGIC_ROADMAP.md, ROADMAP.md*  
*Last updated: June 1, 2026*
