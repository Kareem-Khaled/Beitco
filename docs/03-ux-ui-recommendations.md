# Beitco – UX/UI Recommendations

**Document Version:** 3.0 — Social Network Pivot
**Date:** April 7, 2026

---

## 1. Design Principles

### 1.1 Core Design Philosophy

| Principle | Description |
|-----------|-------------|
| **Arabic-First** | RTL layout is the default. Arabic typography, right-aligned content, culturally appropriate imagery. English is secondary. |
| **Mobile-First** | Designed for 5-6" screens first. Desktop is an enhanced version, never the primary target. |
| **Social-Native, Video-Forward** | A true social network where video is the premium format. Posts, comments, groups, and likes are as natural as scrolling. |
| **Trust-Forward** | Verification badges, contributor tiers, and approval indicators visible on every piece of content. |
| **Permission-Aware** | UI adapts to user's tier: show "Create Post" for verified; show "Submit for Approval" for members; hide for new users. |
| **Speed-Obsessed** | Skeleton loading, optimistic updates (likes, follows), progressive enhancement. |
| **Thumb-Zone Optimized** | All primary actions within comfortable thumb reach on mobile. Bottom navigation, not top. |

### 1.2 Design System

**Typography:**
```
Arabic:        IBM Plex Arabic / Cairo (Google Fonts)
English:       Inter / IBM Plex Sans
Monospace:     IBM Plex Mono (for prices/numbers)

Scale:
├── Display:   32px / 2rem (property price on detail)
├── H1:        24px / 1.5rem
├── H2:        20px / 1.25rem
├── H3:        18px / 1.125rem
├── Body:      16px / 1rem
├── Caption:   14px / 0.875rem
└── Micro:     12px / 0.75rem
```

**Color Palette:**
```
Primary:       #1A56DB (Trust Blue — conveys reliability)
Secondary:     #059669 (Success Green — Egyptian currency, growth)
Accent:        #F59E0B (Warm Gold — premium, Egyptian cultural tie)
Background:    #FFFFFF (Light) / #0F172A (Dark mode)
Surface:       #F8FAFC (Light) / #1E293B (Dark mode)
Text Primary:  #0F172A (Light) / #F8FAFC (Dark)
Text Secondary:#64748B
Error:         #DC2626
Warning:       #F59E0B
Success:       #059669
```

**Spacing System:**
```
4px base unit
├── xs:  4px
├── sm:  8px
├── md:  16px
├── lg:  24px
├── xl:  32px
├── 2xl: 48px
└── 3xl: 64px
```

**Border Radius:**
```
├── sm:   6px  (buttons, inputs)
├── md:   12px (cards, containers)
├── lg:   16px (modals, sheets)
├── xl:   24px (featured cards)
└── full: 9999px (avatars, pills)
```

---

## 2. Screen-by-Screen UX Design

### 2.1 Onboarding Flow

**Problem in Original Plan:** No onboarding flow designed.

**Enhanced Flow (v3.0 — Social Onboarding):**
```
Launch App
    │
    ▼
┌─────────────────────┐
│   Splash Screen      │  Beitco logo + tagline (Arabic)
│   (1.5s max)         │  "مجتمعك العقاري" (Your real estate community)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Welcome Carousel   │  3 slides:
│   (swipeable)        │  1. "شارك، ناقش، واكتشف" (Share, discuss, and discover)
│                      │  2. "محتوى موثوق من خبراء" (Trusted content from experts)
│                      │  3. "ابحث عن شقتك مع المجتمع" (Find your home with the community)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Phone Login        │  🇪🇬 +20 ___________
│                      │  [Send OTP]
│                      │  or continue with Google/Apple
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   OTP Verification   │  ○ ○ ○ ○ ○ ○
│                      │  Resend in 30s
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Quick Profile      │  Name: ___________
│   Setup              │  I am: [Buyer] [Seller] [Agent] [Curious]
│                      │  Preferred city: [Cairo] [Giza] [Alex]
│                      │  Budget range (optional): [slider]
│                      │  Upload avatar (optional): [📷]
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Follow Interests   │  "Follow topics that interest you:"
│   (NEW in v3.0)      │  [نصائح عقارية] [أخبار السوق] [شقق للبيع]
│                      │  [فيلات] [استثمار] [أول شراء] [التشطيب]
│                      │  [القاهرة الجديدة] [6 أكتوبر] [الإسكندرية]
│                      │  (min. 3 required)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Suggested Follows  │  "Follow these top contributors:"
│   (NEW in v3.0)      │  [Ahmed ✅ Real Estate Expert] [Follow]
│                      │  [Sara ✅ Interior Designer] [Follow]
│                      │  [Beitco Official ✅] [Follow]
│                      │  (min. 2 follows suggested, can skip)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Permission         │  📍 Location (for nearby content & groups)
│   Requests           │  🔔 Notifications (for posts, comments, approvals)
│   (one at a time)    │  [Allow] [Skip]
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Tier Explanation    │  "Welcome! 🎉"
│   (NEW in v3.0)      │  "You can browse, like, and save content."
│                      │  "Verify your ID to post directly."
│                      │  [Verify Now] [Maybe Later]
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Social Feed (Home) │  ← User lands here (Tier 4: New User)
└─────────────────────┘
```

