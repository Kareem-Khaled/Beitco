"use client"

import { useState } from 'react'
import { Search, MapPin, Star, TrendingUp, Users, Home } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const mockAreas = [
  { id: '1', slug: 'new-cairo', nameAr: 'القاهرة الجديدة', city: 'القاهرة', lifestyleScore: 8.4, avgPricePerMeter: 28000, trending: true, residents: '1.2M', image: 'https://images.unsplash.com/photo-1549294413-26f195200c16?w=600&q=80' },
  { id: '2', slug: '6-october', nameAr: '6 أكتوبر', city: 'الجيزة', lifestyleScore: 7.8, avgPricePerMeter: 18000, trending: false, residents: '800K', image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80' },
  { id: '3', slug: 'sheikh-zayed', nameAr: 'الشيخ زايد', city: 'الجيزة', lifestyleScore: 8.1, avgPricePerMeter: 25000, trending: true, residents: '500K', image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&q=80' },
  { id: '4', slug: 'new-capital', nameAr: 'العاصمة الإدارية', city: 'القاهرة', lifestyleScore: 7.2, avgPricePerMeter: 22000, trending: true, residents: '150K', image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80' },
  { id: '5', slug: 'maadi', nameAr: 'المعادي', city: 'القاهرة', lifestyleScore: 8.0, avgPricePerMeter: 32000, trending: false, residents: '600K', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80' },
  { id: '6', slug: 'heliopolis', nameAr: 'مصر الجديدة', city: 'القاهرة', lifestyleScore: 7.5, avgPricePerMeter: 35000, trending: false, residents: '700K', image: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=600&q=80' },
  { id: '7', slug: 'shorouk', nameAr: 'الشروق', city: 'القاهرة', lifestyleScore: 7.0, avgPricePerMeter: 14000, trending: false, residents: '300K', image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&q=80' },
  { id: '8', slug: 'north-coast', nameAr: 'الساحل الشمالي', city: 'مطروح', lifestyleScore: 8.8, avgPricePerMeter: 45000, trending: true, residents: '100K', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80' },
]

export default function AreasPage() {
  const [search, setSearch] = useState('')

  const filtered = mockAreas.filter(a => a.nameAr.includes(search) || a.slug.includes(search.toLowerCase()))
  const trending = filtered.filter(a => a.trending)
  const rest = filtered.filter(a => !a.trending)

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1549294413-26f195200c16?w=1200&q=60" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/70 to-emerald-900/90" />
        </div>
        <div className="relative px-4 py-10 text-center text-white">
          <h1 className="text-2xl font-bold mb-2">دليل المناطق</h1>
          <p className="text-white/80 text-sm mb-5">اعرف المنطقة قبل ما تسكن فيها</p>
          <div className="relative max-w-md mx-auto">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="ابحث عن منطقة..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10 bg-white/95 border-0 shadow-lg" />
          </div>
        </div>
      </div>

      {/* Trending Areas - Horizontal scroll */}
      {trending.length > 0 && !search && (
        <div className="py-4">
          <h2 className="px-4 font-semibold text-sm mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-500" /> مناطق رائجة
          </h2>
          <div className="flex gap-3 overflow-x-auto px-4 pb-2">
            {trending.map(area => (
              <a key={area.id} href={`areas/${area.slug}`} className="flex-shrink-0 w-36 rounded-xl overflow-hidden border bg-card shadow-sm hover:shadow-md transition-all">
                <div className="relative h-24">
                  <img src={area.image} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-2 right-2 text-white"><p className="text-xs font-bold">{area.nameAr}</p></div>
                  <div className="absolute top-2 left-2 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">{area.lifestyleScore}</div>
                </div>
                <div className="p-2"><p className="text-[10px] text-muted-foreground">{(area.avgPricePerMeter / 1000).toFixed(0)}K جنيه/م²</p></div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* All Areas */}
      <div className="px-4 py-2 pb-20 space-y-3">
        <h2 className="font-semibold text-sm">كل المناطق</h2>
        {(search ? filtered : rest.length > 0 ? [...rest, ...trending] : filtered).map(area => (
          <a key={area.id} href={`areas/${area.slug}`} className="flex gap-3 p-3 rounded-xl border bg-card hover:shadow-md transition-all hover:-translate-y-0.5">
            <div className="w-20 h-20 rounded-lg flex-shrink-0 overflow-hidden">
              <img src={area.image} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0 py-0.5">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm">{area.nameAr}</h3>
                {area.trending && <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">رائج</span>}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{area.city}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="flex items-center gap-1 text-xs text-muted-foreground"><Home className="h-3 w-3" /> {(area.avgPricePerMeter / 1000).toFixed(0)}K/م²</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground"><Users className="h-3 w-3" /> {area.residents}</span>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center">
              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold", area.lifestyleScore >= 8 ? "bg-green-100 text-green-700" : area.lifestyleScore >= 7 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700")}>
                {area.lifestyleScore}
              </div>
              <span className="text-[9px] text-muted-foreground mt-0.5">تقييم</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
