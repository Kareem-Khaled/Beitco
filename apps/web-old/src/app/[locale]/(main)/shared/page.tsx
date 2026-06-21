"use client"

import { useState } from 'react'
import { Search, BedDouble, DoorOpen, Home, MapPin, Star, Users, Wifi, Shield, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Link } from '@/i18n/routing'

type ListingType = 'all' | 'bed' | 'room' | 'apartment'

const typeFilters: { key: ListingType; label: string; icon: React.ReactNode }[] = [
  { key: 'all', label: 'الكل', icon: null },
  { key: 'bed', label: 'سرير', icon: <BedDouble className="h-3.5 w-3.5" /> },
  { key: 'room', label: 'غرفة', icon: <DoorOpen className="h-3.5 w-3.5" /> },
  { key: 'apartment', label: 'شقة كاملة', icon: <Home className="h-3.5 w-3.5" /> },
]

const mockSharedListings = [
  {
    id: '1',
    title: 'سرير في غرفة مشتركة - مدينة نصر',
    type: 'bed' as const,
    price: 2500,
    location: 'مدينة نصر، القاهرة',
    image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600&q=80',
    totalBeds: 4,
    availableBeds: 1,
    amenities: ['واي فاي', 'غسالة', 'مطبخ'],
    gender: 'شباب',
    landlordRating: 4.2,
    verified: true,
  },
  {
    id: '2',
    title: 'غرفة خاصة في شقة مشتركة - المعادي',
    type: 'room' as const,
    price: 5500,
    location: 'المعادي، القاهرة',
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80',
    totalBeds: 3,
    availableBeds: 1,
    amenities: ['واي فاي', 'تكييف', 'مطبخ', 'بلكونة'],
    gender: 'بنات',
    landlordRating: 4.8,
    verified: true,
  },
  {
    id: '3',
    title: 'شقة 3 غرف للمشاركة - 6 أكتوبر',
    type: 'apartment' as const,
    price: 12000,
    location: '6 أكتوبر، الجيزة',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80',
    totalBeds: 6,
    availableBeds: 3,
    amenities: ['واي فاي', 'تكييف', 'غسالة', 'مطبخ كامل'],
    gender: 'مختلط',
    landlordRating: 3.9,
    verified: false,
  },
  {
    id: '4',
    title: 'سرير للطالبات - قريب من GUC',
    type: 'bed' as const,
    price: 3000,
    location: 'التجمع الخامس، القاهرة',
    image: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=600&q=80',
    totalBeds: 6,
    availableBeds: 2,
    amenities: ['واي فاي', 'مطبخ', 'قريب من الجامعة'],
    gender: 'بنات',
    landlordRating: 4.5,
    verified: true,
  },
  {
    id: '5',
    title: 'غرفة مفروشة - الشيخ زايد',
    type: 'room' as const,
    price: 7000,
    location: 'الشيخ زايد، الجيزة',
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80',
    totalBeds: 2,
    availableBeds: 1,
    amenities: ['واي فاي', 'تكييف', 'حمام خاص'],
    gender: 'شباب',
    landlordRating: 4.1,
    verified: true,
  },
]

function TypeBadge({ type }: { type: string }) {
  const config = {
    bed: { label: 'سرير', className: 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400' },
    room: { label: 'غرفة', className: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400' },
    apartment: { label: 'شقة', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' },
  }[type] || { label: type, className: 'bg-muted text-muted-foreground' }

  return <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${config.className}`}>{config.label}</span>
}

export default function SharedLivingPage() {
  const [selectedType, setSelectedType] = useState<ListingType>('all')
  const [search, setSearch] = useState('')

  const filtered = mockSharedListings.filter(l => {
    if (selectedType !== 'all' && l.type !== selectedType) return false
    if (search && !l.title.includes(search) && !l.location.includes(search)) return false
    return true
  })

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=60" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-purple-900/80 to-purple-900/90" />
        </div>
        <div className="relative px-4 py-8 text-white">
          <h1 className="text-2xl font-bold mb-1">سكن مشترك</h1>
          <p className="text-white/80 text-sm mb-4">غرف وأسرّة بأسعار مناسبة • مُلّاك موثقين</p>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="ابحث بالمنطقة أو الجامعة..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10 bg-white/95 border-0 shadow-lg" />
          </div>
        </div>
      </div>

      {/* Type Filters */}
      <div className="px-4 py-3 bg-background border-b sticky top-14 z-10">
        <div className="flex gap-2">
          {typeFilters.map(f => (
            <button
              key={f.key}
              onClick={() => setSelectedType(f.key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs whitespace-nowrap border transition-all",
                selectedType === f.key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border text-muted-foreground"
              )}
            >
              {f.icon}
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Availability Stats */}
      <div className="px-4 py-3 flex gap-3 overflow-x-auto">
        <div className="flex-shrink-0 px-3 py-2 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900">
          <p className="text-lg font-bold text-purple-700 dark:text-purple-400">{filtered.reduce((s, l) => s + l.availableBeds, 0)}</p>
          <p className="text-[10px] text-muted-foreground">سرير متاح الآن</p>
        </div>
        <div className="flex-shrink-0 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
          <p className="text-lg font-bold text-blue-700 dark:text-blue-400">2,500</p>
          <p className="text-[10px] text-muted-foreground">أقل سعر/شهر</p>
        </div>
        <div className="flex-shrink-0 px-3 py-2 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
          <p className="text-lg font-bold text-green-700 dark:text-green-400">87%</p>
          <p className="text-[10px] text-muted-foreground">مُلّاك موثقين</p>
        </div>
      </div>

      {/* Results */}
      <div className="px-4 pb-20 space-y-3">
        <p className="text-xs text-muted-foreground">{filtered.length} نتيجة</p>

        {filtered.map(listing => (
          <Link key={listing.id} href={`/shared/${listing.id}`} className="block rounded-xl border bg-card overflow-hidden hover:shadow-md transition-all">
            <div className="flex gap-3 p-3">
              <div className="w-24 h-24 rounded-lg flex-shrink-0 overflow-hidden relative">
                <img src={listing.image} alt="" className="w-full h-full object-cover" />
                {listing.verified && (
                  <div className="absolute top-1 left-1 bg-green-500 rounded p-0.5">
                    <Shield className="h-2.5 w-2.5 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <TypeBadge type={listing.type} />
                  <span className="text-[10px] text-muted-foreground">{listing.gender}</span>
                </div>
                <h3 className="text-sm font-medium truncate">{listing.title}</h3>
                <div className="flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">{listing.location}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-sm font-bold text-primary">{listing.price.toLocaleString('ar-EG')} <span className="text-[10px] font-normal text-muted-foreground">جنيه/شهر</span></p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <BedDouble className="h-3 w-3" /> {listing.availableBeds}/{listing.totalBeds}
                    </span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <Star className="h-3 w-3 text-amber-400" /> {listing.landlordRating}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {/* Amenities */}
            <div className="px-3 pb-2.5 flex gap-1.5 flex-wrap">
              {listing.amenities.slice(0, 3).map(a => (
                <span key={a} className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{a}</span>
              ))}
              {listing.amenities.length > 3 && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">+{listing.amenities.length - 3}</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
