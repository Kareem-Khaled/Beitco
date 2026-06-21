"use client"

import { useState } from 'react'
import { useRouter } from '@/i18n/routing'
import Image from 'next/image'
import { Heart, MessageCircle, Share2, Bookmark, Volume2, VolumeX, Play, Pause, BadgeCheck, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { mockPosts } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

// Filter only video posts
const videoPosts = mockPosts.filter(post => post.video || post.images?.length)

export default function VideosPage() {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [isPlaying, setIsPlaying] = useState(true)
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set())

  const currentPost = videoPosts[currentIndex]

  const handleScroll = (e: React.WheelEvent) => {
    if (e.deltaY > 0 && currentIndex < videoPosts.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else if (e.deltaY < 0 && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const toggleLike = (postId: string) => {
    const newLiked = new Set(likedPosts)
    if (newLiked.has(postId)) {
      newLiked.delete(postId)
    } else {
      newLiked.add(postId)
    }
    setLikedPosts(newLiked)
  }

  const toggleSave = (postId: string) => {
    const newSaved = new Set(savedPosts)
    if (newSaved.has(postId)) {
      newSaved.delete(postId)
    } else {
      newSaved.add(postId)
    }
    setSavedPosts(newSaved)
  }

  if (!currentPost) {
    return (
      <div className="h-screen flex items-center justify-center bg-foreground">
        <p className="text-background">لا توجد فيديوهات</p>
      </div>
    )
  }

  return (
    <div 
      className="h-screen bg-foreground overflow-hidden relative"
      onWheel={handleScroll}
    >
      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => router.back()}
        className="absolute top-4 start-4 z-50 text-background hover:bg-background/20"
      >
        <X className="w-6 h-6" />
      </Button>

      {/* Video container */}
      <div 
        className="relative h-full w-full"
        onClick={() => setIsPlaying(!isPlaying)}
      >
        {/* Video/Image placeholder */}
        <div className="absolute inset-0">
          <Image
            src={currentPost.images?.[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'}
            alt="Video thumbnail"
            fill
            className="object-cover"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-foreground/80" />
        </div>

        {/* Play/Pause overlay */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="w-20 h-20 rounded-full bg-background/30 flex items-center justify-center">
              <Play className="w-10 h-10 text-background ms-1" fill="currentColor" />
            </div>
          </div>
        )}

        {/* Progress bar */}
        <div className="absolute bottom-0 inset-x-0 h-1 bg-background/30 z-20">
          <div className="h-full w-1/3 bg-background" />
        </div>
      </div>

      {/* Right side actions */}
      <div className="absolute end-4 bottom-32 flex flex-col items-center gap-6 z-30">
        {/* Like */}
        <button
          onClick={() => toggleLike(currentPost.id)}
          className="flex flex-col items-center gap-1"
        >
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center",
            likedPosts.has(currentPost.id) ? "bg-destructive" : "bg-background/20"
          )}>
            <Heart className={cn(
              "w-6 h-6 text-background",
              likedPosts.has(currentPost.id) && "fill-current"
            )} />
          </div>
          <span className="text-background text-xs">{currentPost.likes + (likedPosts.has(currentPost.id) ? 1 : 0)}</span>
        </button>

        {/* Comment */}
        <button className="flex flex-col items-center gap-1">
          <div className="w-12 h-12 rounded-full bg-background/20 flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-background" />
          </div>
          <span className="text-background text-xs">{currentPost.comments}</span>
        </button>

        {/* Share */}
        <button className="flex flex-col items-center gap-1">
          <div className="w-12 h-12 rounded-full bg-background/20 flex items-center justify-center">
            <Share2 className="w-6 h-6 text-background" />
          </div>
          <span className="text-background text-xs">{currentPost.shares}</span>
        </button>

        {/* Save */}
        <button
          onClick={() => toggleSave(currentPost.id)}
          className="flex flex-col items-center gap-1"
        >
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center",
            savedPosts.has(currentPost.id) ? "bg-accent" : "bg-background/20"
          )}>
            <Bookmark className={cn(
              "w-6 h-6 text-background",
              savedPosts.has(currentPost.id) && "fill-current"
            )} />
          </div>
        </button>

        {/* Sound toggle */}
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="flex flex-col items-center gap-1"
        >
          <div className="w-12 h-12 rounded-full bg-background/20 flex items-center justify-center">
            {isMuted ? (
              <VolumeX className="w-6 h-6 text-background" />
            ) : (
              <Volume2 className="w-6 h-6 text-background" />
            )}
          </div>
        </button>
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-8 inset-x-0 px-4 z-30 safe-area-bottom">
        {/* Author */}
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="w-10 h-10 border-2 border-background">
            <AvatarImage src={currentPost.author.avatar} alt={currentPost.author.name} />
            <AvatarFallback>{currentPost.author.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-2">
            <span className="font-medium text-background">{currentPost.author.name}</span>
            {currentPost.author.isVerified && (
              <BadgeCheck className="w-4 h-4 text-primary" />
            )}
          </div>
          <Button size="sm" className="ms-2 bg-blue-500 hover:bg-blue-600 text-white border-0">
            متابعة
          </Button>
        </div>

        {/* Caption */}
        <p className="text-background text-sm leading-relaxed line-clamp-2">
          {currentPost.content}
        </p>
      </div>

      {/* Pagination dots */}
      <div className="absolute end-4 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 z-30">
        {videoPosts.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={cn(
              "w-1.5 rounded-full transition-all",
              index === currentIndex
                ? "h-6 bg-background"
                : "h-1.5 bg-background/50"
            )}
          />
        ))}
      </div>
    </div>
  )
}
