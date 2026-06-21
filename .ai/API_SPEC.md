> ⚠️ **STALE — pre-pivot doc.** Beitco pivoted to a trust-first **bed-level housing marketplace** (June 2026). This doc describes the old social-network/real-estate endpoints. The **new endpoint plan lives in `.ai/BACKEND_TASKS.md`** (B-1, B-2…), and the response envelope/conventions in `.ai/AI_RULES.md`. The frontend mock store (`apps/web/src/lib/beitco/store.ts`) is the executable spec for endpoint shapes. Trust `.ai/CURRENT_STATE.md`, `.ai/BACKEND_TASKS.md`, and `.ai/TASKS.md` instead. Kept for historical reference only.

---

# Beitco — API Specification

> **Complete API endpoint reference for AI code generation. All endpoints use `/api/v1/` prefix.**

---

## Global Conventions

```
Base URL:          https://api.beitco.app/api/v1
Content-Type:      application/json
Auth:              Bearer <JWT> in Authorization header
Locale:            Accept-Language: ar (default) | en
Rate Limits:       Tier 2: 120 req/min | Tier 3: 60 req/min | Tier 4: 30 req/min
Pagination:        Cursor-based — ?cursor=<string>&limit=20 (max 50)
Soft Deletes:      DELETE returns 204, sets deleted_at (not hard delete)
```

### Standard Response Format

```typescript
// Success
{
  "success": true,
  "data": T,
  "meta": {
    "cursor": "string | null",  // for pagination
    "hasMore": boolean,
    "total": number             // optional, expensive
  }
}

// Error
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",       // e.g., "UNAUTHORIZED", "VALIDATION_ERROR"
    "message": "Human-readable message",
    "details": {}               // optional validation details
  }
}
```

### Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid JWT |
| `FORBIDDEN` | 403 | Insufficient tier/permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 422 | Request body validation failed |
| `RATE_LIMITED` | 429 | Too many requests |
| `TIER_REQUIRED` | 403 | User tier too low for this action |
| `APPROVAL_REQUIRED` | 202 | Post submitted for approval (not published) |
| `CONTENT_BLOCKED` | 403 | Content flagged by moderation |
| `DUPLICATE_CONTENT` | 409 | Duplicate post/listing detected |
| `ACCOUNT_SUSPENDED` | 403 | User account is suspended |

---

## 1. Authentication

### `POST /auth/otp/send`
Send OTP to phone number.
```typescript
// Request
{ "phone": "+201234567890" }

// Response 200
{ "success": true, "data": { "expiresIn": 300, "retryAfter": 60 } }
```
**Rate limit:** 5 requests per minute per phone.

### `POST /auth/otp/verify`
Verify OTP and get tokens.
```typescript
// Request
{ "phone": "+201234567890", "code": "123456" }

// Response 200
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "expiresIn": 900,
    "user": { ...UserProfile },
    "isNewUser": true
  }
}
```

### `POST /auth/refresh`
Refresh access token.
```typescript
// Request
{ "refreshToken": "eyJ..." }

// Response 200
{ "success": true, "data": { "accessToken": "eyJ...", "expiresIn": 900 } }
```

### `POST /auth/google`
```typescript
// Request
{ "idToken": "google-id-token" }
// Response: same as otp/verify
```

### `POST /auth/apple`
```typescript
// Request
{ "identityToken": "apple-identity-token", "authorizationCode": "code" }
// Response: same as otp/verify
```

### `DELETE /auth/logout`
Invalidate refresh token. **Auth required.**
```
// Response 204 No Content
```

---

## 2. Users

### `GET /users/me` 🔒
```typescript
// Response 200
{
  "success": true,
  "data": {
    "id": "uuid",
    "phone": "+201234567890",
    "email": "user@example.com",
    "nameAr": "أحمد محمد",
    "nameEn": "Ahmed Mohamed",
    "role": "agent",
    "permissionTier": 2,
    "avatarUrl": "https://...",
    "coverPhotoUrl": "https://...",
    "bio": "وسيط عقاري...",
    "nationalIdVerified": true,
    "agentLicenseVerified": true,
    "trustScore": 87,
    "reputationScore": 92,
    "followerCount": 1240,
    "followingCount": 56,
    "postCount": 89,
    "createdAt": "2025-01-15T10:00:00Z",
    "preferences": { "language": "ar", "notifications": {} }
  }
}
```

