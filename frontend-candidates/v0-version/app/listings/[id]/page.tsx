"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Share2, MoreHorizontal, Heart, MapPin, Bed, Bath, Maximize, Home, Star, Clock, ChevronLeft, ChevronRight, Phone, MessageCircle, BadgeCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ListingCard } from '@/components/listing-card'
import { mockListings } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function ListingDetailPage({ params }: PageProps) {
  const router = useRouter()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isSaved, setIsSaved] = useState(false)
  const [showFullDescription, setShowFullDescription] = useState(false)

  // In real app, would fetch listing by ID
  const listing = mockListings[0]
  const similarListings = mockListings.slice(1, 4)

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

  const getFinishingLabel = (finishing: string) => {
    const labels: Record<string, string> = {
      finished: 'تشطيب كامل',
      'semi-finished': 'نصف تشطيب',
      unfinished: 'بدون تشطيب',
    }
    return labels[finishing] || finishing
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === listing.images.length - 1 ? 0 : prev + 1
    )
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? listing.images.length - 1 : prev - 1
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between h-14 px-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowRight className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSaved(!isSaved)}
              className={cn(isSaved && "text-destructive")}
            >
              <Heart className={cn("w-5 h-5", isSaved && "fill-current")} />
            </Button>
            <Button variant="ghost" size="icon">
              <Share2 className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Image carousel */}
      <div className="relative aspect-[4/3] bg-surface">
        <Image
          src={listing.images[currentImageIndex]}
          alt={listing.title}
          fill
          className="object-cover"
        />
        
        {/* Navigation arrows */}
        {listing.images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute start-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 flex items-center justify-center"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={nextImage}
              className="absolute end-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 flex items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Dots indicator */}
        <div className="absolute bottom-4 inset-x-0 flex justify-center gap-1.5">
          {listing.images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                index === currentImageIndex
                  ? "w-6 bg-background"
                  : "bg-background/50"
              )}
            />
          ))}
        </div>

        {/* Badge */}
        <div className="absolute top-4 start-4">
          <span className={cn(
            "px-3 py-1.5 rounded-md text-sm font-medium",
            listing.purpose === 'sale' 
              ? "bg-primary text-primary-foreground" 
              : "bg-accent text-accent-foreground"
          )}>
            {listing.purpose === 'sale' ? 'للبيع' : 'للإيجار'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="px-4">
        {/* Price */}
        <div className="py-4 border-b border-border">
          <p className="font-mono font-bold text-3xl text-foreground">
            {formatPrice(listing.price)} EGP
            {listing.purpose === 'rent' && (
              <span className="text-lg font-normal text-muted-foreground">/شهرياً</span>
            )}
          </p>
        </div>

        {/* Location */}
        <div className="py-4 border-b border-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <MapPin className="w-4 h-4" />
            <span>{listing.location.area}، {listing.location.city}</span>
          </div>
          {listing.location.address && (
            <p className="text-sm text-muted-foreground ps-6">{listing.location.address}</p>
          )}
        </div>

        {/* Type */}
        <div className="py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Home className="w-4 h-4 text-muted-foreground" />
            <span className="text-foreground">{getTypeLabel(listing.type)}</span>
            <span className="text-muted-foreground">|</span>
            <span className="text-foreground">{listing.purpose === 'sale' ? 'للبيع' : 'للإيجار'}</span>
          </div>
        </div>

        {/* Specs */}
        <div className="py-4 border-b border-border">
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col items-center p-4 rounded-lg bg-surface">
              <Bed className="w-6 h-6 text-primary mb-2" />
              <span className="text-lg font-semibold text-foreground">{listing.specs.bedrooms}</span>
              <span className="text-sm text-muted-foreground">غرف نوم</span>
            </div>
            <div className="flex flex-col items-center p-4 rounded-lg bg-surface">
              <Bath className="w-6 h-6 text-primary mb-2" />
              <span className="text-lg font-semibold text-foreground">{listing.specs.bathrooms}</span>
              <span className="text-sm text-muted-foreground">حمامات</span>
            </div>
            <div className="flex flex-col items-center p-4 rounded-lg bg-surface">
              <Maximize className="w-6 h-6 text-primary mb-2" />
              <span className="text-lg font-semibold text-foreground">{listing.specs.area}</span>
              <span className="text-sm text-muted-foreground">متر مربع</span>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="py-4 border-b border-border space-y-3">
          <h3 className="font-semibold text-foreground">تفاصيل العقار</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">التشطيب</span>
              <span className="text-foreground">{getFinishingLabel(listing.features.finishing)}</span>
            </div>
            {listing.features.floor && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">الطابق</span>
                <span className="text-foreground">{listing.features.floor}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">مفروش</span>
              <span className="text-foreground">{listing.features.furnished ? 'نعم' : 'لا'}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="py-4 border-b border-border">
          <h3 className="font-semibold text-foreground mb-3">الوصف</h3>
          <p className={cn(
            "text-muted-foreground leading-relaxed",
            !showFullDescription && "line-clamp-3"
          )}>
            {listing.description}
          </p>
          {listing.description.length > 150 && (
            <button
              onClick={() => setShowFullDescription(!showFullDescription)}
              className="text-primary text-sm mt-2"
            >
              {showFullDescription ? 'عرض أقل' : 'عرض المزيد'}
            </button>
          )}
        </div>

        {/* Map placeholder */}
        <div className="py-4 border-b border-border">
          <h3 className="font-semibold text-foreground mb-3">الموقع</h3>
          <div className="aspect-video rounded-lg bg-surface flex items-center justify-center">
            <div className="text-center">
              <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">الخريطة</p>
            </div>
          </div>
        </div>

        {/* Agent */}
        <div className="py-4 border-b border-border">
          <h3 className="font-semibold text-foreground mb-4">المعلن</h3>
          <div className="flex items-center gap-4">
            <Link href={`/profile/${listing.agent.id}`}>
              <Avatar className="w-16 h-16">
                <AvatarImage src={listing.agent.avatar} alt={listing.agent.name} />
                <AvatarFallback>{listing.agent.name[0]}</AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-1 mb-1">
                <Link href={`/profile/${listing.agent.id}`} className="font-medium text-foreground">
                  {listing.agent.name}
                </Link>
                {listing.agent.isVerified && (
                  <BadgeCheck className="w-4 h-4 text-primary" />
                )}
              </div>
              {listing.agent.rating && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                  <Star className="w-4 h-4 text-accent fill-accent" />
                  <span>{listing.agent.rating}</span>
                  <span>({listing.agent.reviewCount} تقييم)</span>
                </div>
              )}
              {listing.agent.responseTime && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{listing.agent.responseTime}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" className="flex-1" asChild>
              <Link href={`/profile/${listing.agent.id}`}>
                عرض الملف الشخصي
              </Link>
            </Button>
            <Button variant="outline" className="flex-1">
              متابعة
            </Button>
          </div>
        </div>

        {/* Similar listings */}
        <div className="py-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">عقارات مشابهة</h3>
            <Link href="/listings" className="text-sm text-primary">
              عرض الكل
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto scrollbar-hide -mx-4 px-4">
            {similarListings.map((item) => (
              <div key={item.id} className="min-w-[280px]">
                <ListingCard listing={item} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-background border-t border-border px-4 py-3 safe-area-bottom">
        <div className="flex gap-3">
          <Button className="flex-1 h-12 gap-2" asChild>
            <a href={`tel:${listing.agent.phone}`}>
              <Phone className="w-5 h-5" />
              <span>اتصال</span>
            </a>
          </Button>
          <Button variant="outline" className="flex-1 h-12 gap-2" asChild>
            <Link href={`/messages/new?listing=${listing.id}`}>
              <MessageCircle className="w-5 h-5" />
              <span>محادثة</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
