> ⚠️ **STALE — pre-pivot doc.** Beitco pivoted to a trust-first **bed-level housing marketplace** (June 2026). This doc describes the old social-network/real-estate architecture. For the current system read `.ai/CURRENT_STATE.md` (what's built) and `.ai/BACKEND_TASKS.md` (the backend plan). Trust `.ai/ENTRY_PROMPT.md`, `.ai/CURRENT_STATE.md`, `.ai/BACKEND_TASKS.md`, and `.ai/TASKS.md` instead. Kept for historical reference only.

---

# Beitco — Architecture Reference

> **Concise technical reference for AI assistants. For detailed diagrams, see `docs/02-architecture-tech-stack.md`.**

---

## System Architecture (Simplified)

```
Client Layer:
  Next.js PWA (Web)  ←──┐
  Capacitor (iOS)    ←──┤── Same codebase
  Capacitor (Android)←──┘
    ↓ HTTPS
Cloudflare CDN + WAF
    ↓
AWS ALB (Load Balancer)
    ↓                    ↓
NestJS API Server    NestJS WebSocket Gateway
    ↓                    ↓
┌──────────────────────────────────────┐
│           DATA LAYER                  │
│  PostgreSQL  Redis  Meilisearch  S3  │
└──────────────────────────────────────┘
    ↓
BullMQ Background Jobs (moderation, notifications, video processing)
```

---

## Backend Modules (NestJS)

```
apps/api/src/modules/
├── auth/                 # Phone OTP, JWT, Google/Apple OAuth
├── users/                # Profile CRUD, tier management, verification
├── posts/                # Create/read/update/delete posts, approval workflow
├── comments/             # Threaded comments, like, pin
├── social/               # Follow/unfollow, block, suggestions
├── groups/               # Group CRUD, membership, group feed
├── moderation/           # AI pipeline (3-stage), reports, admin review
├── feed/                 # 3-tab feed algorithms (For You / Following / Videos)
├── listings/             # Property CRUD, geo search, status management
├── videos/               # Mux integration, upload, transcode webhooks
├── search/               # Meilisearch indexing and query
├── chat/                 # Conversations, real-time messaging (WebSocket)
├── notifications/        # Push (FCM), SMS, in-app, preferences
├── reviews/              # Agent reviews and ratings
├── payments/             # Paymob integration, subscriptions
├── admin/                # User management, moderation queue, analytics
└── analytics/            # Event tracking, metrics aggregation
```

---

## Shared Packages

```
packages/
├── types/          # TypeScript interfaces shared between frontend + backend
│   ├── user.ts     # User, UserProfile, PermissionTier
│   ├── post.ts     # Post, PostType, PostStatus, CreatePostDto
│   ├── comment.ts  # Comment, CreateCommentDto
│   ├── group.ts    # Group, GroupMember, GroupType
│   ├── listing.ts  # Listing, ListingType, PropertyType
│   ├── feed.ts     # FeedItem, FeedTab, FeedQuery
│   └── common.ts   # ApiResponse, PaginatedResponse, ErrorResponse
│
├── validators/     # Zod schemas (runtime validation, source of truth for types)
│   ├── post.schema.ts
│   ├── user.schema.ts
│   ├── listing.schema.ts
│   └── common.schema.ts
│
└── utils/          # Shared utilities
    ├── format-price.ts      # "1,500,000 ج.م"
    ├── arabic-utils.ts      # Arabic number conversion, text direction
    ├── date-utils.ts        # Relative dates in Arabic ("منذ ساعتين")
    └── slug.ts              # URL-safe Arabic slugs
```

---

## Frontend Architecture

```
apps/web/src/
├── app/[locale]/
│   ├── (auth)/                    # Login, OTP, onboarding
│   ├── (main)/                    # Main app layout (bottom nav)
│   │   ├── page.tsx               # Home — 3-tab feed
│   │   ├── search/                # Unified search
│   │   ├── create/                # Post composer (tier-aware)
│   │   ├── groups/                # Group directory + detail
│   │   ├── profile/               # My profile + settings
│   │   ├── post/[id]/             # Post detail + comments
│   │   ├── listing/[id]/          # Listing detail
│   │   ├── user/[id]/             # Public user profile
│   │   ├── messages/              # Chat conversations
│   │   └── notifications/         # Notification center
│   └── (admin)/                   # Admin panel
│
├── components/
│   ├── ui/                        # shadcn/ui primitives
│   ├── feed/                      # FeedTabs, ForYouFeed, FollowingFeed, VideosFeed
│   ├── post/                      # PostComposer, PostCard, CommentSection
│   ├── social/                    # FollowButton, UserCard, SuggestedUsers
│   ├── groups/                    # GroupCard, GroupHeader, GroupFeed
│   ├── listing/                   # ListingCard, ListingForm, MapSearch
│   ├── video/                     # VideoPlayer, FullScreenVideo, VideoOverlay
│   ├── chat/                      # ConversationList, ChatView
│   └── common/                    # BottomNav, TopBar, Skeleton, Badge
│
├── hooks/
│   ├── useAuth.ts                 # Auth state + actions
│   ├── useTier.ts                 # Current user tier + permission checks
│   ├── useFeed.ts                 # TanStack Query for feed tabs
│   ├── usePosts.ts                # Post CRUD operations
│   ├── useFollow.ts               # Follow/unfollow with optimistic updates
│   ├── useLike.ts                 # Like/unlike with optimistic updates
│   └── useGroups.ts               # Group operations
│
├── stores/
│   ├── auth.store.ts              # User session, tokens
│   ├── feed.store.ts              # Active tab, scroll position
│   └── ui.store.ts                # Dark mode, language, bottom sheet state
│
├── lib/
│   ├── api-client.ts              # Axios/fetch wrapper with auth headers
│   ├── api/                       # Per-module API functions
│   │   ├── posts.api.ts
│   │   ├── feed.api.ts
│   │   ├── groups.api.ts
│   │   └── ...
│   └── query-keys.ts              # TanStack Query key constants
│
└── messages/
    ├── ar.json                    # Arabic translations
    └── en.json                    # English translations
```

---

## Mobile Strategy (Capacitor)

```
Approach:  Web-first with Capacitor for native app distribution
Framework: Capacitor 6.x wraps the Next.js app into iOS + Android shells
Result:    One codebase → Web + iOS App Store + Google Play Store

apps/web/
├── src/                   # Your Next.js code (unchanged)
├── ios/                   # Capacitor-generated Xcode project
├── android/               # Capacitor-generated Android Studio project
├── capacitor.config.ts    # Capacitor configuration
└── next.config.ts         # Next.js config (unchanged)
```

### Native Plugins Used

| Plugin | Purpose |
|--------|---------|
| `@capacitor/push-notifications` | FCM push on iOS + Android |
| `@capacitor/camera` | Native camera for video recording |
| `@capacitor/haptics` | Haptic feedback on like, swipe |
| `@capacitor/share` | Native share sheet |
| `@capacitor/app` | Deep links, app state, back button |
| `@capacitor/filesystem` | Offline caching |
| `@capacitor/splash-screen` | Native splash screen |
| `@capacitor/status-bar` | Status bar styling |

### Platform Detection Pattern

```typescript
import { Capacitor } from '@capacitor/core';

// Check if running as native app
const isNative = Capacitor.isNativePlatform();
const platform = Capacitor.getPlatform(); // 'web' | 'ios' | 'android'

// Use native camera on mobile, file input on web
if (isNative) {
  const photo = await Camera.getPhoto({ ... });
} else {
  // fallback to HTML file input
}
```

### Migration Path

```
MVP (Week 9):     Capacitor wraps Next.js → App Store + Google Play
Post-Launch:      If Reels video needs 60fps native → add native video player plugin
Scale (if ever):  If native app needed → apps/mobile/ (React Native) in same monorepo
```

---

## Database Overview

```
Core Tables:                Social Tables:           Content Tables:
├── users                   ├── follows              ├── posts
├── listings                ├── blocks               ├── comments
├── videos                  ├── likes                ├── shares
├── conversations           ├── groups               ├── reports
├── messages                ├── group_members         ├── hashtags
├── reviews                 ├── poll_votes           ├── notifications
├── saved_listings          │                        │
├── saved_searches          │                        │
└── payments                │                        │

Primary key:     UUID (gen_random_uuid()) on all tables
Soft delete:     status = 'deleted' (never physical delete)
Timestamps:      created_at + updated_at on all tables
Denormalized:    like_count, comment_count, follower_count (updated via service)
Geo:             PostGIS geography(Point, 4326) for listings + groups
```

*For complete schema, see `.ai/DB_SCHEMA.md`*

---

## Key Data Flows

### Post Creation Flow
```
User taps "Create"
  → Frontend checks tier via useTier()
  → If Tier 4/5: show "verify to post" prompt
  → If Tier 3: show composer with "Submit for Approval" button
  → If Tier 2: show composer with "Publish" button
  → POST /api/v1/posts with content
  → Backend: TierGuard checks permission
  → Backend: AI moderation (Stage 1: rules, Stage 2: text analysis)
  → If Tier 2: status = 'published', ai_quality_score saved
  → If Tier 3: status = 'pending_approval', enters moderation queue
  → BullMQ: notification to author ("submitted" or "published")
  → If published: add to Meilisearch index, update feed cache
```

### Feed Loading Flow
```
User opens app → lands on "For You" tab
  → GET /api/v1/feed?cursor=X&limit=20
  → Backend: get candidate posts from followed users + area + trending
  → Rank by: trust (25%) + quality (20%) + engagement (20%) + affinity (15%) + recency (15%) + diversity (5%)
  → Inject 1 sponsored post per 8 organic
  → Return paginated response with cursor for next page
  → Frontend: TanStack Query infinite scroll, preload next page
  → On tab switch to "Following": GET /api/v1/feed/following (chronological)
  → On tab switch to "Videos": GET /api/v1/feed/videos (full-screen player)
```

### Moderation Flow
```
Content submitted (post or comment)
  → Stage 1 (Rules): Check banned words, URL patterns, phone numbers
  → Stage 2 (AI Text): OpenAI moderation API for text analysis
  → Stage 3 (AI Media): Image/video analysis for inappropriate content
  → Score: 0-100 (0 = definitely safe, 100 = definitely spam/harmful)
  
  If score < 30: Auto-approve (for Tier 2) or mark safe (for Tier 3 queue)
  If score 30-70: Flag for human review (enters moderation queue)
  If score > 70: Auto-reject with reason
  
  Tier 2 posts: AI runs post-publish (published first, removed if flagged)
  Tier 3 posts: AI runs pre-publish (must pass before publishing)
```

---

## Infrastructure

```
AWS Region: me-south-1 (Bahrain) — closest to Egypt

Compute:     ECS Fargate (auto-scaling, 0.5 vCPU / 1GB min)
Database:    RDS PostgreSQL 16 (db.t3.medium, 100GB, Multi-AZ later)
Cache:       Upstash Redis (serverless, pay-per-request)
Storage:     S3 (user uploads) + Cloudflare R2 (CDN assets)
Search:      Meilisearch on ECS (1 instance, scale later)
Queue:       BullMQ on Redis (shared Upstash instance)
Video:       Mux (external, API-based)
Mobile:      Capacitor 6.x (iOS + Android native shells wrapping Next.js)
CDN:         Cloudflare (free tier → Pro)
DNS:         Cloudflare
SSL:         Cloudflare (edge) + ACM (ALB)
Monitoring:  Sentry + CloudWatch + PostHog
CI/CD:       GitHub Actions → Docker → ECR → ECS (blue/green deploy)

Estimated MVP cost: ~$185/month
```

---

*For complete architecture diagrams and detailed infrastructure, see `docs/02-architecture-tech-stack.md`*
