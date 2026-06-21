"use client"

import { useState } from 'react'
import { Search, Building2, BedDouble, MapPin, SlidersHorizontal, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Link } from '@/i18n/routing'
import { ListingCard } from '@/components/listing-card'
import { mockListings } from '@/lib/mock-data'

const tabs = [
  { key: 'buy', label: 'شراء', icon: <Building2 className="h-3.5 w-3.5" /> },
  { key: 'rent', label: 'إيجار', icon: <Building2 className="h-3.5 w-3.5" /> },
  { key: 'shared', label: 'سكن مشترك', icon: <BedDouble className="h-3.5 w-3.5" /> },
]

const popularAreas = ['التجمع الخامس', '6 أكتوبر', 'الشيخ زايد', 'المعادي', 'مدينة نصر', 'العاصمة الإدارية']

export default function SearchPage() {
  const [activeTab, setActiveTab] = useState('buy')
  const [query, setQuery] = useState('')
  const [selectedArea, setSelectedArea] = useState('')

  const hasSearched = query.length > 0 || selectedArea.length > 0

  return (
    <div className="min-h-screen">
      {/* Search Header */}
      <div className="sticky top-14 z-20 bg-background border-b px-4 py-3">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ابحث بالمنطقة، الكمبوند، أو النوع..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pr-10 h-11 rounded-xl"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute left-3 top-1/2 -translate-y-1/2">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-3">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all",
                activeTab === tab.key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {!hasSearched ? (
        /* Default State - Popular areas */
        <div className="px-4 py-6">
          <h2 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" /> مناطق شائعة
          </h2>
          <div className="flex flex-wrap gap-2">
            {popularAreas.map(area => (
              <button
                key={area}
                onClick={() => setSelectedArea(area)}
                className="px-3 py-2 rounded-lg border bg-card text-xs font-medium hover:border-primary hover:text-primary transition-colors"
              >
                {area}
              </button>
            ))}
          </div>

          {/* Quick Links */}
          <div className="mt-8 space-y-3">
            <Link href="/compounds" className="flex items-center justify-between p-4 rounded-xl border bg-card hover:shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center">
                  <span className="text-lg">⭐</span>
                </div>
                <div>
                  <p className="text-sm font-medium">تقييمات الكمبوندات</p>
                  <p className="text-[10px] text-muted-foreground">آراء حقيقية من السكان</p>
                </div>
              </div>
            </Link>
            <Link href="/areas" className="flex items-center justify-between p-4 rounded-xl border bg-card hover:shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center">
                  <span className="text-lg">📍</span>
                </div>
                <div>
                  <p className="text-sm font-medium">دليل المناطق</p>
                  <p className="text-[10px] text-muted-foreground">اعرف المنطقة قبل ما تسكن</p>
                </div>
              </div>
            </Link>
            <Link href="/prices" className="flex items-center justify-between p-4 rounded-xl border bg-card hover:shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center">
                  <span className="text-lg">💰</span>
                </div>
                <div>
                  <p className="text-sm font-medium">أسعار العقارات</p>
                  <p className="text-[10px] text-muted-foreground">بيانات السوق الحقيقية</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      ) : (
        /* Search Results */
        <div className="px-4 py-4 pb-20">
          {selectedArea && (
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {selectedArea}
                <button onClick={() => setSelectedArea('')}><X className="h-3 w-3" /></button>
              </span>
            </div>
          )}

          {activeTab === 'shared' ? (
            <div className="text-center py-12">
              <BedDouble className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium mb-1">ابحث عن سكن مشترك</p>
              <p className="text-xs text-muted-foreground mb-4">غرف وأسرّة بأسعار مناسبة</p>
              <Button asChild><Link href="/shared">تصفح السكن المشترك</Link></Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">{mockListings.length} نتيجة</p>
              {mockListings.slice(0, 5).map(listing => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
