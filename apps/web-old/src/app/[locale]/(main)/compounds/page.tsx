"use client"

import { useState } from 'react'
import { Search, Star, MapPin, Camera, Users } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const mockCompounds = [
  { id: '1', slug: 'madinaty', nameAr: 'مدينتي', nameEn: 'Madinaty', developer: 'طلعت مصطفى', city: 'القاهرة الجديدة', avgRating: 8.2, totalReviews: 342, photos: 56, coverImage: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80' },
  { id: '2', slug: 'hyde-park', nameAr: 'هايد بارك', nameEn: 'Hyde Park', developer: 'هايد بارك للتطوير', city: 'القاهرة الجديدة', avgRating: 7.8, totalReviews: 156, photos: 34, coverImage: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80' },
  { id: '3', slug: 'palm-hills-october', nameAr: 'بالم هيلز أكتوبر', nameEn: 'Palm Hills October', developer: 'بالم هيلز', city: '6 أكتوبر', avgRating: 8.5, totalReviews: 228, photos: 42, coverImage: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80' },
  { id: '4', slug: 'mountain-view-icity', nameAr: 'ماونتن فيو آي سيتي', nameEn: 'Mountain View iCity', developer: 'ماونتن فيو', city: 'القاهرة الجديدة', avgRating: 7.9, totalReviews: 98, photos: 23, coverImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80' },
  { id: '5', slug: 'sodic-east', nameAr: 'سوديك إيست', nameEn: 'SODIC East', developer: 'سوديك', city: 'الشروق', avgRating: 7.5, totalReviews: 67, photos: 18, coverImage: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&q=80' },
  { id: '6', slug: 'allegria', nameAr: 'أليجريا', nameEn: 'Allegria', developer: 'سوديك', city: '6 أكتوبر', avgRating: 8.1, totalReviews: 189, photos: 38, coverImage: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80' },
]

const cities = ['الكل', 'القاهرة الجديدة', '6 أكتوبر', 'الشروق', 'العاصمة الإدارية', 'الشيخ زايد']

function RatingBadge({ rating }: { rating: number }) {
  const color = rating >= 8 ? 'bg-green-500' : rating >= 7 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className={`${color} text-white text-xs font-bold px-2 py-1 rounded-lg`}>
      {rating}
    </div>
  )
}

export default function CompoundsPage() {
  const [search, setSearch] = useState('')
  const [selectedCity, setSelectedCity] = useState('الكل')

  const filtered = mockCompounds.filter(c => {
    const matchesSearch = c.nameAr.includes(search) || c.nameEn.toLowerCase().includes(search.toLowerCase())
    const matchesCity = selectedCity === 'الكل' || c.city === selectedCity
    return matchesSearch && matchesCity
  })

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Hero with Background Image */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=60" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        </div>
        <div className="relative px-4 py-10 text-center text-white">
          <h1 className="text-2xl font-bold mb-2">تقييمات الكمبوندات</h1>
          <p className="text-white/80 text-sm mb-5">آراء حقيقية من سكان حقيقيين • {mockCompounds.length}+ كمبوند</p>
          <div className="relative max-w-md mx-auto">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="ابحث عن كمبوند..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10 bg-white/95 border-0 shadow-lg" />
          </div>
        </div>
      </div>

      {/* City Filter */}
      <div className="px-4 py-3 overflow-x-auto bg-background border-b sticky top-0 z-10">
        <div className="flex gap-2">
          {cities.map(city => (
            <button key={city} onClick={() => setSelectedCity(city)} className={cn("px-3 py-1.5 rounded-full text-xs whitespace-nowrap border transition-all", selectedCity === city ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-background border-border text-muted-foreground hover:border-primary/50")}>
              {city}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="px-4 py-4 pb-20 space-y-4">
        <p className="text-sm text-muted-foreground">{filtered.length} كمبوند</p>

        {/* Featured (first item larger) */}
        {filtered.length > 0 && (
          <a href={`compounds/${filtered[0].slug}`} className="block rounded-2xl overflow-hidden border bg-card shadow-sm hover:shadow-lg transition-shadow">
            <div className="relative h-44">
              <img src={filtered[0].coverImage} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute top-3 left-3"><RatingBadge rating={filtered[0].avgRating} /></div>
              <div className="absolute bottom-3 right-3 text-white">
                <h3 className="font-bold text-lg">{filtered[0].nameAr}</h3>
                <div className="flex items-center gap-1 text-sm opacity-90"><MapPin className="h-3 w-3" /><span>{filtered[0].city}</span></div>
              </div>
              <div className="absolute bottom-3 left-3 flex items-center gap-2 text-white/80 text-xs">
                <span className="flex items-center gap-1"><Camera className="h-3 w-3" />{filtered[0].photos}</span>
                <span className="flex items-center gap-1"><Users className="h-3 w-3" />{filtered[0].totalReviews} تقييم</span>
              </div>
            </div>
            <div className="p-3 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{filtered[0].developer}</p>
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="text-sm font-bold">{filtered[0].avgRating}</span>
                <span className="text-xs text-muted-foreground">/ 10</span>
              </div>
            </div>
          </a>
        )}

        {/* Rest of compounds */}
        {filtered.slice(1).map(compound => (
          <a key={compound.id} href={`compounds/${compound.slug}`} className="flex gap-3 p-3 rounded-xl border bg-card hover:shadow-md transition-all hover:-translate-y-0.5">
            <div className="w-24 h-24 rounded-lg flex-shrink-0 overflow-hidden relative">
              <img src={compound.coverImage} alt="" className="w-full h-full object-cover" />
              <div className="absolute bottom-1 left-1"><RatingBadge rating={compound.avgRating} /></div>
            </div>
            <div className="flex-1 min-w-0 py-0.5">
              <h3 className="font-semibold text-sm truncate">{compound.nameAr}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{compound.developer}</p>
              <div className="flex items-center gap-1 mt-1.5">
                <MapPin className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{compound.city}</span>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <span className="flex items-center gap-1 text-xs text-muted-foreground"><Users className="h-3 w-3" /> {compound.totalReviews} تقييم</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground"><Camera className="h-3 w-3" /> {compound.photos} صورة</span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
