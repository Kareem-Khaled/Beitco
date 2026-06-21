# Beitco – Roadmap & Timeline

**Document Version:** 3.0 — Social Network Pivot
**Date:** April 7, 2026

---

## 1. Phase Overview

```
Timeline Overview (v3.0 — 12 Weeks to Social Real Estate MVP)

Week:  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24
       ├──────────────────────┤
       │ PHASE 1: Social MVP  │
       │  Backend, APIs,      │
       │  Social Features,    │
       │  Moderation Pipeline │
       │  (5 weeks)           │
       ├──────────────────────┤
                              ├──────────────────┤
                              │ PHASE 2: MVP     │
                              │  Frontend &      │
                              │  Social UX       │
                              │  (4 weeks)       │
                              ├──────────────────┤
                                                  ├──────────┤
                                                  │ PHASE 3: │
                                                  │ QA, Beta │
                                                  │ & Launch │
                                                  │ (3 weeks)│
                                                  ├──────────┤
                                                             ├──────────────────┤
                                                             │ PHASE 4: Growth  │
                                                             │ & Community      │
                                                             │ Building         │
                                                             │ (4 weeks)        │
                                                             ├──────────────────┤
                                                                                ├──────────────────┤
                                                                                │ PHASE 5: Scale & │
                                                                                │ Expansion        │
                                                                                │ (Ongoing)        │
                                                                                ├──────────────────┤

Note: Timeline increased from 9-week MVP to 12-week MVP due to social features scope.
Social features add ~3 weeks: posts, comments, likes, follows, groups, moderation, approval workflow.
```

---

## 2. Phase 1: Social MVP Backend & Infrastructure (Weeks 1-5)

### Week 1: Foundation & Infrastructure

| Day | Task | Owner | Output |
|-----|------|-------|--------|
| D1 | Project scaffolding: Turborepo monorepo, NestJS setup, Next.js setup | CTO | Working monorepo with CI |
| D1 | PostgreSQL + PostGIS setup on AWS RDS | CTO | Database running |
| D1 | Redis (Upstash) setup | CTO | Cache layer ready |
| D2 | Prisma schema design — Users, Listings, Videos, **Posts, Comments, Likes, Follows, Groups** | Backend | Schema + initial migration |
| D2 | Docker setup (Dockerfile.api, docker-compose for local dev) | CTO | Local dev environment |
| D3 | Auth module: Phone OTP + JWT + Refresh tokens | Backend | Auth API working |
| D3 | Auth module: Google OAuth + Apple Sign-In | Backend | Social auth working |
| D4 | Users module: Profile CRUD, role management, **tier system** | Backend | User APIs + tier logic |
| D4 | Middleware: Rate limiter, request logger, error handler, **tier-aware guards** | Backend | Production-ready middleware |
| D5 | CI/CD pipeline: GitHub Actions → ECR → ECS Fargate | CTO | Auto-deploy on merge to main |
| D5 | Cloudflare DNS + SSL + CDN setup | CTO | Domain + HTTPS |

**Milestone:** Auth system working, users can register/login via phone OTP, tiered permission system active

### Week 2: Social Features — Posts, Feed & Social Graph

| Day | Task | Owner | Output |
|-----|------|-------|--------|
| D1 | **Posts module: Create, Read, Update, Delete with tier-aware permissions** | Backend | Post CRUD APIs |
| D1 | **Post types: Text, Image, Video, Poll, Listing Post** | Backend | Multi-type post creation |
| D2 | **Post approval workflow: Auto-approve (Tier 2), queue for review (Tier 3), block (Tier 4)** | Backend | Approval pipeline |
| D2 | **Moderation module: AI text analysis + rules engine (Stage 1 & 2)** | Backend | AI moderation for text |
| D3 | **Social graph module: Follow/unfollow, block/unblock, followers/following lists** | Backend | Social graph APIs |
| D3 | **Likes module: Like/unlike posts and comments, like counts, like lists** | Backend | Like system |
| D4 | **Comments module: Create, reply (threaded), edit, delete, pin** | Backend | Comment system |
| D4 | **Shares module: In-app reshare, external share link generation** | Backend | Share system |
| D5 | **Feed module: 3-tab architecture — For You (algorithmic), Following (chronological), Videos (watch-time-based)** | Backend | 3 feed endpoints |
| D5 | **Feed: Videos tab endpoint with own ranking algorithm (watch time + engagement)** | Backend | Videos feed API |

