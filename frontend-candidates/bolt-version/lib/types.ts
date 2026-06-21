export type UserTier = 1 | 2 | 3 | 4 | 5;
export type PropertyType = 'apartment' | 'villa' | 'townhouse' | 'studio' | 'penthouse';
export type PropertyStatus = 'for_sale' | 'for_rent' | 'sold';
export type UserRole = 'buyer' | 'seller' | 'agent' | 'interested';

export interface User {
  id: string;
  name: string;
  avatar?: string;
  bio?: string;
  city: string;
  role: UserRole;
  tier: UserTier;
  isVerified: boolean;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  rating?: number;
  ratingCount?: number;
}

export interface Post {
  id: string;
  author: User;
  content: string;
  image?: string;
  video?: string;
  createdAt: Date;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isSaved: boolean;
  listing?: Listing;
}

export interface Listing {
  id: string;
  title: string;
  type: PropertyType;
  status: PropertyStatus;
  price: number;
  location: string;
  city: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  image: string;
  image2?: string;
  image3?: string;
  description?: string;
  agent: User;
}

export interface Comment {
  id: string;
  author: User;
  content: string;
  createdAt: Date;
  likesCount: number;
  isLiked: boolean;
  replies?: Comment[];
  isPinned?: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  content: string;
  image?: string;
  timestamp: Date;
  isRead: boolean;
}

export interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  listing?: Listing;
}

export interface NotificationItem {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'approval' | 'match';
  actor: User | User[];
  content: string;
  relatedPostId?: string;
  createdAt: Date;
  isRead: boolean;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  membersCount: number;
  postsCount: number;
  isJoined: boolean;
}
