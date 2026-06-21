"use client"

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Search, BadgeCheck, Heart, MessageCircle, MapPin, Bed, Bath, Maximize, Users, Crown, Medal } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { mockPosts, mockListings, mockUsers, mockGroups } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

const topics = [
  { id: 'tips', label: 'نصائح عقارية', active: true },
  { id: 'news', label: 'أخبار السوق', active: false },
  { id: 'apartments', label: 'شقق للبيع', active: false },
  { id: 'villas', label: 'فيلات', active: false },
  { id: 'investment', label: 'استثمار', active: false },
  { id: 'first-buy', label: 'أول شراء', active: false },
  { id: 'finishing', label: 'التشطيب', active: false },
]

const topContributors = [
  { ...mockUsers[4], rank: 1, postCount: 312, followerCount: 8500 },
  { ...mockUsers[2], rank: 2, postCount: 156, followerCount: 3200 },
  { ...mockUsers[0], rank: 3, postCount: 89, followerCount: 1250 },
  { ...mockUsers[1], rank: 4, postCount: 45, followerCount: 450 },
  { ...mockUsers[3], rank: 5, postCount: 23, followerCount: 120 },
]

export default function ExplorePage() {
  const [activeTopic, setActiveTopic] = useState('tips')
  const [searchQuery, setSearchQuery] = useState('')

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)}M`
    }
    if (price >= 1000) {
      return `${(price / 1000).toFixed(0)}K`
    }
    return price.toString()
  }

  return (
    <AppShell>
      {/* Search bar */}
      <div className="sticky top-14 z-30 bg-background px-4 py-3 border-b border-border">
        <div className="relative">
          <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="ابحث في بيتكو..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 ps-12 pe-4 rounded-full bg-surface border border-transparent focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Topic Pills */}
      <div className="px-4 py-3 border-b border-border overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 min-w-max">
          {topics.map((topic) => (
            <button
              key={topic.id}
              onClick={() => setActiveTopic(topic.id)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                activeTopic === topic.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface text-muted-foreground hover:bg-surface/80"
              )}
            >
              {topic.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-[680px] mx-auto pb-20">
        {/* Trending Section */}
        <section className="p-4 border-b border-border">
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            الأكثر تداولاً
            <span className="text-lg">🔥</span>
          </h2>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4">
            {mockPosts.slice(0, 3).map((post) => (
              <Link
                key={post.id}
                href={`/post/${post.id}`}
                className="flex-shrink-0 w-72 bg-card rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-colors"
              >
                {post.images && post.images[0] && (
                  <div className="relative h-36">
                    <Image
                      src={post.images[0]}
                      alt=""
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-2 start-2 end-2 flex items-center gap-3 text-white text-xs">
                      <span className="flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5" />
                        {post.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3.5 h-3.5" />
                        {post.comments}
                      </span>
                    </div>
                  </div>
                )}
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={post.author.avatar} />
                      <AvatarFallback>{post.author.name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-foreground truncate">{post.author.name}</span>
                    {post.author.isVerified && (
                      <BadgeCheck className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{post.content}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Suggested People */}
        <section className="p-4 border-b border-border">
          <h2 className="font-semibold text-foreground mb-4">أشخاص مقترحين</h2>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4">
            {mockUsers.map((user) => (
              <Link
                key={user.id}
                href={`/profile/${user.id}`}
                className="flex-shrink-0 w-40 bg-card rounded-xl p-4 border border-border hover:border-primary/50 transition-colors text-center"
              >
                <Avatar className="w-20 h-20 mx-auto mb-3">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback>{user.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <span className="font-medium text-foreground text-sm truncate">{user.name}</span>
                  {user.isVerified && (
                    <BadgeCheck className="w-4 h-4 text-primary flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2 h-8">{user.bio}</p>
                <p className="text-xs text-muted-foreground mb-3">{user.followers} متابع</p>
                <Button size="sm" className="w-full" onClick={(e) => e.preventDefault()}>
                  متابعة
                </Button>
              </Link>
            ))}
          </div>
        </section>

        {/* Popular Groups */}
        <section className="p-4 border-b border-border">
          <h2 className="font-semibold text-foreground mb-4">مجموعات شائعة</h2>
          <div className="grid grid-cols-2 gap-3">
            {mockGroups.map((group) => (
              <Link
                key={group.id}
                href={`/groups/${group.id}`}
                className="bg-card rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-colors"
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
                  <h3 className="font-medium text-foreground text-sm truncate mb-1">{group.name}</h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mb-3">
                    <Users className="w-3 h-3" />
                    {group.memberCount.toLocaleString('ar-EG')} عضو
                  </p>
                  <Button
                    size="sm"
                    variant={group.isJoined ? "outline" : "default"}
                    className="w-full"
                    onClick={(e) => e.preventDefault()}
                  >
                    {group.isJoined ? 'عضو' : 'انضم'}
                  </Button>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Nearby Listings */}
        <section className="p-4 border-b border-border">
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            عقارات قريبة منك
            <span className="text-lg">📍</span>
          </h2>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4">
            {mockListings.map((listing) => (
              <Link
                key={listing.id}
                href={`/listings/${listing.id}`}
                className="flex-shrink-0 w-64 bg-card rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-colors"
              >
                <div className="relative h-36">
                  <Image
                    src={listing.images[0]}
                    alt={listing.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-2 start-2 px-2 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-medium">
                    {listing.purpose === 'sale' ? 'للبيع' : 'للإيجار'}
                  </div>
                </div>
                <div className="p-3">
                  <p className="font-mono text-lg font-bold text-primary mb-1">
                    {formatPrice(listing.price)} EGP
                    {listing.purpose === 'rent' && <span className="text-xs font-normal text-muted-foreground">/شهرياً</span>}
                  </p>
                  <h3 className="font-medium text-foreground text-sm truncate mb-2">{listing.title}</h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                    <MapPin className="w-3 h-3" />
                    {listing.location.area}، {listing.location.city}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Bed className="w-3 h-3" />
                      {listing.specs.bedrooms}
                    </span>
                    <span className="flex items-center gap-1">
                      <Bath className="w-3 h-3" />
                      {listing.specs.bathrooms}
                    </span>
                    <span className="flex items-center gap-1">
                      <Maximize className="w-3 h-3" />
                      {listing.specs.area} م²
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Top Contributors */}
        <section className="p-4">
          <h2 className="font-semibold text-foreground mb-4">المساهمون الأكثر تأثيراً</h2>
          <div className="space-y-2">
            {topContributors.map((user) => (
              <Link
                key={user.id}
                href={`/profile/${user.id}`}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl transition-colors",
                  user.rank === 1 && "bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800",
                  user.rank === 2 && "bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700",
                  user.rank === 3 && "bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800",
                  user.rank > 3 && "bg-card border border-border hover:border-primary/50"
                )}
              >
                <div className="flex items-center justify-center w-8 h-8 flex-shrink-0">
                  {user.rank === 1 && <Crown className="w-6 h-6 text-amber-500" />}
                  {user.rank === 2 && <Medal className="w-6 h-6 text-slate-400" />}
                  {user.rank === 3 && <Medal className="w-6 h-6 text-orange-500" />}
                  {user.rank > 3 && <span className="text-lg font-bold text-muted-foreground">{user.rank}</span>}
                </div>
                <Avatar className="w-12 h-12">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback>{user.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-foreground truncate">{user.name}</span>
                    {user.isVerified && (
                      <BadgeCheck className="w-4 h-4 text-primary flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    <span>{user.postCount} منشور</span>
                    <span>{user.followerCount.toLocaleString('ar-EG')} متابع</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  )
}
