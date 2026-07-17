# Admin / Operator Portal — Feature Plan

> **What the Beitoon team (platform operators) needs to run the marketplace.** · created June 25, 2026 · updated June 25 · branch: `dev`
> Companion to `.ai/NEXT_STEPS.md` (backlog) + `.ai/BUSINESS_MODEL.md` (revenue) + `.ai/CURRENT_STATE.md` (built). Derived from a full scan of the schema (24 models), services, and business model.
>
> **Scope:** the `/admin` portal is **operators only** (`User.isAdmin`), separate from the *landlord* dashboard (`/dashboard`). It is the control room for moderation, trust, users, listings, money, and analytics.

---

## Where we are (June 25)

**Built — a 7-section `/admin` portal, ~3,900 LOC, every mutation audit-logged:**
- **Overview** (`/admin`, ADMIN-1) — platform KPIs + action queues + recent activity (`GET /admin/stats`).
- **Analytics** (`/admin/analytics`, ADMIN-9) — growth time-series, conversion funnel, supply/demand by area.
- **Users** (`/admin/users`, ADMIN-2) — search/filter; verify, **ban/reinstate**, make/revoke admin, trust override; self-guards.
- **Listings** (`/admin/listings`, ADMIN-3) — search all statuses; **force-takedown**/restore, verify, delete.
- **Reviews** (`/admin/reviews`, ADMIN-4) — soft-remove/restore reviews + Q&A → **recompute trust**.
- **Reports** (`/admin/reports`, ADMIN-5) — user "report" button → triage queue; deep-links to users/listings.
- **Moderation + KYC** queues (linked in from `/dashboard`).
- **Audit log** (ADMIN-12, partial) — `AdminAuditLog` + `GET /admin/audit`; every operator mutation records who/what/target/reason.

**The model today:** a single `User.isAdmin` boolean + `AdminGuard` (×8 controllers). **Audit log: done.** Still missing: **admin RBAC roles** (super_admin/moderator/support/finance), billing, broadcast, config, trust-override-anomaly tooling, support timeline.

---

## The gap (what operators still can't do)

Operators now can find/ban users, take down listings, remove fake reviews, and triage reports. **Still missing:** real admin **roles** (everyone with `isAdmin` can do everything — ADMIN-12 roles), **revenue/billing** (ADMIN-8, needs PAY-1), **trust override + fraud signals** (ADMIN-6), **leads/tenancies oversight** (ADMIN-7), **broadcast/announcements** (ADMIN-10), **platform config/feature-flags** (ADMIN-11), and a **support/dispute timeline** (ADMIN-13). The epics below track these.

---

## Epics

> Legend: 🔴 core-ops (run the platform safely) · 🟠 trust/safety · 🟡 growth/money · 🟢 nice-to-have. Each lists the **features**, the **API** it needs, and any **new models**.

### ADMIN-1 · Portal shell + overview — ✅ done
Operator portal + platform-overview dashboard (`/admin`, `GET /admin/stats`). _Remaining polish: migrate the moderation + KYC queues to live fully under `/admin` (they link in from the `/dashboard` frame today)._

---

### ADMIN-2 · User management 🔴 — ✅ done (June 25)
**Goal:** find any user and act on them.
- **Browse/search/filter** users — by name/phone, role (renter/owner/both), status (verified/pending/unverified/banned), `isAdmin`; sort by joined/trust; cursor-paginated.
- **User detail** — profile + counts (listings, leads, tenancies, reviews given/received, threads), trust + breakdown, KYC history, join date, last activity.
- **Actions:** verify/unverify manually · **ban/suspend + reinstate** · grant/revoke admin · edit role/name · **manual trust override** (with reason) · soft-delete · "view as" (read-only impersonation) for support.
- **API:** `GET /admin/users` (search/filter/paginate), `GET /admin/users/:id` (detail), `PATCH /admin/users/:id` (role/verify/trust), `POST /admin/users/:id/ban` + `/reinstate`, `POST /admin/users/:id/make-admin` + `/revoke-admin`.
- **New model:** add `bannedAt`/`banReason` to `User` (or a `status` enum). Every action → audit log (ADMIN-12).