### `PATCH /users/me` 🔒
```typescript
// Request (partial)
{
  "nameAr": "أحمد محمد",
  "nameEn": "Ahmed Mohamed",
  "bio": "وسيط عقاري...",
  "avatarUrl": "https://...",
  "preferences": { "language": "ar" }
}
// Response 200: updated UserProfile
```

### `GET /users/:id`
```typescript
// Response 200: public UserProfile (no phone, no email, no preferences)
```

### `POST /users/me/verify-id` 🔒
```typescript
// Request
{ "nationalIdFront": "base64...", "nationalIdBack": "base64...", "selfie": "base64..." }
// Response 202
{ "success": true, "data": { "verificationId": "uuid", "status": "pending" } }
```

### `GET /users/:id/posts`
```typescript
// Query: ?cursor=X&limit=20
// Response 200: paginated list of PostSummary
```

### `GET /users/:id/followers`
```typescript
// Query: ?cursor=X&limit=20
// Response 200: paginated list of UserSummary
```

### `GET /users/:id/following`
```typescript
// Query: ?cursor=X&limit=20
// Response 200: paginated list of UserSummary
```

### `GET /users/:id/groups`
```typescript
// Response 200: list of GroupSummary
```

### `GET /users/me/dashboard` 🔒 (Tier 2)
```typescript
// Response 200
{
  "success": true,
  "data": {
    "totalListings": 15,
    "activeListings": 12,
    "totalViews": 8500,
    "totalInquiries": 42,
    "totalFollowers": 1240,
    "weeklyEngagement": { "likes": 320, "comments": 87, "shares": 15 },
    "pendingApprovals": 0,
    "reputationScore": 92
  }
}
```

---

## 3. Social Graph

### `POST /follows/:userId` 🔒
Follow a user.
```typescript
// Response 201
{ "success": true, "data": { "followerId": "me", "followingId": "userId", "createdAt": "..." } }
```

### `DELETE /follows/:userId` 🔒
Unfollow a user.
```
// Response 204
```

### `GET /follows/suggestions` 🔒
```typescript
// Response 200: list of UserSummary with reason
{
  "success": true,
  "data": [
    { "user": { ...UserSummary }, "reason": "in_your_area" },
    { "user": { ...UserSummary }, "reason": "active_contributor" }
  ]
}
```

### `POST /blocks/:userId` 🔒
```
// Response 201
```

### `DELETE /blocks/:userId` 🔒
```
// Response 204
```

---

## 4. Posts

### `POST /posts` 🔒
Create a post. Tier 2 → auto-publish. Tier 3 → pending approval.
```typescript
// Request
{
  "postType": "text" | "image" | "video" | "listing" | "poll" | "discussion",
  "contentText": "أفضل أحياء القاهرة الجديدة...",
  "media": [
    { "type": "image", "url": "https://...", "width": 1080, "height": 1080, "order": 0 }
  ],
  "listingId": "uuid | null",
  "videoId": "uuid | null",
  "groupId": "uuid | null",
  "metadata": {
    "location": { "lat": 30.0444, "lng": 31.2357 },
    "pollOptions": ["التجمع الخامس", "الشيخ زايد", "مدينة نصر"],
    "mentions": ["userId1", "userId2"]
  }
}

// Response 201 (Tier 2 — auto-published)
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "published",
    "approvalStatus": "auto_approved",
    ...PostDetail
  }
}

// Response 202 (Tier 3 — submitted for approval)
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "pending_approval",
    "approvalStatus": "pending",
    "message": "تم تقديم بوستك للمراجعة. سيتم إخطارك بالنتيجة."
  }
}
```

### `GET /posts/:id`
```typescript
// Response 200
{
  "success": true,
  "data": {
    "id": "uuid",
    "author": { ...UserSummary, "permissionTier": 2 },
    "postType": "image",
    "contentText": "...",
    "media": [...],
    "hashtags": ["عقارات", "القاهرة_الجديدة"],
    "status": "published",
    "likeCount": 42,
    "commentCount": 7,
    "shareCount": 3,
    "viewCount": 890,
    "isLiked": true,
    "isSaved": false,
    "createdAt": "2025-04-07T12:00:00Z",
    "updatedAt": "2025-04-07T12:00:00Z"
  }
}
```

### `PATCH /posts/:id` 🔒 (author only, within 24h)
```typescript
// Request (partial)
{ "contentText": "updated text..." }
// Response 200: updated PostDetail
```

