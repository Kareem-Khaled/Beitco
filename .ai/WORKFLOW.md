# Beitoon  -  AI Workflow Guide

> **How to go from idea → task → implementation → documentation update.**

---

## 1. Session Startup Protocol

Every AI session should start with:

```
1. Read `.ai/ENTRY_PROMPT.md`  -  get full project context (30 seconds)
2. Read `.ai/CURRENT_STATE.md`  -  know what's done and what's not
3. Read `.ai/TASKS.md`  -  find the next task to work on
4. Check `.ai/SESSION_LOG.md`  -  see what the last session did
5. Ask: "What would you like to work on?" (or continue from task board)
```

---

## 2. Task Lifecycle

### 2.1 Creating a New Task

```
1. User describes feature/fix
2. AI breaks it into atomic tasks
3. Each task gets:
   - T-XXX ID (next sequential)
   - Priority (P0/P1/P2)
   - Dependencies
   - File list
   - Acceptance criteria
4. Add to `.ai/TASKS.md`
```

### 2.2 Working on a Task

```
1. Pick task from TASKS.md (highest priority, all deps met)
2. Mark status: 🟡 In Progress
3. Read relevant docs:
   - `.ai/API_SPEC.md` for endpoint schemas
   - `.ai/DB_SCHEMA.md` for table structure
   - `.ai/AI_RULES.md` for coding standards
   - `.ai/ARCHITECTURE.md` for module structure
4. Implement the task
5. Test the implementation
6. Mark status: 🟢 Done
7. Update `.ai/CURRENT_STATE.md`
8. Log in `.ai/SESSION_LOG.md`
```

### 2.3 Implementation Checklist (Per Task)

```
□ Read the task's acceptance criteria
□ Check dependencies are completed
□ Create/modify files listed in the task
□ Follow AI_RULES.md coding standards
□ Add Arabic translations for any user-facing strings
□ Write unit tests for service methods
□ Verify no TypeScript errors
□ Test API endpoints manually (curl/Insomnia)
□ Update CURRENT_STATE.md module status
□ Log session work
```

---

## 3. Feature Implementation Flow

### Backend Feature (NestJS Module)

```
Step 1: DTO
├── Create `dto/create-*.dto.ts` with class-validator
├── Create `dto/update-*.dto.ts` (PartialType)
└── Create `dto/query-*.dto.ts` (for filters/pagination)

Step 2: Service
├── Create `*.service.ts`
├── Inject PrismaService
├── Implement CRUD methods
├── Add tier checks where needed
├── Add Redis caching for counts
└── Emit events for notifications

Step 3: Controller
├── Create `*.controller.ts`
├── Add route decorators
├── Add @Public() for open routes (everything else is auth by default)
├── Add @UseGuards(AdminGuard) for admin-only; owner/participant checks live in the service
├── Add @ApiTags, @ApiOperation (Swagger)
└── Use standard ApiResponse format

Step 4: Module
├── Create `*.module.ts`
├── Import PrismaModule
├── Register service and controller
└── Export service (if used by other modules)

Step 5: Test
├── Create `*.service.spec.ts`
├── Mock PrismaService
└── Test business logic
```

### Frontend Feature (Next.js)

```
Step 1: Types
├── Import types from @beitoon/types
└── Create component-specific types if needed

Step 2: API Hook
├── Create custom hook in `hooks/use-*.ts`
├── Use SWR or React Query
├── Handle loading, error, data states
└── Include optimistic updates for mutations

Step 3: Component
├── Create component in appropriate folder
├── Use shadcn/ui primitives
├── Add RTL support (use logical properties)
├── Add loading skeleton
└── Add error state

Step 4: Page
├── Create page in `app/[locale]/(app)/...`
├── Add metadata (title, description)
├── Compose components
└── Handle auth redirect if needed

Step 5: i18n
├── Add Arabic strings to `i18n/ar.json`
├── Add English strings to `i18n/en.json`
└── Use translation hook in components
```

---

## 4. Code Modification Flow

### Before Modifying Existing Code

```
1. Read the file completely
2. Understand all imports and exports
3. Check who uses this code (grep for imports)
4. Make the change
5. Fix all broken imports/types
6. Run tests
7. Check for side effects
```

### Modifying a Database Table

