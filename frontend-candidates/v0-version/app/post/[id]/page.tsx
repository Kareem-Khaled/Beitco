"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, BadgeCheck, Send, Pin, ChevronDown, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { mockPosts, mockUsers, currentUser } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import type { Comment } from '@/lib/types'

// Extended mock comments with more data
const extendedComments: Comment[] = [
  {
    id: '1',
    author: mockUsers[2],
    content: 'كلام صح جداً! أنا شخصياً وقعت في مشكلة كده قبل كده. النصيحة دي مهمة جداً لكل اللي بيفكر يشتري عقار.',
    likes: 45,
    isLiked: false,
    createdAt: 'منذ ساعة',
    isPinned: true,
  },
  {
    id: '2',
    author: mockUsers[1],
    content: 'شكراً على النصيحة! ممكن تقولنا إيه أهم الأوراق اللي لازم نتأكد منها؟',
    likes: 28,
    isLiked: true,
    createdAt: 'منذ ٣٠ دقيقة',
    replies: [
      {
        id: '2-1',
        author: mockUsers[0],
        content: 'أهم حاجة: عقد الملكية المسجل، رخصة البناء، وشهادة الضرائب العقارية.',
        likes: 35,
        isLiked: false,
        createdAt: 'منذ ٢٠ دقيقة',
      },
      {
        id: '2-2',
        author: mockUsers[4],
        content: 'وكمان لازم تتأكد من عدم وجود أي رهن على العقار من البنك.',
        likes: 22,
        isLiked: false,
        createdAt: 'منذ ١٥ دقيقة',
      },
      {
        id: '2-3',
        author: mockUsers[1],
        content: 'شكراً جزيلاً على التوضيح!',
        likes: 5,
        isLiked: false,
        createdAt: 'منذ ١٠ دقائق',
      },
    ],
  },
  {
    id: '3',
    author: mockUsers[3],
    content: 'ممكن حد يساعدني أفهم إيه الفرق بين العقد الابتدائي والعقد المسجل؟',
    likes: 18,
    isLiked: false,
    createdAt: 'منذ ١٥ دقيقة',
    replies: [
      {
        id: '3-1',
        author: mockUsers[2],
        content: 'العقد الابتدائي هو اتفاق بين البائع والمشتري، لكن العقد المسجل هو اللي بيكون في الشهر العقاري وده اللي بيثبت ملكيتك قانونياً.',
        likes: 42,
        isLiked: true,
        createdAt: 'منذ ١٠ دقائق',
      },
    ],
  },
  {
    id: '4',
    author: mockUsers[4],
    content: 'بالنسبة للمشاريع الجديدة، لازم كمان تتأكد من تراخيص المطور وسجله السابق.',
    likes: 31,
    isLiked: false,
    createdAt: 'منذ ٤٥ دقيقة',
  },
  {
    id: '5',
    author: { ...mockUsers[1], name: 'عمر فاروق', id: '6' },
    content: 'معلومات قيمة جداً، شكراً لكم!',
    likes: 8,
    isLiked: false,
    createdAt: 'منذ ساعتين',
  },
  {
    id: '6',
    author: { ...mockUsers[3], name: 'منى السيد', id: '7' },
    content: 'أنا كنت هشتري شقة من غير ما أتأكد من الأوراق، الحمد لله شفت البوست ده في الوقت المناسب.',
    likes: 15,
    isLiked: false,
    createdAt: 'منذ ٣ ساعات',
  },
  {
    id: '7',
    author: { ...mockUsers[0], name: 'كريم مصطفى', id: '8' },
    content: 'من تجربتي، أهم حاجة تستعين بمحامي متخصص في العقارات.',
    likes: 52,
    isLiked: true,
    createdAt: 'منذ ٤ ساعات',
  },
  {
    id: '8',
    author: { ...mockUsers[2], name: 'نورهان أحمد', id: '9' },
    content: 'هل في فرق في الإجراءات بين شقة تمليك وشقة إيجار؟',
    likes: 11,
    isLiked: false,
    createdAt: 'منذ ٥ ساعات',
  },
]

