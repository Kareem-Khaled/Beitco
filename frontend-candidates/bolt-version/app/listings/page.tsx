'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { listings } from '@/lib/mock-data';
import Link from 'next/link';
import Image from 'next/image';
import { Filter, Heart } from 'lucide-react';
import { useState } from 'react';

export default function ListingsPage() {
  const [favorites, setFavorites] = useState<string[]>([]);

  const toggleFavorite = (id: string) => {
    setFavorites(prev =>
      prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
    );
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-md py-lg">
        <div className="mb-lg">
          <h1 className="text-h1 font-bold mb-md">العقارات</h1>

          <div className="flex gap-md">
            <Input
              type="search"
              placeholder="ابحث عن عقار..."
              className="flex-1 rounded-pill"
            />
            <Button variant="outline" size="icon" className="min-touch">
              <Filter className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
          {listings.map((listing) => (
            <Link key={listing.id} href={`/listings/${listing.id}`}>
              <Card className="rounded-card overflow-hidden shadow-card hover:shadow-lg transition-shadow h-full flex flex-col cursor-pointer group">
                <div className="relative w-full aspect-video bg-surface overflow-hidden">
                  <Image
                    src={listing.image}
                    alt={listing.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform"
                  />
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      toggleFavorite(listing.id);
                    }}
                    className="absolute top-md end-md z-10 bg-white rounded-full p-2 hover:bg-gray-100 transition-colors min-touch"
                  >
                    <Heart
                      className="w-5 h-5"
                      fill={favorites.includes(listing.id) ? '#DC2626' : 'none'}
                      color={favorites.includes(listing.id) ? '#DC2626' : 'currentColor'}
                    />
                  </button>
                  <span className="absolute bottom-md start-md px-2 py-1 rounded-full text-micro font-medium bg-beitco-blue-DEFAULT text-white">
                    {listing.status === 'for_sale' ? 'للبيع' : 'للإيجار'}
                  </span>
                </div>

                <div className="p-md flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-body font-bold line-clamp-2 mb-sm">{listing.title}</h3>
                    <p className="text-caption text-muted-foreground mb-md">
                      📍 {listing.location}
                    </p>
                    <p className="font-mono text-h2 text-beitco-blue-DEFAULT mb-md">
                      {listing.price.toLocaleString('ar-EG')}
                      {listing.status === 'for_rent' && <span className="text-caption font-mono"> /الشهر</span>}
                    </p>
                  </div>

                  <div className="flex gap-2 text-caption text-muted-foreground pt-md border-t border-border">
                    {listing.bedrooms && <span>🛏️ {listing.bedrooms}</span>}
                    {listing.bathrooms && <span>🚿 {listing.bathrooms}</span>}
                    {listing.area && <span>📐 {listing.area}م²</span>}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}

