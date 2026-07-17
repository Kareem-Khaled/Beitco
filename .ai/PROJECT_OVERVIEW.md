# Project Overview — Beitoon

> 📄 **Vision doc.** This captures the product vision, personas, and MVP scope. For the **current feature inventory, domain model, gaps, and roadmap**, see the working source of truth: `.ai/PRD.md`. Note: the "NOT building (now): Buy/sell" line below is now an **open decision** — a `للبيع` flow has been prototyped (see PRD §9).

## One-Liner
**Beitoon is the trust-first housing marketplace for Egypt where you rent a bed, a room, or a whole apartment with confidence.**

## The Problem
Egyptian housing is a trust crisis:
- Listings on OLX & Property Finder are 30–50% fake or stale.
- Shared housing (the reality for most students & young professionals) is invisible — it lives in scattered Facebook groups.
- Renters get burned by hidden fees, unsafe buildings, ghost landlords, lying brokers.
- There's no public reputation for landlords or buildings.

## The Solution
A platform where:
1. **Owners list at the bed level** — "I have 4 beds in this apartment, 2 are free right now" — not just "rent this 3-bed apartment for X EGP".
2. **Every listing carries a public trust footprint** — verification, score, real reviews, quality metrics, landlord response rate, Q&A.
3. **Renters filter by what they actually need** — budget, area, type (شقة / أوضة / سرير), profile fit (students / professionals / families).
4. **Reviews come only from past residents** with verified months-lived. No fake reviews. No paid placement.

## Inventory Types

| Type | Arabic | Use case |
|---|---|---|
| Apartment | شقة | Couples, families, single tenants who want privacy |
| Private Room | أوضة | Young professionals, expat students, anyone wanting own space in shared flat |
| Bed | سرير | Students, coliving, lowest-cost shared housing |

## Target Users

### Renters (demand side)
- **University students** (AUC, Cairo Uni, Ain Shams, Alex Uni) needing affordable, safe shared housing
- **Young professionals** (22–32) who can't afford solo apartments in good areas
- **Remote workers / digital nomads** wanting coliving with reliable internet
- **Egyptians relocating** between cities (Alex → Cairo, Cairo → North Coast for season)

### Owners (supply side)
- **Investor landlords** with 1–10 apartments looking to maximize occupancy
- **Coliving operators** running purpose-built shared housing (8–20 beds)
- **Compound owners** in 6th of October, Sheikh Zayed, New Cairo
- **Family owners** renting out an extra apartment for income

## Geographic Focus (MVP)
Greater Cairo first, then Alexandria. Specifically:
- **Cairo:** New Cairo (5th Settlement), Maadi, Zamalek, Mohandessin, Dokki, Nasr City, Sheikh Zayed, 6th of October
- **Alexandria:** Smouha, Sidi Gaber, San Stefano, Sporting

## MVP Scope (what ships first)

### Must-have
- ✅ Browse listings with filter by area, type, price, beds-available
- ✅ Property detail page with reviews, Q&A, quality scores, trust badge
- �� Phone OTP signup (Egyptian numbers)
- 🔲 Owner: post apartment + mark beds available
- 🔲 Renter: request viewing + message landlord
- 🔲 Reviews: only past residents (≥30 days) can post
- 🔲 Trust score calculation (verification + reviews + response rate)
- 🔲 Search & filter (Meilisearch)

### Nice-to-have (post-MVP)
- Mux video tours
- Saved searches + alerts
- In-app payments / deposits
- Compound-level pages (e.g. "Madinaty" landing)
- Community discussions per neighborhood
- Landlord dashboard analytics

### Explicitly NOT building (now)
- Buy/sell real estate (rentals only)
- Short-term / vacation rentals (long-term only — 1+ months)
- Brokerage commissions on transactions

## Key Differentiators vs Competition

| | OLX | Property Finder | Aqarmap | **Beitoon** |
|---|---|---|---|---|
| Bed-level inventory | ❌ | ❌ | ❌ | ✅ |
| Verified listings | partial | partial | partial | **core** |
| Real resident reviews | ❌ | ❌ | ❌ | ✅ |
| Trust score | ❌ | ❌ | ❌ | ✅ |
| Quality metrics (internet/safety/noise) | ❌ | ❌ | ❌ | ✅ |
| Egyptian Arabic UX | mixed | English-first | mixed | **dialect** |
| Q&A on listings | ❌ | ❌ | ❌ | ✅ |

## Success Metrics (first 6 months)
- **500 verified listings** in Greater Cairo
- **5,000 monthly active renters** browsing
- **200 successful match-to-move-in conversions**
- **NPS ≥ 50** from renters who moved in
- **Trust score correlation:** higher-trust listings should convert 2–3× better
