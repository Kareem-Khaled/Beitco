'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, MessageCircle, UserPlus, CircleCheck as CheckCircle, TrendingUp, Bell } from 'lucide-react';
import Link from 'next/link';
import { notifications } from '@/lib/mock-data';

const NotificationIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'like':
      return <Heart className="w-5 h-5 text-red-500" fill="currentColor" />;
    case 'comment':
      return <MessageCircle className="w-5 h-5 text-blue-500" />;
    case 'follow':
      return <UserPlus className="w-5 h-5 text-green-500" />;
    case 'approval':
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case 'match':
      return <TrendingUp className="w-5 h-5 text-gold-500" />;
    default:
      return <Bell className="w-5 h-5" />;
  }
};

export default function NotificationsPage() {
  const groupedNotifs = {
    today: notifications.filter(
      (n) => Date.now() - n.createdAt.getTime() < 24 * 60 * 60 * 1000
    ),
    earlier: notifications.filter(
      (n) => Date.now() - n.createdAt.getTime() >= 24 * 60 * 60 * 1000
    ),
  };

  return (
    <MainLayout showHeader={false} showBottomNav={true}>
      <div className="max-w-2xl mx-auto">
        <div className="sticky top-0 z-30 bg-background border-b border-border px-md py-md">
          <h1 className="text-h2 font-bold">الإشعارات</h1>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full grid grid-cols-4 rounded-none border-b border-border bg-transparent p-0 px-md">
            <TabsTrigger
              value="all"
              className="rounded-none border-b-2 data-[state=active]:border-beitco-blue-DEFAULT text-caption"
            >
              الكل
            </TabsTrigger>
            <TabsTrigger
              value="social"
              className="rounded-none border-b-2 data-[state=active]:border-beitco-blue-DEFAULT text-caption"
            >
              اجتماعي
            </TabsTrigger>
            <TabsTrigger
              value="property"
              className="rounded-none border-b-2 data-[state=active]:border-beitco-blue-DEFAULT text-caption"
            >
              عقارات
            </TabsTrigger>
            <TabsTrigger
              value="approval"
              className="rounded-none border-b-2 data-[state=active]:border-beitco-blue-DEFAULT text-caption"
            >
              موافقات
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-0">
            {groupedNotifs.today.length > 0 && (
              <div>
                <p className="text-caption font-medium text-muted-foreground px-md py-md">اليوم</p>
                <div className="space-y-0">
                  {groupedNotifs.today.map((notif) => (
                    <Link
                      key={notif.id}
                      href={notif.relatedPostId ? `/posts/${notif.relatedPostId}` : '#'}
                    >
                      <div
                        className={`px-md py-md border-b border-border hover:bg-surface transition-colors cursor-pointer ${
                          !notif.isRead ? 'bg-beitco-blue-light/5' : ''
                        }`}
                      >
                        <div className="flex items-start gap-md">
                          <Avatar className="w-12 h-12 flex-shrink-0">
                            <AvatarImage
                              src={
                                Array.isArray(notif.actor)
                                  ? notif.actor[0]?.avatar || ''
                                  : notif.actor?.avatar || ''
                              }
                            />
                            <AvatarFallback>
                              {Array.isArray(notif.actor)
                                ? notif.actor[0]?.name?.slice(0, 2) || ''
                                : notif.actor?.name?.slice(0, 2) || ''}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1">
                            <p className="text-body mb-1">
                              <span className="font-medium">
                                {Array.isArray(notif.actor)
                                  ? `${notif.actor[0]?.name || ''} و${notif.actor.length - 1} آخرين`
                                  : notif.actor?.name || ''}
                              </span>{' '}
                              {notif.content}
                            </p>
                            <p className="text-micro text-muted-foreground">
                              {Math.floor(
                                (Date.now() - notif.createdAt.getTime()) /
                                  60000
                              )}
                              {'  دقيقة'}
                            </p>
                          </div>

                          {!notif.isRead && (
                            <div className="w-2 h-2 rounded-full bg-beitco-blue-DEFAULT flex-shrink-0"></div>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {groupedNotifs.earlier.length > 0 && (
              <div>
                <p className="text-caption font-medium text-muted-foreground px-md py-md">أقدم</p>
                <div className="space-y-0">
                  {groupedNotifs.earlier.map((notif) => (
                    <div key={notif.id} className="px-md py-md border-b border-border">
                      <div className="flex items-start gap-md">
                        <Avatar className="w-12 h-12">
                          <AvatarImage
                            src={
                              Array.isArray(notif.actor)
                                ? notif.actor[0]?.avatar || ''
                                : notif.actor?.avatar || ''
                            }
                          />
                          <AvatarFallback>
                            {Array.isArray(notif.actor)
                              ? notif.actor[0]?.name?.slice(0, 2) || ''
                              : notif.actor?.name?.slice(0, 2) || ''}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-body mb-1 text-muted-foreground">
                            {notif.content}
                          </p>
                          <p className="text-micro text-muted-foreground">
                            {notif.createdAt.toLocaleDateString('ar-EG')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {['social', 'property', 'approval'].map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-0">
              <div className="flex flex-col items-center justify-center py-3xl text-center">
                <Bell className="w-12 h-12 text-muted-foreground mb-md" />
                <p className="text-body text-muted-foreground">
                  لا توجد إشعارات من هذا النوع
                </p>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </MainLayout>
  );
}
