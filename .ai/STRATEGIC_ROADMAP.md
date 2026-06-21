> ⚠️ **STALE — pre-pivot doc.** Beitco pivoted to a trust-first **bed-level housing marketplace** (June 2026). This doc was written before the pivot and references the old social-network/real-estate model. Trust `.ai/ENTRY_PROMPT.md`, `.ai/PROJECT_OVERVIEW.md`, `.ai/CURRENT_STATE.md`, `.ai/BUSINESS_MODEL.md`, `.ai/ROADMAP.md`, and `.ai/TASKS.md` instead. This file is kept for historical reference only and is on the cleanup list.

---

# Beitco — Strategic Roadmap

> Based on: Strategic Repositioning (June 2026)  
> Direction: Trust → Knowledge → Community → Listings

---

## Immediate Next: New Trust-Layer Pages

These are the **new pages/features** that need to be added to the frontend to align with the trust-first strategy. They don't exist yet.

---

### 🏘️ Compound Pages (`/compounds/[slug]`)

**Purpose:** Dedicated page for each compound with resident reviews & ratings.

**Sections:**
1. Hero: Compound name, developer, location, cover photo
2. Overall Rating: 0-10 composite score
3. Category Ratings (spider chart):
   - Security (أمن وحراسة)
   - Maintenance (صيانة)
   - Construction Quality (جودة البناء)
   - Developer Commitment (التزام المطور)
   - Community (المجتمع)
   - Internet & Utilities (إنترنت وخدمات)
   - Traffic & Accessibility (مواصلات)
   - Amenities (مرافق)
4. Resident Reviews (with verified badge)
5. Anonymous Insights (verified-but-hidden identity)
6. Photos from residents (real, not marketing)
7. Price Range (current listings in this compound)
8. Developer Info Card → links to developer page
9. Nearby: Schools, hospitals, malls
10. Discussion threads about this compound

**Data Model (new Prisma models):**
```
Compound { id, slug, nameAr, nameEn, developerId, location, coverImage, ... }
CompoundReview { id, compoundId, userId, ratings (JSON), comment, isAnonymous, isVerified, ... }
CompoundRating { compoundId, category, averageScore, totalReviews }
```

---

### 🏢 Developer Pages (`/developers/[slug]`)

**Purpose:** Company profile with trust score, projects, delivery history.

**Sections:**
1. Hero: Logo, name, trust score badge (0-100)
2. Overview: Founded year, HQ, total projects, total units delivered
3. Trust Score breakdown:
   - Delivery on-time %
   - Resident satisfaction
   - Complaint resolution rate
   - Years in market
4. All Projects (grid of compound cards)
5. Delivery Timeline (visual: promised vs. actual)
6. Reviews from residents across all their compounds
7. Complaints & Responses
8. Contact info

**Data Model:**
```
Developer { id, slug, nameAr, nameEn, logo, foundedYear, hq, trustScore, ... }
DeveloperProject { developerId, compoundId, promisedDelivery, actualDelivery, status }
```

---

### 📍 Area Intelligence Pages (`/areas/[slug]`)

**Purpose:** Living guide — "Should I live here?"

**Sections:**
1. Hero: Area name, city, lifestyle score
2. At a Glance: Population density, avg price/m², lifestyle type
3. Resident Ratings:
   - Safety
   - Schools & Education
   - Healthcare
   - Transportation
   - Shopping & Dining
   - Nightlife & Entertainment
   - Green Spaces
   - Noise Level
4. Cost of Living: Avg rent, utilities, groceries
5. Commute Times: To major hubs (Smart Village, Downtown, etc.)
6. Resident Stories (anonymous okay)
7. Available Listings in this area
8. Discussions about this area
9. Nearby Areas comparison

**Data Model:**
```
Area { id, slug, nameAr, nameEn, city, parentArea, polygon (PostGIS), ... }
AreaReview { id, areaId, userId, ratings (JSON), comment, isAnonymous, ... }
AreaGuide { areaId, schools, hospitals, transportation, costOfLiving (JSON), ... }
```

---

### 💬 Discussions (`/discussions`, `/discussions/[id]`)

**Purpose:** Reddit-style Q&A and debate platform.

**Sections:**
1. Discussion List: Sorted by hot/new/top
2. Categories: Price fair?, Area comparison, Developer review, General advice
3. Thread View: Question + answers (upvote/downvote)
4. Tags: compound names, areas, developers
5. "Expert Answers" — from verified contributors

**Data Model:**
```
Discussion { id, title, body, authorId, category, tags[], upvotes, ... }
DiscussionAnswer { id, discussionId, authorId, body, upvotes, isExpert, ... }
```

---

### 💰 Price Intelligence (`/prices`, `/prices/[area]`)

**Purpose:** Market transparency tools.