**Key Design Decisions (v3.0):**
- Phone-first auth (not email) — 95%+ of Egyptian internet users access via phone
- OTP over password — reduces friction, higher security for Egyptian market
- Progressive profiling — ask minimal info upfront, learn preferences over time
- Permission requests happen one-by-one, not all at once
- **NEW:** Follow interests step to seed the algorithm with content preferences
- **NEW:** Suggested follows step to bootstrap user's social graph (cold-start solve)
- **NEW:** Tier explanation step so user understands the permission system from day one
- **NEW:** Verification CTA in onboarding — converts Tier 4 → Tier 3 early

### 2.2 Social Feed — Home Screen (Replaces Video-Only Feed)

**Layout (Mixed Content Feed — Instagram/LinkedIn style):**
```
┌────────────────────────────┐
│ بيتكو    [🔔 3]     [💬 2] │  ← Top bar: Logo, notifications, messages
│                            │
│ [For You] [Following] [📹] │  ← Feed tabs (For You / Following / Videos)
│                            │
│ ┌────────────────────────┐ │
│ │ ┌──┐ Ahmed ✅            │ │  ← Post card: author + verified badge
│ │ │🖼 │ @ahmed_realestate  │ │
│ │ └──┘ 2 hours ago        │ │
│ │                        │ │
│ │ نصيحة لأول مرة شاري:     │ │  ← Post text (Arabic, RTL)
│ │ لازم تتأكد من العداد     │ │
│ │ والصيانة قبل ما تدفع... │ │
│ │ [Read more]            │ │
│ │                        │ │
│ │ ┌────────────────────┐ │ │
│ │ │   📸 IMAGE          │ │ │  ← Post media (image/video/carousel)
│ │ │                    │ │ │
│ │ └────────────────────┘ │ │
│ │                        │ │
│ │ ❤️ 234  � 45  ↗️ 12   │ │  ← Engagement bar
│ │                        │ │
│ │ [❤️ Like] [💬 Comment] [↗️]│ │  ← Action buttons
│ └────────────────────────┘ │
│                            │
│ ┌────────────────────────┐ │
│ │ ┌──┐ Sara 👤  ⏳        │ │  ← Member post with "Pending" status
│ │ │🖼 │ @sara_buyer       │ │    (only visible to author + admins)
│ │ └──┘ Pending Approval   │ │
│ │ ...                    │ │
│ └────────────────────────┘ │
│                            │
│ ┌────────────────────────┐ │
│ │ LISTING POST           │ │  ← Listing post (property card in feed)
│ │ ┌──┐ Mohamed ✅         │ │
│ │ │🖼 │ Premium Agent     │ │
│ │ └──┘                   │ │
│ │ ┌────────────────────┐ │ │
│ │ │   📹 VIDEO TOUR     │ │ │  ← Video with play button
│ │ │   [▶ Play]          │ │ │
│ │ └────────────────────┘ │ │
│ │ 🏠 3 Bed Apartment      │ │
│ │ 📍 New Cairo            │ │
│ │ 💰 1,500,000 EGP        │ │
│ │ � 150 m² | Full Finish │ │
│ │                        │ │
│ │ ❤️ 89  💬 12  ↗️ 34    │ │
│ │ [❤️] [💬] [↗️] [📞 Call] │ │  ← Listing has extra CTA
│ └────────────────────────┘ │
│                            │
│ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ │  ← Bottom navigation
│ │🏠│ │🔍│ │➕│ │�│ │👤│ │
│ │  │ │  │ │  │ │  │ │  │ │
│ └──┘ └──┘ └──┘ └──┘ └──┘ │
│Home Search Post Groups Me  │  ← Updated nav: Groups replaces Chat
└────────────────────────────┘
```

**Bottom Navigation (Updated for Social Network):**
| Tab | Icon | Screen | Notes |
|-----|------|--------|-------|
| Home | 🏠 | Social Feed | Mixed content feed |
| Search | 🔍 | Unified Search | Listings, posts, users, groups |
| Create | ➕ | Post Composer | Tier-aware: direct post or submit for approval |
| Groups | 👥 | Groups Directory | Neighborhood groups, topics |
| Me | 👤 | Profile + Settings | Profile, saved, messages, notifications |

**"Create" Button Behavior (Tier-Aware):**
```
User taps "+" (Create):
├── Tier 2 (Verified):
│   └── Opens post composer with all options:
│       [📝 Text Post] [📸 Photo Post] [📹 Video Post]
│       [🏠 Listing] [📊 Poll]
│       Button: "Publish" (direct)
│
├── Tier 3 (Member):
│   └── Opens post composer with limited options:
│       [📝 Text Post] [📸 Photo Post]
│       Note: "Your post will be reviewed before publishing"
│       Button: "Submit for Approval"
│
├── Tier 4 (New User):
│   └── Shows prompt:
│       "Complete your profile to start posting!"
│       [Verify Phone] [Browse Feed Instead]
│
└── Tier 5 (Restricted):
    └── Shows message:
        "Your account is restricted. Contact support."
```

