'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Compass, Search, TrendingUp } from 'lucide-react';
import { groups, users } from '@/lib/mock-data';
import Link from 'next/link';
import Image from 'next/image';

export default function ExplorePage() {
  const trendingTags = ['التجمع_الخامس', 'عقارات_القاهرة', 'استثمار_عقاري', 'شقق_للبيع'];

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-md py-lg pb-lg">
        <div className="mb-lg">
          <h1 className="text-h1 font-bold mb-md">استكشاف</h1>

          <div className="flex gap-md mb-lg">
            <Input
              type="search"
              placeholder="ابحث..."
              className="flex-1 rounded-pill"
            />
            <Button variant="outline" size="icon" className="min-touch">
              <Search className="w-5 h-5" />
            </Button>
          </div>

          <div>
            <p className="text-caption font-medium text-muted-foreground mb-2">الأكثر بحثاً</p>
            <div className="flex gap-2 flex-wrap">
              {trendingTags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="cursor-pointer hover:bg-beitco-blue-light transition-colors"
                >
                  #{tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full grid grid-cols-4 rounded-none border-b border-border bg-transparent p-0 mb-lg">
            <TabsTrigger
              value="all"
              className="rounded-none border-b-2 data-[state=active]:border-beitco-blue-DEFAULT"
            >
              الكل
            </TabsTrigger>
            <TabsTrigger
              value="posts"
              className="rounded-none border-b-2 data-[state=active]:border-beitco-blue-DEFAULT"
            >
              منشورات
            </TabsTrigger>
            <TabsTrigger
              value="listings"
              className="rounded-none border-b-2 data-[state=active]:border-beitco-blue-DEFAULT"
            >
              عقارات
            </TabsTrigger>
            <TabsTrigger
              value="people"
              className="rounded-none border-b-2 data-[state=active]:border-beitco-blue-DEFAULT"
            >
              أشخاص
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-md">
            <div>
              <h2 className="text-h2 font-bold mb-md">مجموعات مقترحة</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                {groups.map((group) => (
                  <Card
                    key={group.id}
                    className="rounded-card overflow-hidden shadow-card hover:shadow-lg transition-shadow cursor-pointer group"
                  >
                    <div className="relative w-full h-24 bg-surface overflow-hidden">
                      <Image
                        src={group.coverImage}
                        alt={group.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="p-md">
                      <h3 className="text-body font-bold mb-1">{group.name}</h3>
                      <p className="text-caption text-muted-foreground mb-md line-clamp-2">
                        {group.description}
                      </p>
                      <p className="text-micro text-muted-foreground mb-md">
                        👥 {group.membersCount.toLocaleString('ar-EG')} عضو
                      </p>
                      <Button
                        size="sm"
                        className="w-full rounded-input text-caption font-medium"
                      >
                        {group.isJoined ? 'مرتبط' : 'انضم'}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-h2 font-bold mb-md">أشخاص للمتابعة</h2>
              <div className="space-y-md">
                {users.slice(1).map((user) => (
                  <Card
                    key={user.id}
                    className="rounded-card p-md border-border flex items-center justify-between"
                  >
                    <div className="flex items-center gap-md flex-1">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-body font-medium">{user.name}</p>
                        <p className="text-caption text-muted-foreground">
                          👥 {user.followersCount.toLocaleString('ar-EG')} متابِع
                        </p>
                      </div>
                    </div>
                    <Button size="sm" className="rounded-input">
                      متابعة
                    </Button>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="posts">
            <div className="flex flex-col items-center justify-center py-3xl">
              <TrendingUp className="w-12 h-12 text-muted-foreground mb-md" />
              <p className="text-body text-muted-foreground">منشورات مشهورة قريباً</p>
            </div>
          </TabsContent>

          <TabsContent value="listings">
            <div className="flex flex-col items-center justify-center py-3xl">
              <Compass className="w-12 h-12 text-muted-foreground mb-md" />
              <p className="text-body text-muted-foreground">عقارات مختارة قريباً</p>
            </div>
          </TabsContent>

          <TabsContent value="people">
            <div className="space-y-md">
              {users.map((user) => (
                <Card
                  key={user.id}
                  className="rounded-card p-md border-border flex items-center justify-between"
                >
                  <div className="flex items-center gap-md flex-1">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-body font-medium">{user.name}</p>
                        {user.isVerified && (
                          <Badge className="bg-beitco-green-light text-beitco-green-DEFAULT text-micro">
                            ✓
                          </Badge>
                        )}
                      </div>
                      <p className="text-caption text-muted-foreground">
                        👥 {user.followersCount.toLocaleString('ar-EG')} متابِع
                      </p>
                    </div>
                  </div>
                  <Button size="sm" className="rounded-input">
                    متابعة
                  </Button>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
