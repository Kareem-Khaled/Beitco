# Beitco — AI Development Rules

> **Every AI assistant MUST read this file before writing any code.**

---

## 1. Before You Write Any Code

```
MANDATORY PRE-FLIGHT CHECKLIST:
1. Read .ai/ENTRY_PROMPT.md          → Understand the project
2. Read .ai/CURRENT_STATE.md         → Know what exists
3. Read .ai/ARCHITECTURE.md          → Know the stack and patterns
4. Read .ai/TASKS.md                 → Find your assigned task
5. Check the relevant source files   → Understand existing code
6. THEN and ONLY THEN → write code
```

**Never generate code based solely on a user's chat prompt.** Always cross-reference with project documentation first.

---

## 2. Tech Stack — Non-Negotiable

| Layer | Technology | DO NOT use alternatives |
|-------|-----------|------------------------|
| Backend | NestJS 11 + TypeScript | ❌ Express, Fastify, Hono |
| ORM | Prisma | ❌ TypeORM, Drizzle, Knex |
| Database | PostgreSQL 16 + PostGIS | ❌ MongoDB, MySQL, SQLite |
| Frontend | Next.js 15 (App Router) | ❌ Pages Router, Remix, Vite SPA |
| Styling | Tailwind CSS + shadcn/ui | ❌ MUI, Chakra, styled-components |
| State | Zustand | ❌ Redux, Jotai, MobX |
| Data Fetching | TanStack Query v5 | ❌ SWR, raw fetch, axios-only |
| Validation | Zod | ❌ Joi, Yup, class-validator |
| Video | Mux | ❌ Cloudflare Stream, AWS MediaConvert |
| Search | Meilisearch | ❌ Elasticsearch, Algolia |
| Cache | Redis (Upstash) | ❌ Memcached, in-memory only |
| Queue | BullMQ | ❌ Agenda, custom cron |
| Monorepo | Turborepo + pnpm | ❌ Lerna, Nx, yarn workspaces |
| Mobile | Capacitor 6.x (wraps Next.js) | ❌ React Native, Flutter, Expo (for MVP) |
| Auth | Phone OTP + JWT (access + refresh) | ❌ Sessions, Firebase Auth |
| Payments | Paymob | ❌ Stripe, PayPal |

---

## 3. Coding Standards

### 3.1 TypeScript Rules

```typescript
// ✅ DO
- Use strict TypeScript everywhere (strict: true in tsconfig)
- Use interfaces for DTOs and entities, types for unions/utilities
- Use enums only for fixed sets (roles, statuses). Prefer const objects + "as const"
- Export types from a shared `packages/types/` package
- Use Zod schemas for runtime validation, infer types from them

// ❌ DO NOT
- Never use `any`. Use `unknown` if type is truly unknown.
- Never use `@ts-ignore` or `@ts-expect-error` without a TODO comment
- Never duplicate types between frontend and backend — use shared package
- Never use relative imports across package boundaries — use `@beitco/types`
```

### 3.2 Naming Conventions

```
Files:
├── kebab-case for files         → post-approval.service.ts
├── PascalCase for components    → PostCard.tsx
├── camelCase for utilities      → formatPrice.ts
└── UPPER_SNAKE for constants    → MAX_POST_LENGTH

Code:
├── camelCase for variables      → const postCount = 5
├── camelCase for functions      → function getPostById()
├── PascalCase for classes       → class PostService
├── PascalCase for interfaces    → interface CreatePostDto
├── PascalCase for types         → type PostStatus = 'published' | 'pending'
├── UPPER_SNAKE for env vars     → DATABASE_URL
└── camelCase for DB columns     → created_at → createdAt (Prisma maps)

NestJS modules:
├── Module file                  → posts.module.ts
├── Controller                   → posts.controller.ts
├── Service                      → posts.service.ts
├── Guard                        → tier-permission.guard.ts
├── Decorator                    → @CurrentUser()
├── DTO                          → create-post.dto.ts
└── Spec file                    → posts.service.spec.ts
```

### 3.3 API Response Format

Every API response MUST follow this structure:

