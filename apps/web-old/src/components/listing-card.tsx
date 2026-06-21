"use client"

import { useState } from 'react'
import Image from 'next/image'
import { Link } from '@/i18n/routing'
import { Heart, MapPin, Bed, Bath, Maximize, Camera, BadgeCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Listing } from '@/lib/types'
import { cn } from '@/lib/utils'

interface ListingCardProps {
  listing: Listing
  variant?: 'default' | 'compact'
}

export function ListingCard({ listing, variant = 'default' }: ListingCardProps) {
  const [isSaved, setIsSaved] = useState(false)

  const formatPrice = (price: number) => {
    if (price >= 1_000_000) {
      const millions = price / 1_000_000
      return `${millions % 1 === 0 ? millions : millions.toFixed(1)} مليون`
    }
    return new Intl.NumberFormat('ar-EG').format(price)
  }

  const formatPricePerMeter = (price: number, area: number) => {
    const ppm = Math.round(price / area)
    return new Intl.NumberFormat('ar-EG').format(ppm)
  }

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      apartment: 'شقة',
      villa: 'فيلا',
      studio: 'استوديو',
      duplex: 'دوبلكس',
      penthouse: 'بنتهاوس',
      land: 'أرض',
      office: 'مكتب',
      shop: 'محل',
    }
    return types[type] || type
  }

  if (variant === 'compact') {
    return (
      <Link href={`/listings/${listing.id}`} className="block">
        <div className="flex gap-3 p-3 rounded-lg bg-card border border-border">
          <div className="relative w-20 h-20 rounded-md overflow-hidden flex-shrink-0">
            <Image
              src={listing.images[0]}
              alt={listing.title}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground">
              {formatPrice(listing.price)} جنيه
            </p>
            <p className="text-sm text-muted-foreground truncate">
              {listing.location.area}
            </p>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span>{listing.specs.bedrooms} غرف</span>
              <span>{listing.specs.area} م²</span>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link href={`/listings/${listing.id}`} className="block group">
      <div className="flex gap-3 rounded-xl bg-card border border-border shadow-sm transition-shadow hover:shadow-md p-3">
        {/* Image */}
        <div className="relative w-[120px] h-[120px] sm:w-[140px] sm:h-[140px] rounded-lg overflow-hidden flex-shrink-0">
          <Image
            src={listing.images[0]}
            alt={listing.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
          />
          {/* Photo count */}
          <div className="absolute bottom-1.5 start-1.5 flex items-center gap-0.5 bg-black/60 text-white rounded px-1.5 py-0.5">
            <Camera className="w-3 h-3" />
            <span className="text-[10px] font-medium">{listing.images.length}</span>
          </div>
          {/* Purpose badge */}
          <div className="absolute top-1.5 start-1.5">
            <span className={cn(
              "px-1.5 py-0.5 rounded text-[10px] font-medium",
              listing.purpose === 'sale' 
                ? "bg-green-600 text-white" 
                : "bg-blue-600 text-white"
            )}>
              {listing.purpose === 'sale' ? 'للبيع' : 'للإيجار'}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          {/* Top section */}
          <div>
            {/* Price row */}
            <div className="flex items-baseline gap-2">
              <p className="font-bold text-[17px] text-foreground leading-tight">
                {formatPrice(listing.price)} <span className="text-xs font-normal">جنيه</span>
              </p>
            </div>
            {/* Price per meter */}
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {formatPricePerMeter(listing.price, listing.specs.area)} جنيه/م²
            </p>
            {/* Description/title */}
            <p className="text-sm text-foreground mt-1.5 line-clamp-1">
              {getTypeLabel(listing.type)} {listing.specs.area} م² {listing.features.finishing === 'finished' ? 'تشطيب كامل' : listing.features.finishing === 'semi-finished' ? 'نصف تشطيب' : 'بدون تشطيب'}
            </p>
          </div>

          {/* Location */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{listing.location.area}، {listing.location.city}</span>
          </div>

          {/* Specs row */}
          <div className="flex items-center gap-4 mt-2 pt-2 border-t border-border/50">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Maximize className="w-3.5 h-3.5" />
              <span>{listing.specs.area} م²</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Bed className="w-3.5 h-3.5" />
              <span>{listing.specs.bedrooms}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Bath className="w-3.5 h-3.5" />
              <span>{listing.specs.bathrooms}</span>
            </div>
          </div>
        </div>

        {/* Right actions column */}
        <div className="flex flex-col items-center justify-between flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.preventDefault()
              setIsSaved(!isSaved)
            }}
            className="w-8 h-8"
          >
            <Heart className={cn("w-4 h-4", isSaved ? "fill-destructive text-destructive" : "text-muted-foreground")} />
          </Button>
          {/* Verified indicator */}
          <BadgeCheck className="w-4 h-4 text-blue-500" />
        </div>
      </div>
    </Link>
  )
}

// Skeleton loader
export function ListingCardSkeleton() {
  return (
    <div className="flex gap-3 rounded-xl bg-card border border-border p-3 animate-pulse">
      <div className="w-[120px] h-[120px] sm:w-[140px] sm:h-[140px] rounded-lg bg-muted flex-shrink-0" />
      <div className="flex-1 space-y-2.5 py-0.5">
        <div className="h-5 w-28 bg-muted rounded" />
        <div className="h-3 w-20 bg-muted rounded" />
        <div className="h-4 w-full bg-muted rounded" />
        <div className="h-3 w-36 bg-muted rounded" />
        <div className="flex gap-4 pt-2 border-t border-border/50">
          <div className="h-3 w-12 bg-muted rounded" />
          <div className="h-3 w-8 bg-muted rounded" />
          <div className="h-3 w-8 bg-muted rounded" />
        </div>
      </div>
    </div>
  )
}
