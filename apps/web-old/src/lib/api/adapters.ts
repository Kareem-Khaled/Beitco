/**
 * Adapters: Map @beitco/types (backend API responses) → v0 display types (frontend)
 *
 * The frontend was built with v0's simplified types. Rather than rewriting all 29 pages,
 * we adapt backend responses to match the existing frontend interface.
 */

import type {
  UserSummary,
  UserProfile,
  PostSummary,
  ListingSummary,
  ListingDetail,
  CommentSummary,
  CommentThread,
  GroupSummary,
  GroupDetail,
  ConversationSummary,
  NotificationItem,
} from '@beitco/types';

import type {
  User,
  Post,
  Listing,
  Comment,
  Conversation,
  Group,
  Notification,
} from '@/lib/types';

// ─── User Adapters ──────────────────────────────────

const TIER_MAP: Record<string, 1 | 2 | 3 | 4 | 5> = {
  admin: 1,
  verified_contributor: 2,
  trusted_member: 3,
  new_user: 4,
  restricted: 5,
};

export function adaptUserSummary(u: UserSummary, locale: string = 'ar'): User {
  return {
    id: u.id,
    name: locale === 'ar' ? u.nameAr : (u.nameEn ?? u.nameAr),
    avatar: u.avatarUrl ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`,
    bio: undefined,
    city: '',
    role: 'buyer',
    tier: TIER_MAP[u.permissionTier] ?? 4,
    isVerified: u.isVerified,
    followers: u.followerCount,
    following: 0,
    posts: 0,
  };
}

export function adaptUserProfile(u: UserProfile, locale: string = 'ar'): User {
  return {
    id: u.id,
    name: locale === 'ar' ? u.nameAr : (u.nameEn ?? u.nameAr),
    avatar: u.avatarUrl ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`,
    bio: u.bio ?? undefined,
    city: '',
    role: u.role as User['role'],
    tier: TIER_MAP[u.permissionTier] ?? 4,
    isVerified: u.isVerified,
    followers: u.followerCount,
    following: u.followingCount,
    posts: u.postCount,
    phone: u.phone,
  };
}

// ─── Post Adapters ──────────────────────────────────

export function adaptPost(p: PostSummary, locale: string = 'ar'): Post {
  return {
    id: p.id,
    author: adaptUserSummary(p.author, locale),
    content: p.contentText ?? '',
    images: p.media.filter(m => m.type === 'image').map(m => m.url),
    video: p.media.find(m => m.type === 'video')?.url,
    likes: p.likeCount,
    comments: p.commentCount,
    shares: p.shareCount,
    isLiked: p.isLiked,
    isSaved: p.isSaved,
    createdAt: p.createdAt,
    type: p.postType as Post['type'],
  };
}

// ─── Listing Adapters ───────────────────────────────

export function adaptListingSummary(l: ListingSummary, locale: string = 'ar'): Listing {
  return {
    id: l.id,
    title: locale === 'ar' ? l.titleAr : (l.titleEn ?? l.titleAr),
    price: l.price,
    currency: 'EGP',
    type: l.propertyType as Listing['type'],
    purpose: l.listingType === 'rent' ? 'rent' : 'sale',
    location: {
      city: l.city ?? '',
      area: l.district ?? '',
    },
    specs: {
      bedrooms: l.bedrooms ?? 0,
      bathrooms: l.bathrooms ?? 0,
      area: l.area,
    },
    features: {
      finishing: 'finished',
      furnished: false,
    },
    description: '',
    images: l.images,
    agent: {
      id: '',
      name: '',
      avatar: '',
      city: '',
      role: 'agent',
      tier: 2,
      isVerified: true,
      followers: 0,
      following: 0,
      posts: 0,
    },
    views: 0,
    createdAt: l.createdAt,
  };
}

export function adaptListingDetail(l: ListingDetail, locale: string = 'ar'): Listing {
  const finishing = l.finishing === 'fully_finished'
    ? 'finished'
    : l.finishing === 'semi_finished'
      ? 'semi-finished'
      : 'unfinished';

  return {
    id: l.id,
    title: locale === 'ar' ? l.titleAr : (l.titleEn ?? l.titleAr),
    price: l.price,
    currency: 'EGP',
    type: l.propertyType as Listing['type'],
    purpose: l.listingType === 'rent' ? 'rent' : 'sale',
    location: {
      city: l.city ?? '',
      area: l.district ?? '',
      address: l.address ?? undefined,
    },
    specs: {
      bedrooms: l.bedrooms ?? 0,
      bathrooms: l.bathrooms ?? 0,
      area: l.area,
    },
    features: {
      finishing: finishing as Listing['features']['finishing'],
      floor: l.floor ?? undefined,
      furnished: l.amenities.includes('furnished'),
    },
    description: locale === 'ar'
      ? (l.descriptionAr ?? '')
      : (l.descriptionEn ?? l.descriptionAr ?? ''),
    images: l.images,
    agent: adaptUserSummary(l.agent, locale),
    views: l.viewCount,
    createdAt: l.createdAt,
  };
}

// ─── Comment Adapters ───────────────────────────────

export function adaptComment(c: CommentSummary, locale: string = 'ar'): Comment {
  return {
    id: c.id,
    author: adaptUserSummary(c.author, locale),
    content: c.content,
    likes: c.likeCount,
    isLiked: c.isLiked,
    createdAt: c.createdAt,
    isPinned: c.isPinned,
    replies: undefined,
  };
}

export function adaptCommentThread(c: CommentThread, locale: string = 'ar'): Comment {
  return {
    ...adaptComment(c, locale),
    replies: c.replies.map(r => adaptComment(r, locale)),
  };
}

// ─── Group Adapters ─────────────────────────────────

export function adaptGroup(g: GroupSummary | GroupDetail, locale: string = 'ar'): Group {
  return {
    id: g.id,
    name: locale === 'ar' ? g.nameAr : (g.nameEn ?? g.nameAr),
    description: 'descriptionAr' in g
      ? (locale === 'ar' ? (g.descriptionAr ?? '') : (g.descriptionEn ?? g.descriptionAr ?? ''))
      : '',
    coverImage: g.coverPhotoUrl ?? '',
    memberCount: g.memberCount,
    isJoined: g.isMember,
  };
}

// ─── Conversation Adapters ──────────────────────────

export function adaptConversation(c: ConversationSummary, locale: string = 'ar'): Conversation {
  const participant = c.participants[0];
  return {
    id: c.id,
    participant: participant ? adaptUserSummary(participant, locale) : {
      id: '', name: '', avatar: '', city: '', role: 'buyer', tier: 4,
      isVerified: false, followers: 0, following: 0, posts: 0,
    },
    lastMessage: c.lastMessage?.content ?? '',
    lastMessageTime: c.updatedAt,
    unreadCount: c.unreadCount,
    type: c.listingId ? 'listing' : 'direct',
  };
}

// ─── Notification Adapters ──────────────────────────

const NOTIFICATION_TYPE_MAP: Record<string, Notification['type']> = {
  like: 'like',
  comment: 'comment',
  follow: 'follow',
  post_approval: 'approval',
  match: 'listing_match',
  price_drop: 'price_drop',
};

export function adaptNotification(n: NotificationItem): Notification {
  return {
    id: n.id,
    type: NOTIFICATION_TYPE_MAP[n.type] ?? 'like',
    title: n.title,
    message: n.body ?? '',
    isRead: n.readAt !== null,
    createdAt: n.createdAt,
  };
}
