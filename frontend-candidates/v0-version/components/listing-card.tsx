"use client"

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, MapPin, Bed, Bath, Maximize } from 'lucide-react'
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
    return new Intl.NumberFormat('ar-EG').format(price)
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
        <div className="flex gap-3 p-3 rounded-lg bg-surface border border-border">
          <div className="relative w-20 h-20 rounded-md overflow-hidden flex-shrink-0">
            <Image
              src={listing.images[0]}
              alt={listing.title}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-mono font-semibold text-foreground">
              {formatPrice(listing.price)} EGP
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
      <div className="rounded-xl overflow-hidden bg-card border border-border shadow-sm transition-shadow hover:shadow-md">
        {/* Image */}
        <div className="relative aspect-[4/3]">
          <Image
            src={listing.images[0]}
            alt={listing.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
          />
          {/* Badge */}
          <div className="absolute top-3 start-3">
            <span className={cn(
              "px-2 py-1 rounded text-xs font-medium",
              listing.purpose === 'sale' 
                ? "bg-primary text-primary-foreground" 
                : "bg-accent text-accent-foreground"
            )}>
              {listing.purpose === 'sale' ? 'للبيع' : 'للإيجار'}
            </span>
          </div>
          {/* Save button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.preventDefault()
              setIsSaved(!isSaved)
            }}
            className="absolute top-3 end-3 w-8 h-8 bg-background/80 hover:bg-background"
          >
            <Heart className={cn("w-4 h-4", isSaved && "fill-destructive text-destructive")} />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Price */}
          <p className="font-mono font-bold text-xl text-foreground">
            {formatPrice(listing.price)} EGP
            {listing.purpose === 'rent' && (
              <span className="text-sm font-normal text-muted-foreground">/شهرياً</span>
            )}
          </p>

          {/* Type & Location */}
          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{getTypeLabel(listing.type)}</span>
            <span>•</span>
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span>{listing.location.area}، {listing.location.city}</span>
            </div>
          </div>

          {/* Specs */}
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Bed className="w-4 h-4" />
              <span>{listing.specs.bedrooms}</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Bath className="w-4 h-4" />
              <span>{listing.specs.bathrooms}</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Maximize className="w-4 h-4" />
              <span>{listing.specs.area} م²</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

// Skeleton loader
export function ListingCardSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden bg-card border border-border animate-pulse">
      <div className="aspect-[4/3] bg-surface" />
      <div className="p-4 space-y-3">
        <div className="h-6 w-32 bg-surface rounded" />
        <div className="h-4 w-48 bg-surface rounded" />
        <div className="flex gap-4 pt-3 border-t border-border">
          <div className="h-4 w-12 bg-surface rounded" />
          <div className="h-4 w-12 bg-surface rounded" />
          <div className="h-4 w-16 bg-surface rounded" />
        </div>
      </div>
    </div>
  )
}
