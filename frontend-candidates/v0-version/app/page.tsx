"use client"

import { useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { PostCard, PostCardSkeleton } from '@/components/post-card'
import { mockPosts } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

const tabs = [
  { id: 'for-you', label: 'لك' },
  { id: 'following', label: 'المتابَعين' },
  { id: 'videos', label: 'فيديو' },
]

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('for-you')
  const [isLoading] = useState(false)

  const filteredPosts = activeTab === 'videos' 
    ? mockPosts.filter(post => post.video)
    : mockPosts

  return (
    <AppShell>
      {/* Feed tabs */}
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
              {tab.id === 'videos' && '📹 '}
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 inset-x-4 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Feed content */}
      <div className="max-w-[680px] mx-auto">
        {isLoading ? (
          <>
            <PostCardSkeleton />
            <PostCardSkeleton />
            <PostCardSkeleton />
          </>
        ) : (
          filteredPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))
        )}
      </div>
    </AppShell>
  )
}