### `DELETE /posts/:id` 🔒 (author or admin)
```
// Response 204
```

### `POST /posts/:id/like` 🔒
Toggle like.
```typescript
// Response 200
{ "success": true, "data": { "liked": true, "likeCount": 43 } }
```

### `POST /posts/:id/share` 🔒
Record share event.
```typescript
// Request
{ "shareType": "whatsapp" | "in_app_repost" | "copy_link" | "instagram" | "facebook" }
// Response 201
{ "success": true, "data": { "shareCount": 4 } }
```

### `POST /posts/:id/report` 🔒
```typescript
// Request
{ "reason": "spam" | "inappropriate" | "fake" | "harassment" | "fraud" | "other", "details": "..." }
// Response 201
```

### `GET /posts/me/pending` 🔒
Get my pending-approval posts (Tier 3).
```typescript
// Response 200: paginated list of PostSummary with approvalStatus
```

---

## 5. Comments

### `GET /posts/:id/comments`
```typescript
// Query: ?cursor=X&limit=20&sort=relevant|newest|most_liked
// Response 200
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "author": { ...UserSummary },
      "content": "تعليق رائع...",
      "parentCommentId": null,
      "likeCount": 5,
      "isLiked": false,
      "isPinned": false,
      "createdAt": "...",
      "replies": [
        { "id": "uuid", "author": {...}, "content": "...", ... }
      ]
    }
  ],
  "meta": { "cursor": "...", "hasMore": true }
}
```

### `POST /posts/:id/comments` 🔒 (Tier 3+)
```typescript
// Request
{ "content": "تعليق جديد...", "parentCommentId": "uuid | null" }
// Response 201: CommentDetail
```

### `PATCH /comments/:id` 🔒 (author, within 15 min)
```typescript
// Request
{ "content": "updated comment..." }
// Response 200: updated CommentDetail
```

### `DELETE /comments/:id` 🔒 (author/post author/admin)
```
// Response 204
```

### `POST /comments/:id/like` 🔒
```typescript
// Response 200
{ "success": true, "data": { "liked": true, "likeCount": 6 } }
```

### `POST /comments/:id/pin` 🔒 (post author only)
```typescript
// Response 200
{ "success": true, "data": { "pinned": true } }
```

### `POST /comments/:id/report` 🔒
Same as post report.

---

## 6. Groups

### `POST /groups` 🔒 (Tier 2+)
```typescript
// Request
{
  "nameAr": "القاهرة الجديدة",
  "nameEn": "New Cairo",
  "descriptionAr": "مجموعة لسكان...",
  "descriptionEn": "Group for residents...",
  "groupType": "neighborhood" | "topic" | "compound" | "custom",
  "privacy": "public" | "private",
  "postingRules": "open" | "moderated" | "admin_only",
  "location": { "lat": 30.0, "lng": 31.5 },
  "city": "القاهرة",
  "district": "التجمع الخامس"
}
// Response 201: GroupDetail
```

### `GET /groups`
```typescript
// Query: ?search=X&type=neighborhood&city=X&cursor=X&limit=20
// Response 200: paginated GroupSummary[]
```

### `GET /groups/:id`
```typescript
// Response 200: GroupDetail (includes isMember, myRole)
```

### `PATCH /groups/:id` 🔒 (admin)
```typescript
// Request (partial)
// Response 200: updated GroupDetail
```

### `DELETE /groups/:id` 🔒 (creator/platform admin)
```
// Response 204
```

### `POST /groups/:id/join` 🔒
```typescript
// Response 200 (public group)
{ "success": true, "data": { "status": "active" } }

// Response 202 (private group — request sent)
{ "success": true, "data": { "status": "pending" } }
```

### `DELETE /groups/:id/leave` 🔒
```
// Response 204
```

### `GET /groups/:id/members`
```typescript
// Query: ?cursor=X&limit=20&role=admin|moderator|member
// Response 200: paginated list of { user: UserSummary, role, joinedAt }
```

### `GET /groups/:id/posts`
```typescript
// Query: ?cursor=X&limit=20
// Response 200: paginated PostSummary[] (group feed)
```

### `POST /groups/:id/posts` 🔒 (group members)
Same as `POST /posts` but with `groupId` pre-set.

### `PATCH /groups/:id/members/:userId` 🔒 (group admin)
```typescript
// Request
{ "role": "moderator" | "member", "status": "active" | "banned" }
// Response 200
```