**Milestone:** Core social features working — users can post, comment, like, follow, and see 3 distinct feeds (For You / Following / Videos)

### Week 3: Groups, Listings & Communication

| Day | Task | Owner | Output |
|-----|------|-------|--------|
| D1 | **Groups module: Create, join, leave, manage group settings** | Backend | Group CRUD APIs |
| D1 | **Groups: Neighborhood auto-groups, topic groups, member roles** | Backend | Group management |
| D2 | **Groups: Group feed (posts within group), pinned posts, rules** | Backend | Group feed logic |
| D2 | Listings module: Create, Read, Update, Delete (as a special post type) | Backend | Listing CRUD APIs |
| D3 | Listings: Geo queries with PostGIS (nearby, within radius, polygon) | Backend | Location-based search |
| D3 | Listings: Filtering (type, price range, bedrooms, area, finishing) | Backend | Filter APIs |
| D4 | Video module: Mux integration, TUS resumable upload | Backend | Video upload working |
| D4 | Video module: Webhook for transcode, thumbnail generation | Backend | Video pipeline complete |
| D5 | Chat module: Conversations CRUD, WebSocket gateway, real-time messaging | Backend | Chat working |
| D5 | Chat module: Typing indicators, read receipts, **DM + listing chat** | Backend | Full chat system |

**Milestone:** Groups working, listings as post type, video upload, chat system

### Week 4: Trust, Notifications, Search & Moderation

| Day | Task | Owner | Output |
|-----|------|-------|--------|
| D1 | **Reputation module: Quality scoring, trust score, tier auto-promotion** | Backend | Reputation engine |
| D1 | **Reports module: Report posts/comments/users, report categories** | Backend | Report system |
| D2 | Reviews module: Create, list, aggregate ratings | Backend | Review system |
| D2 | **AI moderation pipeline: Stage 3 (media analysis) — image/video screening** | Backend | Full AI moderation |
| D3 | Notification module: Push (FCM), SMS, in-app (social + listing + approval) | Backend | Multi-channel notifications |
| D3 | Notification module: **Batching (likes), immediate (comments/approvals)** | Backend | Smart notification delivery |
| D4 | Search module: Meilisearch integration — **posts, users, groups, hashtags, listings** | Backend | Unified search |
| D4 | Search module: Autocomplete, trending hashtags, saved searches | Backend | Search UX complete |
| D5 | **Hashtag module: Parse from posts, trending calculation, hashtag feeds** | Backend | Hashtag system |
| D5 | **Moderation admin APIs: Approve/reject queue, bulk actions, auto-rules** | Backend | Admin moderation tools |

**Milestone:** Trust & reputation system, AI moderation pipeline, unified search, hashtags

### Week 5: Payments, Admin & Backend Polish

| Day | Task | Owner | Output |
|-----|------|-------|--------|
| D1 | Payment module: Paymob integration (card + Fawry + VF Cash) | Backend | Payment processing |
| D1 | Payment module: Subscription management, **promoted posts billing** | Backend | Monetization APIs |
| D2 | Admin module: User management, **post moderation queue**, listing moderation | Backend | Admin APIs |
| D2 | Admin module: **Group management, contributor verification queue** | Backend | Admin controls |
| D3 | Analytics module: View tracking, engagement events, **social metrics** | Backend | Analytics pipeline |
| D3 | BullMQ setup: **Post approval queue, AI moderation queue, notification queue, trending recalc** | Backend | Background jobs |
| D4 | API documentation: Swagger/OpenAPI auto-generation | Backend | API docs |
| D4 | Security audit: Rate limiting, input validation, **permission escalation tests** | CTO | Security checklist passed |
| D5 | Load testing: k6 scripts for critical paths (**feed, post creation, social graph**) | CTO | Performance baseline |
| D5 | Seed data: **100+ posts, 50 listings, 10 groups, 20 users with follows** | Backend | Demo data |

