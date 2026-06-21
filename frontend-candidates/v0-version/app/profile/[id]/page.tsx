"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, BadgeCheck, MoreHorizontal, Star, Clock, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { PostCard } from '@/components/post-card'
import { ListingCard } from '@/components/listing-card'
import { mockUsers, mockPosts, mockListings } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

interface PageProps {
  params: Promise<{ id: string }>
}

const tabs = [
  { id: 'posts', label: 'منشورات' },
  { id: 'listings', label: 'عقارات' },
]

export default function UserProfilePage({ params }: PageProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('posts')
  const [isFollowing, setIsFollowing] = useState(false)

  // In real app, would fetch user by ID
  const user = mockUsers[2]
  const userPosts = mockPosts.filter(p => p.author.id === user.id)
  const userListings = mockListings.filter(l => l.agent.id === user.id)

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center h-14 px-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowRight className="w-5 h-5" />
          </Button>
          <h1 className="flex-1 font-semibold text-foreground text-center truncate px-4">
            {user.name}
          </h1>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon">
              <Share2 className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Profile header */}
      <div className="px-4 py-6">
        {/* Avatar */}
        <div className="flex justify-center mb-4">
          <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="text-2xl">{user.name[0]}</AvatarFallback>
          </Avatar>
        </div>

        {/* Name & badge */}
        <div className="text-center mb-3">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <h1 className="text-xl font-bold text-foreground">{user.name}</h1>
            {user.isVerified && (
              <BadgeCheck className="w-5 h-5 text-primary" />
            )}
          </div>
          {user.bio && (
            <p className="text-muted-foreground text-sm">{user.bio}</p>
          )}
        </div>

        {/* Rating & response time */}
        {(user.rating || user.responseTime) && (
          <div className="flex items-center justify-center gap-4 mb-4 text-sm">
            {user.rating && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Star className="w-4 h-4 text-accent fill-accent" />
                <span>{user.rating}</span>
                <span>({user.reviewCount} تقييم)</span>
              </div>
            )}
            {user.responseTime && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{user.responseTime}</span>
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-center gap-8 mb-4">
          <div className="text-center">
            <p className="font-bold text-foreground">{user.posts}</p>
            <p className="text-sm text-muted-foreground">منشور</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-foreground">{user.followers}</p>
            <p className="text-sm text-muted-foreground">متابِع</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-foreground">{user.following}</p>
            <p className="text-sm text-muted-foreground">متابَع</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <Button
            variant={isFollowing ? "outline" : "default"}
            className="flex-1"
            onClick={() => setIsFollowing(!isFollowing)}
          >
            {isFollowing ? 'متابَع' : 'متابعة'}
          </Button>
          <Button variant="outline" className="flex-1">
            رسالة
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-14 z-30 bg-background border-b border-border">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 py-3 text-sm font-medium transition-colors relative",
                activeTab === tab.id
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 inset-x-4 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div>
        {activeTab === 'posts' && (
          <div className="max-w-[680px] mx-auto">
            {userPosts.length > 0 ? (
              userPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <p className="text-muted-foreground text-center">
                  لا توجد منشورات
                </p>
              </div>
            )}
            {/* Show some posts for demo */}
            {userPosts.length === 0 && mockPosts.slice(0, 2).map((post) => (
              <PostCard key={post.id} post={{...post, author: user}} />
            ))}
          </div>
        )}

        {activeTab === 'listings' && (
          <div className="p-4">
            {userListings.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {userListings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <p className="text-muted-foreground text-center">
                  لا توجد عقارات
                </p>
              </div>
            )}
            {/* Show some listings for demo */}
            {userListings.length === 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {mockListings.slice(0, 2).map((listing) => (
                  <ListingCard key={listing.id} listing={{...listing, agent: user}} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
