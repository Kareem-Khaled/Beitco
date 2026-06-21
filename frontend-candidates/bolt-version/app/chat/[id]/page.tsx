'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ArrowRight, Image as ImageIcon, Mic, Send } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { conversations } from '@/lib/mock-data';

export default function ChatDetailPage({ params }: { params: { id: string } }) {
  const conversation = conversations[0];
  const [message, setMessage] = useState('');

  const quickReplies = ['هل متاح؟', 'السعر؟', 'ممكن زيارة؟'];

  return (
    <MainLayout showHeader={false}>
      <div className="max-w-2xl mx-auto h-screen flex flex-col">
        <div className="sticky top-0 z-30 bg-background border-b border-border px-md py-md flex items-center justify-between">
          <div className="flex items-center gap-md">
            <Link href="/chat">
              <Button variant="ghost" size="icon" className="min-touch">
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Avatar className="w-10 h-10">
              <AvatarImage src={conversation.participantAvatar} />
              <AvatarFallback>{conversation.participantName.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-body font-medium">{conversation.participantName}</p>
              <p className="text-micro text-muted-foreground">نشط الآن</p>
            </div>
          </div>
        </div>

        {conversation.listing && (
          <Card className="rounded-input m-md p-md border-border bg-surface">
            <p className="text-micro text-muted-foreground mb-1">محادثة حول</p>
            <p className="text-body font-medium">{conversation.listing.title}</p>
          </Card>
        )}

        <div className="flex-1 overflow-y-auto px-md py-md space-y-md">
          <div className="flex gap-md">
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarImage src={conversation.participantAvatar} />
              <AvatarFallback>{conversation.participantName.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <Card className="rounded-input p-md bg-surface max-w-xs">
              <p className="text-body">{conversation.lastMessage}</p>
              <p className="text-micro text-muted-foreground mt-1">قبل 5 دقائق</p>
            </Card>
          </div>

          <div className="flex gap-md justify-end">
            <Card className="rounded-input p-md bg-beitco-blue-DEFAULT text-white max-w-xs">
              <p className="text-body">شكراً، هل يمكن عرض المزيد من الصور؟</p>
              <p className="text-micro text-blue-200 mt-1">قبل 2 دقائق ✓✓</p>
            </Card>
          </div>
        </div>

        {message === '' && (
          <div className="px-md py-md">
            <p className="text-caption text-muted-foreground mb-md">ردود سريعة</p>
            <div className="flex gap-2 mb-md flex-wrap">
              {quickReplies.map((reply) => (
                <button
                  key={reply}
                  onClick={() => setMessage(reply)}
                  className="px-md py-2 rounded-pill bg-surface border border-border text-caption hover:bg-beitco-blue-light transition-colors"
                >
                  {reply}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="bg-background border-t border-border px-md py-md flex gap-md">
          <Button variant="ghost" size="icon" className="min-touch flex-shrink-0">
            <ImageIcon className="w-5 h-5" />
          </Button>
          <Input
            type="text"
            placeholder="اكتب رسالة..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 rounded-pill"
          />
          <Button
            size="icon"
            className="min-touch flex-shrink-0 bg-beitco-blue-DEFAULT hover:bg-beitco-blue-hover"
            disabled={!message.trim()}
            onClick={() => setMessage('')}
          >
            {message.trim() ? (
              <Send className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