---

## 7. Feed

### `GET /feed` 🔒
**For You tab** — algorithmic mixed feed.
```typescript
// Query: ?cursor=X&limit=20
// Response 200
{
  "success": true,
  "data": [
    { ...PostSummary, "feedSource": "for_you", "feedReason": "trending_in_area" },
    { ...PostSummary, "feedSource": "for_you", "feedReason": "from_group" }
  ],
  "meta": { "cursor": "abc123", "hasMore": true }
}
```

### `GET /feed/following` 🔒
**Following tab** — chronological from followed users only.
```typescript
// Query: ?cursor=X&limit=20
// Response 200: same structure, feedSource = "following"
```

### `GET /feed/videos` 🔒
**Videos tab** — Reels-style, video posts only.
```typescript
// Query: ?cursor=X&limit=10
// Response 200
{
  "success": true,
  "data": [
    {
      ...PostSummary,
      "feedSource": "videos",
      "video": {
        "id": "uuid",
        "playbackUrl": "https://stream.mux.com/...",
        "thumbnailUrl": "https://image.mux.com/...",
        "duration": 45,
        "aspectRatio": "9:16"
      }
    }
  ],
  "meta": { "cursor": "...", "hasMore": true }
}
```

### `GET /feed/trending`
Trending content (hashtags + posts).
```typescript
// Response 200
{
  "success": true,
  "data": {
    "hashtags": [{ "tag": "عقارات", "postCount": 523 }],
    "posts": [ ...PostSummary[] ]
  }
}
```

---

## 8. Listings

### `POST /listings` 🔒 (Tier 2)
```typescript
// Request
{
  "titleAr": "شقة ٣ غرف في التجمع",
  "titleEn": "3BR Apartment in New Cairo",
  "descriptionAr": "...",
  "listingType": "sale" | "rent" | "commercial",
  "propertyType": "apartment" | "villa" | "office" | "land" | "duplex" | "penthouse" | "studio" | "chalet",
  "price": 2500000,
  "currency": "EGP",
  "area": 180,
  "bedrooms": 3,
  "bathrooms": 2,
  "floor": 5,
  "finishing": "fully_finished" | "semi_finished" | "core_shell",
  "amenities": ["parking", "gym", "pool", "security"],
  "location": { "lat": 30.0131, "lng": 31.4089 },
  "address": "التجمع الخامس، شارع التسعين",
  "city": "القاهرة",
  "district": "التجمع الخامس",
  "images": ["url1", "url2"],
  "videoId": "uuid | null"
}
// Response 201: ListingDetail
```

### `GET /listings`
```typescript
// Query: ?type=sale&propertyType=apartment&minPrice=X&maxPrice=X&minArea=X
//        &bedrooms=3&city=X&lat=X&lng=X&radius=5000&cursor=X&limit=20
// Response 200: paginated ListingSummary[]
```

### `GET /listings/:id`
```typescript
// Response 200: ListingDetail (includes agent info, similar listings)
```

### `PATCH /listings/:id` 🔒 (owner)
### `DELETE /listings/:id` 🔒 (owner/admin)

### `POST /listings/:id/save` 🔒
Toggle save/favorite.
```typescript
// Response 200
{ "success": true, "data": { "saved": true } }
```

### `GET /listings/saved` 🔒
```typescript
// Response 200: paginated ListingSummary[]
```

### `GET /listings/:id/similar`
```typescript
// Response 200: ListingSummary[] (max 10)
```

---

## 9. Videos

### `POST /videos/upload-url` 🔒
Get Mux direct upload URL.
```typescript
// Request
{ "duration": 45, "type": "reel" | "tour" | "tip" }

// Response 201
{
  "success": true,
  "data": {
    "videoId": "uuid",
    "uploadUrl": "https://storage.googleapis.com/mux-uploads/...",
    "maxDuration": 180
  }
}
```

### `GET /videos/:id/status`
```typescript
// Response 200
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "uploading" | "processing" | "ready" | "error",
    "playbackUrl": "https://stream.mux.com/...",
    "thumbnailUrl": "https://image.mux.com/...",
    "duration": 45,
    "aspectRatio": "9:16"
  }
}
```

### `POST /videos/:id/watch` 🔒
Track watch time (for algorithm).
```typescript
// Request
{ "watchedSeconds": 30, "totalSeconds": 45, "completed": false }
// Response 204
```

