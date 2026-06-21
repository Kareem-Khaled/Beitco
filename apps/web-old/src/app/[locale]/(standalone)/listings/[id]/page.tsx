"use client"

import { useState } from 'react'
import { useRouter } from '@/i18n/routing'
import Image from 'next/image'
import { Link } from '@/i18n/routing'
import { ArrowRight, Share2, MoreHorizontal, Heart, MapPin, Bed, Bath, Maximize, Home, Star, Clock, ChevronLeft, ChevronRight, Phone, MessageCircle, BadgeCheck, Eye, Shield, Wifi, Car, Trees, Waves, Flag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ListingCard } from '@/components/listing-card'
import { mockListings } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function ListingDetailPage({ params: _params }: PageProps) {
  const router = useRouter()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isSaved, setIsSaved] = useState(false)
  const [showFullDescription, setShowFullDescription] = useState(false)

  // In real app, would fetch listing by ID
  const listing = mockListings[0]!
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

  if (!listing) return null

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
          src={listing.images[currentImageIndex] ?? ''}
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
          {listing.images.map((_: string, index: number) => (
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
          <p className="font-bold text-2xl text-foreground">
            {formatPrice(listing.price)} جنيه
            {listing.purpose === 'rent' && (
              <span className="text-base font-normal text-muted-foreground">/شهرياً</span>
            )}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {formatPrice(Math.round(listing.price / listing.specs.area))} جنيه/م²
          </p>
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{listing.views} مشاهدة</span>
            <span>رقم الإعلان: BT-{listing.id}</span>
          </div>
        </div>

        {/* Quick specs row */}
        <div className="flex items-center gap-6 py-4 border-b border-border overflow-x-auto">
          <div className="flex items-center gap-2 text-sm">
            <Maximize className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{listing.specs.area} م²</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Bed className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{listing.specs.bedrooms} غرف</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Bath className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{listing.specs.bathrooms} حمام</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Home className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{getFinishingLabel(listing.features.finishing)}</span>
          </div>
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
            <span className="px-2.5 py-1 rounded-md bg-muted text-sm font-medium text-foreground">{getTypeLabel(listing.type)}</span>
            <span className="px-2.5 py-1 rounded-md bg-muted text-sm font-medium text-foreground">{listing.purpose === 'sale' ? 'للبيع' : 'للإيجار'}</span>
            {listing.features.furnished && (
              <span className="px-2.5 py-1 rounded-md bg-muted text-sm font-medium text-foreground">مفروش</span>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="py-4 border-b border-border space-y-3">
          <h3 className="font-semibold text-foreground">تفاصيل العقار</h3>
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="divide-y divide-border">
              <div className="flex items-center justify-between px-4 py-3 bg-muted/50">
                <span className="text-sm text-muted-foreground">النوع</span>
                <span className="text-sm font-medium text-foreground">{getTypeLabel(listing.type)}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-muted-foreground">المساحة</span>
                <span className="text-sm font-medium text-foreground">{listing.specs.area} م²</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3 bg-muted/50">
                <span className="text-sm text-muted-foreground">غرف النوم</span>
                <span className="text-sm font-medium text-foreground">{listing.specs.bedrooms}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-muted-foreground">الحمامات</span>
                <span className="text-sm font-medium text-foreground">{listing.specs.bathrooms}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3 bg-muted/50">
                <span className="text-sm text-muted-foreground">التشطيب</span>
                <span className="text-sm font-medium text-foreground">{getFinishingLabel(listing.features.finishing)}</span>
              </div>
              {listing.features.floor && (
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-muted-foreground">الطابق</span>
                  <span className="text-sm font-medium text-foreground">{listing.features.floor}</span>
                </div>
              )}
              <div className="flex items-center justify-between px-4 py-3 bg-muted/50">
                <span className="text-sm text-muted-foreground">مفروش</span>
                <span className="text-sm font-medium text-foreground">{listing.features.furnished ? 'نعم' : 'لا'}</span>
              </div>
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

        {/* Amenities */}
        <div className="py-4 border-b border-border">
          <h3 className="font-semibold text-foreground mb-3">المميزات</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Shield, label: 'أمن وحراسة' },
              { icon: Car, label: 'جراج' },
              { icon: Wifi, label: 'إنترنت' },
              { icon: Trees, label: 'حديقة' },
              { icon: Waves, label: 'حمام سباحة' },
              { icon: Maximize, label: 'بلكونة' },
            ].map((amenity) => (
              <div key={amenity.label} className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-muted/50">
                <amenity.icon className="w-5 h-5 text-primary" />
                <span className="text-xs text-muted-foreground text-center">{amenity.label}</span>
              </div>
            ))}
          </div>
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
            <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
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
        <div className="flex gap-2">
          <Button className="flex-1 h-12 gap-2 bg-green-600 hover:bg-green-700 text-white" asChild>
            <a href={`https://wa.me/+2${listing.agent.phone}`} target="_blank" rel="noopener">
              <MessageCircle className="w-5 h-5" />
              <span>واتساب</span>
            </a>
          </Button>
          <Button className="flex-1 h-12 gap-2" asChild>
            <a href={`tel:${listing.agent.phone}`}>
              <Phone className="w-5 h-5" />
              <span>اتصال</span>
            </a>
          </Button>
          <Button variant="outline" size="icon" className="h-12 w-12 flex-shrink-0" onClick={() => setIsSaved(!isSaved)}>
            <Heart className={cn("w-5 h-5", isSaved ? "fill-destructive text-destructive" : "")} />
          </Button>
        </div>
      </div>
    </div>
  )
}
