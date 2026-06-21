"use client"

import { Building2, BedDouble, MapPin, ShieldCheck, Wifi, Users, ArrowLeft, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/routing'
import { TrustBadge } from '@/components/trust-badge'
import Image from 'next/image'

const featuredListings = [
  {
    id: '1',
    title: 'شقة 3 غرف مفروشة بالكامل',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=400&fit=crop',
    area: 'التجمع الخامس · القاهرة الجديدة',
    type: 'شقة',
    price: 2500,
    trust: 9.2,
    verified: true,
    beds: { total: 6, available: 2 },
    internet: 9.4,
    residents: 6,
    reviews: 24,
  },
  {
    id: '2',
    title: 'غرفة خاصة قريبة من سمارت فيلدج',
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop',
    area: 'الشيخ زايد',
    type: 'غرفة',
    price: 4500,
    trust: 8.8,
    verified: true,
    beds: { total: 4, available: 1 },
    internet: 8.9,
    residents: 3,
    reviews: 12,
  },
  {
    id: '3',
    title: 'سرير في شقة طلاب',
    image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600&h=400&fit=crop',
    area: 'مدينة نصر · قرب عين شمس',
    type: 'سرير',
    price: 1800,
    trust: 7.5,
    verified: false,
    beds: { total: 8, available: 3 },
    internet: 7.2,
    residents: 5,
    reviews: 8,
  },
]

const stats = [
  { label: 'شقة متاحة', value: '240+' },
  { label: 'سرير فاضي', value: '580+' },
  { label: 'مالك موثّق', value: '120+' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen pb-20">
      {/* Hero */}
      <div className="px-4 pt-5 pb-6">
        <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-medium text-muted-foreground mb-4">
          <Sparkles className="h-3 w-3 text-accent" />
          منصة السكن الموثوقة في مصر
        </span>
        <h1 className="text-2xl font-semibold tracking-tight leading-tight">
          اعرف مكانك
          <span className="block text-primary">قبل ما تسكن فيه.</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          شقق وأسرّة بتقييمات حقيقية من السكان، درجة ثقة، وتكلفة شهرية واضحة.
        </p>

        {/* Role Selection */}
        <div className="grid grid-cols-2 gap-3 mt-5">
          <Link href="/browse" className="group p-4 rounded-2xl border bg-surface hover:shadow-[var(--shadow-soft)] transition-all text-center">
            <BedDouble className="h-7 w-7 mx-auto text-primary mb-2" />
            <p className="text-sm font-semibold">بدوّر على سرير</p>
            <p className="text-[10px] text-muted-foreground mt-1">تصفح الشقق المتاحة</p>
          </Link>
          <Link href="/post" className="group p-4 rounded-2xl border bg-surface hover:shadow-[var(--shadow-soft)] transition-all text-center">
            <Building2 className="h-7 w-7 mx-auto text-accent mb-2" />
            <p className="text-sm font-semibold">عندي شقة</p>
            <p className="text-[10px] text-muted-foreground mt-1">أضف شقتك وأسرّتها</p>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="flex justify-around py-3 mx-4 rounded-2xl border bg-surface mb-5">
        {stats.map(stat => (
          <div key={stat.label} className="text-center">
            <p className="text-lg font-semibold text-primary tabular-nums">{stat.value}</p>
            <p className="text-[9px] text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Matches CTA */}
      <div className="mx-4 mb-6 p-4 rounded-2xl border border-trust/30 bg-trust-soft">
        <p className="text-sm font-semibold mb-1">مش عارف تختار؟</p>
        <p className="text-[11px] text-muted-foreground mb-3">قولنا شغلك أو جامعتك وهنقترحلك أقرب الأماكن المناسبة</p>
        <Button size="sm" asChild className="rounded-xl">
          <Link href="/matches" className="gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> جرّب المقترحات
          </Link>
        </Button>
      </div>

      {/* Featured Listings */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">أحدث الشقق</h2>
          <Link href="/browse" className="text-xs text-primary font-medium">عرض الكل</Link>
        </div>

        <div className="space-y-4">
          {featuredListings.map(listing => (
            <Link
              key={listing.id}
              href={`/apartment/${listing.id}`}
              className="group block overflow-hidden rounded-2xl border bg-surface hover:shadow-[var(--shadow-elevated)] transition-all"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                <Image
                  src={listing.image}
                  alt={listing.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  unoptimized
                />
                <div className="absolute left-3 top-3 flex gap-1.5">
                  <span className="rounded-full bg-white/90 backdrop-blur-sm px-2 py-0.5 text-[10px] font-medium">
                    {listing.type}
                  </span>
                  {listing.verified && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-trust px-2 py-0.5 text-[10px] font-medium text-trust-foreground">
                      <ShieldCheck className="h-2.5 w-2.5" /> موثّق
                    </span>
                  )}
                </div>
                <div className="absolute right-3 top-3">
                  <TrustBadge score={listing.trust} />
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold truncate">{listing.title}</h3>
                    <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {listing.area}
                    </div>
                  </div>
                  <div className="text-left shrink-0">
                    <div className="text-sm font-semibold tabular-nums">
                      {listing.price.toLocaleString()} <span className="text-[10px] font-normal text-muted-foreground">جنيه/شهر</span>
                    </div>
                  </div>
                </div>

                {/* Bed progress bar */}
                <div className="mt-3 rounded-lg bg-muted/60 p-2.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-medium">الأسرّة</span>
                    <span className="text-muted-foreground">{listing.beds.available}/{listing.beds.total} متاح</span>
                  </div>
                  <div className="mt-1.5 flex gap-1">
                    {Array.from({ length: listing.beds.total }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full ${i < listing.beds.available ? "bg-trust" : "bg-border"}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Wifi className="h-3 w-3" /> إنترنت {listing.internet.toFixed(1)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3 w-3" /> {listing.residents} ساكن · {listing.reviews} تقييم
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
