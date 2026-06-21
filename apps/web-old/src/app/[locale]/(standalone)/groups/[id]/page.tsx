"use client"

import { useState } from 'react'
import { useRouter } from '@/i18n/routing'
import Image from 'next/image'
import { ArrowRight, Share2, MoreHorizontal, Users, Edit, Shield, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { PostCard } from '@/components/post-card'
import { mockGroups, mockPosts, mockUsers } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

interface PageProps {
  params: Promise<{ id: string }>
}

const tabs = [
  { id: 'posts', label: 'المنشورات' },
  { id: 'members', label: 'الأعضاء' },
  { id: 'about', label: 'حول' },
]

export default function GroupDetailPage({ params }: PageProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('posts')
  const [isJoined, setIsJoined] = useState(true)

  // In real app, would fetch group by ID
  const group = mockGroups[0]

  const formatMemberCount = (count: number) => {
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K'
    }
    return count.toString()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center h-14 px-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowRight className="w-5 h-5" />
          </Button>
          <h1 className="flex-1 font-semibold text-foreground text-center truncate px-4">
            {group.name}
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

      {/* Cover image */}
      <div className="relative h-40">
        <Image
          src={group.coverImage}
          alt={group.name}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
      </div>

      {/* Group info */}
      <div className="px-4 -mt-8 relative z-10">
        <h2 className="text-2xl font-bold text-foreground mb-2">{group.name}</h2>
        <p className="text-muted-foreground mb-3">{group.description}</p>
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{formatMemberCount(group.memberCount)} عضو</span>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant={isJoined ? "outline" : "default"}
            className={`flex-1 ${!isJoined ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
            onClick={() => setIsJoined(!isJoined)}
          >
            {isJoined ? 'تم الانضمام' : 'انضم للمجموعة'}
          </Button>
          {isJoined && (
            <Button variant="default" className="flex-1 gap-2">
              <Edit className="w-4 h-4" />
              <span>مشاركة</span>
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-14 z-30 bg-background border-b border-border mt-4">
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
            {mockPosts.slice(0, 3).map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}

        {activeTab === 'members' && (
          <div className="p-4 space-y-3">
            {mockUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-surface"
              >
                <Avatar className="w-12 h-12">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>{user.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.city}</p>
                </div>
                <Button variant="outline" size="sm">
                  متابعة
                </Button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'about' && (
          <div className="p-4 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">عن المجموعة</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                {group.description}
              </p>
            </div>

            {group.rules && group.rules.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">قواعد المجموعة</h3>
                </div>
                <ul className="space-y-2">
                  {group.rules.map((rule, index) => (
                    <li key={index} className="flex gap-2 text-muted-foreground">
                      <span className="text-primary font-medium">{index + 1}.</span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