```
1. Update `.ai/DB_SCHEMA.md` first
2. Update `prisma/schema.prisma`
3. Run `pnpm prisma migrate dev --name <description>`
4. Update affected DTOs
5. Update affected services
6. Update affected types in @beitoon/types
7. Update `.ai/API_SPEC.md` if response shape changed
```

### Modifying an API Endpoint

```
1. Update `.ai/API_SPEC.md` first
2. Update DTO (request validation)
3. Update Service (business logic)
4. Update Controller (route handler)
5. Update @beitoon/types (response type)
6. Update frontend API hook
7. Update frontend component
```

---

## 5. Documentation Update Protocol

### After Every Session

Update these files:

| File | What to Update |
|------|---------------|
| `CURRENT_STATE.md` | Module status (not started → in progress → done) |
| `TASKS.md` | Task status (🔴 → 🟡 → 🟢) |
| `SESSION_LOG.md` | Add session entry with what was done |

### After Major Changes

| File | When to Update |
|------|---------------|
| `ARCHITECTURE.md` | New module, new package, infrastructure change |
| `API_SPEC.md` | New endpoint, changed request/response schema |
| `DB_SCHEMA.md` | New table, new column, changed index |
| `AI_RULES.md` | New coding pattern, new convention |
| `ROADMAP.md` | Phase dates change, scope change |

---

## 6. Session Logging

### Session Log Format

```markdown
## Session YYYY-MM-DD  -  [Summary]

**Duration:** ~X hours
**Tasks Worked On:** T-XXX, T-XXX
**AI Assistant:** [Cursor/Copilot/Claude/etc.]

### What Was Done
- Created `path/to/file.ts`  -  description
- Modified `path/to/file.ts`  -  what changed
- Fixed bug in X  -  details

### Decisions Made
- Chose X over Y because Z
- Changed approach for X because Y

### Blockers / Open Questions
- Need to decide on X
- Waiting for Y

### Next Steps
- Continue with T-XXX
- Start T-XXX after dependency is done
```

---

## 7. Git Workflow

### Branch Naming

```
feature/T-001-monorepo-scaffolding
feature/T-008-posts-module
fix/T-008-posts-validation-error
chore/update-dependencies
```

### Commit Messages

```
feat(posts): add post creation endpoint (T-008)
fix(auth): handle expired OTP gracefully (T-006)
chore(prisma): add missing index on posts.created_at
docs: update API_SPEC with new post fields
test(posts): add unit tests for PostsService
```

### PR Checklist

```
□ Task ID referenced in PR title
□ All acceptance criteria met
□ Tests pass
□ No TypeScript errors
□ Arabic translations added
□ CURRENT_STATE.md updated
□ API_SPEC.md updated (if API changed)
□ DB_SCHEMA.md updated (if schema changed)
```

---

## 8. Environment Setup

### First Time Setup

```bash
# 1. Clone and install
git clone <repo-url>
cd beitco
pnpm install

# 2. Start infrastructure
docker compose up -d

# 3. Setup database
cp .env.example .env  # fill in values
pnpm prisma migrate dev
pnpm prisma db seed

# 4. Start development
pnpm dev  # starts both api (3001) and web (3000)
```

### Required Environment Variables

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/beitco

# Redis
REDIS_URL=redis://localhost:6379

# Meilisearch
MEILISEARCH_URL=http://localhost:7700
MEILISEARCH_KEY=masterKey

# Auth
JWT_SECRET=<random-64-chars>
JWT_REFRESH_SECRET=<random-64-chars>
OTP_SECRET=<random-32-chars>

# Mux
MUX_TOKEN_ID=<from-mux-dashboard>
MUX_TOKEN_SECRET=<from-mux-dashboard>
MUX_WEBHOOK_SECRET=<from-mux-dashboard>

# Paymob
PAYMOB_API_KEY=<from-paymob>
PAYMOB_IFRAME_ID=<from-paymob>

# Google OAuth
GOOGLE_CLIENT_ID=<from-google-console>

# Apple OAuth
APPLE_CLIENT_ID=<from-apple-developer>
APPLE_TEAM_ID=<from-apple-developer>
APPLE_KEY_ID=<from-apple-developer>

# FCM (Push Notifications)
FCM_PROJECT_ID=<from-firebase>
FCM_PRIVATE_KEY=<from-firebase>
FCM_CLIENT_EMAIL=<from-firebase>
```

---

*This workflow is designed for AI assistants but works for human developers too.*