**Feed Algorithm (v3.0 — Mixed Content):**
```
v3.0 Algorithm (Rule-Based + Signals):
1. Fetch candidate posts from:
   ├── Followed users' posts (50% weight)
   ├── Posts in joined groups (20% weight)
   ├── Trending/popular in user's area (20% weight)
   └── Sponsored content (10% weight)

2. Rank by composite score:
   ├── Author trust/reputation score (25%)
   ├── Post quality score (20%)
   ├── Engagement velocity (likes/comments in last hour) (20%)
   ├── Content type affinity (user prefers video? boost video) (15%)
   ├── Recency (time decay, newer = higher) (15%)
   └── Diversity bonus (mix content types, don't show 3 text posts in a row) (5%)

3. Business rules:
   ├── Never show posts from blocked users
   ├── Never show hidden/deleted/pending posts (except own pending to author)
   ├── Inject 1 sponsored post per 8 organic posts
   ├── Inject 1 "suggested group" card per 15 posts
   └── De-duplicate: same listing across posts
```

### 2.2b "Videos" Tab — Full-Screen Reels Experience

When user taps the **[📹]** tab, the entire screen transforms into an immersive, TikTok/Reels-style video player:

```
Videos Tab (Full-Screen Vertical Video):
┌────────────────────────────┐
│                            │
│                            │
│                            │
│                            │
│     FULL-SCREEN            │
│     VERTICAL VIDEO         │
│     (autoplay, muted       │
│      initially, tap to     │
│      unmute)               │
│                            │
│                            │
│                            │
│                            │
│              ┌───┐         │
│              │ 🖼│         │  ← Author avatar
│              │ ✅│         │    + verified badge
│              │ + │         │    + follow button
│              ├───┤         │
│              │ ❤️ │         │  ← Like
│              │2.3K│         │
│              ├───┤         │
│              │ 💬 │         │  ← Comment (opens sheet)
│              │ 45 │         │
│              ├───┤         │
│              │ ↗️ │         │  ← Share (WhatsApp, etc.)
│              │   │         │
│              ├───┤         │
│              │ 🔖 │         │  ← Save/Bookmark
│              │   │         │
│              └───┘         │
│                            │
│ ┌────────────────────────┐ │
│ │ Ahmed Hassan ✅          │ │  ← Author name + badge
│ │ نصيحة مهمة لأول مرة     │ │  ← Caption (expandable)
│ │ شاري: لازم تشوف ال...   │ │
│ │ [more]                 │ │
│ │ #نصائح_عقارية #شقق     │ │  ← Hashtags
│ └────────────────────────┘ │
│                            │
│ ┌────────────────────────┐ │  ← Property info (if listing video)
│ │ 🏠 3 Bed | 📍 New Cairo │ │
│ │ 💰 1,500,000 EGP  [→]  │ │  ← Tap to open listing detail
│ └────────────────────────┘ │
│                            │
│ ♫ Original audio ─────── │  ← Audio indicator
│                            │
│ [For You][Following][📹]   │  ← Tab bar visible at top (semi-transparent)
│                            │
│ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ │  ← Bottom nav (semi-transparent)
│ │🏠│ │🔍│ │➕│ │👥│ │👤│ │
│ └──┘ └──┘ └──┘ └──┘ └──┘ │
└────────────────────────────┘
```

**Videos Tab Gestures:**
| Gesture | Action |
|---------|--------|
| Swipe Up | Next video |
| Swipe Down | Previous video |
| Single Tap | Pause/Play toggle |
| Double Tap (right side) | Like (heart animation) |
| Long Press | Share menu / "Not interested" |
| Tap author avatar | Navigate to profile |
| Tap property card | Open listing detail (bottom sheet) |
| Tap comment icon | Open comments bottom sheet |
| Swipe Left | Navigate to profile of video author |

**How the 3 Tabs Feel Different:**
```
┌──────────────────────────────────────────────────┐
│ FOR YOU tab         FOLLOWING tab    VIDEOS tab   │
│ ┌──────────────┐   ┌──────────────┐ ┌──────────┐│
│ │ [Post Card]  │   │ [Post Card]  │ │          ││
│ │ text + img   │   │ from @sara   │ │ FULL     ││
│ ├──────────────┤   ├──────────────┤ │ SCREEN   ││
│ │ [Post Card]  │   │ [Post Card]  │ │ VIDEO    ││
│ │ listing      │   │ from @ahmed  │ │          ││
│ ├──────────────┤   ├──────────────┤ │ (swipe   ││
│ │ [Post Card]  │   │ [Post Card]  │ │  up for  ││
│ │ video (play) │   │ from @mona   │ │  next)   ││
│ ├──────────────┤   ├──────────────┤ │          ││
│ │ [Ad]         │   │ [Post Card]  │ │ 🎬 🔥    ││
│ └──────────────┘   └──────────────┘ └──────────┘│
│                                                  │
│ Scroll layout      Scroll layout    Immersive    │
│ Algorithmic        Chronological    Swipe-based  │
│ All content        Only followed    Video only   │
│ Has ads            No ads           Has ads      │
└──────────────────────────────────────────────────┘
```

### 2.3 Post Composer (New Screen)

