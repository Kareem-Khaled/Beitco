// ─── Enums ──────────────────────────────────────────

export const UserRole = {
  BUYER: 'buyer',
  SELLER: 'seller',
  AGENT: 'agent',
  AGENCY_ADMIN: 'agency_admin',
  ADMIN: 'admin',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const PermissionTier = {
  ADMIN: 'admin',
  VERIFIED_CONTRIBUTOR: 'verified_contributor',
  TRUSTED_MEMBER: 'trusted_member',
  NEW_USER: 'new_user',
  RESTRICTED: 'restricted',
} as const;
export type PermissionTier = (typeof PermissionTier)[keyof typeof PermissionTier];

export const TIER_LEVEL: Record<PermissionTier, number> = {
  admin: 1,
  verified_contributor: 2,
  trusted_member: 3,
  new_user: 4,
  restricted: 5,
};

export const PostType = {
  TEXT: 'text',
  IMAGE: 'image',
  VIDEO: 'video',
  LISTING: 'listing',
  POLL: 'poll',
  DISCUSSION: 'discussion',
  REPOST: 'repost',
} as const;
export type PostType = (typeof PostType)[keyof typeof PostType];

export const PostStatus = {
  PUBLISHED: 'published',
  PENDING_APPROVAL: 'pending_approval',
  REJECTED: 'rejected',
  HIDDEN: 'hidden',
  DELETED: 'deleted',
} as const;
export type PostStatus = (typeof PostStatus)[keyof typeof PostStatus];

export const ApprovalStatus = {
  AUTO_APPROVED: 'auto_approved',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;
export type ApprovalStatus = (typeof ApprovalStatus)[keyof typeof ApprovalStatus];

export const GroupType = {
  NEIGHBORHOOD: 'neighborhood',
  TOPIC: 'topic',
  COMPOUND: 'compound',
  CUSTOM: 'custom',
} as const;
export type GroupType = (typeof GroupType)[keyof typeof GroupType];

export const ListingType = {
  SALE: 'sale',
  RENT: 'rent',
  COMMERCIAL: 'commercial',
} as const;
export type ListingType = (typeof ListingType)[keyof typeof ListingType];

export const PropertyType = {
  APARTMENT: 'apartment',
  VILLA: 'villa',
  OFFICE: 'office',
  LAND: 'land',
  DUPLEX: 'duplex',
  PENTHOUSE: 'penthouse',
  STUDIO: 'studio',
  CHALET: 'chalet',
  TOWNHOUSE: 'townhouse',
  TWIN_HOUSE: 'twin_house',
} as const;
export type PropertyType = (typeof PropertyType)[keyof typeof PropertyType];

export const CommentStatus = {
  VISIBLE: 'visible',
  HIDDEN: 'hidden',
  DELETED: 'deleted',
} as const;
export type CommentStatus = (typeof CommentStatus)[keyof typeof CommentStatus];

export const LikeTargetType = {
  POST: 'post',
  COMMENT: 'comment',
} as const;
export type LikeTargetType = (typeof LikeTargetType)[keyof typeof LikeTargetType];

export const ShareType = {
  WHATSAPP: 'whatsapp',
  IN_APP_REPOST: 'in_app_repost',
  COPY_LINK: 'copy_link',
  INSTAGRAM: 'instagram',
  FACEBOOK: 'facebook',
} as const;
export type ShareType = (typeof ShareType)[keyof typeof ShareType];

export const GroupPrivacy = {
  PUBLIC: 'public',
  PRIVATE: 'private',
} as const;
export type GroupPrivacy = (typeof GroupPrivacy)[keyof typeof GroupPrivacy];

export const PostingRules = {
  OPEN: 'open',
  MODERATED: 'moderated',
  ADMIN_ONLY: 'admin_only',
} as const;
export type PostingRules = (typeof PostingRules)[keyof typeof PostingRules];

export const GroupMemberRole = {
  MEMBER: 'member',
  MODERATOR: 'moderator',
  ADMIN: 'admin',
} as const;
export type GroupMemberRole = (typeof GroupMemberRole)[keyof typeof GroupMemberRole];

export const GroupMemberStatus = {
  ACTIVE: 'active',
  PENDING: 'pending',
  BANNED: 'banned',
} as const;
export type GroupMemberStatus = (typeof GroupMemberStatus)[keyof typeof GroupMemberStatus];

export const FinishingType = {
  FULLY_FINISHED: 'fully_finished',
  SEMI_FINISHED: 'semi_finished',
  CORE_SHELL: 'core_shell',
} as const;
export type FinishingType = (typeof FinishingType)[keyof typeof FinishingType];

export const ListingStatus = {
  ACTIVE: 'active',
  PENDING: 'pending',
  SOLD: 'sold',
  RENTED: 'rented',
  EXPIRED: 'expired',
} as const;
export type ListingStatus = (typeof ListingStatus)[keyof typeof ListingStatus];

export const VideoStatus = {
  UPLOADING: 'uploading',
  PROCESSING: 'processing',
  READY: 'ready',
  ERROR: 'error',
} as const;
export type VideoStatus = (typeof VideoStatus)[keyof typeof VideoStatus];

export const ReportReason = {
  SPAM: 'spam',
  INAPPROPRIATE: 'inappropriate',
  FAKE: 'fake',
  HARASSMENT: 'harassment',
  FRAUD: 'fraud',
  OTHER: 'other',
} as const;
export type ReportReason = (typeof ReportReason)[keyof typeof ReportReason];

export const ReportStatus = {
  PENDING: 'pending',
  REVIEWED: 'reviewed',
  RESOLVED: 'resolved',
  DISMISSED: 'dismissed',
} as const;
export type ReportStatus = (typeof ReportStatus)[keyof typeof ReportStatus];

export const ReportAction = {
  NONE: 'none',
  WARNING: 'warning',
  CONTENT_REMOVED: 'content_removed',
  USER_SUSPENDED: 'user_suspended',
  USER_BANNED: 'user_banned',
} as const;
export type ReportAction = (typeof ReportAction)[keyof typeof ReportAction];

export const NotificationType = {
  MESSAGE: 'message',
  MATCH: 'match',
  PRICE_DROP: 'price_drop',
  LISTING_STATUS: 'listing_status',
  FOLLOW: 'follow',
  LIKE: 'like',
  COMMENT: 'comment',
  SHARE: 'share',
  GROUP_ACTIVITY: 'group_activity',
  POST_APPROVAL: 'post_approval',
  MENTION: 'mention',
  SYSTEM: 'system',
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

export const FeedTab = {
  FOR_YOU: 'for_you',
  FOLLOWING: 'following',
  VIDEOS: 'videos',
} as const;
export type FeedTab = (typeof FeedTab)[keyof typeof FeedTab];
