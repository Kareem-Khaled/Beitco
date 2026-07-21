# Business Model  -  Beitoon

## TL;DR
Free for renters, free to list for owners. Revenue from **(1) verified-owner subscriptions** and **(2) success fees on confirmed move-ins**, with optional **promoted-listing boosts** later.

---

## Why This Model
- We can't charge listing fees out of the gate  -  supply is fragile in a new market.
- We can't charge renters  -  they have free alternatives (OLX, Facebook).
- The wedge that makes Beitoon valuable (trust) is exactly what justifies a success fee: when a renter moves in, both sides won because of *our* trust layer.

---

## Revenue Streams

### 1. Verified Owner Subscription  -  *primary*
**299 EGP / month** or **2,499 EGP / year** per owner.

What they get:
- Verified badge (+ID/property docs check)
- Up to 5 active listings
- Priority placement when trust scores tie
- Owner dashboard with view counts, response-rate analytics, lead inbox
- "Responds in <24h" badge eligibility

**Target by month 12:** 1,500 paying owners → ~450k EGP MRR.

### 2. Success Fee on Match-to-Move-in
**5% of first month's rent**, capped at 1,500 EGP, charged to the **owner** when:
- Renter & owner met through the platform (we have the messaging trail)
- Renter moves in and stays ≥30 days (verified by review eligibility)

Average bed rent ~3,500 EGP, average room rent ~6,000 EGP, average apartment ~15,000 EGP.
Average success fee: ~400–800 EGP per move-in.

**Target by month 12:** 800 move-ins/month → ~480k EGP/month.

### 3. Promoted Listings  -  *post-MVP*
Pay-per-day boost to top of search for a specific area/filter combo.
- 50 EGP/day for "top of أوضة in المعادي"
- Algorithm still respects trust score floor (we never promote unverified listings)

### 4. Coliving Operator Plan  -  *post-MVP*
Custom pricing for operators with 50+ beds. Bulk listing tools, branded landing page, analytics.

---

## What We Will Never Charge For
- Browsing
- Posting reviews
- Asking Q&A
- Basic owner listing (up to 2 listings, no verified badge)
- Messaging
- Phone calls between matched parties

---

## Unit Economics (target steady state)

| Metric | Target |
|---|---|
| CAC (renter) | <30 EGP via SEO + organic Arabic content |
| CAC (owner) | <200 EGP via referral + targeted FB ads |
| Owner LTV | 2,800 EGP (avg 9-month subscription) |
| LTV : CAC | 14:1 owner side |
| Gross margin | 85% (mostly software costs + Mux + SMS OTP) |
| Move-in conversion | 6% of qualified leads |

---

## Trust Layer = Defensive Moat
The data we accumulate (reviews, response rates, quality scores, building reputation) is **non-portable**. A landlord can't take their 4.8 trust score and 47 reviews to a competitor. Renters can't get this signal anywhere else for Egyptian housing. Year 2+: this becomes the network-effect lock-in.

---

## Pricing Roadmap

| Phase | Months | Pricing |
|---|---|---|
| Beta | 0–3 | Everything free, focus on supply seeding |
| Soft launch | 4–6 | Verified owner subscription introduced (free for first 100) |
| Growth | 7–12 | Subscription paid; success fee enabled |
| Scale | 13+ | Promoted listings, coliving operator plan |

---

## Anti-Patterns (things we will not do)
- Charging deposit/escrow fees in v1  -  regulatory risk in Egypt
- Selling renter contact info as leads  -  kills trust
- Pay-to-rank above trust score  -  kills trust
- Brokering offline (we don't take a cut of the lease itself, only of the match)
- Buying/selling real estate inventory ourselves
