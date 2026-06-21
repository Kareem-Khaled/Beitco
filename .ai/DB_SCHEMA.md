> ⚠️ **STALE — pre-pivot doc.** Beitco pivoted to a trust-first **bed-level housing marketplace** (June 2026). This doc describes the old social-network/real-estate model. The **rewrite to the bed-level + trust schema is tracked as task B-0 in `.ai/BACKEND_TASKS.md`**, sourced from `apps/web/src/lib/beitco/types.ts`. Trust `.ai/ENTRY_PROMPT.md`, `.ai/CURRENT_STATE.md`, `.ai/BACKEND_TASKS.md`, and `.ai/TASKS.md` instead. Kept for historical reference only.

---

# Beitco — Database Schema

> **Complete Prisma schema reference. Copy directly into `apps/api/prisma/schema.prisma`.**

---

## Prisma Config

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [postgis]
}
```

---

## Enums

```prisma
enum UserRole {
  buyer
  seller
  agent
  agency_admin
  admin
}

enum PermissionTier {
  admin             // Tier 1
  verified_contributor // Tier 2
  trusted_member    // Tier 3
  new_user          // Tier 4
  restricted        // Tier 5
}

enum PostType {
  text
  image
  video
  listing
  poll
  discussion
  repost
}

enum PostStatus {
  published
  pending_approval
  rejected
  hidden
  deleted
}

enum ApprovalStatus {
  auto_approved
  pending
  approved
  rejected
}

enum CommentStatus {
  visible
  hidden
  deleted
}

enum LikeTargetType {
  post
  comment
}

enum ShareType {
  whatsapp
  in_app_repost
  copy_link
  instagram
  facebook
}

enum GroupType {
  neighborhood
  topic
  compound
  custom
}

enum GroupPrivacy {
  public
  private
}

enum PostingRules {
  open
  moderated
  admin_only
}

enum GroupMemberRole {
  member
  moderator
  admin
}

enum GroupMemberStatus {
  active
  pending
  banned
}

enum ListingType {
  sale
  rent
  commercial
}

enum PropertyType {
  apartment
  villa
  office
  land
  duplex
  penthouse
  studio
  chalet
  townhouse
  twin_house
}

enum FinishingType {
  fully_finished
  semi_finished
  core_shell
}

enum ListingStatus {
  active
  pending
  sold
  rented
  expired
}

enum VideoStatus {
  uploading
  processing
  ready
  error
}

enum ReportReason {
  spam
  inappropriate
  fake
  harassment
  fraud
  other
}

enum ReportStatus {
  pending
  reviewed
  resolved
  dismissed
}

enum ReportAction {
  none
  warning
  content_removed
  user_suspended
  user_banned
}

enum NotificationType {
  message
  match
  price_drop
  listing_status
  follow
  like
  comment
  share
  group_activity
  post_approval
  mention
  system
}
```

---

## Models

```prisma
// ─── USERS ─────────────────────────────────────────────

model User {
  id                    String          @id @default(uuid()) @db.Uuid
  phone                 String          @unique
  email                 String?         @unique
  nameAr                String          @map("name_ar")
  nameEn                String?         @map("name_en")
  role                  UserRole        @default(buyer)
  permissionTier        PermissionTier  @default(new_user) @map("permission_tier")
  avatarUrl             String?         @map("avatar_url")
  coverPhotoUrl         String?         @map("cover_photo_url")
  bio                   String?
  nationalIdVerified    Boolean         @default(false) @map("national_id_verified")
  agentLicenseVerified  Boolean         @default(false) @map("agent_license_verified")
  trustScore            Int             @default(0) @map("trust_score")
  reputationScore       Int             @default(0) @map("reputation_score")
  followerCount         Int             @default(0) @map("follower_count")
  followingCount        Int             @default(0) @map("following_count")
  postCount             Int             @default(0) @map("post_count")
  preferences           Json            @default("{}")
  createdAt             DateTime        @default(now()) @map("created_at")
  updatedAt             DateTime        @updatedAt @map("updated_at")
  deletedAt             DateTime?       @map("deleted_at")

  // Relations
  posts                 Post[]          @relation("PostAuthor")
  comments              Comment[]       @relation("CommentAuthor")
  likes                 Like[]
  followers             Follow[]        @relation("Following") // people following this user
  following             Follow[]        @relation("Follower")  // people this user follows
  blockedBy             Block[]         @relation("Blocked")
  blocking              Block[]         @relation("Blocker")
  groups                GroupMember[]
  createdGroups         Group[]         @relation("GroupCreator")
  listings              Listing[]
  videos                Video[]
  shares                Share[]
  reports               Report[]        @relation("Reporter")
  notifications         Notification[]
  reviewsGiven          Review[]        @relation("ReviewAuthor")
  reviewsReceived       Review[]        @relation("ReviewTarget")
  conversations         ConversationParticipant[]
  messages              Message[]
  savedListings         SavedListing[]
  savedSearches         SavedSearch[]
  pollVotes             PollVote[]
  approvedPosts         Post[]          @relation("PostApprover")

  @@index([phone])
  @@index([email])
  @@index([permissionTier])
  @@index([createdAt])
  @@map("users")
}

