"use client"

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Users, Search, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { mockGroups } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

const tabs = [
  { id: 'my-groups', label: 'مجموعاتي' },
  { id: 'discover', label: 'اكتشف مجموعات' },
]

export default function GroupsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('my-groups')
  const [searchQuery, setSearchQuery] = useState('')
  const [joinedGroups, setJoinedGroups] = useState<Set<string>>(
    new Set(mockGroups.filter(g => g.isJoined).map(g => g.id))
  )

  const toggleJoin = (groupId: string) => {
    const newJoined = new Set(joinedGroups)
    if (newJoined.has(groupId)) {
      newJoined.delete(groupId)
    } else {
      newJoined.add(groupId)
    }
    setJoinedGroups(newJoined)
  }

  const myGroups = mockGroups.filter(g => joinedGroups.has(g.id))
  const discoverGroups = mockGroups.filter(g => !joinedGroups.has(g.id))

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
          <h1 className="flex-1 font-semibold text-foreground text-center">المجموعات</h1>
          <Button variant="ghost" size="icon">
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Search */}
      <div className="px-4 py-3 border-b border-border">
        <div className="relative">
          <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="ابحث عن مجموعة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 ps-12 pe-4 rounded-full bg-surface border border-transparent focus:border-primary outline-none text-foreground placeholder:text-muted-foreground"
          />
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
      <div className="p-4">
        {activeTab === 'my-groups' && (
          <>
            {myGroups.length > 0 ? (
              <div className="space-y-4">
                {myGroups.map((group) => (
                  <Link
                    key={group.id}
                    href={`/groups/${group.id}`}
                    className="flex gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors"
                  >
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={group.coverImage}
                        alt={group.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground truncate">{group.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                        {group.description}
                      </p>
                      <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span>{formatMemberCount(group.memberCount)} عضو</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-medium text-foreground mb-1">لم تنضم لأي مجموعة</h3>
                <p className="text-sm text-muted-foreground text-center mb-4">
                  اكتشف مجموعات تناسب اهتماماتك
                </p>
                <Button onClick={() => setActiveTab('discover')}>
                  اكتشف مجموعات
                </Button>
              </div>
            )}
          </>
        )}

        {activeTab === 'discover' && (
          <>
            {/* Trending groups */}
            <div className="mb-6">
              <h2 className="font-semibold text-foreground mb-4">مجموعات رائجة</h2>
              <div className="flex gap-4 overflow-x-auto scrollbar-hide -mx-4 px-4">
                {mockGroups.slice(0, 3).map((group) => (
                  <div
                    key={group.id}
                    className="min-w-[200px] rounded-xl overflow-hidden bg-card border border-border"
                  >
                    <div className="relative h-24">
                      <Image
                        src={group.coverImage}
                        alt={group.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-foreground text-sm truncate">{group.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatMemberCount(group.memberCount)} عضو
                      </p>
                      <Button
                        size="sm"
                        variant={joinedGroups.has(group.id) ? "outline" : "default"}
                        className="w-full mt-2"
                        onClick={(e) => {
                          e.preventDefault()
                          toggleJoin(group.id)
                        }}
                      >
                        {joinedGroups.has(group.id) ? 'تم الانضمام' : 'انضم'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* All groups */}
            <div>
              <h2 className="font-semibold text-foreground mb-4">كل المجموعات</h2>
              <div className="space-y-4">
                {mockGroups.map((group) => (
                  <div
                    key={group.id}
                    className="flex gap-4 p-4 rounded-xl bg-card border border-border"
                  >
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={group.coverImage}
                        alt={group.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground truncate">{group.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                        {group.description}
                      </p>
                      <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span>{formatMemberCount(group.memberCount)} عضو</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={joinedGroups.has(group.id) ? "outline" : "default"}
                      className="flex-shrink-0 self-center"
                      onClick={() => toggleJoin(group.id)}
                    >
                      {joinedGroups.has(group.id) ? 'تم الانضمام' : 'انضم'}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
