// User Tiers
export type UserTier = 1 | 2 | 3 | 4 | 5

export interface User {
  id: string
  name: string
  avatar: string
  bio?: string
  city: string
  role: 'buyer' | 'seller' | 'agent' | 'interested'
  tier: UserTier
  isVerified: boolean
  followers: number
  following: number
  posts: number
  rating?: number
  reviewCount?: number
  responseTime?: string
  phone?: string
}

export interface Post {
  id: string
  author: User
  content: string
  images?: string[]
  video?: string
  listing?: Listing
  likes: number
  comments: number
  shares: number
  isLiked: boolean
  isSaved: boolean
  createdAt: string
  type: 'text' | 'image' | 'video' | 'listing'
}

export interface Listing {
  id: string
  title: string
  price: number
  currency: 'EGP'
  type: 'apartment' | 'villa' | 'studio' | 'duplex' | 'penthouse' | 'land' | 'office' | 'shop'
  purpose: 'sale' | 'rent'
  location: {
    city: string
    area: string
    address?: string
  }
  specs: {
    bedrooms: number
    bathrooms: number
    area: number
  }
  features: {
    finishing: 'finished' | 'semi-finished' | 'unfinished'
    floor?: number
    furnished: boolean
  }
  description: string
  images: string[]
  video?: string
  agent: User
  views: number
  createdAt: string
}

export interface Comment {
  id: string
  author: User
  content: string
  likes: number
  isLiked: boolean
  createdAt: string
  replies?: Comment[]
  isPinned?: boolean
}

export interface Message {
  id: string
  sender: User
  content: string
  createdAt: string
  isRead: boolean
  type: 'text' | 'image' | 'voice'
}

export interface Conversation {
  id: string
  participant: User
  listing?: Listing
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  type: 'listing' | 'direct'
}

export interface Group {
  id: string
  name: string
  description: string
  coverImage: string
  memberCount: number
  isJoined: boolean
  rules?: string[]
}

export interface Notification {
  id: string
  type: 'like' | 'comment' | 'follow' | 'approval' | 'listing_match' | 'price_drop'
  title: string
  message: string
  users?: User[]
  post?: Post
  listing?: Listing
  isRead: boolean
  createdAt: string
}

export interface ApprovalPost {
  id: string
  title: string
  content: string
  status: 'pending' | 'approved' | 'rejected'
  submittedAt: string
  publishedAt?: string
  rejectionReason?: string
  engagementStats?: {
    likes: number
    comments: number
    views: number
  }
}