**Milestone:** Complete backend API ready for frontend integration — all social + listing + moderation features

---

## 3. Phase 2: MVP Frontend & Social UX (Weeks 6-9)

### Week 6: Core Frontend, Auth & Social Feed

| Day | Task | Owner | Output |
|-----|------|-------|--------|
| D1 | Next.js setup: App Router, Tailwind, shadcn/ui, next-intl (AR/EN) | Frontend | Frontend scaffolding |
| D1 | Design system: Colors, typography, components in Storybook | Frontend | UI component library |
| D2 | PWA setup: Service worker, manifest, install prompt | Frontend | PWA installable |
| D2 | Auth flow: Phone OTP login, Google OAuth, **social onboarding (follow interests, follow people, tier explanation)** | Frontend | Auth + onboarding E2E |
| D3 | Layout: Bottom navigation (**Home, Search, Create, Groups, Me**), RTL support, dark mode | Frontend | App shell ready |
| D3 | **PostCard component: Text post, image post, video post, listing post, poll** | Frontend | Core content card |
| D4 | **3-tab feed: "For You" (algorithmic card feed) + "Following" (chronological card feed) + tab switcher** | Frontend | 2 of 3 tabs working |
| D4 | **"Videos" tab: Full-screen vertical video player, swipe up/down, autoplay, TikTok-style overlay (like/comment/share/author)** | Frontend | Videos (Reels) tab working |
| D5 | **Like, comment count, share button, follow/unfollow across all 3 tabs** | Frontend | Feed engagement UX |
| D5 | **Post detail view: Full post, comments (threaded), pinned comments** | Frontend | Post detail page |

**Milestone:** Users can browse all 3 tabs (For You / Following / Videos Reels), like/comment, RTL working

### Week 7: Post Creation, Groups & Social Profile

| Day | Task | Owner | Output |
|-----|------|-------|--------|
| D1 | **Post composer: Tier-aware flow (Publish vs Submit for Approval)** | Frontend | Post creation working |
| D1 | **Post composer: Text, image upload, video record/upload, location, hashtags** | Frontend | Multi-type posting |
| D2 | **Approval status UX: Pending/Approved/Rejected dashboard for Tier 3 users** | Frontend | Approval flow complete |
| D2 | **AI writing assistant: "Improve my text" button in post composer** | Frontend | AI-assisted content |
| D3 | **Groups directory: My groups, discover, neighborhood groups, topic groups** | Frontend | Group browsing |
| D3 | **Group detail: Group feed, members, about, join/leave, post in group** | Frontend | Group interaction |
| D4 | **Social profile: Avatar, cover photo, bio, followers/following, posts tab, listings tab** | Frontend | Profile pages |
| D4 | **Profile: Tier progress bar, reputation score, verification CTA** | Frontend | Tier gamification UX |
| D5 | **Notifications center: All/Social/Listings/Approvals tabs, batched likes, immediate comments** | Frontend | Notification UX |
| D5 | **Follow suggestions, "People you might know" component** | Frontend | Social graph growth UX |

**Milestone:** Full social UX — post creation (tier-aware), groups, profiles, notifications

### Week 8: Listings, Search, Chat & Payments

| Day | Task | Owner | Output |
|-----|------|-------|--------|
| D1 | Listing detail view: Media carousel, specs, map, agent info, **discussion/comments** | Frontend | Listing detail page |
| D1 | Listing creation form: Property details, map pin, video upload, **post as listing** | Frontend | Listing creation |
| D2 | **Unified search: Posts, listings, users, groups, hashtags with tab filters** | Frontend | Search experience |
| D2 | Listing search: Filter bottom sheet (type, price, location, bedrooms, etc.) | Frontend | Listing filter UI |
| D3 | Map view: Mapbox integration, property pins, cluster markers | Frontend | Map-based browsing |
| D3 | Saved searches + bookmarked posts/listings | Frontend | Save/bookmark flow |
| D4 | Chat: Conversation list (**listing chats + direct messages**), real-time messaging | Frontend | Chat working E2E |
| D4 | Chat: Template messages, listing context card, read receipts | Frontend | Chat UX complete |
| D5 | Payment flow: Boost listing, **promote post**, subscription purchase | Frontend | Payment integration |
| D5 | **Contributor Pro/Expert subscription purchase flow** | Frontend | Social monetization UI |

