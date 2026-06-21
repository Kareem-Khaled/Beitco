'use client';

import { useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Share2, Bookmark, Play } from 'lucide-react';
import Link from 'next/link';
import { posts } from '@/lib/mock-data';
import Image from 'next/image';

interface PostCardProps {
  post: typeof posts[0];
}

function PostCard({ post }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [isSaved, setIsSaved] = useState(post.isSaved);
  const [likeCount, setLikeCount] = useState(post.likesCount);

  return (
    <Card className="rounded-card p-0 border-0 shadow-card mb-md">
      <div className="p-md">
        <div className="flex items-start gap-md mb-md">
          <Avatar className="w-10 h-10">
            <AvatarImage src={post.author.avatar} />
            <AvatarFallback>{post.author.name.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-body font-medium">{post.author.name}</span>
              {post.author.isVerified && (
                <Badge className="bg-beitco-green-light text-beitco-green-DEFAULT rounded-full px-2 py-1 text-micro h-5">
                  ✓
                </Badge>
              )}
            </div>
            <span className="text-caption text-muted-foreground">
              {Math.floor((Date.now() - post.createdAt.getTime()) / 3600000)} ساعات
            </span>
          </div>
        </div>

        <p className="text-body mb-md leading-relaxed">{post.content}</p>

        {post.image && (
          <div className="relative w-full aspect-video rounded-input overflow-hidden mb-md bg-surface">
            <Image
              src={post.image}
              alt="Post image"
              fill
              className="object-cover"
            />
          </div>
        )}

        {post.listing && (
          <Link href={`/listings/${post.listing.id}`}>
            <Card className="rounded-input p-md mb-md border-border hover:shadow-card transition-shadow cursor-pointer">
              <div className="grid grid-cols-3 gap-md">
                <div className="relative col-span-1 aspect-video rounded-input overflow-hidden">
                  <Image
                    src={post.listing.image}
                    alt={post.listing.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="col-span-2">
                  <p className="text-body font-medium line-clamp-2">{post.listing.title}</p>
                  <p className="text-caption text-muted-foreground mb-sm">
                    📍 {post.listing.location}
                  </p>
                  <p className="font-mono text-h3 text-beitco-blue-DEFAULT">
                    {post.listing.price.toLocaleString('ar-EG')} ج.م
                  </p>
                  <div className="flex gap-sm text-caption text-muted-foreground mt-sm">
                    <span>🛏️ {post.listing.bedrooms}</span>
                    <span>🚿 {post.listing.bathrooms}</span>
                    <span>📐 {post.listing.area}م²</span>
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        )}

        <div className="flex justify-between text-muted-foreground pt-md border-t border-border">
          <button
            onClick={() => {
              setIsLiked(!isLiked);
              setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
            }}
            className="flex items-center gap-2 min-touch flex-1 justify-center hover:text-beitco-blue-DEFAULT transition-colors"
          >
            <Heart
              className="w-5 h-5"
              fill={isLiked ? 'currentColor' : 'none'}
              color={isLiked ? '#DC2626' : 'currentColor'}
            />
            <span className="text-caption">{likeCount}</span>
          </button>
          <Link href={`/posts/${post.id}`} className="flex items-center gap-2 min-touch flex-1 justify-center hover:text-beitco-blue-DEFAULT transition-colors">
            <MessageCircle className="w-5 h-5" />
            <span className="text-caption">{post.commentsCount}</span>
          </Link>
          <button className="flex items-center gap-2 min-touch flex-1 justify-center hover:text-beitco-blue-DEFAULT transition-colors">
            <Share2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsSaved(!isSaved)}
            className="flex items-center gap-2 min-touch flex-1 justify-center hover:text-beitco-blue-DEFAULT transition-colors"
          >
            <Bookmark
              className="w-5 h-5"
              fill={isSaved ? 'currentColor' : 'none'}
            />
          </button>
        </div>
      </div>
    </Card>
  );
}

export default function HomePage() {
  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto px-0 md:px-0 pt-md pb-lg">
        <Tabs defaultValue="for_you" className="w-full">
          <TabsList className="w-full grid grid-cols-3 rounded-none border-b border-border bg-transparent p-0 mb-md">
            <TabsTrigger
              value="for_you"
              className="rounded-none border-b-2 data-[state=active]:border-beitco-blue-DEFAULT"
            >
              لك
            </TabsTrigger>
            <TabsTrigger
              value="following"
              className="rounded-none border-b-2 data-[state=active]:border-beitco-blue-DEFAULT"
            >
              المتابَعين
            </TabsTrigger>
            <TabsTrigger
              value="videos"
              className="rounded-none border-b-2 data-[state=active]:border-beitco-blue-DEFAULT"
            >
              📹 فيديو
            </TabsTrigger>
          </TabsList>

          <TabsContent value="for_you" className="space-y-md">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </TabsContent>

          <TabsContent value="following" className="space-y-md">
            {posts.slice(0, 2).map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </TabsContent>

          <TabsContent value="videos" className="space-y-md">
            <Card className="rounded-card p-lg border-0 shadow-card text-center">
              <Play className="w-12 h-12 mx-auto mb-md text-muted-foreground" />
              <p className="text-body text-muted-foreground">لا توجد مقاطع فيديو حالياً</p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
