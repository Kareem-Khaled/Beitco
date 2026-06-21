'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { CircleAlert as AlertCircle, Image, Video, ChartBar as BarChart3, MapPin, Send } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useState } from 'react';
import { currentUser } from '@/lib/mock-data';

export default function CreatePage() {
  const [content, setContent] = useState('');
  const isRestricted = currentUser.tier >= 3;

  return (
    <MainLayout showHeader={false} showBottomNav={true}>
      <div className="max-w-2xl mx-auto pb-lg">
        <div className="sticky top-0 z-30 bg-background border-b border-border px-md py-md">
          <h1 className="text-h2 font-bold">إنشاء منشور</h1>
        </div>

        {isRestricted && (
          <Alert className="mx-md mt-lg bg-beitco-gold-light border-beitco-gold-DEFAULT">
            <AlertCircle className="h-4 w-4 text-beitco-gold-DEFAULT" />
            <AlertDescription className="text-beitco-gold-DEFAULT">
              بوستك هيتراجع قبل النشر من قبل الفريق
            </AlertDescription>
          </Alert>
        )}

        <Card className="rounded-card m-md border-border">
          <div className="p-lg space-y-lg">
            <div className="flex items-center gap-md">
              <Avatar className="w-12 h-12">
                <AvatarImage src={currentUser.avatar} />
                <AvatarFallback>{currentUser.name.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-body font-medium">{currentUser.name}</p>
                <select className="text-caption text-muted-foreground bg-transparent">
                  <option>الجميع يرون</option>
                  <option>المتابعون فقط</option>
                  <option>خاص</option>
                </select>
              </div>
            </div>

            <Textarea
              placeholder="شارك رأيك..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="rounded-input min-h-[120px] text-body resize-none border-border"
            />

            <div className="grid grid-cols-2 gap-md">
              <Input
                type="number"
                placeholder="عدد الأحرف"
                disabled
                value={content.length}
                className="rounded-input text-caption text-center"
              />
              <span className="text-caption text-muted-foreground text-center self-center">
                {5000 - content.length} متبقية
              </span>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" className="rounded-input text-caption">
                <Image className="w-4 h-4 me-1" />
                صورة
              </Button>
              <Button variant="outline" size="sm" className="rounded-input text-caption">
                <Video className="w-4 h-4 me-1" />
                فيديو
              </Button>
              <Button variant="outline" size="sm" className="rounded-input text-caption">
                <BarChart3 className="w-4 h-4 me-1" />
                استطلاع
              </Button>
              <Button variant="outline" size="sm" className="rounded-input text-caption">
                <MapPin className="w-4 h-4 me-1" />
                موقع
              </Button>
            </div>

            <Button
              className="w-full rounded-button bg-beitco-blue-DEFAULT text-body font-medium"
              disabled={!content.trim()}
            >
              <Send className="w-5 h-5 me-2" />
              {isRestricted ? 'إرسال للموافقة' : 'نشر'}
            </Button>

            <Link href="/">
              <Button
                variant="outline"
                className="w-full rounded-button text-body font-medium"
              >
                إلغاء
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
