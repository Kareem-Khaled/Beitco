"use client"

import { useState } from 'react'
import Image from 'next/image'
import { Link } from '@/i18n/routing'
import { Heart, MessageCircle, Share2, Bookmark, Play, MoreHorizontal, BadgeCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { Post } from '@/lib/types'
import { cn } from '@/lib/utils'

interface PostCardProps {
  post: Post
}

export function PostCard({ post }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(post.isLiked)
  const [isSaved, setIsSaved] = useState(post.isSaved)
  const [likes, setLikes] = useState(post.likes)

  const handleLike = () => {
    setIsLiked(!isLiked)
    setLikes(isLiked ? likes - 1 : likes + 1)
  }

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-EG').format(price)
  }

  return (
    <article className="bg-card border-b border-border">
      {/* Author row */}
      <div className="flex items-center gap-3 p-4 pb-3">
        <Link href={`/profile/${post.author.id}`}>
          <Avatar className="w-10 h-10">
            <AvatarImage src={post.author.avatar} alt={post.author.name} />
            <AvatarFallback>{post.author.name[0]}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <Link href={`/profile/${post.author.id}`} className="font-medium text-foreground truncate">
              {post.author.name}
            </Link>
            {post.author.isVerified && (
              <BadgeCheck className="w-4 h-4 text-primary flex-shrink-0" />
            )}
          </div>
          <p className="text-sm text-muted-foreground">{post.createdAt}</p>
        </div>
        <Button variant="ghost" size="icon" className="flex-shrink-0">
          <MoreHorizontal className="w-5 h-5" />
        </Button>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-foreground leading-relaxed whitespace-pre-wrap">{post.content}</p>
      </div>

      {/* Media */}
      {post.images && post.images.length > 0 && (
        <div className="relative aspect-[4/3] bg-surface">
          <Image
            src={post.images[0]}
            alt="Post image"
            fill
            className="object-cover"
          />
        </div>
      )}

      {post.video && (
        <div className="relative aspect-video bg-surface">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-foreground/80 flex items-center justify-center">
              <Play className="w-8 h-8 text-background ms-1" fill="currentColor" />
            </div>
          </div>
        </div>
      )}

      {/* Embedded listing */}
      {post.listing && (
        <Link href={`/listings/${post.listing.id}`} className="block mx-4 mb-3">
          <div className="flex gap-3 rounded-lg border border-border overflow-hidden bg-card p-3">
            <div className="relative w-20 h-20 rounded-md overflow-hidden flex-shrink-0">
              <Image
                src={post.listing.images[0]}
                alt={post.listing.title}
                fill
                className="object-cover"
              />
              <div className="absolute top-1 start-1 px-1 py-0.5 rounded text-[9px] font-medium bg-green-600 text-white">
                {post.listing.purpose === 'sale' ? 'للبيع' : 'للإيجار'}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-foreground">
                {formatPrice(post.listing.price)} جنيه
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {post.listing.location.area}، {post.listing.location.city}
              </p>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                <span>{post.listing.specs.bedrooms} غرف</span>
                <span>{post.listing.specs.bathrooms} حمام</span>
                <span>{post.listing.specs.area} م²</span>
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={cn("gap-2 px-3", isLiked && "text-destructive")}
          >
            <Heart className={cn("w-5 h-5", isLiked && "fill-current")} />
            <span className="text-sm">{formatNumber(likes)}</span>
          </Button>
          <Button variant="ghost" size="sm" className="gap-2 px-3" asChild>
            <Link href={`/posts/${post.id}`}>
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm">{formatNumber(post.comments)}</span>
            </Link>
          </Button>
          <Button variant="ghost" size="sm" className="gap-2 px-3">
            <Share2 className="w-5 h-5" />
          </Button>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSaved(!isSaved)}
          className={cn(isSaved && "text-accent")}
        >
          <Bookmark className={cn("w-5 h-5", isSaved && "fill-current")} />
        </Button>
      </div>
    </article>
  )
}

// Skeleton loader
export function PostCardSkeleton() {
  return (
    <div className="bg-card border-b border-border animate-pulse">
      <div className="flex items-center gap-3 p-4 pb-3">
        <div className="w-10 h-10 rounded-full bg-surface" />
        <div className="flex-1">
          <div className="h-4 w-24 bg-surface rounded mb-2" />
          <div className="h-3 w-16 bg-surface rounded" />
        </div>
      </div>
      <div className="px-4 pb-3 space-y-2">
        <div className="h-4 bg-surface rounded w-full" />
        <div className="h-4 bg-surface rounded w-3/4" />
      </div>
      <div className="aspect-[4/3] bg-surface" />
      <div className="flex items-center gap-4 px-4 py-3">
        <div className="h-8 w-16 bg-surface rounded" />
        <div className="h-8 w-16 bg-surface rounded" />
        <div className="h-8 w-16 bg-surface rounded" />
      </div>
    </div>
  )
}
