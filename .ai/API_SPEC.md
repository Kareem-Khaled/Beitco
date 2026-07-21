# Beitoon  -  API Specification

> **Last updated:** June 25, 2026 · Live endpoint inventory (~93 routes across 18 controllers). **Interactive source of truth: Swagger at `http://localhost:3001/api/docs`.**
> Base: `/api/v1` (URI versioning). All paths below are relative to it.

---

## Conventions

- **Response envelope (every endpoint):** `{ success: boolean, data: T, meta?: { cursor: string|null, hasMore: boolean }, error?: { code, message } }`  -  applied globally by `ResponseEnvelopeInterceptor` + `AllExceptionsFilter`.
- **Auth:** global `JwtAuthGuard`. Routes are **authenticated by default**; only `@Public()` ones are open. Session = access+refresh JWTs in **httpOnly cookies** (`beitco_at`); browsers send them automatically (`credentials: include`).
- **Authz failures:** `401` (no/invalid session), `403` (authenticated but not owner/participant/admin).
- **Validation:** strict (`whitelist` + `forbidNonWhitelisted`)  -  unknown body fields are rejected.
- **Pagination:** cursor-based via `meta.cursor` / `meta.hasMore` (no offset).
- **Errors carry an Arabic `message`** (user-facing) + a stable `code`.

---

## Auth  -  `/auth`
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/auth/otp/send` | Public | Send OTP (Redis, 5-min TTL, 60s cooldown; dev returns `123456`). |
| POST | `/auth/otp/verify` | Public | Verify → find-or-create user → set cookies → `{ user, isNewUser }`. |
| POST | `/auth/complete-profile` | Auth | New-user name/role/gender. |
| GET | `/auth/me` | Auth | Current user (incl. `profile`). |
| POST | `/auth/refresh` | Public | Rotate access token from the refresh cookie. |
| POST | `/auth/logout` | Auth | Revoke (Redis blacklist) + clear cookies. |

## Listings  -  `/properties`
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/properties` | Public | Cursor-paginated; filters: `type`,`purpose`,`gender`,`area`,`minPrice`,`maxPrice`,`verifiedOnly`,`nightly`,`freeOnly`,`sort`. **Text:** `q` (Meilisearch typo-tolerant, relevance-ordered; DB `contains` fallback). **Geo:** `lat`,`lng`,`radiusKm` (PostGIS `ST_DWithin`, default 5 km / max 50, distance-ordered; composes with `q` + `freeOnly`). |
| GET | `/properties/:id` | Public | Full property (rooms→beds, nearby, landlord, reviews, Q&A). **No occupant data.** |
| GET | `/properties/mine` | Auth | Owner's listings (all statuses) **with** occupant data + `rejectionReason`. |
| POST | `/properties` | Auth | Create (moderation-gated: verified/admin → published, else pending). Fires saved-search alerts on publish. |
| PATCH | `/properties/:id` | Owner | Edit (re-runs the gate for draft/rejected). |
| PATCH | `/properties/:id/manage` | Owner | One concern per call: `listingStatus` (pause), `saleStatus`, or `whole`/`room`/`bed` occupancy. |
| DELETE | `/properties/:id` | Owner | Soft delete. |

## Engagement (saved / searches / leads / Q&A)
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/me/saved` | Auth | Saved listings (summaries). |
| POST | `/properties/:id/save` | Auth | Toggle save → `{ saved }`. |
| GET / POST | `/me/searches` | Auth | List / create saved searches (`{ label, params }`). |
| DELETE | `/me/searches/:id` | Owner | Remove a saved search. |
| POST | `/properties/:id/leads` | Auth | Request viewing / book unit(s). |
| GET | `/me/leads` | Auth | My (renter) requests. |
| GET | `/me/owner-leads` | Auth | Incoming requests on my listings (+ renter reputation + `canReview`). |
| PATCH | `/leads/:id/status` | Owner | `approved`/`declined`/`completed` (completing creates a tenancy). |
| POST | `/properties/:id/questions` | Auth | Ask a public question. |
| POST | `/questions/:id/answer` | Owner | Owner answers. |

## Reviews & trust
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/properties/:id/reviews` | Auth | Resident review (30-day tenancy gate). **Moves trust.** |
| POST | `/reviews/:id/helpful` | Auth | Toggle helpful (dedup). |
| POST | `/reviews/:id/reply` | Owner | Owner reply. |
| GET | `/properties/:id/review-meta` | Auth | `{ canReview, votedReviewIds }`. |
| POST | `/users/:renterId/reviews` | Owner | Owner→renter review (T-4). Moves reputation. |
| GET | `/properties/:id/trust` | Public | Computed trust breakdown. |

## Matching & preferences
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/me/matches` | Auth | Ranked, explainable matches from saved preferences. |
| PATCH | `/users/me` | Auth | Update name/role/avatar/notifications **and `profile`** (preferences; upserts `RenterProfile`). |

## Verification (KYC)  -  `/me/verification` + `/admin/verifications`
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/me/verification` | Auth | Submit `idDocUrl`/`selfieUrl`/optional `ownershipDocUrl` → pending request (`verificationStatus=pending`). |
| GET | `/me/verification` | Auth | My latest request + status. |
| GET | `/admin/verifications` | Admin | Pending KYC queue (oldest first; applicant name/phone/role). |
| GET | `/admin/verifications/count` | Admin | Nav badge. |
| POST | `/admin/verifications/:id/approve` | Admin | → `verified` + `verificationStatus=verified` + **trust recompute** (T-2 bonus) + notification. |
| POST | `/admin/verifications/:id/reject` | Admin | `{ reason }` → `unverified` + notification. |

