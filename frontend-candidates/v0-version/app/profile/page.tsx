"use client"

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Settings, BadgeCheck, CheckCircle, Circle, ArrowLeft, Share2 } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { PostCard } from '@/components/post-card'
import { ListingCard } from '@/components/listing-card'
import { currentUser, mockPosts, mockListings } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

const tabs = [
  { id: 'posts', label: 'منشورات' },
  { id: 'listings', label: 'عقارات' },
  { id: 'likes', label: 'إعجابات' },
]

const tierRequirements = [
  { id: 'phone', label: 'تأكيد رقم الموبايل', completed: true },
  { id: 'posts', label: '٥+ منشورات', completed: true },
  { id: 'id', label: 'تحقق من الهوية', completed: false },
]

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('posts')
  const user = currentUser

  const userPosts = mockPosts.filter(p => p.author.id === user.id)
  const userListings = mockListings.filter(l => l.agent.id === user.id)
  const likedPosts = mockPosts.filter(p => p.isLiked)

  const tierProgress = tierRequirements.filter(r => r.completed).length / tierRequirements.length * 100

  return (
    <AppShell>
      {/* Header actions */}
      <div className="flex items-center justify-end gap-1 px-4 py-2">
        <Button variant="ghost" size="icon">
          <Share2 className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" asChild>
          <Link href="/settings">
            <Settings className="w-5 h-5" />
          </Link>
        </Button>
      </div>

      {/* Profile header */}
      <div className="px-4 pb-4">
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

        {/* Edit profile button */}
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" asChild>
            <Link href="/settings">
              تعديل الملف الشخصي
            </Link>
          </Button>
          <Button variant="outline" className="flex-1" asChild>
            <Link href="/my-posts">
              منشوراتي
            </Link>
          </Button>
        </div>
      </div>

      {/* Tier progress card */}
      {user.tier >= 3 && (
        <div className="mx-4 mb-4 p-4 rounded-xl bg-accent-light border border-accent/20">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">ترقية حسابك</h3>
            <span className="text-sm text-accent font-medium">
              المستوى {user.tier} ← {user.tier - 1}
            </span>
          </div>
          
          {/* Progress bar */}
          <div className="h-2 rounded-full bg-background mb-3 overflow-hidden">
            <div 
              className="h-full bg-accent rounded-full transition-all"
              style={{ width: `${tierProgress}%` }}
            />
          </div>

          {/* Requirements */}
          <div className="space-y-2 mb-4">
            {tierRequirements.map((req) => (
              <div key={req.id} className="flex items-center gap-2 text-sm">
                {req.completed ? (
                  <CheckCircle className="w-4 h-4 text-success" />
                ) : (
                  <Circle className="w-4 h-4 text-muted-foreground" />
                )}
                <span className={req.completed ? "text-muted-foreground line-through" : "text-foreground"}>
                  {req.label}
                </span>
              </div>
            ))}
          </div>

          <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
            تحقق الآن
            <ArrowLeft className="w-4 h-4 ms-2" />
          </Button>
        </div>
      )}

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
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <p className="text-muted-foreground text-center mb-4">
                  لم تنشر أي منشورات بعد
                </p>
                <Button asChild>
                  <Link href="/create">أنشئ منشورك الأول</Link>
                </Button>
              </div>
            )}
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
                <p className="text-muted-foreground text-center mb-4">
                  لم تضف أي عقارات بعد
                </p>
                <Button asChild>
                  <Link href="/create">أضف عقارك الأول</Link>
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'likes' && (
          <div className="max-w-[680px] mx-auto">
            {likedPosts.length > 0 ? (
              likedPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <p className="text-muted-foreground text-center">
                  لم تعجب بأي منشورات بعد
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  )
}