```typescript
// Success
{
  "success": true,
  "data": { ... },
  "meta": {                    // Only for paginated responses
    "page": 1,
    "limit": 20,
    "total": 142,
    "hasMore": true
  }
}

// Error
{
  "success": false,
  "error": {
    "code": "POST_NOT_FOUND",
    "message": "Post not found",              // English
    "messageAr": "المنشور غير موجود",          // Arabic
    "statusCode": 404
  }
}
```

### 3.4 Error Codes

Use structured error codes with this pattern: `{MODULE}_{ACTION}_{REASON}`

```
AUTH_OTP_EXPIRED
AUTH_TOKEN_INVALID
POST_CREATE_TIER_INSUFFICIENT
POST_CREATE_CONTENT_EMPTY
POST_APPROVE_NOT_PENDING
USER_FOLLOW_SELF
USER_FOLLOW_BLOCKED
GROUP_JOIN_PRIVATE
GROUP_POST_NOT_MEMBER
MODERATION_FLAG_SPAM
```

---

## 4. Architecture Rules

### 4.1 Backend (NestJS) Patterns

```
Every feature module MUST have:
├── {feature}.module.ts          → Module definition
├── {feature}.controller.ts      → HTTP endpoints only (no business logic)
├── {feature}.service.ts         → Business logic only
├── dto/
│   ├── create-{feature}.dto.ts  → Zod schema + inferred type
│   ├── update-{feature}.dto.ts
│   └── {feature}-query.dto.ts   → Query/filter params
├── entities/
│   └── {feature}.entity.ts      → Prisma-derived types + any extensions
└── {feature}.service.spec.ts    → Unit tests

Rules:
- Controllers NEVER contain business logic — delegate to services
- Services NEVER import other controllers — only other services
- Guards handle authorization — services handle business rules
- Use @CurrentUser() decorator to get authenticated user, NEVER parse JWT in services
- Use TierGuard(@MinTier(2)) for permission checks
- Pagination: always use cursor-based for feeds, offset for admin lists
```

### 4.2 Frontend (Next.js) Patterns

```
Every page/feature MUST follow:
├── app/[locale]/(main)/{feature}/page.tsx    → Server component (data fetch)
├── components/{feature}/
│   ├── {Feature}Container.tsx                → Client component with logic
│   ├── {Feature}Card.tsx                     → Presentational component
│   └── {Feature}Skeleton.tsx                 → Loading skeleton
├── hooks/
│   └── use{Feature}.ts                       → TanStack Query hooks
├── stores/
│   └── {feature}.store.ts                    → Zustand store (if needed)
└── lib/
    └── {feature}.api.ts                      → API client functions

Rules:
- Server Components by default. Add "use client" ONLY when needed (state, effects, browser APIs)
- All data fetching via TanStack Query hooks — NEVER fetch in useEffect
- Optimistic updates for likes, follows, saves (update UI immediately, rollback on error)
- All text must use next-intl t() function — NEVER hardcode Arabic or English strings
- All images use next/image with width/height — NEVER use <img>
- RTL support: use logical properties (ms-, me-, ps-, pe-) NOT left/right
```

### 4.3 Mobile (Capacitor) Patterns

```
Rules:
- NEVER import Capacitor plugins at module level — use dynamic imports
- ALWAYS provide web fallbacks for every native feature
- Use the platform detection helper from lib/capacitor.ts
- Test on web, iOS Simulator, and Android Emulator

Pattern for native features:
┌──────────────────────────────────────────────────┐
│ import { Capacitor } from '@capacitor/core';     │
│                                                   │
│ if (Capacitor.isNativePlatform()) {              │
│   // Use native plugin                            │
│   const { Camera } = await import('@cap/camera'); │
│   await Camera.getPhoto({ ... });                │
│ } else {                                          │
│   // Use web fallback (HTML input, Web APIs)     │
│   fileInputRef.current?.click();                  │
│ }                                                 │
└──────────────────────────────────────────────────┘

Files:
├── lib/capacitor.ts          → Platform detection helpers (isNative, isIOS, isAndroid)
├── hooks/useNativeFeatures.ts → Hook wrapping all native plugins with web fallbacks
└── capacitor.config.ts        → App ID, server URL, plugin configs
```