## Uploads (images)  -  `/uploads`
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/uploads/presign` | Auth | → presigned **S3/R2** PUT URL + final public URL (validates content-type ∈ {jpeg,png,webp,avif} + ≤10 MB; keys namespaced `listings/<userId>/…`). |
| GET | `/uploads/config` | Auth | `{ configured }`  -  when `false`, the client falls back to downscaled base64. |

## Chat  -  REST + WebSocket
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/me/threads` | Auth | My conversations (+ embedded property summary). |
| GET | `/threads/:id` | Participant | Full history; marks read. |
| POST | `/threads` | Auth | Find-or-create thread (`{ propertyId }`; idempotent; not your own listing). |
| POST | `/threads/:id/messages` | Participant | Send; maintains `ResponseEvent` (T-3) + emits live. |
| WS | `/ws/chat` | Cookie JWT | Socket.io namespace. Joins `user:<id>`; server emits `message:new { threadId, message }`. |

## Notifications  -  `/me/notifications`
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/me/notifications` | Auth | Derived feed + persisted alerts + `lastSeen`. |
| GET | `/me/notifications/unread-count` | Auth | Bell badge count. |
| POST | `/me/notifications/seen` | Auth | Set the last-seen marker. |

## Admin / operator portal  -  `/admin/*` (`AdminGuard`)

> The Beitoon-team control room. All routes are `AdminGuard`-gated (after the global `JwtAuthGuard`); **every mutation is written to the audit log**.

**Overview & audit**
| Method | Path | Notes |
|---|---|---|
| GET | `/admin/stats` | Platform KPIs (users/listings/engagement/inventory/trust/queues + recent). |
| GET | `/admin/audit` | Append-only admin action log (filter `adminId`/`targetType`/`targetId`/`action`, cursor). |

**Moderation queue (listings) & KYC**
| Method | Path | Notes |
|---|---|---|
| GET | `/admin/moderation` (+`/count`) | Pending-approval listings queue + nav badge. |
| POST | `/admin/moderation/:id/approve` \| `/reject` | Publish (+trust recompute +alerts) / reject `{reason}`. |
| GET | `/admin/verifications` (+`/count`) | Pending KYC queue + badge. |
| POST | `/admin/verifications/:id/approve` \| `/reject` | Verify (+trust) / reject `{reason}`. |

**Users (ADMIN-2)**
| Method | Path | Notes |
|---|---|---|
| GET | `/admin/users` | Search (`q` name/phone) + filter (role/status/verified/admins), cursor. |
| GET | `/admin/users/:id` | Detail + activity counts + KYC history. |
| PATCH | `/admin/users/:id` | Role / manual verify (recomputes trust) / trust override `{reason}`. |
| POST | `/admin/users/:id/ban` \| `/reinstate` | Suspend `{reason}` (notifies) / lift. Guards: `SELF_BAN`, `CANNOT_BAN_ADMIN`. |
| POST | `/admin/users/:id/make-admin` \| `/revoke-admin` | Grant / revoke admin (guard: `SELF_ADMIN`). |

**Listings (ADMIN-3)**
| Method | Path | Notes |
|---|---|---|
| GET | `/admin/listings` | Search + filter **all** statuses, cursor. |
| GET | `/admin/listings/:id` | Full admin detail (incl. occupants + moderation fields). |
| POST | `/admin/listings/:id/takedown` \| `/restore` | Force-pause `{reason}` (drops from search, notifies) / republish. |
| PATCH | `/admin/listings/:id` | Toggle `verified` (recompute trust + reindex). |
| DELETE | `/admin/listings/:id` | Soft-delete (`?reason=`). |

**Content moderation (ADMIN-4)**
| Method | Path | Notes |
|---|---|---|
| GET | `/admin/reviews` | Search + `removed=true\|false` filter, cursor. |
| POST | `/admin/reviews/:id/remove` \| `/restore` | Soft-remove `{reason}` → **recompute trust** / restore. |
| POST | `/admin/questions/:id/remove` \| `/restore` | Soft-remove / restore a Q&A. |

**Analytics (ADMIN-9)**
| Method | Path | Notes |
|---|---|---|
| GET | `/admin/analytics/timeseries` | Daily counts (`metric=signups\|listings\|leads\|tenancies`, `days`), zero-filled. |
| GET | `/admin/analytics/funnel` | Browse→lead→approved→move-in + conversion rates. |
| GET | `/admin/analytics/areas` | Supply vs demand per area (gap-sorted). |

## Reports & abuse (ADMIN-5)  -  `/reports` + `/admin/reports`
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/reports` | Auth | File a report `{targetType, targetId, reason, details?}` (target-validated; dedup → `ALREADY_REPORTED`). |
| GET | `/admin/reports` (+`/count`) | Admin | Triage queue (defaults to open+reviewing) + open-count badge. |
| PATCH | `/admin/reports/:id` | Admin | Set status `reviewing\|resolved\|dismissed` `{resolution?}` (resolving stamps the resolver). |

## Health
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/health` | Public | Liveness (`status`, uptime). |
| GET | `/health/ready` | Public | Readiness  -  pings Postgres (`SELECT 1`) + Redis (`PING`); **503** when either is down (for the orchestrator's traffic gate). |

---

> The frontend mock store (`apps/web/src/lib/beitco/store.ts`) + `types.ts` remain the **shape spec** these endpoints satisfy; the API serializers reproduce those shapes (Arabic enums included). When adding an endpoint, match the mock shape and keep the envelope.