```
Post Composer (Verified Contributor):
┌────────────────────────────┐
│ ✕ Cancel          Publish  │  ← "Publish" for Tier 2
│                            │
│ ┌──┐ Ahmed ✅               │  ← Author with badge
│ │🖼 │ Posting as Verified  │
│ └──┘                       │
│                            │
│ Post type:                 │
│ [📝 Text][📸 Photo][📹 Video]│
│ [🏠 Listing][📊 Poll]      │
│                            │
│ ┌────────────────────────┐ │
│ │ اكتب بوستك هنا...       │ │  ← Rich text input (Arabic)
│ │                        │ │
│ │                        │ │
│ └────────────────────────┘ │
│                            │
│ [📷 Add Photos]            │
│ [📹 Add Video]             │
│ [📍 Add Location]          │
│ [# Add Hashtags]           │
│ [📊 Create Poll]           │
│                            │
│ Post to:                   │
│ [🌐 Main Feed ▼]           │  ← Or select a group
│                            │
│ ✨ AI: Improve my text      │  ← AI writing assistant
└────────────────────────────┘

Post Composer (Member — Submit for Approval):
┌────────────────────────────┐
│ ✕ Cancel          Submit   │  ← "Submit" (not Publish)
│                            │
│ ┌──┐ Hassan 👤              │
│ │🖼 │ Submit for review    │  ← Clearly shows approval needed
│ └──┘                       │
│                            │
│ ⓘ Your post will be        │  ← Info banner (blue)
│   reviewed before          │
│   publishing. This usually │
│   takes less than 1 hour.  │
│                            │
│ [📝 Text] [📸 Photo]        │  ← Limited options for Tier 3
│                            │
│ ┌────────────────────────┐ │
│ │ اكتب بوستك هنا...       │ │
│ └────────────────────────┘ │
│                            │
│ Post to:                   │
│ [🌐 Main Feed]             │
│ [👥 Group: القاهرة الجديدة] │  ← Can also post in groups
└────────────────────────────┘

Post Submitted Confirmation:
┌────────────────────────────┐
│                            │
│         ⏳                  │
│                            │
│   Post Submitted!          │
│                            │
│   Our team will review     │
│   your post shortly.       │
│   You'll get a             │
│   notification when it's   │
│   approved.                │
│                            │
│   Avg. review time: ~45 min│
│                            │
│   [View My Pending Posts]  │
│   [Back to Feed]           │
│                            │
│   ─────────────────────    │
│   💡 Tip: Verify your ID   │
│   to post directly         │
│   without approval!        │
│   [Verify Now →]           │
│                            │
└────────────────────────────┘
```

### 2.4 Post Detail & Comments

```
Post Detail View:
┌────────────────────────────┐
│ ← Back              ⋮      │
│                            │
│ ┌──┐ Ahmed ✅               │
│ │🖼 │ Verified Contributor │
│ └──┘ 3 hours ago          │
│      ⭐ 4.8 | 📍 New Cairo │
│                            │
│ نصيحة مهمة لأي حد بيدور    │
│ على شقة في التجمع الخامس:  │
│ دلوقتي أحسن وقت تشتري     │
│ لإن الأسعار نزلت ١٠٪...    │
│                            │
│ ┌────────────────────────┐ │
│ │   📸 IMAGE             │ │
│ └────────────────────────┘ │
│                            │
│ #نصائح_عقارية #القاهرة     │  ← Clickable hashtags
│                            │
│ ❤️ 234  💬 45  ↗️ 12       │
│ [❤️ Like] [💬 Comment] [↗️] │
│                            │
│ ─── COMMENTS (45) ─────── │
│                            │
│ Sort: [Most Relevant ▼]   │
│                            │
│ 📌 [Avatar] Mohamed ✅     │  ← Pinned comment
│    أنا موافق، السوق بينزل │
│    ❤️ 23 · Reply · 2h ago  │
│                            │
│ [Avatar] Sara 👤            │
│    شكراً على النصيحة!       │
│    ❤️ 5 · Reply · 1h ago   │
│    │                       │
│    └─ [Avatar] Ahmed ✅     │  ← Threaded reply
│       العفو! لو عايزة       │
│       مساعدة ابعتيلي       │
│       ❤️ 2 · 45m ago       │
│                            │
│ [Avatar] Omar 🆕            │  ← New user can't comment
│    (Cannot comment yet —   │
│     browse more to unlock) │
│                            │
│ ┌────────────────────────┐ │
│ │ Write a comment...     │ │  ← Comment input (if Tier 3+)
│ │                [Send]  │ │
│ └────────────────────────┘ │
└────────────────────────────┘
```

### 2.5 Groups Screen

```
Groups Directory:
┌────────────────────────────┐
│ Groups                     │
│ 🔍 Search groups...        │
│                            │
│ [My Groups] [Discover]     │  ← Tabs
│ [Neighborhoods] [Topics]   │
│                            │
│ MY GROUPS                  │
│ ┌────────────────────────┐ │
│ │ [🖼] القاهرة الجديدة     │ │  ← Group card
│ │      2,340 members      │ │
│ │      15 new posts today │ │
│ │      [Open →]           │ │
│ ├────────────────────────┤ │
│ │ [🖼] نصائح أول شراء      │ │
│ │      890 members        │ │
│ │      3 new posts today  │ │
│ │      [Open →]           │ │
│ └────────────────────────┘ │
│                            │
│ SUGGESTED FOR YOU          │
│ ┌────────────────────────┐ │
│ │ [�] مدينة 6 أكتوبر     │ │
│ │      1,200 members      │ │
│ │      [Join]             │ │
│ ├────────────────────────┤ │
│ │ [🖼] فرص استثمار عقاري   │ │
│ │      560 members        │ │
│ │      [Join]             │ │
│ └────────────────────────┘ │
└────────────────────────────┘

Single Group View:
┌────────────────────────────┐
│ ← القاهرة الجديدة    ⋮     │
│                            │
│ ┌────────────────────────┐ │
│ │ [Cover Photo]          │ │
│ │                        │ │
│ │ 📍 Neighborhood Group   │ │
│ │ 👥 2,340 members        │ │
│ │ 📝 Rules: Open posting  │ │
│ │ [Joined ✓]  [🔔 Notifs] │ │
│ └────────────────────────┘ │
│                            │
│ [Feed] [Members] [About]   │
│                            │
│ ┌────────────────────────┐ │
│ │ 📝 Write something...  │ │  ← Post in group (if member)
│ └────────────────────────┘ │
│                            │
│ [Post Card]                │
│ [Post Card]                │
│ [Pinned Post — by Admin]   │
│ [Post Card]                │
└────────────────────────────┘
```

