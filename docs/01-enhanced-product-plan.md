# Beitco – Enhanced Product Plan

**Document Version:** 3.0 — Social Network Pivot
**Date:** April 7, 2026

---

## 1. Product Overview

### 1.1 Product Definition

Beitco is a **real estate social network with controlled posting** designed for the Egyptian market. It combines:
- **Multi-format social feed** — text posts, image galleries, video tours, listings, polls, and discussions
- **Controlled content creation** — verified agents/owners post directly; general users submit for approval; AI moderates all content
- **Community-driven engagement** — neighborhood groups, topic communities, follower relationships, comments, likes, shares
- **Marketplace transactional capabilities** — inquiries, bookings, and payments for property listings
- **Trust infrastructure** — tiered reputation, verified contributor badges, community accountability
- **AI-powered operations** — content moderation, quality scoring, smart matching, spam detection

### 1.2 User Personas (Updated)

| Persona | Description | Primary Need | Key Behavior | Permission Tier |
|---------|-------------|--------------|--------------|-----------------|
| **Hassan (Buyer/Renter)** | 28yo, Cairo professional, searching for apartment | Find trustworthy listings, get neighborhood advice | Scrolls social media 2+ hrs/day, reads comments/reviews before trusting | Tier 3: Trusted Member |
| **Mona (Property Owner)** | 45yo, owns investment property in New Cairo | Sell/rent quickly, post directly without middleman | Prefers WhatsApp, values speed, wants control of listing | Tier 2: Verified Contributor (after ID verification) |
| **Ahmed (Real Estate Agent)** | 35yo, independent agent in 6th of October | Build reputation, get qualified leads, share expertise | Posts daily, shares market tips, active in groups | Tier 2: Verified Contributor |
| **Reham (Agency Manager)** | 40yo, manages team of 15 agents | Track team, manage brand page, bulk content | Needs dashboard, analytics, team posting controls | Tier 2: Verified Contributor (Agency) |
| **Karim (Real Estate Enthusiast)** | 32yo, interested in market trends, future buyer | Follow market, ask questions, read expert content | Browses daily, comments frequently, shares in groups | Tier 3: Trusted Member |
| **Nadia (New User)** | 25yo, just graduated, first-time apartment hunter | Browse listings, save favorites, message agents | New to platform, still building activity | Tier 4: New User → Tier 3 |

### 1.3 Competitive Landscape

| Platform | Strengths | Weaknesses | Our Advantage |
|----------|-----------|------------|---------------|
| **OLX Egypt** | Large user base, brand recognition | No video, spam/fraud, poor UX | Video-first, trust system, modern UX |
| **Aqarmap** | Real estate focused, data-driven | Static listings, limited social | Social engagement, video content |
| **Property Finder** | Premium positioning, verified listings | Expensive for agents, no social | Affordable, social-first, viral potential |
| **Facebook Groups** | Huge reach, social interaction | No structure, fraud, no search | Structured marketplace + social features |
| **Nawy** | Transaction-focused, developer partnerships | New builds only, no resale | Full market coverage, video content |

---

## 2. Core Features (v3.0 — Social Network)

### 2.1 Social Feed (Home — Replaces Video-Only Feed)

**v2.0:** TikTok-style vertical video feed with autoplay
**v3.0:** Mixed-content social feed (like Instagram/LinkedIn) with video as the premium format

| Feature | Description | Priority |
|---------|-------------|----------|
| Mixed-content feed | Unified feed showing posts, videos, listings, discussions, and polls | P0 (MVP) |
| Post types | Text-only, image gallery, video, listing (structured), poll, link share | P0 (MVP) |
| Video posts | Full-screen vertical video with autoplay (retained from v2) within feed cards | P0 (MVP) |
| Adaptive bitrate | Auto-adjusts quality for Egypt's variable 4G | P0 (MVP) |
| Infinite scroll with preload | Buffer next posts/videos while viewing current | P0 (MVP) |
| Skeleton loading | Shimmer placeholders while content loads | P0 (MVP) |
| **Feed tabs (3 core tabs)** | **"For You" (algorithmic, all content) / "Following" (only people you follow) / "Videos" (full-screen vertical short video, Reels-style)** | **P0 (MVP)** |
| Like / React | ❤️ Like button on all posts; reaction options (👍 ❤️ 🏠 🔥) on v1.1 | P0 (MVP) |
| Comment | Threaded comments on all posts; reply to comments | P0 (MVP) |
| Share | Share post to WhatsApp, in-app repost, copy link | P0 (MVP) |
| Save/Bookmark | Save any post or listing to personal collection | P0 (MVP) |
| Post author badges | ✅ Verified Contributor, 👤 Member, 🆕 New, ⏳ Pending Approval | P0 (MVP) |
| Feed algorithm | Chronological + engagement + trust score + content type mixing | P0 (MVP) |
| Trending topics | Trending hashtags and discussion topics in Egyptian real estate | P1 (v1.1) |
| Content type filter | Filter feed by: All, Listings, Discussions, Market Insights (within For You tab) | P1 (v1.1) |
| Live video streams | Agent-hosted live property tours | P2 (v2.0) |

