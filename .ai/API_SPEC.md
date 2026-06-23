# Beitco — API Specification

> **Last updated:** June 23, 2026 · Live endpoint inventory. **Interactive source of truth: Swagger at `http://localhost:3001/api/docs`.**
> Base: `/api/v1` (URI versioning). All paths below are relative to it.

---

## Conventions

- **Response envelope (every endpoint):** `{ success: boolean, data: T, meta?: { cursor: string|null, hasMore: boolean }, error?: { code, message } }` — applied globally by `ResponseEnvelopeInterceptor` + `AllExceptionsFilter`.
- **Auth:** global `JwtAuthGuard`. Routes are **authenticated by default**; only `@Public()` ones are open. Session = access+refresh JWTs in **httpOnly cookies** (`beitco_at`); browsers send them automatically (`credentials: include`).
- **Authz failures:** `401` (no/invalid session), `403` (authenticated but not owner/participant/admin).
- **Validation:** strict (`whitelist` + `forbidNonWhitelisted`) — unknown body fields are rejected.
- **Pagination:** cursor-based via `meta.cursor` / `meta.hasMore` (no offset).
- **Errors carry an Arabic `message`** (user-facing) + a stable `code`.

---

## Auth — `/auth`
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/auth/otp/send` | Public | Send OTP (Redis, 5-min TTL, 60s cooldown; dev returns `123456`). |
| POST | `/auth/otp/verify` | Public | Verify → find-or-create user → set cookies → `{ user, isNewUser }`. |
| POST | `/auth/complete-profile` | Auth | New-user name/role/gender. |
| GET | `/auth/me` | Auth | Current user (incl. `profile`). |
| POST | `/auth/refresh` | Public | Rotate access token from the refresh cookie. |
| POST | `/auth/logout` | Auth | Revoke (Redis blacklist) + clear cookies. |

## Listings — `/properties`
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/properties` | Public | Cursor-paginated; filters: `type`,`purpose`,`gender`,`area`,`minPrice`,`maxPrice`,`verifiedOnly`,`nightly`,`freeOnly`,`sort`. |
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

## Chat — REST + WebSocket
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/me/threads` | Auth | My conversations (+ embedded property summary). |
| GET | `/threads/:id` | Participant | Full history; marks read. |
| POST | `/threads` | Auth | Find-or-create thread (`{ propertyId }`; idempotent; not your own listing). |
| POST | `/threads/:id/messages` | Participant | Send; maintains `ResponseEvent` (T-3) + emits live. |
| WS | `/ws/chat` | Cookie JWT | Socket.io namespace. Joins `user:<id>`; server emits `message:new { threadId, message }`. |

## Notifications — `/me/notifications`
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/me/notifications` | Auth | Derived feed + persisted alerts + `lastSeen`. |
| GET | `/me/notifications/unread-count` | Auth | Bell badge count. |
| POST | `/me/notifications/seen` | Auth | Set the last-seen marker. |

## Admin moderation — `/admin/moderation` (`AdminGuard`)
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/admin/moderation` | Admin | Pending queue (oldest first). |
| GET | `/admin/moderation/count` | Admin | Nav badge. |
| POST | `/admin/moderation/:id/approve` | Admin | → published + trust recompute + saved-search alerts. |
| POST | `/admin/moderation/:id/reject` | Admin | `{ reason }`. |

## Health
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/health` | Public | Liveness (`status`, uptime). **Readiness (DB+Redis) is SEC-3 in NEXT_STEPS.** |

---

> The frontend mock store (`apps/web/src/lib/beitco/store.ts`) + `types.ts` remain the **shape spec** these endpoints satisfy; the API serializers reproduce those shapes (Arabic enums included). When adding an endpoint, match the mock shape and keep the envelope.