// ─── POSTS ─────────────────────────────────────────────

model Post {
  id                  String          @id @default(uuid()) @db.Uuid
  authorId            String          @map("author_id") @db.Uuid
  postType            PostType        @map("post_type")
  contentText         String?         @map("content_text")
  contentAr           String?         @map("content_ar")
  media               Json            @default("[]") // MediaItem[]
  listingId           String?         @map("listing_id") @db.Uuid
  videoId             String?         @map("video_id") @db.Uuid
  groupId             String?         @map("group_id") @db.Uuid
  repostOfId          String?         @map("repost_of_id") @db.Uuid
  hashtags            String[]        @default([])
  status              PostStatus      @default(pending_approval)
  approvalStatus      ApprovalStatus  @default(pending) @map("approval_status")
  approvalReviewedBy  String?         @map("approval_reviewed_by") @db.Uuid
  approvalReviewedAt  DateTime?       @map("approval_reviewed_at")
  rejectionReason     String?         @map("rejection_reason")
  aiQualityScore      Int             @default(0) @map("ai_quality_score")
  aiModerationFlags   Json            @default("[]") @map("ai_moderation_flags")
  likeCount           Int             @default(0) @map("like_count")
  commentCount        Int             @default(0) @map("comment_count")
  shareCount          Int             @default(0) @map("share_count")
  viewCount           Int             @default(0) @map("view_count")
  isPinned            Boolean         @default(false) @map("is_pinned")
  metadata            Json            @default("{}") // location, mentions, pollOptions
  createdAt           DateTime        @default(now()) @map("created_at")
  updatedAt           DateTime        @updatedAt @map("updated_at")
  deletedAt           DateTime?       @map("deleted_at")

  // Relations
  author              User            @relation("PostAuthor", fields: [authorId], references: [id])
  approver            User?           @relation("PostApprover", fields: [approvalReviewedBy], references: [id])
  listing             Listing?        @relation(fields: [listingId], references: [id])
  video               Video?          @relation(fields: [videoId], references: [id])
  group               Group?          @relation(fields: [groupId], references: [id])
  repostOf            Post?           @relation("Reposts", fields: [repostOfId], references: [id])
  reposts             Post[]          @relation("Reposts")
  comments            Comment[]
  likes               Like[]          @relation("PostLikes")
  shares              Share[]
  pollVotes           PollVote[]
  reports             Report[]        @relation("PostReports")

  @@index([authorId])
  @@index([groupId])
  @@index([status])
  @@index([createdAt])
  @@index([postType])
  @@index([hashtags], type: Gin)
  @@map("posts")
}

// ─── COMMENTS ──────────────────────────────────────────

