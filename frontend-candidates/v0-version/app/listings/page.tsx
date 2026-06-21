"use client"

import { useState } from 'react'
import { SlidersHorizontal, MapPin, X, ChevronDown } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { ListingCard, ListingCardSkeleton } from '@/components/listing-card'
import { mockListings, egyptianCities, propertyTypes } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

const sortOptions = [
  { value: 'newest', label: 'الأحدث' },
  { value: 'price-low', label: 'السعر: من الأقل' },
  { value: 'price-high', label: 'السعر: من الأعلى' },
  { value: 'area', label: 'المساحة' },
]

export default function ListingsPage() {
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [selectedCity, setSelectedCity] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [purpose, setPurpose] = useState<'all' | 'sale' | 'rent'>('all')
  const [priceRange, setPriceRange] = useState([0, 100])
  const [bedroomsMin, setBedroomsMin] = useState(0)
  const [sortBy, setSortBy] = useState('newest')

  const filteredListings = mockListings.filter((listing) => {
    if (selectedCity && listing.location.city !== selectedCity) return false
    if (selectedType && listing.type !== selectedType) return false
    if (purpose !== 'all' && listing.purpose !== purpose) return false
    return true
  })

  const clearFilters = () => {
    setSelectedCity('')
    setSelectedType('')
    setPurpose('all')
    setPriceRange([0, 100])
    setBedroomsMin(0)
  }

  const hasActiveFilters = selectedCity || selectedType || purpose !== 'all' || bedroomsMin > 0

  return (
    <AppShell>
      {/* Header */}
      <div className="sticky top-14 z-30 bg-background border-b border-border">
        {/* Quick filters */}
        <div className="flex items-center gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
          <Button
            variant={isFilterOpen ? "default" : "outline"}
            size="sm"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex-shrink-0 gap-2"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>فلاتر</span>
            {hasActiveFilters && (
              <span className="w-5 h-5 rounded-full bg-primary-foreground text-primary text-xs flex items-center justify-center">
                {[selectedCity, selectedType, purpose !== 'all', bedroomsMin > 0].filter(Boolean).length}
              </span>
            )}
          </Button>
          
          {/* Purpose toggle */}
          <div className="flex rounded-full bg-surface p-1 flex-shrink-0">
            {['all', 'sale', 'rent'].map((p) => (
              <button
                key={p}
                onClick={() => setPurpose(p as typeof purpose)}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-full transition-colors",
                  purpose === p
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground"
                )}
              >
                {p === 'all' ? 'الكل' : p === 'sale' ? 'للبيع' : 'للإيجار'}
              </button>
            ))}
          </div>

          {/* City quick filter */}
          <div className="relative flex-shrink-0">
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="appearance-none h-9 ps-3 pe-8 rounded-full bg-surface border-0 text-sm text-foreground focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
            >
              <option value="">المدينة</option>
              {egyptianCities.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
            <ChevronDown className="absolute end-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>

          {/* Type quick filter */}
          <div className="relative flex-shrink-0">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="appearance-none h-9 ps-3 pe-8 rounded-full bg-surface border-0 text-sm text-foreground focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
            >
              <option value="">نوع العقار</option>
              {propertyTypes.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute end-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="flex-shrink-0 text-destructive hover:text-destructive"
            >
              مسح الكل
            </Button>
          )}
        </div>
      </div>

      {/* Filter sheet */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 bg-foreground/50" onClick={() => setIsFilterOpen(false)}>
          <div 
            className="absolute bottom-0 inset-x-0 bg-background rounded-t-2xl max-h-[80vh] overflow-y-auto safe-area-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center py-3">
              <div className="w-12 h-1.5 rounded-full bg-border" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">فلاتر البحث</h2>
              <Button variant="ghost" size="icon" onClick={() => setIsFilterOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-4 space-y-6">
              {/* Property type */}
              <div>
                <label className="block font-medium text-foreground mb-3">نوع العقار</label>
                <div className="flex flex-wrap gap-2">
                  {propertyTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setSelectedType(selectedType === type.value ? '' : type.value)}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                        selectedType === type.value
                          ? "bg-primary text-primary-foreground"
                          : "bg-surface text-foreground"
                      )}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price range */}
              <div>
                <label className="block font-medium text-foreground mb-3">
                  نطاق السعر
                  <span className="text-sm font-normal text-muted-foreground ms-2">
                    (بالمليون جنيه)
                  </span>
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={priceRange[0]}
                    onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                    className="flex-1"
                  />
                  <span className="font-mono text-sm text-foreground min-w-[60px] text-center">
                    {priceRange[0]} - {priceRange[1]}+
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                    className="flex-1"
                  />
                </div>
              </div>

              {/* Bedrooms */}
              <div>
                <label className="block font-medium text-foreground mb-3">عدد الغرف (حد أدنى)</label>
                <div className="flex gap-2">
                  {[0, 1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      onClick={() => setBedroomsMin(num)}
                      className={cn(
                        "w-12 h-12 rounded-lg text-sm font-medium transition-colors",
                        bedroomsMin === num
                          ? "bg-primary text-primary-foreground"
                          : "bg-surface text-foreground"
                      )}
                    >
                      {num === 0 ? 'الكل' : num === 5 ? '5+' : num}
                    </button>
                  ))}
                </div>
              </div>

              {/* City */}
              <div>
                <label className="block font-medium text-foreground mb-3">المدينة</label>
                <div className="flex flex-wrap gap-2">
                  {egyptianCities.slice(0, 6).map((city) => (
                    <button
                      key={city}
                      onClick={() => setSelectedCity(selectedCity === city ? '' : city)}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                        selectedCity === city
                          ? "bg-primary text-primary-foreground"
                          : "bg-surface text-foreground"
                      )}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="sticky bottom-0 flex gap-3 p-4 bg-background border-t border-border">
              <Button variant="outline" className="flex-1" onClick={clearFilters}>
                مسح الكل
              </Button>
              <Button className="flex-1" onClick={() => setIsFilterOpen(false)}>
                عرض النتائج ({filteredListings.length})
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Results header */}
      <div className="flex items-center justify-between px-4 py-3">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{filteredListings.length}</span> نتيجة
        </p>
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="appearance-none h-9 ps-3 pe-8 rounded-md bg-transparent border border-border text-sm text-foreground focus:border-primary outline-none cursor-pointer"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute end-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Listings grid */}
      <div className="px-4 pb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>

        {filteredListings.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mb-4">
              <MapPin className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-foreground mb-1">لا توجد نتائج</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              جرب تغيير الفلاتر للحصول على نتائج أكثر
            </p>
            <Button variant="outline" onClick={clearFilters}>
              مسح الفلاتر
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  )
}
