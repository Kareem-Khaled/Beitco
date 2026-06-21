# Beitco – Architecture & Technology Stack

**Document Version:** 3.0 — Social Network Pivot
**Date:** April 7, 2026

---

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                   │
│                                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  Next.js PWA │  │  React Native│  │  Admin Panel │  │  Agent Portal│   │
│  │  (Mobile Web)│  │  (Future v2) │  │  (Next.js)   │  │  (Next.js)   │   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │
│         │                  │                  │                  │           │
└─────────┼──────────────────┼──────────────────┼──────────────────┼───────────┘
          │                  │                  │                  │
          ▼                  ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CDN / EDGE LAYER                                  │
│                                                                             │
│  ┌────────────────────────────┐  ┌────────────────────────────────────┐     │
│  │   Cloudflare CDN           │  │   Cloudflare Stream / Mux         │     │
│  │   - Static assets          │  │   - Video transcoding             │     │
│  │   - API caching            │  │   - Adaptive bitrate (HLS)        │     │
│  │   - DDoS protection        │  │   - CDN delivery                  │     │
│  │   - WAF                    │  │   - Thumbnail generation          │     │
│  │   - Bot management         │  │   - Player SDK                    │     │
│  └────────────────────────────┘  └────────────────────────────────────┘     │
│                                                                             │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          API GATEWAY LAYER                                  │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────┐     │
│  │   AWS Application Load Balancer (ALB)                              │     │
│  │   - SSL termination                                                │     │
│  │   - Health checks                                                  │     │
│  │   - Path-based routing (/api/* → API, /ws/* → WebSocket)         │     │
│  │   - Rate limiting (via WAF rules)                                  │     │
│  └────────────────────────────────────────────────────────────────────┘     │
│                                                                             │
└──────────────┬─────────────────────────────────────┬────────────────────────┘
               │                                     │
               ▼                                     ▼
┌──────────────────────────────────┐  ┌──────────────────────────────────────┐
│      APPLICATION LAYER           │  │       REAL-TIME LAYER                │
│                                  │  │                                      │
│  ┌────────────────────────────┐  │  │  ┌────────────────────────────────┐  │
│  │   NestJS API Server        │  │  │  │   NestJS WebSocket Gateway     │  │
│  │   (ECS Fargate)            │  │  │  │   (ECS Fargate)                │  │
│  │                            │  │  │  │                                │  │
│  │   Modules:                 │  │  │  │   - Chat messaging             │  │
│  │   - Auth (JWT + OTP)       │  │  │  │   - Typing indicators          │  │
│  │   - Users                  │  │  │  │   - Online presence            │  │
│  │   - Posts (NEW)            │  │  │  │   - Real-time notifications    │  │
│  │   - Comments (NEW)         │  │  │  │   - Feed updates               │  │
│  │   - Social Graph (NEW)     │  │  │  │   - Live post engagement       │  │
│  │   - Groups (NEW)           │  │  │  │                                │  │
│  │   - Moderation (NEW)       │  │  │  └────────────────────────────────┘  │
│  │   - Listings               │  │  │                                      │
│  │   - Videos                 │  │  │  Redis Pub/Sub for multi-instance   │
│  │   - Search                 │  │  │  synchronization                    │
│  │   - Feed (updated)         │  │  │                                      │
│  │   - Chat                   │  │  └──────────────────────────────────────┘
│  │   - Reviews                │  │
│  │   - Notifications          │  │
│  │   - Admin                  │  │
│  │   - Analytics              │  │
│  │   - Payments               │  │
│  │                            │  │
│  │   Middleware:              │  │
│  │   - Auth Guard             │  │
│  │   - Rate Limiter           │  │
│  │   - Request Logger         │  │
│  │   - Language Detection     │  │
│  │   - Error Handler          │  │
│  └────────────────────────────┘  │
│                                  │
└──────────┬───────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATA LAYER                                        │
│                                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  PostgreSQL   │  │    Redis     │  │  Meilisearch │  │  S3 / R2     │   │
│  │  + PostGIS    │  │  (Upstash)   │  │              │  │              │   │
│  │              │  │              │  │              │  │              │   │
│  │  - Users     │  │  - Sessions  │  │  - Listings  │  │  - Photos    │   │
│  │  - Posts     │  │  - Feed cache│  │  - Posts     │  │  - Documents │   │
│  │  - Comments  │  │  - Rate limit│  │  - Users     │  │  - Backups   │   │
│  │  - Follows   │  │  - Pub/Sub   │  │  - Groups    │  │  - User      │   │
│  │  - Groups    │  │  - Online    │  │  - Arabic +  │  │    uploads   │   │
│  │  - Listings  │  │    presence  │  │    English   │  │              │   │
│  │  - Videos    │  │  - Leaderbd  │  │  - Geo search│  │              │   │
│  │  - Messages  │  │  - Like      │  │  - Hashtags  │  │              │   │
│  │  - Reviews   │  │    counts    │  │  - Suggest   │  │              │   │
│  │  - Payments  │  │  - Social    │  │              │  │              │   │
│  │  - Reports   │  │    graph     │  │              │  │              │   │
│  │  - Geo data  │  │    cache     │  │              │  │              │   │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                        BACKGROUND SERVICES                                  │
│                                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  BullMQ       │  │  Cron Jobs   │  │  Webhooks    │  │  AI Services │   │
│  │  Job Queue    │  │              │  │  Handler     │  │              │   │
│  │              │  │  - Listing   │  │              │  │  - Content   │   │
│  │  - Video     │  │    expiry    │  │  - Cloudflare│  │    moderation│   │
│  │    processing│  │  - Analytics │  │    Stream    │  │  - Post      │   │
│  │  - Email     │  │    rollup    │  │  - Paymob    │  │    quality   │   │
│  │  - Push      │  │  - Trust     │  │  - SMS       │  │    scoring   │   │
│  │    notifs    │  │    score     │  │    provider  │  │  - Spam      │   │
│  │  - Search    │  │    recalc    │  │              │  │    detection │   │
│  │    indexing  │  │  - Cleanup   │  │              │  │  - Duplicate │   │
│  │  - SMS/OTP   │  │  - Tier      │  │              │  │    detection │   │
│  │  - Post      │  │    auto-     │  │              │  │  - Smart     │   │
│  │    approval  │  │    promote   │  │              │  │    matching  │   │
│  │  - Social    │  │  - Trending  │  │              │  │  - Auto      │   │
│  │    notifs    │  │    recalc    │  │              │  │    captioning│   │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                     MONITORING & OBSERVABILITY                               │
│                                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  Sentry       │  │  Grafana +   │  │  AWS         │  │  PostHog     │   │
│  │              │  │  Prometheus  │  │  CloudWatch  │  │              │   │
│  │  - Error     │  │              │  │              │  │  - Product   │   │
│  │    tracking  │  │  - Metrics   │  │  - Logs      │  │    analytics │   │
│  │  - Perf      │  │  - Dashboards│  │  - Alarms    │  │  - Feature   │   │
│  │    monitoring│  │  - Alerting  │  │  - Container │  │    flags     │   │
│  │  - Release   │  │              │  │    metrics   │  │  - A/B tests │   │
│  │    tracking  │  │              │  │              │  │  - Funnels   │   │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack – Detailed Breakdown

### 2.1 Frontend Stack

| Layer | Technology | Version | Justification |
|-------|-----------|---------|---------------|
| **Framework** | Next.js | 15.x (App Router) | SSR for SEO, RSC for performance, built-in API routes, image optimization |
| **Language** | TypeScript | 5.x | Type safety, better DX, catch errors at compile time |
| **Styling** | Tailwind CSS + shadcn/ui | Latest | Utility-first, RTL support via `dir="rtl"`, consistent design system |
| **State Management** | Zustand | 5.x | Lightweight, TypeScript-native, simpler than Redux |
| **Data Fetching** | TanStack Query (React Query) | 5.x | Caching, background refetching, optimistic updates, infinite scroll |
| **Forms** | React Hook Form + Zod | Latest | Performant forms, schema validation shared with backend |
| **Video Player** | Mux Player / hls.js | Latest | Adaptive bitrate, low-latency, mobile-optimized |
| **Maps** | Mapbox GL JS | Latest | Better Arabic support than Google Maps, customizable, free tier |
| **PWA** | next-pwa / Workbox | Latest | Offline support, install prompt, push notifications |
| **Internationalization** | next-intl | Latest | Arabic/English, RTL/LTR switching, ICU message format |
| **Animation** | Framer Motion | Latest | Smooth page transitions, gesture support for swipe |
| **Icons** | Lucide React | Latest | Consistent, lightweight SVG icons |
| **Charts (Admin)** | Recharts | Latest | Lightweight, React-native charting for dashboards |

**Frontend Architecture:**
```
src/
├── app/                          # Next.js App Router
│   ├── [locale]/                 # i18n routing (ar, en)
│   │   ├── (auth)/               # Auth layout group
│   │   │   ├── login/
│   │   │   ├── verify/
│   │   │   └── onboarding/
│   │   ├── (main)/               # Main app layout group
│   │   │   ├── feed/             # Mixed social feed (home)
│   │   │   ├── search/           # Unified search (listings, posts, users, groups)
│   │   │   ├── map/              # Map view (listings)
│   │   │   ├── post/[id]/        # Single post detail + comments
│   │   │   ├── create/           # Post creation flow (tier-aware)
│   │   │   ├── listing/[id]/     # Listing detail
│   │   │   ├── groups/           # Groups directory
│   │   │   ├── groups/[id]/      # Single group feed + members
│   │   │   ├── messages/         # Chat
│   │   │   ├── profile/[id]/     # User/agent social profile
│   │   │   ├── saved/            # Saved listings & bookmarked posts
│   │   │   ├── notifications/    # Notification center
│   │   │   └── settings/         # User settings
│   │   └── (admin)/              # Admin layout group
│   │       ├── dashboard/
│   │       ├── moderation/       # Post approval queue + flagged content
│   │       ├── users/
│   │       ├── groups/
│   │       └── analytics/
│   ├── api/                      # API routes (BFF pattern)
│   └── layout.tsx                # Root layout
├── components/
│   ├── ui/                       # shadcn/ui base components
│   ├── feed/                     # Feed components
│   │   ├── FeedContainer.tsx     # Manages 3-tab state (For You / Following / Videos)
│   │   ├── FeedTabs.tsx          # Tab switcher component (For You | Following | 📹)
│   │   ├── ForYouFeed.tsx        # Algorithmic mixed feed (card layout)
│   │   ├── FollowingFeed.tsx     # Chronological feed from followed users (card layout)
│   │   ├── VideosFeed.tsx        # Full-screen vertical video feed (Reels/TikTok layout)
│   │   ├── PostCard.tsx          # Generic post card (text/image/video/listing/poll)
│   │   ├── VideoCard.tsx         # Inline video card in For You / Following feeds
│   │   ├── FullScreenVideo.tsx   # Single full-screen video player (for Videos tab)
│   │   ├── VideoPlayer.tsx       # HLS video player core (shared by cards & full-screen)
│   │   ├── VideoOverlay.tsx      # TikTok-style overlay (author, like, comment, share)
│   │   ├── ListingCard.tsx       # Property listing card in feed
│   │   ├── PollCard.tsx          # Poll post card
│   │   └── PropertyOverlay.tsx   # Property info overlay on full-screen video
│   ├── post/                     # Post components (NEW)
│   │   ├── PostComposer.tsx      # Rich post creation form
│   │   ├── PostDetail.tsx
│   │   ├── CommentSection.tsx
│   │   ├── CommentInput.tsx
│   │   ├── LikeButton.tsx
│   │   ├── ShareMenu.tsx
│   │   ├── ApprovalBadge.tsx     # "Pending Approval" / "Approved" badge
│   │   └── AuthorBadge.tsx       # Verified / Member / New badge
│   ├── social/                   # Social components (NEW)
│   │   ├── FollowButton.tsx
│   │   ├── FollowersList.tsx
│   │   ├── UserCard.tsx
│   │   └── SuggestedUsers.tsx
│   ├── groups/                   # Group components (NEW)
│   │   ├── GroupCard.tsx
│   │   ├── GroupHeader.tsx
│   │   ├── GroupFeed.tsx
│   │   ├── GroupMembers.tsx
│   │   └── GroupJoinButton.tsx
│   ├── listing/                  # Listing components
│   ├── chat/                     # Chat components
│   ├── search/                   # Search components
│   ├── profile/                  # Profile components
│   ├── moderation/               # Admin moderation components (NEW)
│   │   ├── ApprovalQueue.tsx
│   │   ├── FlaggedContent.tsx
│   │   └── ReportsDashboard.tsx
│   └── shared/                   # Shared/common components
├── hooks/                        # Custom React hooks
│   ├── useInfiniteScroll.ts
│   ├── useVideoPreload.ts
│   ├── useWebSocket.ts
│   ├── useGeolocation.ts
│   ├── useAuth.ts
│   ├── usePermissionTier.ts      # NEW: Check current user's tier
│   ├── useLike.ts                # NEW: Optimistic like toggle
│   ├── useFollow.ts              # NEW: Follow/unfollow logic
│   └── usePostComposer.ts        # NEW: Post creation state
├── lib/                          # Utilities & configuration
│   ├── api/                      # API client (axios/fetch wrappers)
│   ├── validators/               # Zod schemas (shared with backend)
│   ├── permissions/              # NEW: Tier-based permission checks
│   ├── constants/
│   └── utils/
├── stores/                       # Zustand stores
│   ├── authStore.ts
│   ├── feedStore.ts
│   ├── chatStore.ts
│   ├── socialStore.ts            # NEW: Follow state, like state
│   └── notificationStore.ts      # NEW: Notification state
├── types/                        # TypeScript types/interfaces
├── styles/                       # Global styles, Tailwind config
└── messages/                     # i18n translation files
    ├── ar.json
    └── en.json
```

### 2.2 Backend Stack

| Layer | Technology | Version | Justification |
|-------|-----------|---------|---------------|
| **Framework** | NestJS | 11.x | Modular, TypeScript-native, decorators, built-in WebSocket, dependency injection |
| **Language** | TypeScript | 5.x | Shared types with frontend, type safety |
| **ORM** | Prisma | 6.x | Type-safe queries, migrations, excellent DX, PostGIS support via extension |
| **Validation** | class-validator + class-transformer | Latest | NestJS-native validation decorators |
| **Auth** | Passport.js + JWT | Latest | Flexible auth strategies (JWT, OAuth, OTP) |
| **WebSocket** | Socket.io (via @nestjs/websockets) | Latest | Reliable real-time with fallback, room support, ACK |
| **Queue** | BullMQ + Redis | Latest | Background jobs: video processing, notifications, emails |
| **File Upload** | Multer + tus-server | Latest | Resumable uploads for large video files |
| **SMS** | Twilio / Vonage (or local: Victory Link) | Latest | OTP delivery, SMS notifications |
| **Email** | Resend / SendGrid | Latest | Transactional emails, templates |
| **Push Notifications** | Firebase Cloud Messaging (FCM) | Latest | Cross-platform push notifications |
| **Logging** | Pino (via nestjs-pino) | Latest | Structured JSON logging, fast |
| **API Docs** | Swagger (via @nestjs/swagger) | Latest | Auto-generated API documentation |

**Backend Architecture:**
```
src/
├── main.ts                        # Bootstrap
├── app.module.ts                  # Root module
├── common/                        # Shared utilities
│   ├── decorators/                # Custom decorators (@CurrentUser, @Roles)
│   ├── filters/                   # Exception filters
│   ├── guards/                    # Auth, Role, Throttle guards
│   ├── interceptors/              # Logging, Transform interceptors
│   ├── pipes/                     # Validation pipes
│   ├── middleware/                 # Language detection, request ID
│   └── types/                     # Shared types
├── config/                        # Configuration module
│   ├── database.config.ts
│   ├── jwt.config.ts
│   ├── cloudflare.config.ts
│   ├── redis.config.ts
│   └── app.config.ts
├── modules/
│   ├── auth/                      # Authentication module
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/            # JWT, Google, Apple strategies
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── roles.guard.ts
│   │   │   └── tier.guard.ts      # NEW: Permission tier guard
│   │   └── dto/
│   ├── users/                     # User management
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── reputation.service.ts  # NEW: Reputation score calculation
│   │   ├── tier.service.ts        # NEW: Auto-promotion logic
│   │   ├── dto/
│   │   └── entities/
│   ├── posts/                     # NEW: Social posts module
│   │   ├── posts.module.ts
│   │   ├── posts.controller.ts
│   │   ├── posts.service.ts
│   │   ├── post-approval.service.ts    # Approval workflow
│   │   ├── post-quality.service.ts     # Quality scoring
│   │   ├── dto/
│   │   ├── entities/
│   │   └── processors/           # BullMQ: approval queue, quality scoring
│   ├── comments/                  # NEW: Comments module
│   │   ├── comments.module.ts
│   │   ├── comments.controller.ts
│   │   ├── comments.service.ts
│   │   └── dto/
│   ├── social/                    # NEW: Social graph module
│   │   ├── social.module.ts
│   │   ├── social.controller.ts
│   │   ├── follows.service.ts
│   │   ├── blocks.service.ts
│   │   ├── likes.service.ts
│   │   └── shares.service.ts
│   ├── groups/                    # NEW: Groups & communities module
│   │   ├── groups.module.ts
│   │   ├── groups.controller.ts
│   │   ├── groups.service.ts
│   │   ├── group-members.service.ts
│   │   └── dto/
│   ├── moderation/                # NEW: Content moderation module
│   │   ├── moderation.module.ts
│   │   ├── moderation.controller.ts
│   │   ├── moderation.service.ts
│   │   ├── ai-moderation.service.ts    # AI pipeline
│   │   ├── spam-detection.service.ts
│   │   ├── reports.service.ts
│   │   └── processors/           # BullMQ: async moderation jobs
│   ├── listings/                  # Property listings
│   │   ├── listings.module.ts
│   │   ├── listings.controller.ts
│   │   ├── listings.service.ts
│   │   ├── dto/
│   │   └── entities/
│   ├── videos/                    # Video management
│   │   ├── videos.module.ts
│   │   ├── videos.controller.ts
│   │   ├── videos.service.ts
│   │   ├── cloudflare-stream.service.ts
│   │   ├── dto/
│   │   └── processors/           # BullMQ processors
│   ├── feed/                      # Feed algorithm (UPDATED for mixed content)
│   │   ├── feed.module.ts
│   │   ├── feed.controller.ts
│   │   ├── feed.service.ts
│   │   └── feed-ranking.service.ts # NEW: Mixed content ranking
│   ├── search/                    # Search engine (UPDATED for posts/users/groups)
│   │   ├── search.module.ts
│   │   ├── search.controller.ts
│   │   ├── search.service.ts
│   │   └── meilisearch.service.ts
│   ├── chat/                      # Real-time messaging
│   │   ├── chat.module.ts
│   │   ├── chat.gateway.ts        # WebSocket gateway
│   │   ├── chat.service.ts
│   │   └── dto/
│   ├── reviews/                   # Review & trust system
│   │   ├── reviews.module.ts
│   │   ├── reviews.controller.ts
│   │   └── reviews.service.ts
│   ├── notifications/             # Push, email, SMS, in-app
│   │   ├── notifications.module.ts
│   │   ├── notifications.controller.ts
│   │   ├── notifications.service.ts
│   │   ├── channels/
│   │   │   ├── push.channel.ts
│   │   │   ├── sms.channel.ts
│   │   │   ├── email.channel.ts
│   │   │   └── in-app.channel.ts
│   │   └── processors/
│   ├── payments/                  # Payment processing
│   │   ├── payments.module.ts
│   │   ├── payments.controller.ts
│   │   ├── payments.service.ts
│   │   ├── paymob.service.ts
│   │   └── webhooks/
│   ├── admin/                     # Admin panel APIs
│   │   ├── admin.module.ts
│   │   ├── admin.controller.ts
│   │   └── admin.service.ts
│   └── analytics/                 # Analytics & tracking
│       ├── analytics.module.ts
│       ├── analytics.controller.ts
│       └── analytics.service.ts
├── jobs/                          # Background job definitions
│   ├── video-processing.job.ts
│   ├── post-approval.job.ts       # NEW: Process pending posts
│   ├── post-quality-scoring.job.ts # NEW: AI quality scoring
│   ├── ai-moderation.job.ts       # NEW: Async content moderation
│   ├── tier-auto-promotion.job.ts # NEW: Auto-promote active users
│   ├── listing-expiry.job.ts
│   ├── trust-score.job.ts
│   ├── reputation-score.job.ts    # NEW: Recalculate reputation
│   ├── trending-recalc.job.ts     # NEW: Trending posts/hashtags
│   ├── search-index.job.ts
│   └── analytics-rollup.job.ts
└── prisma/
    ├── schema.prisma              # Database schema
    ├── migrations/                # Migration files
    └── seed.ts                    # Seed data
```

### 2.3 Database Architecture

**Primary Database: PostgreSQL 16 + PostGIS**

**Why PostgreSQL over MySQL:**
- PostGIS for geospatial queries (find properties within radius, polygon search)
- JSONB for flexible metadata (amenities, preferences, video metadata)
- Full-text search for Arabic (with proper tokenizer configuration)
- Better concurrent write performance
- Row-level security for multi-tenant data isolation
- Superior indexing (GIN, GiST, BRIN)

**Key Indexes:**
```sql
-- Geospatial: Find listings within radius
CREATE INDEX idx_listings_location ON listings USING GIST (location);

-- Full-text search (Arabic + English)
CREATE INDEX idx_listings_search ON listings USING GIN (
  to_tsvector('arabic', title_ar || ' ' || description_ar) ||
  to_tsvector('english', title_en || ' ' || description_en)
);

-- Feed query optimization
CREATE INDEX idx_listings_feed ON listings (status, created_at DESC)
  WHERE status = 'active';

-- Price range filtering
CREATE INDEX idx_listings_price ON listings (transaction_type, price)
  WHERE status = 'active';

-- User's listings
CREATE INDEX idx_listings_user ON listings (user_id, created_at DESC);

-- Conversation lookup
CREATE INDEX idx_conversations_participants ON conversations
  USING GIN (participants);

-- Message ordering
CREATE INDEX idx_messages_conversation ON messages (conversation_id, created_at DESC);

-- === NEW: Social Network Indexes ===

-- Posts feed (published posts sorted by recency)
CREATE INDEX idx_posts_feed ON posts (status, created_at DESC)
  WHERE status = 'published';

-- Posts by author
CREATE INDEX idx_posts_author ON posts (author_id, created_at DESC);

-- Posts pending approval (for moderation queue)
CREATE INDEX idx_posts_pending ON posts (approval_status, created_at ASC)
  WHERE approval_status = 'pending';

-- Posts in a group
CREATE INDEX idx_posts_group ON posts (group_id, created_at DESC)
  WHERE group_id IS NOT NULL AND status = 'published';

-- Posts by hashtag
CREATE INDEX idx_posts_hashtags ON posts USING GIN (hashtags);

-- Comments on a post
CREATE INDEX idx_comments_post ON comments (post_id, created_at ASC)
  WHERE status = 'visible';

-- Threaded replies
CREATE INDEX idx_comments_parent ON comments (parent_comment_id, created_at ASC)
  WHERE parent_comment_id IS NOT NULL;

-- Follows (social graph queries)
CREATE INDEX idx_follows_follower ON follows (follower_id, created_at DESC);
CREATE INDEX idx_follows_following ON follows (following_id, created_at DESC);
CREATE UNIQUE INDEX idx_follows_unique ON follows (follower_id, following_id);

-- Likes (check if user liked, count likes)
CREATE UNIQUE INDEX idx_likes_unique ON likes (user_id, target_type, target_id);
CREATE INDEX idx_likes_target ON likes (target_type, target_id);

-- Group members
CREATE UNIQUE INDEX idx_group_members_unique ON group_members (group_id, user_id);
CREATE INDEX idx_group_members_user ON group_members (user_id);

-- Blocks
CREATE UNIQUE INDEX idx_blocks_unique ON blocks (blocker_id, blocked_id);

-- Reports
CREATE INDEX idx_reports_status ON reports (status, created_at ASC)
  WHERE status = 'pending';

-- Hashtags trending
CREATE INDEX idx_hashtags_trending ON hashtags (trending_score DESC);
```

**Redis Architecture (Upstash Serverless Redis):**
```
Key Patterns:
├── session:{userId}                    # JWT refresh tokens
├── otp:{phone}                         # OTP codes (TTL: 5min)
├── rate:{ip}:{endpoint}                # Rate limiting counters
├── feed:{userId}:cache                 # Cached mixed feed (TTL: 3min)
├── feed:{userId}:following             # Following feed cache (TTL: 3min)
├── listing:{id}:views                  # View counter (periodic flush to PG)
├── post:{id}:views                     # Post view counter (periodic flush)
├── post:{id}:likes                     # Like count cache
├── user:{id}:online                    # Online presence (TTL: 30s, heartbeat)
├── user:{id}:followers:count           # Follower count cache
├── user:{id}:following:count           # Following count cache
├── user:{id}:tier                      # Permission tier cache (fast guard checks)
├── search:suggestions:{prefix}         # Search autocomplete cache
├── trending:posts                      # Trending posts sorted set
├── trending:hashtags                   # Trending hashtags sorted set
├── group:{id}:members:count            # Group member count cache
├── moderation:queue:length             # Pending approval queue length
├── chat:room:{conversationId}          # Active chat participants
└── spam:rate:{userId}                  # Spam rate limiter per user
```

### 2.4 Video Infrastructure

**MVP: Cloudflare Stream**
```
Upload Flow:
1. Client requests upload URL → POST /api/v1/videos/upload-url
2. Backend creates Cloudflare Stream upload via TUS
3. Backend returns signed upload URL to client
4. Client uploads directly to Cloudflare (resumable via TUS protocol)
5. Cloudflare transcodes → generates HLS streams at multiple qualities
6. Cloudflare sends webhook → Backend updates video status
7. Backend triggers moderation check
8. Video becomes available in feed

Delivery:
- HLS adaptive bitrate streaming
- Cloudflare CDN with edge caching
- Automatic quality selection based on bandwidth
- Thumbnail generation at multiple sizes
- Video analytics (views, watch time, completion rate)

Quality Tiers:
├── 360p  (500 kbps)   - Poor connectivity / data saver mode
├── 480p  (1 Mbps)     - Standard mobile (3G)
├── 720p  (2.5 Mbps)   - Good mobile (4G)
└── 1080p (5 Mbps)     - WiFi / excellent connectivity
```

**Scale Phase: Mux (when >50k MAU)**
```
Why migrate to Mux:
- Superior analytics (engagement heatmaps, quality metrics)
- Better player SDK (Mux Player) with mobile optimization
- Data-driven quality (Mux Data for real user monitoring)
- Lower cost at scale
- Webhooks for every video lifecycle event
- Better low-latency live streaming (for virtual tours)
```

**Low-Bandwidth Strategy (Critical for Egypt):**
```
1. Auto-detect connection speed on app load
2. Default to 480p on cellular, 720p on WiFi
3. "Data Saver Mode" toggle → 360p + compressed thumbnails
4. Preload next 2 videos at lowest quality, upgrade on play
5. Show static thumbnail + play button on very slow connections
6. Progressive image loading for thumbnails (blur-up technique)
7. Skeleton loading states for everything
8. Cache viewed videos in Service Worker for offline re-viewing
```

### 2.5 Cloud Infrastructure (AWS)

```
AWS Architecture:
├── Region: eu-south-1 (Milan) or me-south-1 (Bahrain)
│   └── Closest to Egypt with full service availability
│
├── Compute:
│   ├── ECS Fargate (API servers)
│   │   ├── API Service (2-10 tasks, auto-scaling)
│   │   ├── WebSocket Service (2-5 tasks)
│   │   └── Worker Service (1-3 tasks, for BullMQ)
│   └── Lambda (lightweight functions)
│       ├── Image resizing
│       ├── Webhook handlers
│       └── Cron triggers
│
├── Database:
│   ├── RDS PostgreSQL (db.t4g.medium → db.r6g.large)
│   │   ├── Multi-AZ for production
│   │   ├── Read replicas for search/analytics queries
│   │   └── Automated backups (7-day retention)
│   └── ElastiCache Redis (or Upstash serverless)
│       └── cache.t4g.micro → cache.r6g.large
│
├── Storage:
│   ├── S3 (photos, documents, backups)
│   │   ├── Standard tier for active content
│   │   ├── IA tier for old content (>90 days)
│   │   └── Glacier for backups
│   └── CloudFront CDN
│       ├── Static assets (Next.js build output)
│       └── S3 content (photos, thumbnails)
│
├── Networking:
│   ├── VPC with public/private subnets
│   ├── ALB for API routing
│   ├── NAT Gateway for outbound traffic
│   └── Route 53 for DNS
│
├── Security:
│   ├── WAF (rate limiting, geo-blocking, SQL injection prevention)
│   ├── Secrets Manager (API keys, DB credentials)
│   ├── IAM roles (least privilege)
│   ├── VPC security groups
│   └── SSL/TLS everywhere
│
└── Monitoring:
    ├── CloudWatch (logs, metrics, alarms)
    ├── X-Ray (distributed tracing)
    └── SNS (alert notifications)
```

**Cost Estimation (MVP):**

| Service | Spec | Monthly Cost (USD) |
|---------|------|-------------------|
| ECS Fargate (API) | 2 tasks, 0.5 vCPU, 1GB | ~$30 |
| ECS Fargate (WS) | 1 task, 0.5 vCPU, 1GB | ~$15 |
| RDS PostgreSQL | db.t4g.micro, 20GB | ~$15 |
| Upstash Redis | Serverless, pay-per-use | ~$10 |
| Cloudflare Stream | 1000 min storage, 5000 min delivery | ~$50 |
| S3 + CloudFront | 50GB storage, 100GB transfer | ~$10 |
| ALB | 1 ALB | ~$20 |
| Route 53 | 1 hosted zone | ~$1 |
| Secrets Manager | 10 secrets | ~$4 |
| Meilisearch (Cloud) | Small instance | ~$30 |
| **Total MVP** | | **~$185/month** |

### 2.6 DevOps & CI/CD

```
CI/CD Pipeline (GitHub Actions):

┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Commit  │───▶│  Build   │───▶│  Test    │───▶│  Deploy  │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
                     │               │               │
                     ▼               ▼               ▼
              ┌──────────┐    ┌──────────┐    ┌──────────┐
              │ TypeCheck│    │ Unit     │    │ Staging  │
              │ Lint     │    │ Integr.  │    │ Preview  │
              │ Build    │    │ E2E      │    │ Prod     │
              └──────────┘    └──────────┘    └──────────┘

Tools:
├── GitHub Actions          # CI/CD orchestration
├── Docker                  # Containerization
├── ECR                     # Container registry
├── Terraform / Pulumi      # Infrastructure as Code
├── Turborepo               # Monorepo build system
└── Changesets              # Version management
```

**Docker Setup:**
```
Monorepo Structure:
beitco/
├── apps/
│   ├── web/               # Next.js frontend
│   ├── api/               # NestJS backend
│   └── admin/             # Admin panel (Next.js)
├── packages/
│   ├── shared/            # Shared types, validators, constants
│   ├── ui/                # Shared UI components
│   └── config/            # Shared config (ESLint, TypeScript, Tailwind)
├── docker/
│   ├── Dockerfile.api
│   ├── Dockerfile.web
│   └── docker-compose.yml
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── deploy-staging.yml
│       └── deploy-production.yml
├── turbo.json
├── package.json
└── pnpm-workspace.yaml
```

### 2.7 Security Architecture

| Layer | Measure | Implementation |
|-------|---------|----------------|
| **Transport** | TLS 1.3 everywhere | Cloudflare SSL + ALB SSL termination |
| **Authentication** | JWT + Refresh tokens | Short-lived access (15min), long-lived refresh (7d), rotation |
| **Authorization** | RBAC + Resource ownership | NestJS Guards, Prisma middleware for row-level checks |
| **API Security** | Rate limiting | Redis-based, per-user and per-IP limits |
| **Input Validation** | Schema validation | class-validator on all DTOs, Zod on frontend |
| **SQL Injection** | Parameterized queries | Prisma ORM (never raw queries without parameterization) |
| **XSS** | Content Security Policy | Next.js CSP headers, sanitize user content |
| **CSRF** | SameSite cookies + tokens | Double-submit cookie pattern |
| **File Upload** | Type validation + scanning | MIME type check, file size limits, antivirus scanning |
| **Secrets** | AWS Secrets Manager | No secrets in code or env files in production |
| **Encryption** | At rest + in transit | RDS encryption, S3 encryption, message encryption |
| **Monitoring** | Security event logging | Failed auth attempts, privilege escalation, anomalies |
| **Compliance** | Egypt Data Protection | Data residency, consent management, right to deletion |

### 2.8 AI & Automation Integration (Updated for Social Network)

| Use Case | Tool/Service | Implementation | Phase |
|----------|-------------|----------------|-------|
| **Post Quality Scoring** | Custom NLP + rule engine | Score 0-100: content completeness, media quality, text readability, author trust | MVP |
| **Content Moderation (Images/Video)** | OpenAI Vision API / Google Cloud Vision | Auto-flag inappropriate images/video thumbnails | MVP |
| **Text Moderation (Arabic + English)** | Custom Arabic profanity filter + OpenAI Moderation API | Real-time comment filtering, post text screening | MVP |
| **Spam Detection** | Rule engine (rate limits, patterns) + ML classifier | Detect repetitive posts, promotional spam, bot behavior | MVP |
| **Fake Listing Detection** | Price anomaly detection + image reverse search | Flag unrealistic prices, stolen photos | MVP |
| **Post Approval Assist** | AI pre-screening pipeline | Auto-approve obvious good content; auto-reject obvious bad; queue borderline for humans | MVP |
| **Duplicate Detection** | Perceptual hashing + text cosine similarity | Detect reposted content across posts and listings | v1.1 |
| **Smart Matching** | Collaborative filtering + content-based | "Because you viewed..." recommendations in feed | v1.1 |
| **Auto-Captioning** | Whisper API (OpenAI) | Arabic/English speech-to-text for video captions | v1.1 |
| **Natural Language Search** | OpenAI Embeddings + pgvector | "3 bedroom near AUC under 2M" → structured query | v2.0 |
| **Trending Detection** | Custom scoring (velocity of engagement) | Identify trending posts, hashtags, discussions | MVP |
| **Sentiment Analysis** | Arabic NLP model | Detect negative sentiment in comments for early moderation | v1.1 |
| **Virtual Staging** | Stable Diffusion / custom model | AI-generated furnished room previews | v2.0 |
| **Code Generation** | Claude / Cursor / v0.dev | Accelerate development of components and APIs | Ongoing |

**AI Moderation Pipeline (Detailed):**
```
Post Submitted
    │
    ▼
┌──────────────────┐
│ Stage 1: Rules   │  - Rate limit check (max 10 posts/day for Tier 3)
│ (Instant, <10ms) │  - Banned words / regex patterns
│                  │  - External link check (block for Tier 3)
│                  │  - Min content length check
└────────┬─────────┘
         │ Pass
         ▼
┌──────────────────┐
│ Stage 2: AI Text │  - Profanity/toxicity score (0-1)
│ (~100ms)         │  - Spam probability (0-1)
│                  │  - Quality score (0-100)
│                  │  - Contact info extraction (phone/email in body)
└────────┬─────────┘
         │ Pass
         ▼
┌──────────────────┐
│ Stage 3: AI      │  - Image/video thumbnail safety check
│ Media (~500ms)   │  - NSFW detection
│ (async for Tier 2│  - Duplicate image hash check
│  sync for Tier 3)│
└────────┬─────────┘
         │
    ┌────┴────────────────────────┐
    │                             │
    ▼                             ▼
[Tier 2: Published]      [Tier 3: Decision]
[AI monitors async]           │
                        ┌─────┴─────┐
                        ▼           ▼
                   [Score > 70]  [Score < 70]
                   Auto-approve  Human review
                   + publish     queue
```

---

### 2.9 Testing Strategy

| Test Type | Tool | Coverage Target | Scope |
|-----------|------|----------------|-------|
| **Unit Tests** | Jest / Vitest | 80%+ for services | Business logic, utilities, validators |
| **Integration Tests** | Jest + Supertest | Key API flows | API endpoints with test database |
| **E2E Tests** | Playwright | Critical user journeys | Sign up, upload, search, chat, purchase |
| **Component Tests** | Storybook + Testing Library | All shared components | UI components in isolation |
| **Load Tests** | k6 / Artillery | Key endpoints | API performance under load |
| **Security Tests** | OWASP ZAP | Quarterly | Vulnerability scanning |
| **Visual Regression** | Chromatic (via Storybook) | UI components | Catch unintended visual changes |

---

*This architecture is designed to support 0 → 100,000 MAU with minimal re-architecture. Horizontal scaling paths are documented for each component.*