### 2.6 User Profile (Social Profile)

```
Profile View:
┌────────────────────────────┐
│ ← Profile            ⋮    │
│                            │
│ ┌────────────────────────┐ │
│ │ [Cover Photo]          │ │
│ │                        │ │
│ │      ┌────┐            │ │
│ │      │ 🖼 │            │ │  ← Avatar
│ │      │ ✅ │            │ │  ← Verified badge overlay
│ │      └────┘            │ │
│ └────────────────────────┘ │
│                            │
│ Ahmed Hassan ✅              │  ← Name + badge
│ @ahmed_realestate           │
│ وسيط عقاري | القاهرة الجديدة│  ← Bio
│ ⭐ 4.8 (127 reviews)        │
│ ⚡ Responds in ~30 min      │
│                            │
│ 234 Followers  89 Following │
│ 45 Posts       12 Listings  │
│                            │
│ [Follow]  [Message]  [📞]  │  ← Action buttons
│                            │
│ [Posts] [Listings] [Reviews]│  ← Profile tabs
│                            │
│ ─── POSTS ────────────── │
│ [Post Card]                │
│ [Post Card]                │
│ [Post Card]                │
└────────────────────────────┘
```

### 2.7 Unified Search

```
Search Screen:
┌────────────────────────────┐
│ 🔍 ابحث عن عقار، بوست، أو شخص│  ← Unified search bar (Arabic)
│                            │
│ [All] [Listings] [Posts]   │  ← Result type tabs
│ [People] [Groups] [Tags]  │
│                            │
│ TRENDING NOW 🔥             │
│ #نصائح_عقارية  #القاهرة     │
│ #أسعار_الشقق  #التجمع       │
│                            │
│ SUGGESTED GROUPS           │
│ ┌────────────────────────┐ │
│ │ [🖼] القاهرة الجديدة     │ │
│ │      2,340 members      │ │
│ │      [Join]             │ │
│ └────────────────────────┘ │
│                            │
│ RECENT SEARCHES            │
│ شقة في المعادي              │
│ نصائح أول شراء              │
│ @ahmed_realestate           │
└────────────────────────────┘

Search Results — Listings Tab:
┌────────────────────────────┐
│ 🔍 شقة في التجمع           │
│ [🗺️ Map] [📋 List] [📹 Feed]│  ← View toggle
│                            │
│ ┌────────────────────────┐ │
│ │ QUICK FILTERS (chips)  │ │
│ │ [شقة] [فيلا] [للبيع]   │ │
│ │ [للإيجار] [< 1M] [< 2M]│ │
│ └────────────────────────┘ │
│                            │
│ ┌────────────────────────┐ │
│ │ FILTER BOTTOM SHEET    │ │  ← Tap "Filters" icon
│ │                        │ │
│ │ Property Type:         │ │
│ │ [شقة] [فيلا] [ستوديو]  │ │
│ │ [مكتب] [أرض] [محل]     │ │
│ │                        │ │
│ │ Transaction:           │ │
│ │ [للبيع] [للإيجار]       │ │
│ │                        │ │
│ │ Price Range:           │ │
│ │ ├────●───────●────┤    │ │
│ │ 500K        3M EGP     │ │
│ │                        │ │
│ │ Location:              │ │
│ │ [القاهرة الجديدة ×]     │ │
│ │                        │ │
│ │ Bedrooms: [1] [2] [3+] │ │
│ │ Bathrooms: [1] [2] [3+]│ │
│ │ Area: 80 - 200 m²      │ │
│ │ Finishing: [Any] ▼     │ │
│ │                        │ │
│ │ [Show 142 results]     │ │
│ │ [Save this search 🔔]  │ │
│ └────────────────────────┘ │
│                            │
│ RESULTS:                   │
│ [Listing Card]             │
│ [Listing Card]             │
│ [Listing Card]             │
└────────────────────────────┘

Search Results — People Tab:
┌────────────────────────────┐
│ 🔍 أحمد                    │
│ [People] tab active        │
│                            │
│ [Avatar] Ahmed Hassan ✅    │
│ Real Estate Expert         │
│ 2.3K followers  [Follow]  │
│                            │
│ [Avatar] Ahmed Ali 👤       │
│ Buyer from Cairo           │
│ 89 followers    [Follow]  │
│                            │
│ [Avatar] Ahmed Mostafa ✅   │
│ Interior Designer          │
│ 1.1K followers  [Follow]  │
└────────────────────────────┘
```

### 2.8 Listing Detail View

