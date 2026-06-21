'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { conversations } from '@/lib/mock-data';

export default function ChatPage() {
  return (
    <MainLayout showHeader={false} showBottomNav={true}>
      <div className="max-w-2xl mx-auto">
        <div className="sticky top-0 z-30 bg-background border-b border-border px-md py-md">
          <h1 className="text-h2 font-bold">الرسائل</h1>
        </div>

        <Tabs defaultValue="property" className="w-full">
          <TabsList className="w-full grid grid-cols-2 rounded-none border-b border-border bg-transparent p-0 px-md">
            <TabsTrigger
              value="property"
              className="rounded-none border-b-2 data-[state=active]:border-beitco-blue-DEFAULT"
            >
              محادثات العقارات
            </TabsTrigger>
            <TabsTrigger
              value="direct"
              className="rounded-none border-b-2 data-[state=active]:border-beitco-blue-DEFAULT"
            >
              رسائل مباشرة
            </TabsTrigger>
          </TabsList>

          <TabsContent value="property" className="space-y-0 mt-0">
            {conversations.slice(0, 1).map((conv) => (
              <Link key={conv.id} href={`/chat/${conv.id}`}>
                <div className="px-md py-md border-b border-border hover:bg-surface transition-colors cursor-pointer">
                  <div className="flex items-start gap-md mb-md">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={conv.participantAvatar} />
                      <AvatarFallback>{conv.participantName.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-body font-medium">{conv.participantName}</span>
                        {conv.unreadCount > 0 && (
                          <Badge className="bg-beitco-blue-DEFAULT text-white rounded-full px-2 py-1 text-micro">
                            {conv.unreadCount}
                          </Badge>
                        )}
                      </div>
                      <p className="text-caption text-muted-foreground line-clamp-2">
                        {conv.lastMessage}
                      </p>
                    </div>
                    <span className="text-micro text-muted-foreground flex-shrink-0">
                      {new Date(conv.lastMessageTime).toLocaleTimeString('ar-EG', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {conv.listing && (
                    <Card className="rounded-input p-2 border-border bg-surface">
                      <p className="text-micro font-medium line-clamp-1">{conv.listing.title}</p>
                    </Card>
                  )}
                </div>
              </Link>
            ))}
          </TabsContent>

          <TabsContent value="direct" className="space-y-0 mt-0">
            {conversations.map((conv) => (
              <Link key={conv.id} href={`/chat/${conv.id}`}>
                <div className="px-md py-md border-b border-border hover:bg-surface transition-colors cursor-pointer">
                  <div className="flex items-center gap-md">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={conv.participantAvatar} />
                      <AvatarFallback>{conv.participantName.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-body font-medium">{conv.participantName}</span>
                        {conv.unreadCount > 0 && (
                          <Badge className="bg-beitco-blue-DEFAULT text-white rounded-full px-2 py-1 text-micro">
                            {conv.unreadCount}
                          </Badge>
                        )}
                      </div>
                      <p className="text-caption text-muted-foreground line-clamp-1">
                        {conv.lastMessage}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </TabsContent>
        </Tabs>

        {conversations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-3xl text-center">
            <MessageCircle className="w-12 h-12 text-muted-foreground mb-md" />
            <p className="text-body text-muted-foreground">لا توجد محادثات حالياً</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