**Feed Tabs — Detailed Design:**
```
┌─────────────────────────────────────────────────────────┐
│                     HOME SCREEN                          │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ FOR YOU  │  │FOLLOWING │  │  VIDEOS  │              │
│  │(default) │  │          │  │  (Reels) │              │
│  └──────────┘  └──────────┘  └──────────┘              │
│                                                         │
│  FOR YOU tab:                                           │
│  ├── Algorithmic feed (all content types)               │
│  ├── Mix of posts from anyone (not just followed)       │
│  ├── Trending content + content from your area          │
│  ├── Group posts from groups you joined                 │
│  ├── Sponsored/promoted posts injected                  │
│  └── Layout: Card-based vertical scroll (Instagram)     │
│                                                         │
│  FOLLOWING tab:                                         │
│  ├── Only posts from people you follow                  │
│  ├── Chronological (most recent first)                  │
│  ├── All content types (text, image, video, listing)    │
│  ├── No algorithmic ranking — pure timeline             │
│  ├── No sponsored content in this tab                   │
│  └── Layout: Card-based vertical scroll (same cards)    │
│                                                         │
│  VIDEOS tab (Beitco Reels):                             │
│  ├── Full-screen vertical video player                  │
│  ├── Swipe up = next video, swipe down = previous       │
│  ├── Autoplay with sound (muted initially)              │
│  ├── Video-only content (property tours, tips, reviews) │
│  ├── Own algorithm: engagement + watch time + freshness │
│  ├── Like/comment/share overlay (TikTok-style right)    │
│  ├── Property info overlay (bottom-left for listings)   │
│  ├── Agent/author info + follow button overlay          │
│  └── Layout: Full-screen immersive (TikTok/Reels)      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Feed Content Mix Strategy (MVP):**
```
Feed composition per session:
├── 40% Listing posts (property + video/photos)
├── 25% Market insight posts (text + images from verified contributors)
├── 15% Community discussions (from groups the user follows)
├── 10% Video tours (standalone video content)
├── 5%  Sponsored/promoted content
└── 5%  Platform announcements / tips
```

### 2.2 Post Creation & Controlled Posting System

**v2.0:** Video upload only (for listings)
**v3.0:** Rich multi-format post creation with tiered access control

#### Post Types

| Post Type | Content | Who Can Create | Approval Required |
|-----------|---------|----------------|-------------------|
| **Listing Post** | Property details + video/photos + price + location + specs | Tier 2 (Verified) | No (AI post-publish review) |
| **Video Post** | Video tour, market tip, neighborhood review | Tier 2 (Verified) | No (AI post-publish review) |
| **Text/Image Post** | Market insight, advice, news, opinion | Tier 2 (Verified) | No (AI post-publish review) |
| **Text/Image Post** | Market insight, advice, news, opinion | Tier 3 (Member) | ⚠️ Yes — AI pre-screen → human approve |
| **Poll** | Community questions (e.g., "Best area for families?") | Tier 2 (Verified) | No |
| **Poll** | Community questions | Tier 3 (Member) | ⚠️ Yes — in groups only |
| **Discussion Thread** | Long-form Q&A (e.g., "Tips for first-time buyers?") | Tier 2+ | No |
| **Comment** | Reply to any post | Tier 3+ | No (AI real-time moderation) |
| **Group Post** | Any type, within a group | Tier 3+ (group member) | Subject to group rules |

#### Controlled Posting Pipeline

```
VERIFIED CONTRIBUTOR (Tier 2) — Direct Post Flow:
┌──────────┐    ┌───────────┐    ┌───────────┐    ┌──────────┐
│  Create   │───▶│  Publish   │───▶│  AI Async  │───▶│  Live in │
│  Post     │    │  Instantly  │    │  Review    │    │  Feed    │
└──────────┘    └───────────┘    └───────────┘    └──────────┘
                                       │
                                       ▼ (if flagged)
                                 ┌───────────┐    ┌──────────┐
                                 │  Auto-Hide │───▶│  Human   │
                                 │  + Notify  │    │  Review  │
                                 └───────────┘    └──────────┘
                                                       │
                                              ┌────────┴────────┐
                                              ▼                 ▼
                                        [Restore]         [Remove +
                                                           Warning]

TRUSTED MEMBER (Tier 3) — Submission Flow:
┌──────────┐    ┌───────────┐    ┌───────────┐    ┌──────────┐
│  Create   │───▶│  Submit    │───▶│  AI Pre-   │───▶│  Status: │
│  Post     │    │  for       │    │  Screen    │    │ "Pending │
└──────────┘    │  Approval  │    └───────────┘    │ Approval"│
                └───────────┘         │             └──────────┘
                                      │
                              ┌───────┴───────┐
                              ▼               ▼
                       [AI: Likely OK]   [AI: Flagged]
                              │               │
                              ▼               ▼
                       ┌───────────┐   ┌───────────┐
                       │  Human     │   │  Auto-     │
                       │  Review    │   │  Reject    │
                       │  Queue     │   │  + Reason  │
                       │  (Priority │   └───────────┘
                       │   High)    │
                       └───────────┘
                              │
                     ┌────────┴────────┐
                     ▼                 ▼
               [Approve →          [Reject →
                Publish +           Notify +
                Notify]             Reason]