### `POST /videos/webhooks/mux`
Mux webhook handler (no auth — verified by Mux signature).

---

## 10. Search

### `GET /search`
Unified search.
```typescript
// Query: ?q=شقة&type=all|posts|users|groups|listings|hashtags&cursor=X&limit=20
// Response 200
{
  "success": true,
  "data": {
    "posts": [ ...PostSummary[] ],
    "users": [ ...UserSummary[] ],
    "groups": [ ...GroupSummary[] ],
    "listings": [ ...ListingSummary[] ],
    "hashtags": [ { "tag": "...", "postCount": 0 } ]
  }
}
```

### `GET /search/suggestions`
Autocomplete.
```typescript
// Query: ?q=شق
// Response 200
{ "success": true, "data": ["شقة", "شقق للبيع", "شقة في التجمع"] }
```

---

## 11. Conversations & Messages

### `GET /conversations` 🔒
### `POST /conversations` 🔒
```typescript
// Request
{ "recipientId": "uuid", "listingId": "uuid | null", "message": "مرحبا..." }
```
### `GET /conversations/:id` 🔒
### `WS /ws/chat` 🔒
WebSocket for real-time messaging.

---

## 12. Notifications

### `GET /notifications` 🔒
```typescript
// Query: ?cursor=X&limit=20&unreadOnly=true
// Response 200
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "like",
      "title": "أحمد عمل لايك لبوستك",
      "body": "...",
      "data": { "postId": "uuid", "userId": "uuid" },
      "readAt": null,
      "createdAt": "..."
    }
  ]
}
```

### `PATCH /notifications/read-all` 🔒
### `PATCH /notifications/:id/read` 🔒
### `POST /notifications/subscribe` 🔒
```typescript
// Request
{ "fcmToken": "...", "platform": "ios" | "android" | "web" }
```
### `GET /notifications/preferences` 🔒
### `PATCH /notifications/preferences` 🔒

---

## 13. Admin

All admin endpoints require **Tier 1 (Admin)**.

### `GET /admin/users`
### `PATCH /admin/users/:id/tier`
```typescript
// Request
{ "tier": 2, "reason": "Verified agent license" }
```
### `PATCH /admin/users/:id/verify`
### `GET /admin/posts/pending` — Approval queue
### `PATCH /admin/posts/:id/approve`
### `PATCH /admin/posts/:id/reject`
```typescript
// Request
{ "reason": "المحتوى لا يتوافق مع إرشادات المجتمع" }
```
### `GET /admin/posts/flagged` — AI-flagged queue
### `GET /admin/comments/flagged`
### `GET /admin/reports`
### `PATCH /admin/reports/:id`
```typescript
// Request
{ "status": "resolved", "actionTaken": "content_removed" | "user_suspended" | "warning" | "dismissed" }
```
### `GET /admin/groups`
### `GET /admin/analytics`
### `GET /admin/moderation/stats`

---

## Shared Types Reference

```typescript
interface UserSummary {
  id: string;
  nameAr: string;
  nameEn: string;
  avatarUrl: string | null;
  permissionTier: 1 | 2 | 3 | 4 | 5;
  isVerified: boolean;
  followerCount: number;
}

interface PostSummary {
  id: string;
  author: UserSummary;
  postType: 'text' | 'image' | 'video' | 'listing' | 'poll' | 'discussion' | 'repost';
  contentText: string | null;
  media: MediaItem[];
  hashtags: string[];
  likeCount: number;
  commentCount: number;
  shareCount: number;
  isLiked: boolean;
  isSaved: boolean;
  createdAt: string;
}

interface MediaItem {
  type: 'image' | 'video';
  url: string;
  thumbnailUrl: string | null;
  width: number;
  height: number;
  order: number;
}

interface GroupSummary {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  groupType: 'neighborhood' | 'topic' | 'compound' | 'custom';
  privacy: 'public' | 'private';
  memberCount: number;
  avatarUrl: string | null;
}

interface ListingSummary {
  id: string;
  titleAr: string;
  titleEn: string;
  listingType: 'sale' | 'rent' | 'commercial';
  propertyType: string;
  price: number;
  currency: 'EGP';
  area: number;
  bedrooms: number;
  bathrooms: number;
  city: string;
  district: string;
  thumbnailUrl: string;
  isSaved: boolean;
}
```

---

*This spec is the source of truth for AI code generation. Always match these schemas exactly.*
