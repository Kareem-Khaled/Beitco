'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Share2, Bookmark, Send, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { posts, comments } from '@/lib/mock-data';
import Image from 'next/image';

export default function PostDetailPage({ params }: { params: { id: string } }) {
  const post = posts.find(p => p.id === params.id) || posts[0];
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likeCount, setLikeCount] = useState(post.likesCount);
  const [newComment, setNewComment] = useState('');
  const [allComments, setAllComments] = useState(comments);

  const handleComment = () => {
    if (newComment.trim()) {
      setNewComment('');
    }
  };

  return (
    <MainLayout showHeader={false}>
      <div className="max-w-2xl mx-auto">
        <div className="sticky top-0 z-30 bg-background border-b border-border px-md py-md flex items-center gap-md">
          <Link href="/">
            <Button variant="ghost" size="icon" className="min-touch">
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-h3 font-bold">المنشور</h1>
        </div>

        <Card className="rounded-card p-0 border-0 shadow-none m-0">
          <div className="p-md border-b border-border">
            <div className="flex items-start gap-md mb-md">
              <Avatar className="w-12 h-12">
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
                  {post.createdAt.toLocaleDateString('ar-EG')}
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

            <div className="flex justify-between text-muted-foreground pt-md border-t border-border">
              <div className="flex-1 text-center py-2 hover:bg-surface rounded transition-colors">
                <p className="text-caption">
                  <span className="font-bold text-foreground">{likeCount}</span> إعجاب
                </p>
              </div>
              <div className="flex-1 text-center py-2 hover:bg-surface rounded transition-colors">
                <p className="text-caption">
                  <span className="font-bold text-foreground">{post.commentsCount}</span> تعليق
                </p>
              </div>
            </div>

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
                <span className="text-caption">إعجاب</span>
              </button>
              <button className="flex items-center gap-2 min-touch flex-1 justify-center hover:text-beitco-blue-DEFAULT transition-colors">
                <MessageCircle className="w-5 h-5" />
                <span className="text-caption">تعليق</span>
              </button>
              <button className="flex items-center gap-2 min-touch flex-1 justify-center hover:text-beitco-blue-DEFAULT transition-colors">
                <Share2 className="w-5 h-5" />
                <span className="text-caption">مشاركة</span>
              </button>
            </div>
          </div>
        </Card>

        <div className="px-md py-lg space-y-md">
          <h2 className="text-h3 font-bold">التعليقات</h2>

          {allComments.map((comment) => (
            <div key={comment.id}>
              {comment.isPinned && (
                <Badge className="mb-2 bg-beitco-gold-light text-beitco-gold-DEFAULT">
                  📌 مثبّت
                </Badge>
              )}
              <Card className="rounded-card p-md border-border">
                <div className="flex items-start gap-md mb-md">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={comment.author.avatar} />
                    <AvatarFallback>{comment.author.name.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-body font-medium">{comment.author.name}</span>
                      {comment.author.isVerified && (
                        <Badge className="bg-beitco-green-light text-beitco-green-DEFAULT rounded-full px-1 text-micro h-4">
                          ✓
                        </Badge>
                      )}
                    </div>
                    <p className="text-body my-md">{comment.content}</p>
                    <div className="flex items-center gap-md text-muted-foreground">
                      <span className="text-caption">
                        {comment.createdAt.toLocaleDateString('ar-EG')}
                      </span>
                      <button className="text-caption hover:text-beitco-blue-DEFAULT transition-colors">
                        الرد
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ps-12">
                  <Heart className="w-4 h-4 text-muted-foreground" />
                  <span className="text-micro text-muted-foreground">{comment.likesCount}</span>
                </div>
              </Card>
            </div>
          ))}
        </div>

        <div className="fixed bottom-0 inset-inline-0 bg-background border-t border-border px-md py-md">
          <div className="max-w-2xl mx-auto flex gap-md">
            <Avatar className="w-10 h-10 flex-shrink-0">
              <AvatarImage src="https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg" />
              <AvatarFallback>أ</AvatarFallback>
            </Avatar>
            <div className="flex-1 flex gap-2">
              <Input
                type="text"
                placeholder="أضف تعليقاً..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 rounded-pill"
              />
              <Button
                size="icon"
                className="bg-beitco-blue-DEFAULT hover:bg-beitco-blue-hover min-touch flex-shrink-0"
                onClick={handleComment}
                disabled={!newComment.trim()}
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