**Milestone:** Full buyer + seller + contributor flow (browse, post, search, chat, pay)

### Week 9: Admin, Moderation & Polish

| Day | Task | Owner | Output |
|-----|------|-------|--------|
| D1 | **Admin panel: Post moderation queue (approve/reject with reason)** | Frontend | Post moderation tool |
| D1 | **Admin panel: User tier management, verification requests queue** | Frontend | User admin tools |
| D2 | Admin panel: Listing moderation, **group management, reported content** | Frontend | Full admin portal |
| D2 | Admin panel: **Analytics dashboard (social metrics, content metrics, moderation stats)** | Frontend | Admin analytics |
| D3 | Agent dashboard: Lead management, listing analytics, earnings | Frontend | Agent tools |
| D3 | **Moderation dashboard: AI auto-scores, manual review queue, bulk actions** | Frontend | Moderation workflow |
| D4 | Responsive design QA: Mobile, tablet, desktop layouts | Frontend | Responsive |
| D4 | RTL polish: Full Arabic layout review, bidirectional text handling | Frontend | Arabic UX perfect |
| D5 | Performance optimization: Skeleton loading, optimistic updates (likes, follows) | Frontend | Fast perceived performance |
| D5 | Accessibility review: Touch targets, contrast, screen reader support | Frontend | WCAG 2.1 AA |

**Milestone:** Full platform ready for QA testing — social + listings + moderation admin

---

## 4. Phase 3: QA, Beta & Launch (Weeks 10-12)

### Week 10: Testing & Bug Fixing

| Day | Task | Owner | Output |
|-----|------|-------|--------|
| D1 | E2E testing: Playwright tests for critical user journeys (**post creation, approval, feed, groups**) | QA/Dev | Automated E2E tests |
| D1 | Unit testing: Backend services + frontend hooks (80% coverage) | QA/Dev | Unit test suite |
| D2 | Performance testing: Lighthouse audit, **feed load times**, API latency | CTO | Performance report |
| D2 | Low-bandwidth testing: 3G simulation, data saver mode | QA/Dev | Works on slow connections |
| D3 | Security testing: OWASP top 10, auth flow, **tier escalation prevention** | CTO | Security audit passed |
| D3 | **Moderation testing: Verify AI pipeline catches spam, inappropriate content** | QA/Dev | Moderation accuracy report |
| D4 | Arabic UX testing: Native Arabic speakers review all flows (**posts, groups, comments**) | UX | Arabic UX sign-off |
| D4 | **Permission testing: Verify each tier sees correct UI (Tier 2/3/4/5)** | QA/Dev | Tier permission sign-off |
| D5 | Bug fixing sprint: Address all critical/high bugs | All | Bug-free critical paths |

### Week 11: Content Seeding & Beta

| Day | Task | Owner | Output |
|-----|------|-------|--------|
| D1 | **Verified contributor onboarding: 20-30 real estate experts as launch contributors** | Marketing | Verified contributor base |
| D1 | **Content seeding: 100+ quality posts (tips, insights, area guides) from seed contributors** | Marketing | Feed has rich content |
| D2 | **Group creation: Launch 20 neighborhood groups + 10 topic groups with seed content** | Marketing | Active groups at launch |
| D2 | Agent onboarding: 30 pre-registered agents upload first listings | Marketing | 100+ real listings |
| D3 | Beta testing: Invite 200 users (friends, family, beta waitlist) | Marketing | First real users |
| D3 | Feedback collection: In-app feedback widget, user interviews | UX | User feedback |
| D4 | Critical bug fixes from beta feedback | All | Bugs fixed |
| D5 | **Moderation team training: Train 2-3 moderators on approval queue workflow** | Marketing | Moderation team ready |

### Week 12: Launch