```
┌────────────────────────────┐
│ ← Back              ↗️ ⋮   │  ← Header with share + menu
│                            │
│ ┌────────────────────────┐ │
│ │   VIDEO/IMAGE CAROUSEL │ │  ← Swipeable media (dots indicator)
│ │   (16:9 ratio here,    │ │
│ │    not fullscreen)      │ │
│ └────────────────────────┘ │
│                            │
│ ┌────────────────────────┐ │
│ │ 💰 1,500,000 EGP       │ │  ← Price (prominent)
│ │ 📍 New Cairo, Cairo     │ │
│ │ 🏠 Apartment | For Sale │ │
│ │                        │ │
│ │ ┌────┐ ┌────┐ ┌────┐  │ │
│ │ │ 3  │ │ 2  │ │150 │  │ │  ← Quick specs
│ │ │Bed │ │Bath│ │ m² │  │ │
│ │ └────┘ └────┘ └────┘  │ │
│ │                        │ │
│ │ Finishing: Full ✨      │ │
│ │ Floor: 5th             │ │
│ │ Furnished: No          │ │
│ └────────────────────────┘ │
│                            │
│ ┌────────────────────────┐ │
│ │ DESCRIPTION            │ │
│ │ شقة 3 غرف في التجمع    │ │
│ │ الخامس، تشطيب كامل... │ │
│ │ [Read more]            │ │
│ └────────────────────────┘ │
│                            │
│ ┌────────────────────────┐ │
│ │ 📍 LOCATION            │ │
│ │ ┌────────────────────┐ │ │
│ │ │   MAP PREVIEW      │ │ │  ← Interactive map pin
│ │ │        📍          │ │ │
│ │ └────────────────────┘ │ │
│ │ New Cairo, 5th Settlement│ │
│ └────────────────────────┘ │
│                            │
│ ┌────────────────────────┐ │
│ │ 👤 POSTED BY            │ │
│ │ [Avatar] Ahmed ✅       │ │  ← Verified badge
│ │ ⭐ 4.8 (127 reviews)   │ │
│ │ ⚡ Responds in ~30 min  │ │
│ │ [View Profile] [Follow]│ │  ← Social CTA added
│ └────────────────────────┘ │
│                            │
│ ┌────────────────────────┐ │
│ │ 💬 DISCUSSION (12)     │ │  ← Comments on listing
│ │ [View all comments →]  │ │
│ │ "حد يعرف حاجة عن..."   │ │
│ └────────────────────────┘ │
│                            │
│ ┌────────────────────────┐ │
│ │ SIMILAR LISTINGS       │ │
│ │ [Card] [Card] [Card]   │ │  ← Horizontal scroll
│ └────────────────────────┘ │
│                            │
│ ┌──────────┐ ┌──────────┐ │  ← Sticky bottom CTA
│ │ 📞 Call   │ │ 💬 Chat  │ │
│ └──────────┘ └──────────┘ │
└────────────────────────────┘
```

### 2.9 Chat & Direct Messages

```
Conversation List:
┌────────────────────────────┐
│ Messages                   │
│                            │
│ [Listing Chats] [Direct]   │  ← Tab: listing inquiries vs social DMs
│                            │
│ LISTING CHATS              │
│ ┌────────────────────────┐ │
│ │ [Avatar] Ahmed ✅       │ │
│ │ 🏠 3 Bed Apt, New Cairo │ │  ← Listing context
│ │ "هل الشقة متاحة؟"      │ │  ← Last message
│ │ 2 min ago        ● 2   │ │  ← Unread badge
│ ├────────────────────────┤ │
│ │ [Avatar] Sara 👤        │ │
│ │ 🏠 Villa, 6th of October│ │
│ │ "تمام، ممكن نتقابل..."  │ │
│ │ 1 hour ago             │ │
│ └────────────────────────┘ │
│                            │
│ DIRECT MESSAGES            │
│ ┌────────────────────────┐ │
│ │ [Avatar] Mohamed ✅     │ │
│ │ "ممكن نتعاون؟"          │ │
│ │ 30 min ago             │ │
│ └────────────────────────┘ │
└────────────────────────────┘

Chat View:
┌────────────────────────────┐
│ ← Ahmed ✅  📞  ⋮          │
│ ┌────────────────────────┐ │
│ │ 🏠 3 Bed Apt | 1.5M EGP│ │  ← Pinned listing card (if listing chat)
│ │ New Cairo  [View →]    │ │
│ └────────────────────────┘ │
│                            │
│    ┌──────────────────┐    │
│    │ هل الشقة متاحة؟   │    │  ← User message (RTL aligned)
│    │           2:30 PM │    │
│    └──────────────────┘    │
│                            │
│ ┌──────────────────┐       │
│ │ أيوه متاحة، تحب    │       │  ← Agent message
│ │ تيجي تشوفها؟       │       │
│ │ 2:31 PM  ✓✓       │       │  ← Read receipts
│ └──────────────────┘       │
│                            │
│ ┌──────────────────────┐   │
│ │ Quick Replies:       │   │  ← Template messages
│ │ [هل متاح؟] [السعر؟]  │   │
│ │ [ممكن زيارة؟] [العنوان]│   │
│ └──────────────────────┘   │
│                            │
│ ┌────────────────┐ [Send]  │
│ │ Type a message │ 📷 🎤   │  ← Input with photo/voice
│ └────────────────┘         │
└────────────────────────────┘
```

