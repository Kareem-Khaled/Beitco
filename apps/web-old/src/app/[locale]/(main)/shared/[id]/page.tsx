"use client"

import { use } from 'react'
import Image from 'next/image'
import { ArrowRight, BedDouble, Shield, Star, MapPin, Wifi, Wind, Car, Utensils, Shirt, Phone, MessageCircle, Share2, Heart, Users, Clock, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/routing'
import { cn } from '@/lib/utils'

const mockSharedListing = {
  id: '1',
  title: 'سرير في غرفة مشتركة — التجمع الخامس',
  type: 'bed' as const,
  gender: 'male' as const,
  price: 2500,
  deposit: 5000,
  minStay: '3 أشهر',
  availableFrom: '15 يونيو 2026',
  description: 'سرير في غرفة مشتركة (3 أسرّة) في شقة مفروشة بالكامل. الشقة في كمبوند راقي بالتجمع الخامس، قريبة من الجامعة الأمريكية. مناسبة للطلاب والموظفين. الجو هادي ومحترم.',
  images: [
    'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=500&fit=crop',
  ],
  location: 'التجمع الخامس، القاهرة الجديدة',
  compound: 'ميفيدا',
  totalBeds: 3,
  occupiedBeds: 2,
  amenities: ['واي فاي', 'تكييف', 'غسالة', 'مطبخ مجهز', 'موقف سيارات', 'حارس أمن'],
  rules: ['ممنوع التدخين', 'هدوء بعد 11 مساءً', 'نظافة مشتركة أسبوعية'],
  landlord: {
    id: 'l1',
    name: 'أحمد محمد',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    rating: 4.8,
    reviewCount: 23,
    verified: true,
    responseTime: 'خلال ساعة',
    listingsCount: 5,
  },
  currentTenants: [
    { name: 'محمد', age: 24, occupation: 'طالب هندسة' },
    { name: 'عمر', age: 26, occupation: 'مطور برمجيات' },
  ],
}

export default function SharedListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const listing = mockSharedListing

  return (
    <div className="min-h-screen pb-32">
      {/* Image Gallery */}
      <div className="relative h-64 bg-muted">
        <Image src={listing.images[0]} alt={listing.title} fill className="object-cover" unoptimized />
        <div className="absolute top-3 right-3 flex gap-2">
          <button className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <Heart className="h-4 w-4 text-white" />
          </button>
          <button className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <Share2 className="h-4 w-4 text-white" />
          </button>
        </div>
        <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-full">
          1/{listing.images.length} صور
        </div>
        {listing.landlord.verified && (
          <div className="absolute bottom-3 right-3 bg-emerald-500 text-white text-[10px] px-2 py-1 rounded-full flex items-center gap-1">
            <Shield className="h-3 w-3" /> مالك موثّق
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 py-4 space-y-5">
        {/* Title & Price */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full font-medium">
              {listing.type === 'bed' ? 'سرير' : listing.type === 'room' ? 'غرفة' : 'شقة'}
            </span>
            <span className="text-[10px] bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
              {listing.gender === 'male' ? 'شباب' : listing.gender === 'female' ? 'بنات' : 'مختلط'}
            </span>
          </div>
          <h1 className="text-lg font-bold">{listing.title}</h1>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <MapPin className="h-3 w-3" /> {listing.location}
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-primary">{listing.price.toLocaleString()}</span>
            <span className="text-sm text-muted-foreground">جنيه/شهر</span>
          </div>
        </div>

        {/* Quick Info */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-xl bg-muted/50 text-center">
            <BedDouble className="h-4 w-4 mx-auto text-primary mb-1" />
            <p className="text-xs font-medium">{listing.occupiedBeds}/{listing.totalBeds} مشغول</p>
          </div>
          <div className="p-3 rounded-xl bg-muted/50 text-center">
            <Clock className="h-4 w-4 mx-auto text-primary mb-1" />
            <p className="text-xs font-medium">حد أدنى {listing.minStay}</p>
          </div>
          <div className="p-3 rounded-xl bg-muted/50 text-center">
            <Users className="h-4 w-4 mx-auto text-primary mb-1" />
            <p className="text-xs font-medium">{listing.currentTenants.length} ساكن حالي</p>
          </div>
        </div>

        {/* Description */}
        <div>
          <h2 className="font-semibold text-sm mb-2">عن المكان</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">{listing.description}</p>
        </div>

        {/* Amenities */}
        <div>
          <h2 className="font-semibold text-sm mb-2">المميزات</h2>
          <div className="flex flex-wrap gap-2">
            {listing.amenities.map(a => (
              <span key={a} className="text-[10px] px-2.5 py-1.5 rounded-lg bg-muted flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" /> {a}
              </span>
            ))}
          </div>
        </div>

        {/* Rules */}
        <div>
          <h2 className="font-semibold text-sm mb-2">قواعد السكن</h2>
          <ul className="space-y-1.5">
            {listing.rules.map(rule => (
              <li key={rule} className="text-xs text-muted-foreground flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> {rule}
              </li>
            ))}
          </ul>
        </div>

        {/* Current Tenants */}
        <div>
          <h2 className="font-semibold text-sm mb-2">السكان الحاليين</h2>
          <div className="space-y-2">
            {listing.currentTenants.map(tenant => (
              <div key={tenant.name} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                  {tenant.name[0]}
                </div>
                <div>
                  <p className="text-xs font-medium">{tenant.name}، {tenant.age} سنة</p>
                  <p className="text-[10px] text-muted-foreground">{tenant.occupation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Landlord */}
        <div className="p-4 rounded-xl border">
          <h2 className="font-semibold text-sm mb-3">المالك</h2>
          <div className="flex items-center gap-3">
            <Image src={listing.landlord.avatar} alt={listing.landlord.name} width={48} height={48} className="rounded-full object-cover" unoptimized />
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium">{listing.landlord.name}</p>
                {listing.landlord.verified && <Shield className="h-3.5 w-3.5 text-emerald-500" />}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-0.5 text-[10px]">
                  <Star className="h-3 w-3 text-amber-500 fill-amber-500" /> {listing.landlord.rating}
                </span>
                <span className="text-[10px] text-muted-foreground">({listing.landlord.reviewCount} تقييم)</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">يرد {listing.landlord.responseTime} • {listing.landlord.listingsCount} إعلانات</p>
            </div>
          </div>
          <Link href={`/landlords/${listing.landlord.id}`} className="text-xs text-primary font-medium mt-3 block">
            عرض الملف الكامل ←
          </Link>
        </div>

        {/* Deposit & Availability */}
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">التأمين</span>
            <span className="font-medium">{listing.deposit.toLocaleString()} جنيه</span>
          </div>
          <div className="flex justify-between text-xs mt-2">
            <span className="text-muted-foreground">متاح من</span>
            <span className="font-medium">{listing.availableFrom}</span>
          </div>
        </div>
      </div>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-16 inset-x-0 p-4 bg-background/90 backdrop-blur-md border-t">
        <div className="flex gap-2">
          <Button variant="outline" size="icon" className="shrink-0">
            <Phone className="h-4 w-4" />
          </Button>
          <Button className="flex-1 gap-2">
            <MessageCircle className="h-4 w-4" /> تواصل مع المالك
          </Button>
        </div>
      </div>
    </div>
  )
}