| Day | Task | Owner | Output |
|-----|------|-------|--------|
| D1 | Staging deployment: Full environment mirror of production | CTO | Staging live |
| D2 | Production deployment: Final deploy with monitoring | CTO | Production live |
| D2 | Monitoring setup: Sentry, CloudWatch alarms, uptime checks | CTO | Observability ready |
| D3 | **Moderation dry-run: Process 50+ real posts through approval pipeline** | All | Moderation flow validated |
| D4 | Final pre-launch checklist sign-off | All | Launch ready |
| D5 | **🚀 PUBLIC LAUNCH** | All | **Beitco is live!** |

**Launch Checklist (v3.0):**
- [ ] All critical APIs respond < 200ms
- [ ] Social feed loads first 10 posts < 2s
- [ ] OTP delivery works reliably
- [ ] **Post creation → approval → publish flow works end-to-end**
- [ ] **AI moderation pipeline processing posts correctly**
- [ ] **Tier permissions enforced (Tier 2 direct post, Tier 3 submit, Tier 4 read-only)**
- [ ] **Groups with seed content and active moderators**
- [ ] Payment processing tested with real transactions
- [ ] Cloudflare WAF rules active
- [ ] Backup and recovery tested
- [ ] Terms of service and privacy policy published (include **community guidelines**)
- [ ] App store listings prepared (PWA install + app store later)
- [ ] Social media accounts ready with launch content
- [ ] Customer support channel active (WhatsApp + in-app)
- [ ] Analytics tracking verified (PostHog events firing)
- [ ] Error tracking verified (Sentry capturing errors)
- [ ] **20+ verified contributors active and posting**
- [ ] **Moderation team on standby for launch volume**

---

## 5. Phase 4: Growth & Community Building (Weeks 13-16)

### Week 13-14: Post-Launch Optimization

| Priority | Task | Trigger |
|----------|------|---------|
| P0 | Fix any production bugs | User reports, Sentry |
| P0 | Monitor and optimize API performance (**feed, post creation, approval queue**) | CloudWatch metrics |
| P0 | **Tune AI moderation: Reduce false positives/negatives from launch data** | Moderation accuracy metrics |
| P1 | Implement user feedback from beta | User interviews |
| P1 | **Optimize feed algorithm: Tune weights based on engagement data** | Feed engagement metrics |
| P1 | A/B test onboarding flow (**follow interests vs skip, tier explanation**) | Conversion rates |
| P1 | **Reduce approval queue time: Optimize AI scoring to auto-approve more posts** | Avg. approval time |
| P2 | **Community analytics: Posts/day, comments/post, active groups** | Content health metrics |
| P2 | **Contributor spotlight feature: Weekly featured contributor on homepage** | Community engagement |

### Week 15-16: Feature Iteration

| Feature | Description | Priority |
|---------|-------------|----------|
| **Expert AMA sessions** | Scheduled Q&A sessions in groups with verified experts | P1 |
| **Polls in groups** | Group-specific polls for neighborhood decisions | P1 |
| **Post editing** | Allow editing published posts (with edit history) | P1 |
| **Bookmarks & collections** | Organize saved posts/listings into named collections | P1 |
| **Content tipping** | Let users tip helpful contributors | P1 |
| **Promoted posts** | Self-serve post promotion purchase flow | P1 |
| Video trimming | In-app video trim before upload | P2 |
| Draw-on-map search | Custom area search for listings | P2 |
| **Invite-only groups** | Premium groups with invite/request access | P2 |
| **Contributor Pro/Expert subscriptions** | Launch paid contributor tiers | P2 |

---

## 6. Phase 5: Scale & Expansion (Weeks 17+)

### 3-Month Goals (Months 5-7)

| Goal | Description | KPI |
|------|-------------|-----|
| **Geographic Expansion** | Expand from New Cairo/6th October to all of Cairo, Giza, Alexandria | 5 new district groups/month |
| **Agent Network Growth** | Scale from 50 to 500 verified agents | Agent sign-ups |
| **Community Scale** | 50+ active groups, 500+ daily posts | Posts/day, active groups |
| **Smart Feed v2** | ML-powered recommendation engine (content + social signals) | Engagement rate + 20% |
| **React Native App** | Native mobile app launch (iOS + Android) | App store rating > 4.5 |
| **Developer Partnerships** | 5 real estate developer partnerships (group sponsors) | Partnership revenue |
| **AI Enhancements** | Auto-captioning, auto-tagging, smart content suggestions | AI accuracy > 90% |