**Sections:**
1. Search: Enter area/compound/type → get price data
2. Fair Price Estimator: Input specs → estimated value + range
3. Price per m² by area (table + heatmap)
4. Historical Trends (line chart)
5. Area vs Area comparison
6. Developer pricing comparison

**Data Model:**
```
PriceDataPoint { id, areaId, compoundId, propertyType, pricePerMeter, date, source }
PriceEstimate { area, compound, type, size → estimatedPrice, range, confidence }
```

---

### 🛡️ Trust Profile Enhancements (`/profile/[id]`)

**Add to existing profile:**
- Trust Score badge (visible)
- Verification status (identity, residency, professional)
- Contribution stats (reviews, discussions, helpful answers)
- "Verified Resident of [Compound]" badge
- Transaction history (if applicable)

---

## Frontend Route Plan (New)

```
/compounds                    → Compound directory (search/filter)
/compounds/[slug]             → Compound detail + reviews
/compounds/[slug]/review      → Write a review form

/developers                   → Developer directory
/developers/[slug]            → Developer profile + trust score

/areas                        → Area directory
/areas/[slug]                 → Area intelligence page

/discussions                  → Discussion threads list
/discussions/new              → Create discussion
/discussions/[id]             → Thread detail + answers

/prices                       → Price intelligence dashboard
/prices/[area]                → Area price details + estimator
```

---

## Backend Modules Needed (New)

| Module | Purpose | Priority |
|--------|---------|----------|
| `compounds` | CRUD, reviews, ratings aggregation | 🔴 HIGH |
| `developers` | Profiles, trust score calculation | 🔴 HIGH |
| `areas` | Area data, reviews, guides | 🔴 HIGH |
| `discussions` | Threads, answers, upvotes | 🔴 HIGH |
| `reviews` | Polymorphic review system (compounds, areas, developers) | 🔴 HIGH |
| `trust` | Trust score calculation engine | 🟡 MEDIUM |
| `prices` | Data collection, estimation, analytics | 🟡 MEDIUM |
| `verification` | Resident/identity/professional verification | 🟡 MEDIUM |

---

## Database Schema Additions (High-Level)

```prisma
model Compound {
  id          String   @id @default(uuid())
  slug        String   @unique
  nameAr      String
  nameEn      String
  developerId String
  developer   Developer @relation(fields: [developerId], references: [id])
  city        String
  area        String
  coverImage  String?
  description String?
  avgRating   Float?
  totalReviews Int     @default(0)
  reviews     CompoundReview[]
  listings    Listing[]
  createdAt   DateTime @default(now())
}

model Developer {
  id          String   @id @default(uuid())
  slug        String   @unique
  nameAr      String
  nameEn      String
  logo        String?
  foundedYear Int?
  hq          String?
  trustScore  Float?
  totalProjects Int    @default(0)
  compounds   Compound[]
  createdAt   DateTime @default(now())
}

model Area {
  id          String   @id @default(uuid())
  slug        String   @unique
  nameAr      String
  nameEn      String
  city        String
  parentId    String?
  parent      Area?    @relation("AreaHierarchy", fields: [parentId], references: [id])
  children    Area[]   @relation("AreaHierarchy")
  avgRating   Float?
  lifestyleScore Float?
  reviews     AreaReview[]
  createdAt   DateTime @default(now())
}

model Review {
  id          String   @id @default(uuid())
  authorId    String
  targetType  String   // 'compound' | 'area' | 'developer'
  targetId    String
  ratings     Json     // { security: 8, maintenance: 6, ... }
  comment     String?
  isAnonymous Boolean  @default(false)
  isVerified  Boolean  @default(false)
  upvotes     Int      @default(0)
  createdAt   DateTime @default(now())
}

model Discussion {
  id          String   @id @default(uuid())
  title       String
  body        String
  authorId    String
  category    String   // 'price_check' | 'area_comparison' | 'developer_review' | 'advice'
  tags        String[]
  upvotes     Int      @default(0)
  answerCount Int      @default(0)
  answers     DiscussionAnswer[]
  createdAt   DateTime @default(now())
}

model DiscussionAnswer {
  id           String   @id @default(uuid())
  discussionId String
  authorId     String
  body         String
  upvotes      Int      @default(0)
  isExpert     Boolean  @default(false)
  createdAt    DateTime @default(now())
}
```

---

## Implementation Order

1. **Compound Pages** (frontend + backend) — highest community value
2. **Area Pages** (frontend + backend) — SEO + decision support
3. **Discussions** (frontend + backend) — engagement + SEO moat
4. **Developer Pages** (frontend + backend) — trust layer
5. **Trust Score System** (backend + profile enhancement)
6. **Price Intelligence** (backend + frontend) — data moat
7. **Resident Verification** (backend) — credibility
8. **AI Advisor** (future) — differentiation

---

*This roadmap supersedes previous task priorities where applicable.*
*Last updated: June 1, 2026*
