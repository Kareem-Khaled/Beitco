# Beitco  -  GitHub Copilot Instructions

## Project Context
Beitco is a **trust-first housing marketplace for Egypt that rents at the bed level** (not just the apartment level). Three inventory types: شقة (apartment) / أوضة (private room) / سرير (bed in shared room). Trust is the core product wedge: every listing carries verification, trust score, real resident reviews, quality scores, landlord response rate, and Q&A.

Read `.ai/ENTRY_PROMPT.md` for the canonical product context.

## Tech Stack
- **Frontend:** TanStack Start (Vite + React 19), TypeScript, Tailwind v4, shadcn/ui  -  at `apps/web/`
- **Backend:** NestJS 11, TypeScript 5.x, Prisma ORM, PostgreSQL 16 + PostGIS  -  at `apps/api/`
- **Mobile (later):** Capacitor 6.x wrapping the web app
- **Search:** Meilisearch · **Cache:** Redis · **Jobs:** BullMQ · **Video:** Mux (deferred)
- **Monorepo:** Turborepo + pnpm

Run frontend: `pnpm web` (port 8080) · Run backend: `pnpm api` (port 3001)

## Coding Standards
- TypeScript strict mode  -  never use `any`
- All API responses: `{ success: boolean, data: T, meta?: { cursor, hasMore }, error?: { code, message } }`
- UUID primary keys, `snake_case` DB columns (via Prisma `@map`), `camelCase` in TypeScript
- Soft deletes via `deleted_at` column
- **Arabic-first, RTL default. Egyptian colloquial dialect  -  not MSA.** Use words like `حط شقتك`, `دوّر`, `فاضي`, `أوضة`, `كلّم`, `لاقي`, `بيرد`, `ساكن`, not their formal MSA equivalents.
- NestJS: one module per feature. Services inject `PrismaService`.
- Frontend: TanStack Router file-based routes in `apps/web/src/routes/`. Use TanStack Query for data fetching.
- Cursor-based pagination (no offset pagination).
- **Use CSS logical properties only:** `ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`. Never `ml-`, `mr-`, `left-`, `right-`.

## Permission System (actual  -  corrected)
> The 5-tier `@RequireTier` system was never built. Real model: identity + verification + ownership.
- **Admin:** `User.isAdmin` → `AdminGuard` (moderation queue only).
- **Verified:** verified/admin owners auto-publish listings; others go to `pending_approval`.
- **Ownership:** every write checks the resource owner (403 otherwise).
- **Participant:** chat is restricted to the two participants.
- **Auth:** global `JwtAuthGuard`; open routes marked `@Public()`. See `.ai/CURRENT_STATE.md`.

## Domain Vocabulary (use exact Arabic terms in UI)

| English | Arabic (UI) |
|---|---|
| Apartment | شقة |
| Private room | أوضة |
| Bed | سرير |
| Available / free | فاضي |
| Occupied / taken | متحجوز |
| Verified | متأكدين منه |
| List your apartment | حط شقتك |
| Search / look for | دوّر |
| Reviews | آراء الناس / آراء الساكنين |
| Internet | نت |
| Trust score | درجة الثقة |
| Request a viewing | اطلب معاينة |
| Message landlord | كلّم صاحب الشقة |
| Q&A | أسئلة وأجوبة |

## Key Patterns

### NestJS Controller
```typescript
@Controller('properties')
@ApiTags('Properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get()
  async list(@Query() query: ListPropertiesDto) {
    const { items, cursor, hasMore } = await this.propertiesService.list(query);
    return { success: true, data: items, meta: { cursor, hasMore } };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@CurrentUser() user: User, @Body() dto: CreatePropertyDto) {
    const property = await this.propertiesService.create(user, dto);
    return { success: true, data: property };
  }
}
```

### NestJS Service
```typescript
@Injectable()
export class PropertiesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(owner: User, dto: CreatePropertyDto) {
    // Verified/admin owners auto-publish; others enter the moderation queue.
    const status = owner.isAdmin || owner.verified ? 'published' : 'pending_approval';
    return this.prisma.property.create({
      data: {
        ...dto,
        ownerId: owner.id,
        status,
        beds: { create: Array.from({ length: dto.bedCount }, () => ({ status: 'available' })) },
      },
    });
  }
}
```

### Frontend Component (TanStack Start, Egyptian Arabic, logical CSS)
```typescript
import { Link } from '@tanstack/react-router';
import { TrustBadge } from '@/components/beitco/TrustBadge';

export function PropertyCard({ p }: { p: PropertySummary }) {
  return (
    <Link to="/property/$id" params={{ id: p.id }} className="rounded-lg border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-base font-semibold">{p.title}</h3>
        <TrustBadge score={p.trust} />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        فاضي {p.beds.available} من {p.beds.total}
      </p>
      <p className="mt-2 font-display text-base font-semibold tabular-nums">
        {p.price.toLocaleString('ar-EG')} <span className="text-xs font-normal">ج.م/شهر</span>
      </p>
    </Link>
  );
}
```

## Reference Files
- `.ai/ENTRY_PROMPT.md`  -  canonical product context (start here)
- `.ai/CURRENT_STATE.md`  -  what's actually built right now (full-stack, done)
- `.ai/NEXT_STEPS.md`  -  **the active backlog (production hardening)  -  what's next**
- `.ai/PROJECT_OVERVIEW.md`  -  product vision, personas, MVP scope
- `.ai/PRD.md`  -  product requirements (source of truth for scope)
- `.ai/BUSINESS_MODEL.md`  -  monetization strategy
- `.ai/ROADMAP.md`  -  phased plan (Phases 0–3 done; 3.5 hardening now)
- `.ai/TRUST_SPEC.md`  -  trust engine (T-1→T-5)
- `.ai/AI_RULES.md`  -  detailed coding standards
- `.ai/ARCHITECTURE.md`  -  current system design
- `.ai/DB_SCHEMA.md`  -  schema map (source of truth: `apps/api/prisma/schema.prisma`)
- `.ai/API_SPEC.md`  -  current endpoint inventory (Swagger: `/api/docs`)
- `.ai/BACKEND_TASKS.md`  -  backend build log
- `.ai/TASKS.md`  -  frontend board (feature-complete)