### 6-Month Goals (Months 8-12)

| Goal | Description | KPI |
|------|-------------|-----|
| **100K MAU** | Reach 100,000 monthly active users | MAU |
| **National Coverage** | All major Egyptian cities with local groups | 20+ cities, 200+ groups |
| **Mortgage Integration** | Bank partnerships for in-app pre-approval | Mortgage leads/month |
| **Live Discussions** | Audio rooms / live Q&A sessions in groups | Live sessions/week |
| **Natural Language Search** | "3 bedroom near AUC under 2M" → structured search | Search satisfaction |
| **Enterprise Dashboard** | Agency management with team analytics | Enterprise subscriptions |
| **Revenue Milestone** | Reach 650K EGP MRR | MRR |
| **Creator Economy** | 100+ contributors earning via tips/consultations | Creator revenue/month |

### 12-Month Goals (Year 2)

| Goal | Description | KPI |
|------|-------------|-----|
| **Market Leadership** | #1 social real estate platform in Egypt | Brand recognition |
| **500K MAU** | Half a million monthly active users | MAU |
| **Regional Expansion** | Saudi Arabia, UAE pilot (with localized groups) | New market launch |
| **Transaction Layer** | Escrow, digital contracts, commission on sales | Transaction revenue |
| **Property Valuation** | AI-powered automated valuation model (AVM) using community data | Valuation accuracy |
| **Data Products** | Market insights subscription for investors/developers | Data revenue |
| **Series A** | Raise $5-10M for regional expansion | Funding |
| **1M+ Posts** | Rich community-generated content library | Content volume |

---

## 7. Team & Resource Plan

### MVP Team (Weeks 1-12)

| Role | Count | Type | Focus |
|------|-------|------|-------|
| **CTO / Tech Lead** | 1 | Full-time | Architecture, DevOps, security, code review |
| **Senior Backend Engineer** | 1 | Full-time | NestJS APIs, database, **social features, moderation pipeline** |
| **Senior Frontend Engineer** | 1 | Full-time | Next.js, **social UX, tier-aware UI**, responsive design |
| **AI Assistant** | N/A | Tool | Code generation, component scaffolding, docs |