```

#### AI Moderation Pipeline (All Posts)

| Check | Tool | Timing | Action |
|-------|------|--------|--------|
| **Spam Detection** | Custom rules + ML model | Pre-publish (Tier 3) / Post-publish (Tier 2) | Flag for review / auto-reject |
| **Inappropriate Content** | OpenAI Vision / Google Cloud Vision | On image/video upload | Block upload / flag for review |
| **Text Quality Score** | Custom NLP model | Pre-publish | Score 0-100; reject < 20; review 20-50; pass > 50 |
| **Duplicate Detection** | Perceptual hashing + text similarity | Pre-publish | Warn user / block duplicate |
| **Fake Listing Detection** | Price anomaly detection + image reverse search | Pre-publish for listings | Flag for human review |
| **Profanity Filter** | Arabic + English word list + ML | Real-time (comments), pre-publish (posts) | Auto-hide + notify |
| **Contact Info Extraction** | Regex + NLP | Pre-publish | Remove phone numbers from post body (force in-app contact) |

#### Post Quality Scoring

Every post receives a quality score (0-100) that affects feed ranking:

```
Quality Score Components:
├── Content completeness (20%)
│   ├── Images/video present? (+10)
│   ├── Description > 50 chars? (+5)
│   └── Location tagged? (+5)
├── Author trust score (30%)
│   ├── Verified contributor? (+15)
│   ├── Reviews rating (+10, scaled)
│   └── Account age/activity (+5)
├── Engagement signals (30%)
│   ├── Likes (log-scaled)
│   ├── Comments (log-scaled)
│   └── Shares (log-scaled)
└── Freshness (20%)
    └── Time decay (newer = higher)
```

### 2.3 Social Graph — Followers, Following & Connections

**v2.0:** Follow agents only
**v3.0:** Full social graph with asymmetric follows + groups

| Feature | Description | Priority |
|---------|-------------|----------|
| Follow / Unfollow | Follow any user (asymmetric, like Instagram) | P0 (MVP) |
| Followers list | View who follows you | P0 (MVP) |
| Following list | View who you follow | P0 (MVP) |
| Following feed | Dedicated tab showing posts from followed users only | P0 (MVP) |
| Follower count | Displayed on profile (public) | P0 (MVP) |
| Follow suggestions | "Agents in your area" / "Active contributors" | P1 (v1.1) |
| Mutual followers | Show mutual connections for trust | P1 (v1.1) |
| Block user | Block a user from seeing/interacting with your content | P0 (MVP) |
| Mute user | Hide a user's posts from your feed without unfollowing | P1 (v1.1) |

**Social Graph Technical Design:**
```
Follows table (adjacency list):
├── follower_id → following_id (indexed both ways)
├── created_at
└── Efficient queries:
    ├── "Who does user X follow?" → WHERE follower_id = X
    ├── "Who follows user X?" → WHERE following_id = X
    ├── "Does X follow Y?" → WHERE follower_id = X AND following_id = Y
    └── "Mutual followers of X and Y" → INTERSECT query
```

### 2.4 Groups & Communities

**v2.0:** Q&A forum (P1), neighborhood reviews (P1)
**v3.0:** Full group system — neighborhoods, topics, compounds (P0)

| Feature | Description | Priority |
|---------|-------------|----------|
| Group creation | Verified contributors can create groups | P0 (MVP) |
| Group types | Neighborhood (geo-based), Topic (e.g., "First-Time Buyers"), Compound (e.g., "Madinaty Residents") | P0 (MVP) |
| Group join | Join public groups freely; request to join private groups | P0 (MVP) |
| Group feed | Dedicated feed of posts within the group | P0 (MVP) |
| Group posting rules | Configurable: open (any member), moderated (admin approves), restricted (admins only) | P0 (MVP) |
| Group admins | Creator + appointed admins can moderate, pin posts, manage members | P0 (MVP) |
| Group search | Search for groups by name, location, topic | P0 (MVP) |
| Pinned posts | Group admins can pin important posts | P0 (MVP) |
| Group member count | Visible on group card | P0 (MVP) |
| Suggested groups | Based on user location, interests, and browsing behavior | P1 (v1.1) |
| Group events | Meetups, open house events (posted in group) | P2 (v2.0) |
| Group analytics | Member growth, engagement stats (for group admins) | P1 (v1.1) |

**Pre-seeded Groups (Launch):**
```
Neighborhood Groups (auto-created):
├── القاهرة الجديدة - New Cairo
├── مدينة 6 أكتوبر - 6th of October
├── المعادي - Maadi
├── مصر الجديدة - Heliopolis
├── الشيخ زايد - Sheikh Zayed
├── العاصمة الإدارية - New Administrative Capital
└── الإسكندرية - Alexandria

Topic Groups (curated):
├── نصائح لأول مرة شاري - First-Time Buyer Tips
├── فرص استثمار عقاري - Real Estate Investment
├── أسعار السوق والاتجاهات - Market Prices & Trends
├── إيجار شقق - Rental Apartments
├── فلل وتاون هاوس - Villas & Townhouses
└── تمويل عقاري - Mortgage & Financing