model Comment {
  id                String         @id @default(uuid()) @db.Uuid
  postId            String         @map("post_id") @db.Uuid
  authorId          String         @map("author_id") @db.Uuid
  parentCommentId   String?        @map("parent_comment_id") @db.Uuid
  content           String         @db.VarChar(500)
  likeCount         Int            @default(0) @map("like_count")
  isPinned          Boolean        @default(false) @map("is_pinned")
  status            CommentStatus  @default(visible)
  aiModerationFlags Json           @default("[]") @map("ai_moderation_flags")
  metadata          Json           @default("{}")
  createdAt         DateTime       @default(now()) @map("created_at")
  updatedAt         DateTime       @updatedAt @map("updated_at")
  deletedAt         DateTime?      @map("deleted_at")

  // Relations
  post              Post           @relation(fields: [postId], references: [id])
  author            User           @relation("CommentAuthor", fields: [authorId], references: [id])
  parentComment     Comment?       @relation("CommentReplies", fields: [parentCommentId], references: [id])
  replies           Comment[]      @relation("CommentReplies")
  likes             Like[]         @relation("CommentLikes")
  reports           Report[]       @relation("CommentReports")

  @@index([postId])
  @@index([authorId])
  @@index([parentCommentId])
  @@index([createdAt])
  @@map("comments")
}

// ─── LIKES ─────────────────────────────────────────────

model Like {
  id          String         @id @default(uuid()) @db.Uuid
  userId      String         @map("user_id") @db.Uuid
  targetType  LikeTargetType @map("target_type")
  postId      String?        @map("post_id") @db.Uuid
  commentId   String?        @map("comment_id") @db.Uuid
  createdAt   DateTime       @default(now()) @map("created_at")

  // Relations
  user        User           @relation(fields: [userId], references: [id])
  post        Post?          @relation("PostLikes", fields: [postId], references: [id])
  comment     Comment?       @relation("CommentLikes", fields: [commentId], references: [id])

  @@unique([userId, targetType, postId, commentId], name: "unique_like")
  @@index([userId])
  @@index([postId])
  @@index([commentId])
  @@map("likes")
}

// ─── FOLLOWS ───────────────────────────────────────────

model Follow {
  id          String   @id @default(uuid()) @db.Uuid
  followerId  String   @map("follower_id") @db.Uuid
  followingId String   @map("following_id") @db.Uuid
  createdAt   DateTime @default(now()) @map("created_at")

  // Relations
  follower    User     @relation("Follower", fields: [followerId], references: [id])
  following   User     @relation("Following", fields: [followingId], references: [id])

  @@unique([followerId, followingId])
  @@index([followerId])
  @@index([followingId])
  @@map("follows")
}

// ─── BLOCKS ────────────────────────────────────────────

model Block {
  id        String   @id @default(uuid()) @db.Uuid
  blockerId String   @map("blocker_id") @db.Uuid
  blockedId String   @map("blocked_id") @db.Uuid
  createdAt DateTime @default(now()) @map("created_at")

  // Relations
  blocker   User     @relation("Blocker", fields: [blockerId], references: [id])
  blocked   User     @relation("Blocked", fields: [blockedId], references: [id])

  @@unique([blockerId, blockedId])
  @@index([blockerId])
  @@index([blockedId])
  @@map("blocks")
}

// ─── GROUPS ────────────────────────────────────────────

model Group {
  id              String        @id @default(uuid()) @db.Uuid
  nameAr          String        @map("name_ar")
  nameEn          String?       @map("name_en")
  slug            String        @unique
  descriptionAr   String?       @map("description_ar")
  descriptionEn   String?       @map("description_en")
  groupType       GroupType     @map("group_type")
  coverPhotoUrl   String?       @map("cover_photo_url")
  avatarUrl       String?       @map("avatar_url")
  privacy         GroupPrivacy  @default(public)
  postingRules    PostingRules  @default(open) @map("posting_rules")
  // PostGIS: stored as Unsupported for Prisma, use raw SQL for geo queries
  locationLat     Float?        @map("location_lat")
  locationLng     Float?        @map("location_lng")
  city            String?
  district        String?
  creatorId       String        @map("creator_id") @db.Uuid
  memberCount     Int           @default(0) @map("member_count")
  postCount       Int           @default(0) @map("post_count")
  settings        Json          @default("{}") // allowed_post_types, auto_approve_tier2, etc.
  createdAt       DateTime      @default(now()) @map("created_at")
  updatedAt       DateTime      @updatedAt @map("updated_at")
  deletedAt       DateTime?     @map("deleted_at")

  // Relations
  creator         User          @relation("GroupCreator", fields: [creatorId], references: [id])
  members         GroupMember[]
  posts           Post[]

  @@index([slug])
  @@index([groupType])
  @@index([city])
  @@index([createdAt])
  @@map("groups")
}

