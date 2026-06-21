"use client"

import { useState } from 'react'
import { Search, MapPin, ShieldCheck, Wifi, Users, X, BedDouble } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Link } from '@/i18n/routing'
import { TrustBadge } from '@/components/trust-badge'
import Image from 'next/image'

const areas = ['الكل', 'التجمع الخامس', '6 أكتوبر', 'الشيخ زايد', 'المعادي', 'مدينة نصر', 'العاصمة الإدارية', 'حلوان']

const apartments = [
  { id: '1', title: 'شقة 3 غرف مفروشة بالكامل', image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500&h=300&fit=crop', area: 'التجمع الخامس', type: 'شقة', price: 2500, trust: 9.2, verified: true, beds: { total: 6, available: 2 }, internet: 9.4, residents: 6, reviews: 24, gender: 'male' },
  { id: '2', title: 'غرفة خاصة قريبة من سمارت فيلدج', image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=500&h=300&fit=crop', area: 'الشيخ زايد', type: 'غرفة', price: 4500, trust: 8.8, verified: true, beds: { total: 4, available: 1 }, internet: 8.9, residents: 3, reviews: 12, gender: 'male' },
  { id: '3', title: 'سرير في شقة طلاب', image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=500&h=300&fit=crop', area: 'مدينة نصر', type: 'سرير', price: 1800, trust: 7.5, verified: false, beds: { total: 8, available: 3 }, internet: 7.2, residents: 5, reviews: 8, gender: 'mixed' },
  { id: '4', title: 'شقة بنات — المعادي', image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500&h=300&fit=crop', area: 'المعادي', type: 'شقة', price: 2800, trust: 9.0, verified: true, beds: { total: 4, available: 2 }, internet: 8.5, residents: 2, reviews: 15, gender: 'female' },
  { id: '5', title: 'سرير قرب جامعة عين شمس', image: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=500&h=300&fit=crop', area: 'مدينة نصر', type: 'سرير', price: 1500, trust: 6.8, verified: false, beds: { total: 8, available: 4 }, internet: 6.5, residents: 7, reviews: 5, gender: 'male' },
]

export default function BrowsePage() {
  const [selectedArea, setSelectedArea] = useState('الكل')
  const [query, setQuery] = useState('')

  const filtered = apartments.filter(a => {
    if (selectedArea !== 'الكل' && a.area !== selectedArea) return false
    if (query && !a.title.includes(query) && !a.area.includes(query)) return false
    return true
  })

  return (
    <div className="min-h-screen pb-20">
      {/* Search */}
      <div className="sticky top-14 z-20 bg-background border-b px-4 py-3">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ابحث بالمنطقة أو اسم الشقة..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="pr-10 h-10 rounded-xl"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute left-3 top-1/2 -translate-y-1/2">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Area Chips */}
      <div className="px-4 pt-3 pb-2 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 w-max">
          {areas.map(area => (
            <button
              key={area}
              onClick={() => setSelectedArea(area)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                selectedArea === area ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}
            >
              {area}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="px-4 py-3">
        <p className="text-[10px] text-muted-foreground mb-3">{filtered.length} شقة متاحة</p>
        <div className="space-y-4">
          {filtered.map(apt => (
            <Link
              key={apt.id}
              href={`/apartment/${apt.id}`}
              className="group block overflow-hidden rounded-2xl border bg-surface hover:shadow-[var(--shadow-elevated)] transition-all"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                <Image src={apt.image} alt={apt.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" unoptimized />
                <div className="absolute left-3 top-3 flex gap-1.5">
                  <span className="rounded-full bg-white/90 backdrop-blur-sm px-2 py-0.5 text-[10px] font-medium">{apt.type}</span>
                  {apt.verified && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-trust px-2 py-0.5 text-[10px] font-medium text-trust-foreground">
                      <ShieldCheck className="h-2.5 w-2.5" /> موثّق
                    </span>
                  )}
                </div>
                <div className="absolute right-3 top-3">
                  <TrustBadge score={apt.trust} />
                </div>
                <span className="absolute bottom-3 left-3 rounded-full bg-black/60 backdrop-blur-sm px-2 py-0.5 text-[10px] text-white">
                  {apt.gender === 'male' ? 'شباب' : apt.gender === 'female' ? 'بنات' : 'مختلط'}
                </span>
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold truncate">{apt.title}</h3>
                    <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {apt.area}
                    </div>
                  </div>
                  <div className="text-left shrink-0">
                    <div className="text-sm font-semibold tabular-nums">
                      {apt.price.toLocaleString()} <span className="text-[10px] font-normal text-muted-foreground">جنيه/شهر</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 rounded-lg bg-muted/60 p-2.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-medium">الأسرّة</span>
                    <span className="text-muted-foreground">{apt.beds.available}/{apt.beds.total} متاح</span>
                  </div>
                  <div className="mt-1.5 flex gap-1">
                    {Array.from({ length: apt.beds.total }).map((_, i) => (
                      <div key={i} className={`h-1.5 flex-1 rounded-full ${i < apt.beds.available ? "bg-trust" : "bg-border"}`} />
                    ))}
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Wifi className="h-3 w-3" /> إنترنت {apt.internet.toFixed(1)}</span>
                  <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" /> {apt.residents} ساكن · {apt.reviews} تقييم</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