Compound Groups (on demand):
├── مدينتي - Madinaty
├── هايد بارك - Hyde Park
├── ماونتن فيو - Mountain View
└── (created when 10+ listings exist in compound)
```

### 2.5 Comments, Likes, Shares & Reactions

**v2.0:** Comments on videos (P1), no likes/shares system
**v3.0:** Full engagement system across all content

| Feature | Description | Priority |
|---------|-------------|----------|
| Like | Single-tap like on posts, listings, videos, comments | P0 (MVP) |
| Unlike | Toggle like off | P0 (MVP) |
| Like count | Visible on all content | P0 (MVP) |
| Reactions | ❤️ 👍 🏠 🔥 😮 (extended reactions on v1.1) | P1 (v1.1) |
| Comment | Text comments on any post; max 500 chars | P0 (MVP) |
| Threaded replies | Reply to a specific comment (1 level of nesting) | P0 (MVP) |
| Comment likes | Like individual comments | P0 (MVP) |
| Comment sorting | Most relevant / Newest / Most liked | P0 (MVP) |
| Share to WhatsApp | One-tap share with preview card and deep link | P0 (MVP) |
| In-app repost | Repost to own feed with optional commentary | P1 (v1.1) |
| Copy link | Copy post URL to clipboard | P0 (MVP) |
| Share to social | Share to Instagram Stories, Facebook, Twitter | P1 (v1.1) |
| Comment moderation | AI auto-flag + author can delete comments on own posts | P0 (MVP) |
| Pin comment | Post author can pin 1 comment | P1 (v1.1) |

**Comment Permissions:**
```
Who can comment:
├── Tier 2 (Verified): Always
├── Tier 3 (Trusted Member): Always
├── Tier 4 (New User): Cannot comment (encourage engagement first)
└── Tier 5 (Restricted): Cannot comment

AI moderation on comments:
├── Real-time profanity filter (block on submit)
├── Spam detection (rate limit: max 10 comments/minute)
├── Link blocking (no external URLs in comments from Tier 3)
└── Flagged comments → human review queue
```

### 2.6 User Profiles & Reputation System

**v2.0:** Basic buyer/agent profiles
**v3.0:** Full social profiles with reputation, activity history, and contributor status

**All User Profiles:**
- Display name (Arabic + English)
- Avatar, cover photo
- Bio (max 200 chars)
- Location / city
- Follower count, following count
- Permission tier badge (Verified ✅, Member 👤, New 🆕)
- Activity feed: posts, comments, likes
- Saved listings collection
- Groups membership list

**Verified Contributor Profile (Agents/Owners) — Additional:**
- Verification badges: ✅ ID Verified, 🏢 Licensed Agent, 🏠 Property Owner
- Listing portfolio with performance metrics
- Trust score (visible: ⭐ 4.8/5)
- Response time badge ("Responds in ~30 min")
- Review showcase (most recent + top rated)
- Specializations (areas, property types)
- "Featured Contributor" badge (for top performers)
- Post history with engagement metrics

**Reputation Score (v3.0 — Enhanced):**
```
Reputation Score = weighted sum of:
├── Verification (25%)
│   ├── Phone verified: +5
│   ├── National ID verified: +10
│   └── Agent license verified: +10
├── Content Quality (25%)
│   ├── Average post quality score (0-100, scaled to 25)
│   ├── Posts removed / total posts ratio (penalty)
│   └── Approval rate for submitted posts
├── Community Standing (25%)
│   ├── Average review rating (1-5, scaled)
│   ├── Helpful comment votes received
│   ├── Group contributions (posts, answers)
│   └── Reports received (penalty)
└── Activity & Responsiveness (25%)
    ├── Account age (months, capped at 12)
    ├── Average response time to messages
    ├── Days active / 30 (consistency)
    └── Inquiry resolution rate