*Note: With AI-assisted development (Claude, Cursor, v0.dev), a team of 2-3 engineers can ship MVP in 12 weeks. The extra 3 weeks (vs v2.0's 9 weeks) are for social features.*

### Growth Team (Post-Launch)

| Role | Count | When | Focus |
|------|-------|------|-------|
| **Product Manager** | 1 | Week 13 | User research, feature prioritization, community health metrics |
| **UX/UI Designer** | 1 | Week 13 | Design system, user testing, A/B tests |
| **Content Moderator** | 2 | Week 11 | **Approval queue, post review, community management** |
| **Community Manager** | 1 | Week 12 | **Group seeding, contributor onboarding, AMAs** |
| **Junior Backend Engineer** | 1 | Week 15 | Feature development, bug fixes |
| **Junior Frontend Engineer** | 1 | Week 15 | Feature development, responsive QA |
| **Marketing / Growth** | 1 | Week 10 | Content, social media, partnerships |
| **Customer Support** | 1 (part-time) | Launch | User support, agent onboarding |

### Scale Team (Month 6+)

| Role | Count | Focus |
|------|-------|-------|
| **ML Engineer** | 1 | Recommendation engine, smart matching |
| **Mobile Engineer** | 1 | React Native app |
| **DevOps Engineer** | 1 | Infrastructure scaling, monitoring |
| **Content Moderator** | 2 | Manual review of flagged content |
| **Sales / Partnerships** | 1 | Developer partnerships, enterprise sales |

---

## 8. Risk Mitigation (v3.0)

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **Slow contributor adoption** | Medium | High | Seed 20-30 verified experts pre-launch, incentivize with Contributor Pro |
| **Low content quality (spam)** | High | High | AI moderation pipeline, approval queue for Tier 3, verified-only direct posting |
| **Moderation bottleneck** | Medium | High | AI auto-approve high-confidence posts, hire 2-3 moderators, community reporting |
| **Approval wait time too long** | Medium | Medium | Target < 1hr, AI speeds up queue, CTA to verify for instant posting |
| **Users confused by tiers** | Medium | Medium | Clear onboarding explanation, progress bar on profile, contextual tooltips |
| **"Empty feed" cold start** | High | High | Seed 100+ posts + 20 groups pre-launch, follow interests in onboarding |
| **Slow agent adoption** | Medium | High | Pre-launch onboarding, free tier, direct outreach |
| **Poor video quality from users** | High | Medium | Video guidelines, quality badges, auto-enhancement |
| **Egyptian internet reliability** | High | Medium | Low-bandwidth mode, offline caching, resumable uploads |
| **Fraud/fake accounts** | High | High | Phone verification required, AI behavior analysis, tier system limits exposure |
| **Payment integration delays** | Medium | Medium | Start Paymob integration early, have manual payment fallback |
| **Competition copying social features** | Medium | Low | First-mover in Egypt social + real estate, focus on network effects |
| **Server scaling issues** | Low | High | Auto-scaling from day 1, load testing, cache strategy |
| **Arabic NLP/moderation quality** | Medium | Medium | Fine-tune AI for Egyptian Arabic (عامية), manual moderation fallback |
| **Group toxicity / flame wars** | Medium | Medium | Group rules, auto-moderation, admin tools, community guidelines |
| **Team burnout (small team)** | Medium | High | Realistic 12-week timeline, AI tools for productivity, hire at growth phase |

---

## 9. Success Metrics & KPIs (v3.0)

### North Star Metric
**Weekly Active Users who create or engage with content** (post, comment, like, share, or inquire)

### KPI Dashboard

| Category | Metric | Target (Month 1) | Target (Month 6) | Target (Month 12) |
|----------|--------|------------------|-------------------|---------------------|
| **Growth** | MAU | 5,000 | 50,000 | 200,000 |
| **Growth** | New users/week | 500 | 3,000 | 8,000 |
| **Growth** | Verified contributors | 30 | 200 | 1,000 |
| **Growth** | Agent sign-ups | 50 | 300 | 1,000 |
| **Social** | Posts created/day | 20 | 500 | 3,000 |
| **Social** | Comments/day | 50 | 2,000 | 15,000 |
| **Social** | Likes/day | 200 | 10,000 | 80,000 |
| **Social** | Active groups | 30 | 100 | 500 |
| **Social** | Avg. follows per user | 3 | 12 | 25 |
| **Engagement** | Avg session duration | 3 min | 6 min | 9 min |
| **Engagement** | Posts viewed/session | 8 | 15 | 25 |
| **Engagement** | DAU/MAU ratio | 15% | 25% | 35% |
| **Content** | Listings published/week | 100 | 1,000 | 5,000 |
| **Content** | % posts with video | 20% | 35% | 45% |
| **Moderation** | Avg. approval time | 1 hr | 30 min | 15 min |
| **Moderation** | AI auto-approve rate | 30% | 60% | 80% |
| **Moderation** | Spam caught rate | 90% | 95% | 98% |
| **Transaction** | Inquiries/week | 200 | 3,000 | 15,000 |
| **Transaction** | Inquiry-to-visit rate | 5% | 10% | 15% |
| **Revenue** | MRR (EGP) | 27,000 | 350,000 | 1,200,000 |
| **Revenue** | Paying agents | 30 | 200 | 700 |
| **Revenue** | Social revenue (EGP/month) | 2,000 | 100,000 | 450,000 |
| **Quality** | App crash rate | < 1% | < 0.5% | < 0.1% |
| **Quality** | API p95 latency | < 500ms | < 300ms | < 200ms |
| **Quality** | Feed load time (p50) | < 2s | < 1.5s | < 1s |
| **Support** | Avg response time | 4 hrs | 2 hrs | 1 hr |

---

*This roadmap is designed to be aggressive but achievable. The 12-week MVP timeline (3 weeks longer than v2.0's 9-week plan) accounts for the social features scope increase. The key to hitting these timelines is disciplined scope management, heavy use of AI-assisted development, and seeding the community pre-launch.*