model GroupMember {
  id       String            @id @default(uuid()) @db.Uuid
  groupId  String            @map("group_id") @db.Uuid
  userId   String            @map("user_id") @db.Uuid
  role     GroupMemberRole    @default(member)
  joinedAt DateTime          @default(now()) @map("joined_at")
  status   GroupMemberStatus  @default(active)

  // Relations
  group    Group              @relation(fields: [groupId], references: [id])
  user     User               @relation(fields: [userId], references: [id])

  @@unique([groupId, userId])
  @@index([groupId])
  @@index([userId])
  @@map("group_members")
}

// ─── SHARES ────────────────────────────────────────────

model Share {
  id        String    @id @default(uuid()) @db.Uuid
  userId    String    @map("user_id") @db.Uuid
  postId    String    @map("post_id") @db.Uuid
  shareType ShareType @map("share_type")
  metadata  Json      @default("{}")
  createdAt DateTime  @default(now()) @map("created_at")

  // Relations
  user      User      @relation(fields: [userId], references: [id])
  post      Post      @relation(fields: [postId], references: [id])

  @@index([userId])
  @@index([postId])
  @@map("shares")
}

// ─── REPORTS ───────────────────────────────────────────

model Report {
  id              String       @id @default(uuid()) @db.Uuid
  reporterId      String       @map("reporter_id") @db.Uuid
  targetType      String       @map("target_type") // post | comment | user | group | listing
  targetPostId    String?      @map("target_post_id") @db.Uuid
  targetCommentId String?      @map("target_comment_id") @db.Uuid
  targetUserId    String?      @map("target_user_id") @db.Uuid
  targetListingId String?      @map("target_listing_id") @db.Uuid
  reason          ReportReason
  details         String?
  status          ReportStatus @default(pending)
  reviewedBy      String?      @map("reviewed_by") @db.Uuid
  actionTaken     ReportAction @default(none) @map("action_taken")
  aiSeverityScore Int          @default(0) @map("ai_severity_score")
  createdAt       DateTime     @default(now()) @map("created_at")
  reviewedAt      DateTime?    @map("reviewed_at")

  // Relations
  reporter        User         @relation("Reporter", fields: [reporterId], references: [id])
  targetPost      Post?        @relation("PostReports", fields: [targetPostId], references: [id])
  targetComment   Comment?     @relation("CommentReports", fields: [targetCommentId], references: [id])

  @@index([reporterId])
  @@index([status])
  @@index([createdAt])
  @@map("reports")
}

// ─── LISTINGS ──────────────────────────────────────────

model Listing {
  id            String        @id @default(uuid()) @db.Uuid
  agentId       String        @map("agent_id") @db.Uuid
  titleAr       String        @map("title_ar")
  titleEn       String?       @map("title_en")
  descriptionAr String?       @map("description_ar")
  descriptionEn String?       @map("description_en")
  listingType   ListingType   @map("listing_type")
  propertyType  PropertyType  @map("property_type")
  price         Decimal       @db.Decimal(12, 2)
  currency      String        @default("EGP") @db.VarChar(3)
  area          Float // sqm
  bedrooms      Int?
  bathrooms     Int?
  floor         Int?
  finishing     FinishingType?
  amenities     String[]      @default([])
  images        String[]      @default([])
  locationLat   Float?        @map("location_lat")
  locationLng   Float?        @map("location_lng")
  address       String?
  city          String?
  district      String?
  compound      String?
  status        ListingStatus @default(active)
  viewCount     Int           @default(0) @map("view_count")
  saveCount     Int           @default(0) @map("save_count")
  inquiryCount  Int           @default(0) @map("inquiry_count")
  expiresAt     DateTime?     @map("expires_at")
  createdAt     DateTime      @default(now()) @map("created_at")
  updatedAt     DateTime      @updatedAt @map("updated_at")
  deletedAt     DateTime?     @map("deleted_at")

  // Relations
  agent         User          @relation(fields: [agentId], references: [id])
  posts         Post[]
  videos        Video[]
  savedBy       SavedListing[]
  reports       Report[]      @relation("ListingReports")

  @@index([agentId])
  @@index([listingType])
  @@index([propertyType])
  @@index([price])
  @@index([city])
  @@index([status])
  @@index([createdAt])
  // PostGIS index added via raw SQL migration:
  // CREATE INDEX listings_location_idx ON listings USING GIST (ST_MakePoint(location_lng, location_lat)::geography);
  @@map("listings")
}