```

### 2.7 Video Feed & Video Features (Retained & Upgraded to "Videos" Tab)

Video remains the **premium content format**. In v3.0, video has a **dedicated "Videos" tab** — a full-screen, immersive, Reels/TikTok-style experience that lives alongside the social feed:

| Feature | Description | Priority |
|---------|-------------|----------|
| **"Videos" tab** | **Dedicated full-screen vertical video feed — third tab on home screen** | **P0 (MVP)** |
| **Swipe-to-browse** | **Swipe up = next video, swipe down = previous (infinite scroll)** | **P0 (MVP)** |
| **Autoplay with sound** | **Videos autoplay muted; tap to unmute; sound persists across swipes** | **P0 (MVP)** |
| **Video overlay UI** | **TikTok-style: author + follow btn (right), like/comment/share (right), property info (bottom-left if listing)** | **P0 (MVP)** |
| **Video types** | **Property tours, market tips, neighborhood reviews, before/after, Q&A clips** | **P0 (MVP)** |
| **Max duration** | **3 minutes (short-form focused; long-form via link to external)** | **P0 (MVP)** |
| Video posts in feed | Video content also appears as rich cards in For You / Following tabs | P0 (MVP) |
| Adaptive bitrate streaming | Auto-adjusts quality (360p-1080p) based on connection | P0 (MVP) |
| Video preloading | Buffer next 2-3 videos while viewing current | P0 (MVP) |
| Video upload (resumable) | TUS protocol for reliable uploads on poor connectivity | P0 (MVP) |
| Thumbnail generation | Auto + manual selection | P0 (MVP) |
| Watermark | Beitco branding on shared videos | P0 (MVP) |
| **Video recording UX** | **In-app camera: record → trim → add text overlay → add location → post** | **P0 (MVP)** |
| AI auto-captioning | Arabic/English subtitles from audio | P1 (v1.1) |
| Video trimming (advanced) | Multi-segment trim, speed adjustment | P1 (v1.1) |
| Music/audio overlay | Add background music from licensed library | P2 (v2.0) |
| Video effects/filters | Basic filters (brightness, contrast, cinematic) | P2 (v2.0) |
| Live streams | Agent-hosted live property tours | P2 (v2.0) |

**Videos Tab Algorithm:**
```
Videos tab feed algorithm (separate from For You / Following):
1. Candidate pool: all video posts (approved/published)
2. Ranking signals:
   ├── Watch time % (30%) — videos watched to completion rank higher
   ├── Engagement velocity (25%) — likes + comments in first 2 hours
   ├── Author trust score (15%) — verified contributors boosted
   ├── Freshness (15%) — newer videos rank higher
   ├── User affinity (10%) — user's past video watching patterns
   └── Diversity (5%) — mix property tours, tips, reviews