### ADMIN-3 · Listing management 🔴 — ✅ done (June 25)
**Goal:** manage **all** listings, not just the pending queue. — **Shipped:** `/admin/listings` search/filter (all statuses) + detail; **force-takedown** (pause + drop from search + notify owner), restore, verified toggle, soft-delete; all audited.
- **Browse/search/filter** every property — any status (draft/pending/published/paused/rejected), type, area, owner, verified; sort by created/trust/price.
- **Listing detail (admin view)** — full record incl. occupants + owner + moderation history.
- **Actions:** **force-unpublish / take-down** a published listing · pause/unpause · toggle `verified` · re-run trust · edit (fix/redact) · soft-delete · (later) feature/boost. Take-downs notify the owner with a reason + drop it from search.
- **API:** `GET /admin/listings` (search/filter), `GET /admin/listings/:id`, `PATCH /admin/listings/:id` (status/verified), `POST /admin/listings/:id/takedown` (reason), `DELETE /admin/listings/:id`.

### ADMIN-4 · Content moderation 🟠 — ✅ done (June 25)
**Goal:** remove fake/abusive content (the trust wedge depends on clean reviews). — **Shipped:** soft-remove reviews + Q&A (`removedAt`), excluded from trust + hidden everywhere (recompute on remove/restore); `/admin/reviews` page; audited. _Renter-review removal: deferred._
- **Reviews** — list/search across all listings; **remove** a review (with reason → recompute the listing's trust); see helpful-vote counts; spot self/duplicate reviews.
- **Q&A** — remove inappropriate questions/answers.
- **Renter reviews** (owner→renter) — remove if abusive.
- **API:** `GET /admin/reviews` (filter by property/author/rating), `DELETE /admin/reviews/:id` (reason → recompute), `DELETE /admin/questions/:id`, `DELETE /admin/renter-reviews/:id`.
- **New field:** `Review.removedAt`/`removedReason` (soft-remove so trust history is auditable).

### ADMIN-5 · Reports & abuse queue 🟠 — ✅ done (June 25)
**Goal:** let users flag bad actors; give operators a triage queue. — **Shipped:** a `ReportButton` across the app (listing + reviews) → `POST /reports` (target-validated, duplicate-guarded); new `Report` model; `/admin/reports` triage (filter/enrich/deep-link/resolve), audit-logged + a sidebar badge.
- **"Report" button** across the app (a listing, a review, a user, a message) → creates a report.
- **Triage queue** — open/under-review/resolved/dismissed; filter by target type + reason; bulk action; link straight to the target's admin view.
- **API:** `POST /reports` (any authed user), `GET /admin/reports` (+count), `PATCH /admin/reports/:id` (status + resolution note).
- **New model:** `Report { id, reporterId, targetType (listing|review|user|message), targetId, reason, status, resolution, createdAt, resolvedById }`.

### ADMIN-6 · Trust & quality controls 🟠
**Goal:** audit + defend the trust engine (`.ai/TRUST_SPEC.md`).
- View any user/listing **trust breakdown**; **manual override** with reason + expiry.
- **Bulk recompute** (after a weight change or data fix).
- **Fraud signals:** flag self-reviews, rating spikes, duplicate listings (same owner/title/area), review velocity anomalies, unverified-but-high-trust.
- **API:** `POST /admin/trust/recompute` (all/owner/listing), `GET /admin/trust/anomalies`, `PATCH /admin/users/:id/trust` + `/admin/listings/:id/trust` (override).

### ADMIN-7 · Leads & tenancies oversight 🟡
**Goal:** see the funnel + the success-fee basis.
- **All leads** with status; the **funnel** (browse → lead → viewing approved → move-in/tenancy).
- **All tenancies** — the source of truth for the 5% success fee (move-in ≥30 days). Flag tenancies eligible for invoicing.
- **API:** `GET /admin/leads` (filter/funnel), `GET /admin/tenancies` (+ eligible-for-fee flag).

### ADMIN-8 · Monetization & billing 🟡 (ties to PAY-1)
**Goal:** run the business model (`.ai/BUSINESS_MODEL.md`).
- **Subscriptions** — verified-owner plans (299 EGP/mo · 2,499/yr): who's on what plan, status, MRR, churn; comp/extend a plan.
- **Success fees** — a ledger per qualifying move-in (5% capped 1,500 EGP): pending → invoiced → paid; manual waive/adjust.
- **Promoted listings** — active boosts (50 EGP/day), revenue, expiry.
- **Revenue dashboard** — MRR, fee revenue, boost revenue, refunds.
- **New models:** `Subscription`, `SuccessFee` (or `Invoice` + `InvoiceLine`), `Boost`. Provider hooks (Paymob/Stripe EGP) from PAY-1.

### ADMIN-9 · Analytics & insights 🟡 — ✅ done (June 25)
**Goal:** understand growth + supply/demand. — **Shipped:** `/admin/analytics` — growth time-series (metric switcher + 30/90d), the conversion funnel + rates, and supply/demand-by-area (gap-sorted). _Tail (optional): trust histogram + CSV export._
- **Time-series** — signups, listings, leads, move-ins per day/week (charts).
- **Conversion funnel** with rates; **cohort retention**.
- **Supply/demand by area** (listings vs saved-searches/leads per area — where to seed supply).
- **Trust distribution** histogram; **top areas / owners**.
- **CSV export** for any table.
- **API:** `GET /admin/analytics/timeseries`, `/funnel`, `/areas`, `/export`.

### ADMIN-10 · Communications & broadcast 🟢
**Goal:** reach users operationally.
- **Announcements** — push an in-app notification to a **segment** (all renters / owners in area X / verified owners / a saved-search audience).
- **In-app banner** (maintenance, launch news).
- (Later) SMS/email campaigns via the existing gateways.
- **API:** `POST /admin/broadcast` (segment + title + body → fan out `Notification`s), `GET /admin/broadcast` (history).

### ADMIN-11 · Platform config & ops 🟢
**Goal:** tune the platform without a deploy.
- **Feature flags** (toggle PROD features, search provider, etc.).
- **Areas/locations** management (the canonical area list used by search + filters).
- **Search ops** — trigger a Meilisearch **reindex**; see index health.
- **System health** — surface `/health/ready` (DB/Redis) + (later) BullMQ job status.
- **CMS** — edit help/terms/FAQ copy.

### ADMIN-12 · Audit log & admin RBAC 🔴 (do early) — 🔨 audit log done (June 25)
**Goal:** accountability + least-privilege for the team. **Should land alongside ADMIN-2/3** so every destructive action is recorded from day one. — **`AdminAuditLog` + `AdminAuditService` shipped** (every ADMIN-2 mutation logs; `GET /admin/audit`); **RBAC roles still TODO.**
- **Audit log** — every admin action (who, what, target, before/after, when). Read-only, filterable.
- **Admin roles** — replace the single `isAdmin` bool with levels: `super_admin` (everything incl. billing + admin management), `moderator` (listings/reviews/reports), `support` (users/view-as, no destructive), `finance` (billing read).
- **Admin management** — invite/grant/revoke admin, see the admin roster.
- **New model:** `AdminAuditLog { id, adminId, action, targetType, targetId, meta(Json), createdAt }`; `AdminRole` enum on `User` (or a join table). Wrap the ADMIN-2/3/4/6 mutations to write a log row.

### ADMIN-13 · Support & disputes 🟢
**Goal:** resolve user problems.
- **Per-user activity timeline** (leads, threads, tenancies, reports, admin actions) for context.
- **Dispute workflow** — link a report/thread to a resolution; internal notes.
- **Manual intervention log** (refund issued, listing restored, ban lifted) — overlaps the audit log.

---

## Suggested build order

1. **ADMIN-12 (audit log + a minimal role split)** — land the audit-log writer first so everything after is recorded. _(Roles can start as `isAdmin` + a `super_admin` flag and expand later.)_
2. **ADMIN-2 (users)** + **ADMIN-3 (listings)** — the two core-ops capabilities; the most-requested "find a user / take down a listing."
3. **ADMIN-4 (content moderation)** + **ADMIN-5 (reports)** — protect the trust wedge; reports feed the moderation queues.
4. **ADMIN-6 (trust controls)** + **ADMIN-9 (analytics)** — defend + understand.
5. **ADMIN-7 (leads/tenancies)** → **ADMIN-8 (billing, with PAY-1)** — turn on revenue.
6. **ADMIN-10/11/13** — operational polish as capacity allows.

> Each epic ships as a vertical slice (backend endpoints + `AdminGuard` + audit log + a `/admin/*` page), flag-aware on the frontend (API + a mock equivalent), with unit tests — matching how ADMIN-1 shipped.

---

## Cross-cutting requirements (every epic)

- **`AdminGuard`** on every route; **audit-log** every mutation (ADMIN-12).
- **Reasons + notifications:** destructive actions (ban/takedown/remove) carry an operator reason and notify the affected user in Egyptian Arabic.
- **Soft, reversible** where possible (soft-delete/soft-remove) so actions are auditable + recoverable.
- **Privacy:** chat/message oversight is for dispute resolution only and must be access-logged; never expose occupant PII beyond what the owner already sees.
- **Flag-aware FE** (`VITE_USE_API`) + **unit tests** per slice, like the rest of the app.