// ─── VIDEOS ────────────────────────────────────────────

model Video {
  id            String      @id @default(uuid()) @db.Uuid
  uploaderId    String      @map("uploader_id") @db.Uuid
  listingId     String?     @map("listing_id") @db.Uuid
  muxAssetId    String?     @map("mux_asset_id")
  muxPlaybackId String?     @map("mux_playback_id")
  muxUploadId   String?     @map("mux_upload_id")
  status        VideoStatus @default(uploading)
  playbackUrl   String?     @map("playback_url")
  thumbnailUrl  String?     @map("thumbnail_url")
  duration      Int?        // seconds
  aspectRatio   String?     @map("aspect_ratio") @db.VarChar(10) // "9:16", "16:9"
  watchCount    Int         @default(0) @map("watch_count")
  totalWatchTime Int        @default(0) @map("total_watch_time") // seconds
  metadata      Json        @default("{}")
  createdAt     DateTime    @default(now()) @map("created_at")
  updatedAt     DateTime    @updatedAt @map("updated_at")

  // Relations
  uploader      User        @relation(fields: [uploaderId], references: [id])
  listing       Listing?    @relation(fields: [listingId], references: [id])
  posts         Post[]

  @@index([uploaderId])
  @@index([listingId])
  @@index([status])
  @@map("videos")
}

// ─── CONVERSATIONS & MESSAGES ──────────────────────────

model Conversation {
  id            String                      @id @default(uuid()) @db.Uuid
  listingId     String?                     @map("listing_id") @db.Uuid
  lastMessageAt DateTime?                   @map("last_message_at")
  createdAt     DateTime                    @default(now()) @map("created_at")

  // Relations
  participants  ConversationParticipant[]
  messages      Message[]

  @@index([lastMessageAt])
  @@map("conversations")
}

model ConversationParticipant {
  id             String       @id @default(uuid()) @db.Uuid
  conversationId String       @map("conversation_id") @db.Uuid
  userId         String       @map("user_id") @db.Uuid
  lastReadAt     DateTime?    @map("last_read_at")
  joinedAt       DateTime     @default(now()) @map("joined_at")

  // Relations
  conversation   Conversation @relation(fields: [conversationId], references: [id])
  user           User         @relation(fields: [userId], references: [id])

  @@unique([conversationId, userId])
  @@index([userId])
  @@map("conversation_participants")
}

model Message {
  id             String       @id @default(uuid()) @db.Uuid
  conversationId String       @map("conversation_id") @db.Uuid
  senderId       String       @map("sender_id") @db.Uuid
  content        String
  messageType    String       @default("text") @map("message_type") @db.VarChar(20) // text | image | listing_card
  metadata       Json         @default("{}")
  createdAt      DateTime     @default(now()) @map("created_at")
  deletedAt      DateTime?    @map("deleted_at")

  // Relations
  conversation   Conversation @relation(fields: [conversationId], references: [id])
  sender         User         @relation(fields: [senderId], references: [id])

  @@index([conversationId])
  @@index([senderId])
  @@index([createdAt])
  @@map("messages")
}

// ─── REVIEWS ───────────────────────────────────────────

model Review {
  id         String   @id @default(uuid()) @db.Uuid
  authorId   String   @map("author_id") @db.Uuid
  targetId   String   @map("target_id") @db.Uuid // agent user id
  rating     Int      @db.SmallInt // 1-5
  content    String?
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  // Relations
  author     User     @relation("ReviewAuthor", fields: [authorId], references: [id])
  target     User     @relation("ReviewTarget", fields: [targetId], references: [id])

  @@unique([authorId, targetId])
  @@index([targetId])
  @@map("reviews")
}

// ─── SAVED LISTINGS ────────────────────────────────────