### 4.4 Database Rules

```
- All tables use UUID primary keys (gen_random_uuid())
- All tables have created_at (default NOW()) and updated_at (auto-update)
- Denormalized counters (like_count, follower_count, etc.) updated via triggers or service logic
- Use database transactions for multi-table writes
- Use Prisma's $transaction for atomic operations
- NEVER delete data physically — use soft delete (status = 'deleted') or move to archive
- All foreign keys have ON DELETE CASCADE or ON DELETE SET NULL — explicitly defined
- Indexes: every FK must be indexed. Every query filter must have an index.
```

### 4.5 Permission Tier Enforcement

```
CRITICAL: Every endpoint that creates or modifies content MUST check permission tier.

Tier 1 (Admin):       Full access to everything
Tier 2 (Verified):    Create posts (direct publish), videos, polls, listings, groups
Tier 3 (Member):      Create posts (approval required), text + image only, comments
Tier 4 (New User):    Read-only, like, save, follow. Cannot post or comment.
Tier 5 (Restricted):  Read-only, no interactions. Account under review.

Implementation:
- Use @MinTier(N) decorator on controller methods
- TierGuard reads user.permissionTier from JWT payload
- Frontend uses useTier() hook to conditionally render UI
- NEVER rely on frontend-only checks — backend MUST enforce
```

---

## 5. How to Add a New Feature

Follow this exact process:

```
Step 1: Define the feature in TASKS.md
   └── Write a clear task with acceptance criteria

Step 2: Create/update Prisma schema (if DB change needed)
   └── npx prisma migrate dev --name add-{feature}
   └── Update DB_SCHEMA.md

Step 3: Create shared types in packages/types/
   └── DTOs, enums, interfaces

Step 4: Build backend module
   └── Module → Service → Controller → DTOs → Guards
   └── Write unit tests for service
   └── Update API_SPEC.md with new endpoints

Step 5: Build frontend
   └── API client → Hook → Component → Page
   └── Use TanStack Query for data fetching
   └── Add i18n strings for Arabic + English

Step 6: Test E2E
   └── Write Playwright test for the happy path

Step 7: Update documentation
   └── Update CURRENT_STATE.md
   └── Mark task complete in TASKS.md
   └── Log in .ai/SESSION_LOG.md
```

---

## 6. How to Modify Existing Code

```
BEFORE modifying any existing file:
1. Read the ENTIRE file first (don't just read the function you're changing)
2. Understand what imports depend on this file (check usages)
3. Check if the file has tests — update them too
4. Make the minimum change needed — don't refactor unrelated code
5. Preserve all existing error handling, logging, and validation
6. If you're changing a DTO/type — check both frontend and backend usage

AFTER modifying:
1. Run type check: pnpm type-check
2. Run tests: pnpm test
3. Run lint: pnpm lint
4. Update CURRENT_STATE.md if a feature's status changed
5. Log what you changed in SESSION_LOG.md
```

---

## 7. File Organization Rules

### Monorepo Structure

```
beitco/
├── apps/
│   ├── api/                     # NestJS backend
│   │   ├── src/
│   │   │   ├── modules/         # Feature modules (auth, posts, groups, etc.)
│   │   │   ├── common/          # Shared guards, decorators, filters, pipes
│   │   │   ├── config/          # Environment config, validation
│   │   │   └── main.ts
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   └── test/                # E2E tests
│   │
│   └── web/                     # Next.js frontend
│       ├── src/
│       │   ├── app/             # App Router pages
│       │   ├── components/      # React components
│       │   ├── hooks/           # Custom hooks
│       │   ├── stores/          # Zustand stores
│       │   ├── lib/             # API clients, utilities, capacitor helpers
│       │   ├── messages/        # i18n JSON (ar.json, en.json)
│       │   └── styles/          # Global styles, Tailwind config
│       ├── ios/                 # Capacitor iOS shell (auto-generated)
│       ├── android/             # Capacitor Android shell (auto-generated)
│       ├── capacitor.config.ts  # Capacitor configuration
│       └── public/
│
├── packages/
│   ├── types/                   # Shared TypeScript types/interfaces
│   │   ├── src/
│   │   │   ├── auth.ts
│   │   │   ├── posts.ts
│   │   │   ├── users.ts
│   │   │   ├── groups.ts
│   │   │   ├── listings.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── validators/              # Shared Zod schemas
│   │   ├── src/
│   │   │   ├── post.schema.ts
│   │   │   ├── user.schema.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── utils/                   # Shared utilities
│       ├── src/
│       │   ├── format-price.ts
│       │   ├── arabic-utils.ts
│       │   └── index.ts
│       └── package.json
│
├── .ai/                         # AI development docs (THIS FOLDER)
├── docs/                        # Detailed planning docs (human-oriented)
├── turbo.json
├── pnpm-workspace.yaml
├── .cursorrules                 # Cursor AI rules (symlinked from .ai/)
├── .github/
│   ├── copilot-instructions.md  # GitHub Copilot rules
│   └── workflows/
│       └── ci.yml
└── README.md
```