3. Rules:
   ├── Never show videos from blocked users
   ├── Inject 1 sponsored video per 8 organic
   ├── Mix content categories (don't show 3 property tours in a row)
   └── Geo-boost: videos from user's preferred area get +10% score
```

**Video vs. For You vs. Following — How They Differ:**
```
┌─────────────────────────────────────────────────┐
│ Tab        │ Content   │ Layout     │ Algorithm  │
├────────────┼───────────┼────────────┼────────────┤
│ For You    │ All types │ Card feed  │ Algorithmic│
│            │ (text,img,│ (scroll)   │ (mixed     │
│            │ video,    │            │ signals)   │
│            │ listing,  │            │            │
│            │ poll)     │            │            │
├────────────┼───────────┼────────────┼────────────┤
│ Following  │ All types │ Card feed  │ Chrono-    │
│            │ from      │ (scroll)   │ logical    │
│            │ followed  │            │ (newest    │
│            │ users     │            │ first)     │
│            │ only      │            │            │
├────────────┼───────────┼────────────┼────────────┤
│ Videos     │ Video     │ Full-screen│ Watch-time │
│            │ only      │ vertical   │ + engage-  │
│            │           │ (swipe up) │ ment based │
│            │           │ TikTok/    │            │
│            │           │ Reels      │            │
└─────────────────────────────────────────────────┘
```

### 2.8 Listing Management (Retained & Enhanced)

| Feature | Description | Priority |
|---------|-------------|----------|
| Structured listing post | Property type, price, location (map pin), bedrooms, bathrooms, area (m²), floor, finishing | P0 (MVP) |
| Multiple videos per listing | Up to 5 videos per property | P0 (MVP) |
| Photo gallery | Up to 20 photos alongside video | P0 (MVP) |
| Listing status | Active, Pending, Sold, Rented, Expired | P0 (MVP) |
| Auto-expiry | Listings expire after 30 days (renewal notification) | P0 (MVP) |
| Listing analytics | Views, saves, inquiries, shares, comments per listing | P0 (MVP) |
| Price history | Track price changes over time | P1 (v1.1) |
| Duplicate detection | AI-powered detection of duplicate/reposted listings | P1 (v1.1) |
| Neighborhood data | Nearby schools, hospitals, metro, malls | P2 (v2.0) |

### 2.9 Search & Discovery (Updated for Social Content)

| Feature | Description | Priority |
|---------|-------------|----------|
| Unified search | Search across listings, posts, users, groups | P0 (MVP) |
| Listing filters | Type, price range, location, bedrooms, bathrooms, area, finishing | P0 (MVP) |
| Map-based search | Interactive map with property pins | P0 (MVP) |
| User search | Find agents, contributors, users by name or area | P0 (MVP) |
| Group search | Search groups by name, location, topic | P0 (MVP) |
| Hashtag search | Search posts by hashtag | P0 (MVP) |
| Saved searches | Save filter combinations with push alerts | P0 (MVP) |
| Smart recommendations | "Because you viewed..." suggestions | P1 (v1.1) |
| AI chat search | Natural language search | P2 (v2.0) |

### 2.10 Communication System (Retained)

| Feature | Description | Priority |
|---------|-------------|----------|
| WhatsApp deep link | One-tap "Message on WhatsApp" | P0 (MVP) |
| Phone call button | Direct call with tracking | P0 (MVP) |
| In-app messaging | Real-time chat with typing, read receipts | P0 (MVP) |
| Chat templates | Pre-built inquiry templates | P0 (MVP) |
| Chat moderation | Auto-detect spam, harassment, fraud | P0 (MVP) |
| Scheduling | Visit scheduling with calendar | P1 (v1.1) |
| Lead tracking | Agent inquiry pipeline | P1 (v1.1) |

### 2.11 Notification System (Updated for Social)

| Channel | Use Cases | Priority |
|---------|-----------|----------|
| Push notifications | New messages, listing matches, new followers, post likes/comments, group activity, post approval status | P0 (MVP) |
| In-app notifications | All activity feed: likes, comments, follows, shares, mentions, group invites, approval results | P0 (MVP) |
| SMS | OTP, critical alerts | P0 (MVP) |
| Email | Weekly digest, post performance, group activity summary | P1 (v1.1) |
| WhatsApp notifications | High-priority lead alerts | P2 (v2.0) |

**Social Notification Types:**
```
Notification Categories:
├── Social: "أحمد بدأ يتابعك" (Ahmed started following you)
├── Engagement: "١٥ شخص عملوا لايك لبوستك" (15 people liked your post)
├── Comments: "مريم علقت على بوستك: ..." (Mariam commented on your post)
├── Groups: "بوست جديد في مجموعة القاهرة الجديدة" (New post in New Cairo group)
├── Approval: "تم قبول بوستك! 🎉" (Your post has been approved!)
├── Approval: "لم يتم قبول بوستك. السبب: ..." (Your post was not approved. Reason: ...)
├── Listings: "عقار جديد يناسب بحثك" (New property matches your search)
├── Messages: "رسالة جديدة من أحمد" (New message from Ahmed)
└── System: "مرحباً بيك في بيتكو! 🏠" (Welcome to Beitco!)
```

### 2.12 Admin Panel (Updated for Social Network)

| Feature | Description | Priority |
|---------|-------------|----------|
| User management | View, suspend, verify, promote/demote tier, delete users | P0 (MVP) |
| **Post moderation queue** | Review pending posts from Tier 3 members; approve/reject with reason | P0 (MVP) |
| **AI moderation dashboard** | View AI-flagged content, override decisions, train model | P0 (MVP) |
| Listing moderation | Approve, reject, flag listings; content queue | P0 (MVP) |
| Video moderation | Review flagged videos | P0 (MVP) |
| **Group management** | Create/edit/delete groups, assign group admins, monitor group health | P0 (MVP) |
| **Comment moderation** | Bulk review flagged comments, ban repeat offenders | P0 (MVP) |
| **Content reporting dashboard** | All reports (posts, comments, users) with AI severity scoring | P0 (MVP) |
| Analytics dashboard | DAU, MAU, posts, comments, groups, revenue, engagement | P0 (MVP) |
| Agent verification | Process ID/license verification requests | P0 (MVP) |
| **Contributor promotion** | Promote Tier 3 → Tier 2 for active community members | P0 (MVP) |
| Financial dashboard | Revenue, subscriptions, payment tracking | P1 (v1.1) |
| System health | API response times, error rates, processing status | P1 (v1.1) |

---

## 3. Data Model Overview (v3.0 — Social Network)

### Core Entities

```
Users (Updated)
├── id (UUID)
├── phone (unique, verified)
├── email (optional)
├── name_ar, name_en
├── role (buyer | seller | agent | agency_admin | admin)
├── permission_tier (1: admin | 2: verified_contributor | 3: trusted_member | 4: new_user | 5: restricted)
├── avatar_url
├── cover_photo_url
├── bio
├── national_id_verified (boolean)
├── agent_license_verified (boolean)
├── trust_score (computed)
├── reputation_score (computed)
├── follower_count (denormalized counter)
├── following_count (denormalized counter)
├── post_count (denormalized counter)
├── created_at, updated_at
└── preferences (JSONB)

Posts (NEW)
├── id (UUID)
├── author_id (FK → Users)
├── post_type (text | image | video | listing | poll | discussion | repost)
├── content_text (text, nullable)
├── content_ar (text, nullable — for bilingual posts)
├── media (JSONB: [{type, url, thumbnail_url, width, height, order}])
├── listing_id (FK → Listings, nullable — for listing posts)
├── video_id (FK → Videos, nullable — for video posts)
├── group_id (FK → Groups, nullable — for group posts)
├── repost_of_id (FK → Posts, nullable — for reposts)
├── hashtags (text[] — extracted on save)
├── status (published | pending_approval | rejected | hidden | deleted)
├── approval_status (auto_approved | pending | approved | rejected)
├── approval_reviewed_by (FK → Users, nullable)
├── approval_reviewed_at (timestamp, nullable)
├── rejection_reason (text, nullable)
├── ai_quality_score (integer 0-100)
├── ai_moderation_flags (JSONB: [{type, confidence, details}])
├── like_count (denormalized)
├── comment_count (denormalized)
├── share_count (denormalized)
├── view_count (denormalized)
├── is_pinned (boolean, for group posts)
├── created_at, updated_at
└── metadata (JSONB: location, mentions, poll_options, etc.)

Comments (NEW)
├── id (UUID)
├── post_id (FK → Posts)
├── author_id (FK → Users)
├── parent_comment_id (FK → Comments, nullable — for threaded replies)
├── content (text, max 500 chars)
├── like_count (denormalized)
├── is_pinned (boolean)
├── status (visible | hidden | deleted)
├── ai_moderation_flags (JSONB)
├── created_at, updated_at
└── metadata (JSONB)

Likes (NEW)
├── id (UUID)
├── user_id (FK → Users)
├── target_type (post | comment)
├── target_id (UUID — polymorphic FK)
├── created_at
└── UNIQUE(user_id, target_type, target_id)

Follows (NEW)
├── id (UUID)
├── follower_id (FK → Users)
├── following_id (FK → Users)
├── created_at
└── UNIQUE(follower_id, following_id)

Blocks (NEW)
├── id (UUID)
├── blocker_id (FK → Users)
├── blocked_id (FK → Users)
├── created_at
└── UNIQUE(blocker_id, blocked_id)

Groups (NEW)
├── id (UUID)
├── name_ar, name_en
├── slug (unique, URL-friendly)
├── description_ar, description_en
├── group_type (neighborhood | topic | compound | custom)
├── cover_photo_url
├── avatar_url
├── privacy (public | private)
├── posting_rules (open | moderated | admin_only)
├── location (PostGIS geography point, nullable — for neighborhood groups)
├── city, district (for geo-based groups)
├── creator_id (FK → Users)
├── member_count (denormalized)
├── post_count (denormalized)
├── created_at, updated_at
└── settings (JSONB: allowed_post_types, auto_approve_tier2, etc.)

GroupMembers (NEW)
├── id (UUID)
├── group_id (FK → Groups)
├── user_id (FK → Users)
├── role (member | moderator | admin)
├── joined_at
├── status (active | pending | banned)
└── UNIQUE(group_id, user_id)

Shares (NEW)
├── id (UUID)
├── user_id (FK → Users)
├── post_id (FK → Posts)
├── share_type (whatsapp | in_app_repost | copy_link | instagram | facebook)
├── created_at
└── metadata (JSONB)

Reports (NEW — covers all content types)
├── id (UUID)
├── reporter_id (FK → Users)
├── target_type (post | comment | user | group | listing)
├── target_id (UUID)
├── reason (spam | inappropriate | fake | harassment | fraud | other)
├── details (text, optional)
├── status (pending | reviewed | resolved | dismissed)
├── reviewed_by (FK → Users, nullable)
├── action_taken (none | warning | content_removed | user_suspended | user_banned)
├── created_at, reviewed_at
└── ai_severity_score (integer 0-100)

Listings (Same as v2.0)
├── ... (unchanged — see v2.0 data model)

Videos (Same as v2.0)
├── ... (unchanged — see v2.0 data model)
├── post_id (FK → Posts, nullable — link video to its social post)

Messages / Conversations (Same as v2.0)
├── ... (unchanged)

Reviews (Same as v2.0)
├── ... (unchanged)

SavedListings (Same as v2.0)
├── ... (unchanged)

SavedSearches (Same as v2.0)
├── ... (unchanged)

Notifications (Updated)
├── id (UUID)
├── user_id (FK → Users)
├── type (message | match | price_drop | listing_status | follow | like | comment | share | group_activity | post_approval | mention | system)
├── title, body
├── data (JSONB: {post_id, user_id, group_id, etc.})
├── read_at
└── created_at

PollVotes (NEW — for poll posts)
├── id (UUID)
├── post_id (FK → Posts, where post_type = 'poll')
├── user_id (FK → Users)
├── option_index (integer)
├── created_at
└── UNIQUE(post_id, user_id)

Hashtags (NEW)
├── id (UUID)
├── tag (text, unique, lowercase)
├── post_count (denormalized)
├── trending_score (computed)
└── created_at
```

---

## 4. API Design Overview (v3.0)

### API Architecture Principles
- **RESTful** for CRUD operations
- **WebSocket** for real-time (chat, notifications, live feed updates)
- **Versioned APIs** (`/api/v1/`)
- **Rate limiting** per user tier (Tier 4 stricter than Tier 2)
- **Arabic-first response** with optional `Accept-Language` header
- **Permission-aware**: Every endpoint checks user's permission tier

### Core API Endpoints (v3.0 — Updated)

```
Authentication (unchanged)
POST   /api/v1/auth/send-otp
POST   /api/v1/auth/verify-otp
POST   /api/v1/auth/refresh
POST   /api/v1/auth/google
POST   /api/v1/auth/apple
DELETE /api/v1/auth/logout

Users (updated)
GET    /api/v1/users/me                  Current user profile (includes tier)
PATCH  /api/v1/users/me                  Update profile
GET    /api/v1/users/:id                 Public profile
POST   /api/v1/users/me/verify-id        Submit ID for verification
GET    /api/v1/users/:id/reviews         Agent reviews
GET    /api/v1/users/me/dashboard        Agent dashboard stats
GET    /api/v1/users/:id/posts           User's posts
GET    /api/v1/users/:id/followers       User's followers
GET    /api/v1/users/:id/following       User's following list
GET    /api/v1/users/:id/groups          User's group memberships

Social Graph (NEW)
POST   /api/v1/follows/:userId           Follow a user
DELETE /api/v1/follows/:userId           Unfollow a user
GET    /api/v1/follows/suggestions       Suggested users to follow
POST   /api/v1/blocks/:userId            Block a user
DELETE /api/v1/blocks/:userId            Unblock a user

Posts (NEW)
POST   /api/v1/posts                     Create post (tier-aware: direct publish or submit for approval)
GET    /api/v1/posts                     Get posts (feed, with pagination)
GET    /api/v1/posts/:id                 Get single post with comments
PATCH  /api/v1/posts/:id                 Edit post (author only, within 24h)
DELETE /api/v1/posts/:id                 Delete post (author or admin)
POST   /api/v1/posts/:id/like            Like/unlike post (toggle)
POST   /api/v1/posts/:id/share           Record share event
POST   /api/v1/posts/:id/report          Report post
GET    /api/v1/posts/:id/comments        Get comments on post
POST   /api/v1/posts/:id/comments        Add comment (tier 3+)
GET    /api/v1/posts/me/pending          Get my pending-approval posts

Comments (NEW)
PATCH  /api/v1/comments/:id              Edit comment (author, within 15m)
DELETE /api/v1/comments/:id              Delete comment (author/post author/admin)
POST   /api/v1/comments/:id/like         Like/unlike comment (toggle)
POST   /api/v1/comments/:id/report       Report comment
POST   /api/v1/comments/:id/pin          Pin comment (post author only)

Groups (NEW)
POST   /api/v1/groups                    Create group (Tier 2+ only)
GET    /api/v1/groups                    List/search groups
GET    /api/v1/groups/:id                Get group details
PATCH  /api/v1/groups/:id                Update group (admin only)
DELETE /api/v1/groups/:id                Delete group (creator/platform admin)
POST   /api/v1/groups/:id/join           Join group (or request for private)
DELETE /api/v1/groups/:id/leave          Leave group
GET    /api/v1/groups/:id/members        List members
GET    /api/v1/groups/:id/posts          Group feed
POST   /api/v1/groups/:id/posts          Create post in group
PATCH  /api/v1/groups/:id/members/:userId Update member role/status

Feed (3 core tabs — all P0 MVP)
GET    /api/v1/feed                      "For You" tab — algorithmic mixed feed (all content types)
GET    /api/v1/feed/following            "Following" tab — chronological, only from followed users
GET    /api/v1/feed/videos               "Videos" tab — full-screen Reels-style video feed (own algorithm)
GET    /api/v1/feed/trending             Trending content (used within For You + Trending section)

Listings (unchanged from v2.0)
POST   /api/v1/listings
GET    /api/v1/listings
GET    /api/v1/listings/:id
PATCH  /api/v1/listings/:id
DELETE /api/v1/listings/:id
POST   /api/v1/listings/:id/save
GET    /api/v1/listings/saved
POST   /api/v1/listings/:id/report
GET    /api/v1/listings/:id/similar

Videos (unchanged from v2.0)
POST   /api/v1/videos/upload-url
POST   /api/v1/videos
GET    /api/v1/videos/:id/status
DELETE /api/v1/videos/:id

Search (updated)
GET    /api/v1/search                    Unified search (listings, posts, users, groups)
GET    /api/v1/search/listings           Listing-specific search with filters
GET    /api/v1/search/posts              Post search
GET    /api/v1/search/users              User search
GET    /api/v1/search/groups             Group search
GET    /api/v1/search/hashtags           Hashtag search
GET    /api/v1/search/suggestions        Autocomplete

Conversations & Messages (unchanged)
GET    /api/v1/conversations
POST   /api/v1/conversations
GET    /api/v1/conversations/:id
WS     /ws/chat

Reviews (unchanged)
POST   /api/v1/reviews
GET    /api/v1/reviews/:agentId

Notifications (updated)
GET    /api/v1/notifications             Get all notifications (paginated)
PATCH  /api/v1/notifications/read-all    Mark all as read
PATCH  /api/v1/notifications/:id/read    Mark single as read
POST   /api/v1/notifications/subscribe   Register push token
GET    /api/v1/notifications/preferences Get notification preferences
PATCH  /api/v1/notifications/preferences Update preferences

Admin (updated)
GET    /api/v1/admin/users               User management
PATCH  /api/v1/admin/users/:id/tier      Change user permission tier
PATCH  /api/v1/admin/users/:id/verify    Verify user
GET    /api/v1/admin/posts/pending       Pending approval queue
PATCH  /api/v1/admin/posts/:id/approve   Approve post
PATCH  /api/v1/admin/posts/:id/reject    Reject post (with reason)
GET    /api/v1/admin/posts/flagged       AI-flagged content queue
GET    /api/v1/admin/comments/flagged    Flagged comments queue
GET    /api/v1/admin/reports             All reports dashboard
PATCH  /api/v1/admin/reports/:id         Resolve report (with action)
GET    /api/v1/admin/groups              Group management
GET    /api/v1/admin/analytics           Platform analytics
GET    /api/v1/admin/moderation/stats    Moderation metrics (approval rate, flagging accuracy, etc.)
```

---

*Detailed API specifications with request/response schemas will be documented in the API specification document.*