const sortOptions = [
  { id: 'newest', label: 'الأحدث' },
  { id: 'popular', label: 'الأكثر تفاعلاً' },
  { id: 'oldest', label: 'الأقدم' },
]

interface CommentItemProps {
  comment: Comment
  depth?: number
}

function CommentItem({ comment, depth = 0 }: CommentItemProps) {
  const [isLiked, setIsLiked] = useState(comment.isLiked)
  const [likes, setLikes] = useState(comment.likes)
  const [showAllReplies, setShowAllReplies] = useState(false)

  const handleLike = () => {
    setIsLiked(!isLiked)
    setLikes(isLiked ? likes - 1 : likes + 1)
  }

  const visibleReplies = showAllReplies
    ? comment.replies
    : comment.replies?.slice(0, 1)

  const hiddenRepliesCount = (comment.replies?.length || 0) - 1

  return (
    <div className={cn(depth > 0 && "ps-10 relative")}>
      {/* Vertical connecting line for replies */}
      {depth > 0 && (
        <div className="absolute end-5 top-0 bottom-0 w-0.5 bg-border" />
      )}

      <div className={cn(
        "py-3",
        comment.isPinned && "bg-primary/5 -mx-4 px-4 rounded-lg border border-primary/20"
      )}>
        <div className="flex gap-3">
          <Link href={`/profile/${comment.author.id}`}>
            <Avatar className={cn(depth > 0 ? "w-8 h-8" : "w-10 h-10")}>
              <AvatarImage src={comment.author.avatar} alt={comment.author.name} />
              <AvatarFallback>{comment.author.name[0]}</AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1 min-w-0">
            {comment.isPinned && (
              <div className="flex items-center gap-1 text-xs text-primary mb-1">
                <Pin className="w-3 h-3" />
                <span>مثبت</span>
              </div>
            )}
            <div className="bg-surface rounded-xl px-3 py-2">
              <div className="flex items-center gap-1 mb-1">
                <Link href={`/profile/${comment.author.id}`} className="font-medium text-sm text-foreground">
                  {comment.author.name}
                </Link>
                {comment.author.isVerified && (
                  <BadgeCheck className="w-3.5 h-3.5 text-primary" />
                )}
              </div>
              <p className="text-sm text-foreground">{comment.content}</p>
            </div>
            <div className="flex items-center gap-4 mt-1.5 px-1">
              <span className="text-xs text-muted-foreground">{comment.createdAt}</span>
              <button
                onClick={handleLike}
                className={cn(
                  "flex items-center gap-1 text-xs transition-colors",
                  isLiked ? "text-destructive" : "text-muted-foreground hover:text-destructive"
                )}
              >
                <Heart className={cn("w-3.5 h-3.5", isLiked && "fill-current")} />
                <span>{likes}</span>
              </button>
              <button className="text-xs text-muted-foreground hover:text-primary transition-colors">
                رد
              </button>
            </div>
          </div>
        </div>

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2">
            {visibleReplies?.map((reply) => (
              <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
            ))}
            {hiddenRepliesCount > 0 && !showAllReplies && (
              <button
                onClick={() => setShowAllReplies(true)}
                className="flex items-center gap-1 text-xs text-primary mt-2 ps-10 hover:underline"
              >
                <ChevronDown className="w-3.5 h-3.5" />
                عرض {hiddenRepliesCount} {hiddenRepliesCount === 1 ? 'رد آخر' : 'ردود أخرى'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function PostDetailPage() {
  const router = useRouter()
  const [commentText, setCommentText] = useState('')
  const [isLiked, setIsLiked] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [sortBy, setSortBy] = useState('newest')

  // In real app, would fetch post by ID
  const post = mockPosts[0]
  const totalComments = extendedComments.length + extendedComments.reduce((acc, c) => acc + (c.replies?.length || 0), 0)

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault()
    // In real app, would submit comment
    setCommentText('')
  }

  // Simulate user tier for demo
  const userTier = currentUser.tier

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center h-14 px-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowRight className="w-5 h-5" />
          </Button>
          <h1 className="flex-1 font-semibold text-foreground text-center">منشور</h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem>نسخ الرابط</DropdownMenuItem>
              <DropdownMenuItem>إبلاغ</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Post content */}
      <div className="flex-1 overflow-y-auto pb-20">
        <article className="border-b border-border">
          {/* Author */}
          <div className="flex items-center gap-3 p-4 pb-3">
            <Link href={`/profile/${post.author.id}`}>
              <Avatar className="w-12 h-12">
                <AvatarImage src={post.author.avatar} alt={post.author.name} />
                <AvatarFallback>{post.author.name[0]}</AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <Link href={`/profile/${post.author.id}`} className="font-medium text-foreground">
                  {post.author.name}
                </Link>
                {post.author.isVerified && (
                  <BadgeCheck className="w-4 h-4 text-primary" />
                )}
              </div>
              <p className="text-sm text-muted-foreground">{post.createdAt}</p>
            </div>
            <Button variant="outline" size="sm">
              متابعة
            </Button>
          </div>

          {/* Content */}
          <div className="px-4 pb-4">
            <p className="text-foreground text-lg leading-relaxed whitespace-pre-wrap">
              {post.content}
            </p>
          </div>

          {/* Media */}
          {post.images && post.images.length > 0 && (
            <div className="relative aspect-[4/3]">
              <Image
                src={post.images[0]}
                alt="Post image"
                fill
                className="object-cover"
              />
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 px-4 py-3 border-t border-border text-sm text-muted-foreground">
            <span><strong className="text-foreground">{post.likes}</strong> إعجاب</span>
            <span><strong className="text-foreground">{totalComments}</strong> تعليق</span>
            <span><strong className="text-foreground">{post.shares}</strong> مشاركة</span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-around px-4 py-2 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsLiked(!isLiked)}
              className={cn("gap-2", isLiked && "text-destructive")}
            >
              <Heart className={cn("w-5 h-5", isLiked && "fill-current")} />
              <span>إعجاب</span>
            </Button>
            <Button variant="ghost" size="sm" className="gap-2">
              <MessageCircle className="w-5 h-5" />
              <span>تعليق</span>
            </Button>
            <Button variant="ghost" size="sm" className="gap-2">
              <Share2 className="w-5 h-5" />
              <span>مشاركة</span>
            </Button>
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

        {/* Comments section */}
        <div className="px-4">
          {/* Comments header with count and sort */}
          <div className="flex items-center justify-between py-3 border-b border-border">
            <h2 className="font-semibold text-foreground">
              التعليقات ({totalComments})
            </h2>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                  {sortOptions.find(o => o.id === sortBy)?.label}
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {sortOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.id}
                    onClick={() => setSortBy(option.id)}
                    className={cn(sortBy === option.id && "bg-surface")}
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Comments list */}
          <div className="divide-y divide-border">
            {extendedComments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
          </div>
        </div>
      </div>

      {/* Comment input - tier restricted */}
      <div className="sticky bottom-0 bg-background border-t border-border px-4 py-3 safe-area-bottom">
        {userTier <= 3 ? (
          <form onSubmit={handleSubmitComment} className="flex items-center gap-3">
            <Avatar className="w-9 h-9 flex-shrink-0">
              <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
              <AvatarFallback>{currentUser.name[0]}</AvatarFallback>
            </Avatar>
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="اكتب تعليقاً..."
              className="flex-1 h-10 px-4 rounded-full bg-surface border border-transparent focus:border-primary outline-none text-foreground placeholder:text-muted-foreground"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!commentText.trim()}
              className="rounded-full"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        ) : userTier === 4 ? (
          <div className="flex items-center justify-center gap-2 py-2 text-center">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <p className="text-muted-foreground text-sm">
              <Link href="/onboarding/verify" className="text-primary font-medium hover:underline">
                سجل أولاً للتعليق
              </Link>
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 py-2 text-center">
            <AlertCircle className="w-4 h-4 text-destructive" />
            <p className="text-destructive text-sm font-medium">
              حسابك مقيد
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