---

## 8. Language & Localization Rules

```
- ALL user-facing text MUST go through next-intl (frontend) or i18n service (backend)
- Arabic is the PRIMARY language — design Arabic first, then English
- Use RTL-aware CSS: margin-inline-start, padding-inline-end, etc.
- Dates: use Hijri calendar option alongside Gregorian
- Numbers: support both Arabic-Indic (١٢٣) and Western (123) — user preference
- Currency: always EGP, formatted as "1,500,000 ج.م" or "1,500,000 EGP"
- Phone: always +20 prefix, 10-digit Egyptian mobile
- Addresses: in Arabic by default, optional English transliteration
```

---

## 9. Testing Rules

```
Required test coverage:
├── Backend services: 80%+ unit test coverage
├── Controllers: Integration tests for auth + permissions
├── Critical paths: E2E tests (Playwright)
│   ├── Login via OTP
│   ├── Create post (Tier 2 direct, Tier 3 approval)
│   ├── Like, comment, share
│   ├── Follow/unfollow
│   ├── Search (listing + post + user)
│   ├── Group join + post in group
│   └── Admin: approve/reject post
└── Frontend components: Snapshot tests for key UI (PostCard, VideoPlayer)

Test naming: describe('PostService') → it('should reject post from Tier 4 user')
```

---

## 10. Git & Version Control Rules

```
Branch naming:
├── feature/{task-id}-{short-description}    → feature/T-012-post-creation
├── fix/{task-id}-{short-description}        → fix/T-045-like-count-bug
├── chore/{description}                      → chore/update-dependencies

Commit messages (Conventional Commits):
├── feat(posts): add post creation with tier-aware approval
├── fix(feed): fix infinite scroll not loading next page
├── refactor(auth): extract OTP service into separate module
├── docs: update API_SPEC with new group endpoints
├── test(posts): add unit tests for post approval flow
├── chore: update prisma to 6.x

Pull request rules:
├── Every PR must reference a task ID from TASKS.md
├── Every PR must pass CI (lint + type-check + tests)
├── Every PR must have a description explaining WHAT and WHY
├── Backend changes must include/update tests
├── DB migrations must be reviewed for data safety
```

---

## 11. Security Rules

```
NEVER:
- Log sensitive data (passwords, tokens, OTPs, payment info)
- Store OTPs in plain text (hash with bcrypt)
- Return full user objects in API responses (select specific fields)
- Trust client-side input (always validate with Zod on backend)
- Allow tier escalation without backend verification
- Expose internal error messages to clients (use error codes)
- Use eval(), innerHTML, or dangerouslySetInnerHTML with user content

ALWAYS:
- Sanitize user-generated HTML/text (DOMPurify for frontend, sanitize-html for backend)
- Rate limit all endpoints (stricter for Tier 4/5)
- Use parameterized queries (Prisma handles this)
- Validate file uploads (type, size, dimensions)
- Check ownership before update/delete (user can only edit their own posts)
- Log all admin actions with user ID and timestamp
```

---

*Last updated: April 7, 2026. Update this file when adding new rules or patterns.*
