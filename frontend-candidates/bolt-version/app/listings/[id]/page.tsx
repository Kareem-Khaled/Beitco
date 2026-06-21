'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel';
import { Share2, Phone, MessageCircle, MapPin, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { listings } from '@/lib/mock-data';
import Image from 'next/image';

export default function ListingDetailPage({ params }: { params: { id: string } }) {
  const listing = listings.find(l => l.id === params.id) || listings[0];

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto pb-lg">
        <div className="sticky top-16 z-30 bg-background border-b border-border px-md py-md flex items-center justify-between md:hidden">
          <Link href="/listings">
            <Button variant="ghost" size="icon" className="min-touch">
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          <Button variant="ghost" size="icon" className="min-touch">
            <Share2 className="w-5 h-5" />
          </Button>
        </div>

        <Carousel className="w-full bg-surface">
          <CarouselContent>
            {[listing.image, listing.image2 || listing.image, listing.image3 || listing.image].map((img, idx) => (
              <CarouselItem key={idx}>
                <div className="relative w-full aspect-video bg-surface">
                  <Image
                    src={img}
                    alt={`${listing.title} ${idx + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="start-md" />
          <CarouselNext className="end-md" />
        </Carousel>

        <div className="px-md py-lg space-y-lg">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-h1 font-bold mb-2">{listing.title}</h1>
              <p className="text-caption text-muted-foreground flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {listing.location}, {listing.city}
              </p>
            </div>
            <Button variant="ghost" size="icon" className="min-touch hidden md:flex">
              <Share2 className="w-5 h-5" />
            </Button>
          </div>

          <Card className="rounded-card p-lg border-border bg-surface">
            <p className="text-micro text-muted-foreground mb-2">السعر</p>
            <p className="font-mono text-display text-beitco-blue-DEFAULT">
              {listing.price.toLocaleString('ar-EG')}
              <span className="text-h2 text-muted-foreground ms-2">ج.م</span>
            </p>
          </Card>

          <div className="grid grid-cols-4 gap-md">
            <Card className="rounded-input p-md text-center border-border">
              <p className="text-h2 font-bold text-beitco-blue-DEFAULT">{listing.bedrooms}</p>
              <p className="text-micro text-muted-foreground">غرفة نوم</p>
            </Card>
            <Card className="rounded-input p-md text-center border-border">
              <p className="text-h2 font-bold text-beitco-blue-DEFAULT">{listing.bathrooms}</p>
              <p className="text-micro text-muted-foreground">حمام</p>
            </Card>
            <Card className="rounded-input p-md text-center border-border">
              <p className="text-h2 font-bold text-beitco-blue-DEFAULT">{listing.area}</p>
              <p className="text-micro text-muted-foreground">م²</p>
            </Card>
            <Card className="rounded-input p-md text-center border-border">
              <p className="text-h2 font-bold text-beitco-blue-DEFAULT">
                {listing.type === 'apartment' ? 'شقة' : listing.type === 'villa' ? 'فيلا' : listing.type}
              </p>
              <p className="text-micro text-muted-foreground">النوع</p>
            </Card>
          </div>

          {listing.description && (
            <Card className="rounded-card p-lg border-border">
              <h3 className="text-h3 font-bold mb-md">الوصف</h3>
              <p className="text-body leading-relaxed">{listing.description}</p>
            </Card>
          )}

          <Card className="rounded-card p-lg border-border">
            <h3 className="text-h3 font-bold mb-md">من بيع العقار</h3>
            <div className="flex items-center justify-between mb-md">
              <div className="flex items-center gap-md">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={listing.agent.avatar} />
                  <AvatarFallback>{listing.agent.name.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-body font-medium">{listing.agent.name}</p>
                  {listing.agent.rating && (
                    <p className="text-caption text-muted-foreground">
                      ⭐ {listing.agent.rating} ({listing.agent.ratingCount} تقييم)
                    </p>
                  )}
                </div>
              </div>
              {listing.agent.isVerified && (
                <Badge className="bg-beitco-green-light text-beitco-green-DEFAULT">✓</Badge>
              )}
            </div>

            <div className="flex gap-sm">
              <Button className="flex-1 rounded-button bg-beitco-blue-DEFAULT text-body font-medium">
                <Phone className="w-5 h-5 me-2" />
                اتصال
              </Button>
              <Button variant="outline" className="flex-1 rounded-button text-body font-medium">
                <MessageCircle className="w-5 h-5 me-2" />
                رسالة
              </Button>
            </div>
          </Card>
        </div>

        <div className="fixed bottom-0 inset-inline-0 bg-background border-t border-border p-md md:hidden">
          <div className="flex gap-sm">
            <Button className="flex-1 rounded-button bg-beitco-blue-DEFAULT text-body font-medium">
              <Phone className="w-5 h-5 me-2" />
              اتصال
            </Button>
            <Button variant="outline" className="flex-1 rounded-button text-body font-medium">
              <MessageCircle className="w-5 h-5 me-2" />
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
