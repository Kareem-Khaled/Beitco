'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Share2, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { currentUser, posts } from '@/lib/mock-data';
import Image from 'next/image';

export default function ProfilePage() {
  const tierProgress = 65;
  const requirements = [
    { label: 'التحقق من الهاتف', completed: true },
    { label: '5 منشورات على الأقل', completed: true },
    { label: 'التحقق من الهوية', completed: false },
    { label: '50 متابع', completed: false },
  ];

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto px-md pb-lg pt-md">
        <div className="relative">
          <div className="h-24 bg-gradient-to-r from-beitco-blue-light to-beitco-gold-light rounded-card"></div>

          <div className="relative px-md">
            <Avatar className="w-24 h-24 border-4 border-background absolute -top-12 start-md">
              <AvatarImage src={currentUser.avatar} />
              <AvatarFallback>{currentUser.name.slice(0, 2)}</AvatarFallback>
            </Avatar>

            <div className="pt-16">
              <div className="flex items-start justify-between mb-md">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-h1 font-bold">{currentUser.name}</h1>
                    {currentUser.isVerified && (
                      <Badge className="bg-beitco-green-light text-beitco-green-DEFAULT">✓ موثق</Badge>
                    )}
                  </div>
                  <p className="text-caption text-muted-foreground">{currentUser.city}</p>
                </div>
                <Link href="/settings">
                  <Button variant="outline" size="icon" className="min-touch">
                    <Settings className="w-5 h-5" />
                  </Button>
                </Link>
              </div>

              <p className="text-body text-muted-foreground mb-lg">{currentUser.bio}</p>

              <div className="grid grid-cols-3 gap-md mb-lg text-center">
                <div className="p-md bg-surface rounded-input">
                  <p className="text-h2 font-bold">{currentUser.postsCount}</p>
                  <p className="text-caption text-muted-foreground">منشور</p>
                </div>
                <div className="p-md bg-surface rounded-input">
                  <p className="text-h2 font-bold">{currentUser.followersCount}</p>
                  <p className="text-caption text-muted-foreground">متابِع</p>
                </div>
                <div className="p-md bg-surface rounded-input">
                  <p className="text-h2 font-bold">{currentUser.followingCount}</p>
                  <p className="text-caption text-muted-foreground">متابَع</p>
                </div>
              </div>

              <div className="flex gap-sm mb-lg">
                <Button className="flex-1 rounded-button bg-beitco-blue-DEFAULT text-body font-medium">
                  <MessageCircle className="w-5 h-5 me-2" />
                  تابع
                </Button>
                <Button variant="outline" className="flex-1 rounded-button text-body font-medium">
                  <Share2 className="w-5 h-5 me-2" />
                  مشاركة
                </Button>
              </div>

              <Card className="rounded-card p-lg border-border mb-lg bg-beitco-blue-light/10">
                <h3 className="text-h3 font-bold mb-md">ترقيتك إلى المستوى الثاني</h3>
                <div className="mb-md">
                  <div className="flex justify-between mb-2">
                    <span className="text-caption">التقدم</span>
                    <span className="text-caption font-mono">{tierProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-300 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-beitco-blue-DEFAULT transition-all"
                      style={{ width: `${tierProgress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-2 mb-md">
                  {requirements.map((req, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-caption">
                        {req.completed ? '✓' : '☐'}
                      </span>
                      <span className={req.completed ? 'text-caption text-muted-foreground line-through' : 'text-caption'}>
                        {req.label}
                      </span>
                    </div>
                  ))}
                </div>

                <Button className="w-full rounded-button bg-beitco-blue-DEFAULT text-body font-medium">
                  تحقق الآن
                </Button>
              </Card>
            </div>
          </div>
        </div>

        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="w-full grid grid-cols-3 rounded-none border-b border-border bg-transparent p-0">
            <TabsTrigger value="posts" className="rounded-none border-b-2 data-[state=active]:border-beitco-blue-DEFAULT">
              منشورات
            </TabsTrigger>
            <TabsTrigger value="listings" className="rounded-none border-b-2 data-[state=active]:border-beitco-blue-DEFAULT">
              عقارات
            </TabsTrigger>
            <TabsTrigger value="saved" className="rounded-none border-b-2 data-[state=active]:border-beitco-blue-DEFAULT">
              معجبات
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="space-y-md mt-md">
            {posts.slice(1, 2).map((post) => (
              <Card key={post.id} className="rounded-card p-md border-0 shadow-card">
                <p className="text-body">{post.content}</p>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="listings" className="grid grid-cols-1 md:grid-cols-2 gap-md mt-md">
            <Card className="rounded-card overflow-hidden shadow-card">
              <div className="relative w-full aspect-video bg-surface">
                <Image
                  src="https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg"
                  alt="Listing"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-md">
                <p className="text-body font-medium">شقة في التجمع</p>
                <p className="text-h3 font-mono text-beitco-blue-DEFAULT">1,500,000 ج.م</p>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="saved" className="mt-md">
            <div className="text-center py-lg">
              <p className="text-body text-muted-foreground">لم تحفظ أي منشورات حالياً</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