### 2.10 Notifications Center

```
┌────────────────────────────┐
│ Notifications              │
│                            │
│ [All] [Social] [Listings]  │  ← Filter tabs
│ [Approvals]                │
│                            │
│ TODAY                      │
│ ┌────────────────────────┐ │
│ │ 🟢 أحمد وسارة و8 آخرين  │ │
│ │    عملوا لايك على بوستك │ │
│ │    2 min ago            │ │
│ ├────────────────────────┤ │
│ │ 🟢 محمد علق: "نصيحة     │ │
│ │    ممتازة!"              │ │
│ │    15 min ago           │ │
│ ├────────────────────────┤ │
│ │ 🟢 بوستك اتنشر! 🎉      │ │
│ │    1 hour ago           │ │
│ ├────────────────────────┤ │
│ │ ⚪ عقار جديد يناسب بحثك  │ │
│ │    في القاهرة الجديدة 🏠 │ │
│ │    3 hours ago          │ │
│ └────────────────────────┘ │
│                            │
│ EARLIER                    │
│ ┌────────────────────────┐ │
│ │ ⚪ 5 بوستات جديدة في    │ │
│ │    مجموعة القاهرة الجديدة│ │
│ │    Yesterday            │ │
│ └────────────────────────┘ │
└────────────────────────────┘
```

### 2.11 Approval Status Dashboard (Tier 3 Users)

```
My Posts — Pending/Approved/Rejected:
┌────────────────────────────┐
│ ← My Posts                 │
│                            │
│ [All] [⏳ Pending (2)]     │
│ [✅ Approved] [❌ Rejected] │
│                            │
│ PENDING REVIEW             │
│ ┌────────────────────────┐ │
│ │ ⏳ نصائح عن التشطيب     │ │
│ │    Submitted 30 min ago │ │
│ │    Estimated: ~15 min   │ │
│ │    [Edit] [Delete]      │ │
│ ├────────────────────────┤ │
│ │ ⏳ أفضل مناطق للشراء    │ │
│ │    Submitted 2 hours ago│ │
│ │    Under review...      │ │
│ │    [Edit] [Delete]      │ │
│ └────────────────────────┘ │
│                            │
│ RECENTLY APPROVED          │
│ ┌────────────────────────┐ │
│ │ ✅ نصائح أول مرة شاري   │ │
│ │    Published 1 day ago  │ │
│ │    ❤️ 45  💬 12         │ │
│ │    [View Post]          │ │
│ └────────────────────────┘ │
│                            │
│ REJECTED                   │
│ ┌────────────────────────┐ │
│ │ ❌ إعلان عن شقة          │ │
│ │    Reason: "Looks like  │ │
│ │    spam/advertising.    │ │
│ │    Please reformat."    │ │
│ │    [Edit & Resubmit]    │ │
│ └────────────────────────┘ │
│                            │
│ ─────────────────────────  │
│ 💡 Get verified to post    │
│    without approval!       │
│    [Verify Now →]          │
└────────────────────────────┘
```

## 3. Engagement Mechanics & Gamification

### 3.1 Social Engagement Features

| Feature | Description | Engagement Driver |
|---------|-------------|-------------------|
| **Like Animations** | Heart animation on double-tap or like button | Instant gratification |
| **Comment Replies** | Threaded comments with "Reply" action | Discussion depth |
| **Share Sheet** | Share to WhatsApp, Telegram, copy link, repost in-app | Viral distribution |
| **Follow Suggestions** | "People you might know" based on groups and interests | Social graph growth |
| **Group Recommendations** | "Popular groups in your area" carousel | Community engagement |
| **Post Reactions** | Like, Love (❤️), Helpful (🙏), Insightful (💡) | Expressive engagement |
| **Bookmarks** | Save posts and listings to categorized collections | Content curation, return visits |
| **Daily Streak** | "You've been active 5 days straight! 🔥" | Retention, daily habit |
| **Save Counter** | Show how many people saved a listing or post | Social proof |
| **Price Drop Alert** | Push notification when saved listing price drops | Re-engagement |
| **New Post Alert** | Alert when followed user or group has new content | Re-engagement |
| **Contributor Leaderboard** | Top contributors by area (weekly/monthly) | Competition, quality content |
| **Quality Badges** | "Helpful Contributor," "Top Expert," "Video Pro" | Status, aspiration |
| **Verified Badge** | ✅ for verified contributors, visible everywhere | Trust, aspiration to verify |
| **Approval Speed** | Show avg. approval time to motivate moderation team | Transparency |
| **Tier Progress Bar** | Show Tier 4 → Tier 3 → Tier 2 progress on profile | Motivate verification |
| **First Comment** | "Be the first to comment!" prompt on new posts | Early interaction |

### 3.2 Reputation & Tier Gamification

```
Profile Card — Tier Progress:
┌────────────────────────────┐
│ Your Contributor Level      │
│                            │
│ [████████░░░] Tier 3       │
│  80% to Tier 2 (Verified)  │
│                            │
│ ✅ Phone verified           │
│ ✅ 5+ quality posts         │
│ ✅ 30-day active account    │
│ ☐ ID verified              │  ← Remaining requirement
│ ☐ 20+ helpful ratings      │
│                            │
│ [Verify ID → Unlock Tier 2]│
│                            │
│ Tier 2 benefits:           │
│ • Post directly (no review)│
│ • Upload videos            │
│ • Create polls             │
│ • Higher feed visibility   │
└────────────────────────────┘
```