model SavedListing {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  listingId String   @map("listing_id") @db.Uuid
  createdAt DateTime @default(now()) @map("created_at")

  // Relations
  user      User     @relation(fields: [userId], references: [id])
  listing   Listing  @relation(fields: [listingId], references: [id])

  @@unique([userId, listingId])
  @@map("saved_listings")
}

// ─── SAVED SEARCHES ────────────────────────────────────

model SavedSearch {
  id         String   @id @default(uuid()) @db.Uuid
  userId     String   @map("user_id") @db.Uuid
  name       String?
  filters    Json     // { listingType, minPrice, maxPrice, bedrooms, city, etc. }
  alertsOn   Boolean  @default(true) @map("alerts_on")
  createdAt  DateTime @default(now()) @map("created_at")

  // Relations
  user       User     @relation(fields: [userId], references: [id])

  @@index([userId])
  @@map("saved_searches")
}

// ─── NOTIFICATIONS ─────────────────────────────────────

model Notification {
  id        String           @id @default(uuid()) @db.Uuid
  userId    String           @map("user_id") @db.Uuid
  type      NotificationType
  title     String
  body      String?
  data      Json             @default("{}") // { postId, userId, groupId, etc. }
  readAt    DateTime?        @map("read_at")
  createdAt DateTime         @default(now()) @map("created_at")

  // Relations
  user      User             @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([readAt])
  @@index([createdAt])
  @@map("notifications")
}

// ─── POLL VOTES ────────────────────────────────────────

model PollVote {
  id          String   @id @default(uuid()) @db.Uuid
  postId      String   @map("post_id") @db.Uuid
  userId      String   @map("user_id") @db.Uuid
  optionIndex Int      @map("option_index")
  createdAt   DateTime @default(now()) @map("created_at")

  // Relations
  post        Post     @relation(fields: [postId], references: [id])
  user        User     @relation(fields: [userId], references: [id])

  @@unique([postId, userId])
  @@index([postId])
  @@map("poll_votes")
}

// ─── HASHTAGS ──────────────────────────────────────────

model Hashtag {
  id            String   @id @default(uuid()) @db.Uuid
  tag           String   @unique
  postCount     Int      @default(0) @map("post_count")
  trendingScore Float    @default(0) @map("trending_score")
  createdAt     DateTime @default(now()) @map("created_at")

  @@index([tag])
  @@index([trendingScore])
  @@map("hashtags")
}
```

---

## Raw SQL Migrations (run after Prisma migrate)

```sql
-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- GiST index for geo queries on listings
CREATE INDEX IF NOT EXISTS listings_location_gist_idx
ON listings USING GIST (
  ST_MakePoint(location_lng, location_lat)::geography
);

-- GiST index for geo queries on groups
CREATE INDEX IF NOT EXISTS groups_location_gist_idx
ON groups USING GIST (
  ST_MakePoint(location_lng, location_lat)::geography
);

-- Example: Find listings within 5km
-- SELECT * FROM listings
-- WHERE ST_DWithin(
--   ST_MakePoint(location_lng, location_lat)::geography,
--   ST_MakePoint(31.4089, 30.0131)::geography,
--   5000
-- );
```

---

## Table Summary

| Table | Rows (est. Year 1) | Key Indexes |
|-------|-------------------|-------------|
| users | 50K | phone, email, tier, created_at |
| posts | 200K | author_id, group_id, status, created_at, hashtags (GIN) |
| comments | 500K | post_id, author_id, created_at |
| likes | 2M | user_id+target (unique), post_id, comment_id |
| follows | 300K | follower_id, following_id (unique) |
| blocks | 10K | blocker_id, blocked_id (unique) |
| groups | 500 | slug, type, city |
| group_members | 50K | group_id+user_id (unique) |
| shares | 100K | user_id, post_id |
| reports | 5K | status, created_at |
| listings | 30K | agent_id, type, property_type, price, city, location (GiST) |
| videos | 50K | uploader_id, status |
| conversations | 100K | last_message_at |
| messages | 1M | conversation_id, created_at |
| notifications | 5M | user_id, read_at, created_at |
| hashtags | 10K | tag (unique), trending_score |
| poll_votes | 50K | post_id+user_id (unique) |

---

*This schema is the source of truth. When creating the Prisma schema file, copy the Models and Enums sections directly.*