### 3.3 Notification Strategy (v3.0 — Social)

| Trigger | Channel | Timing | Message Example (Arabic) |
|---------|---------|--------|--------------------------|
| New follower | Push + In-app | Immediate | "محمد بدأ يتابعك! 👤" |
| Someone liked your post | In-app badge | Batched (5 min) | "أحمد وسارة و8 آخرين عملوا لايك على بوستك" |
| Comment on your post | Push + In-app | Immediate | "سارة علقت على بوستك: 'نصيحة ممتازة!'" |
| Reply to your comment | Push + In-app | Immediate | "أحمد رد على تعليقك" |
| Post approved | Push | Immediate | "بوستك اتنشر! 🎉 شوف التفاعل" |
| Post rejected | Push + In-app | Immediate | "بوستك محتاج تعديل. [اعرف أكتر]" |
| New post in group | In-app | Batched (15 min) | "3 بوستات جديدة في مجموعة القاهرة الجديدة" |
| Mentioned in post | Push + In-app | Immediate | "أحمد ذكرك في بوست" |
| New message | Push + In-app | Immediate | "رسالة جديدة من أحمد عن شقة التجمع" |
| New listing match | Push | Within 5 min | "عقار جديد يناسب بحثك في القاهرة الجديدة 🏠" |
| Price drop | Push | Immediate | "الشقة اللي حفظتها نزل سعرها ١٠٪! 📉" |
| Tier upgrade | Push + In-app | Immediate | "مبروك! 🎉 انت دلوقتي Verified Contributor" |
| Weekly digest | Email | Sunday 10 AM | "أفضل بوستات وعقارات هذا الأسبوع في منطقتك" |
| Inactive user | Push | After 3 days | "مجتمعك بيشتاقلك! شوف الجديد 🏡" |

**Notification Grouping Rules:**
- Likes are batched: "Ahmed and 12 others liked your post" (not 12 separate notifications)
- Group posts batched: "3 new posts in القاهرة الجديدة" (every 15 min max)
- Comments are immediate (high engagement signal)
- Approval status is always immediate (critical user flow)

### 3.4 Dark Mode Support

Full dark mode support is essential for:
- Extended evening browsing (peak real estate search time in Egypt: 8 PM - 12 AM)
- OLED screens (battery saving)
- Reduced eye strain during long sessions
- Modern, premium feel

Implementation: Tailwind `dark:` variant + CSS variables + system preference detection + manual toggle

---

## 4. Accessibility & Localization

### 4.1 RTL Design Requirements

| Element | RTL Consideration |
|---------|-------------------|
| Text alignment | Right-aligned by default for Arabic |
| Navigation | Swipe direction mirrors (back = swipe right) |
| Icons | Directional icons flip (arrows, chevrons) |
| Numbers | Arabic-Indic numerals option (١٢٣) or Western (123) |
| Forms | Labels right-aligned, input right-aligned |
| Chat bubbles | Sender on right (Arabic convention) |
| Feed actions | Action buttons on left side (thumb zone for RTL) |

### 4.2 Accessibility Standards

- **WCAG 2.1 AA** compliance target
- Color contrast ratios: 4.5:1 minimum for text
- Touch targets: 44x44px minimum
- Screen reader support with proper ARIA labels (Arabic)
- Keyboard navigation support
- Reduced motion preference respected
- Font size scaling support

### 4.3 Performance Budgets

| Metric | Target | Tool |
|--------|--------|------|
| First Contentful Paint (FCP) | < 1.5s | Lighthouse |
| Largest Contentful Paint (LCP) | < 2.5s | Lighthouse |
| First Input Delay (FID) | < 100ms | Lighthouse |
| Cumulative Layout Shift (CLS) | < 0.1 | Lighthouse |
| Time to Interactive (TTI) | < 3.5s | Lighthouse |
| Bundle size (initial) | < 150KB gzipped | webpack-bundle-analyzer |
| Image load (thumbnail) | < 50KB each | Sharp/Next.js Image |

---

## 5. Responsive Breakpoints

```
Mobile (default):     320px - 767px    ← Primary target
Tablet:               768px - 1023px
Desktop:              1024px - 1439px
Large Desktop:        1440px+

Feed Layout:
- Mobile: Single column, card-based social feed
- Tablet: Single column (80% width), side panel for trending
- Desktop: Two-column (feed left, detail/sidebar right)
- Large Desktop: Three-column (nav + groups, feed, detail/trending)

Post Composer:
- Mobile: Full-screen modal
- Tablet: Centered modal (70% width)
- Desktop: Inline (within feed column) or modal

Group View:
- Mobile: Full-screen, tab navigation
- Tablet: Two-pane (group list left, feed right)
- Desktop: Three-pane (groups sidebar, feed, member panel)

Profile View:
- Mobile: Stacked (cover → avatar → stats → tabs → content)
- Desktop: Side-by-side (profile info left, content feed right)
```

---

*All wireframes and designs should be created in Figma with a shared design system. Components should be built in Storybook for documentation and testing before integration. All screens must be tested with Arabic content (RTL) and verified across the tiered permission system.*
