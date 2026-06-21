"use client"

import { use } from 'react'
import Image from 'next/image'
import { Shield, Star, MapPin, Phone, MessageCircle, ThumbsUp, ThumbsDown, BedDouble, Building2, Clock, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Link } from '@/i18n/routing'

const mockLandlord = {
  id: 'l1',
  name: 'أحمد محمد إبراهيم',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
  verified: true,
  rating: 4.8,
  totalReviews: 23,
  memberSince: 'يناير 2024',
  responseTime: 'خلال ساعة',
  responseRate: 95,
  totalListings: 5,
  activeListings: 3,
  bio: 'مالك عقارات في التجمع الخامس والشيخ زايد. بهتم بالنظافة والراحة. متاح للتواصل في أي وقت.',
  stats: {
    positive: 20,
    neutral: 2,
    negative: 1,
  },
  badges: ['مالك موثّق', 'سريع الرد', 'أكثر من 20 تقييم'],
  listings: [
    { id: '1', title: 'سرير في غرفة مشتركة — التجمع الخامس', type: 'bed', price: 2500, beds: '2/3', image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&h=250&fit=crop' },
    { id: '2', title: 'غرفة خاصة — الشيخ زايد', type: 'room', price: 4500, beds: null, image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=250&fit=crop' },
    { id: '3', title: 'سرير في شقة طلاب — مدينة نصر', type: 'bed', price: 1800, beds: '1/4', image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=250&fit=crop' },
  ],
  reviews: [
    { id: 'r1', author: 'محمد أحمد', rating: 5, date: 'منذ أسبوع', text: 'مالك محترم جداً. الشقة نضيفة والتعامل ممتاز. بيرد بسرعة ومتعاون.', sentiment: 'positive' as const },
    { id: 'r2', author: 'عمر خالد', rating: 4, date: 'منذ شهر', text: 'مكان كويس والسعر مناسب. المالك متعاون بس أحياناً بيتأخر في الصيانة.', sentiment: 'positive' as const },
    { id: 'r3', author: 'يوسف علي', rating: 5, date: 'منذ شهرين', text: 'أفضل مالك اتعاملت معاه. مفيش مشاكل خالص والجو حلو.', sentiment: 'positive' as const },
  ],
}

export default function LandlordProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const landlord = mockLandlord

  const positivePercent = Math.round((landlord.stats.positive / landlord.totalReviews) * 100)

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="px-4 pt-4 pb-5 border-b">
        <div className="flex items-center gap-4">
          <Image src={landlord.avatar} alt={landlord.name} width={72} height={72} className="rounded-full object-cover" unoptimized />
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <h1 className="text-lg font-bold">{landlord.name}</h1>
              {landlord.verified && <Shield className="h-4 w-4 text-emerald-500" />}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="flex items-center gap-0.5 text-xs">
                <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                <span className="font-medium">{landlord.rating}</span>
              </span>
              <span className="text-[10px] text-muted-foreground">({landlord.totalReviews} تقييم)</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">عضو منذ {landlord.memberSince}</p>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {landlord.badges.map(badge => (
            <span key={badge} className="text-[10px] px-2 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              {badge}
            </span>
          ))}
        </div>

        {landlord.bio && (
          <p className="text-xs text-muted-foreground mt-3">{landlord.bio}</p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 border-b">
        <div className="p-3 text-center border-l">
          <p className="text-lg font-bold text-primary">{landlord.responseRate}%</p>
          <p className="text-[10px] text-muted-foreground">نسبة الرد</p>
        </div>
        <div className="p-3 text-center border-l">
          <p className="text-lg font-bold">{landlord.activeListings}</p>
          <p className="text-[10px] text-muted-foreground">إعلان نشط</p>
        </div>
        <div className="p-3 text-center">
          <p className="text-lg font-bold text-emerald-600">{positivePercent}%</p>
          <p className="text-[10px] text-muted-foreground">تقييم إيجابي</p>
        </div>
      </div>

      <div className="px-4 py-5 space-y-6">
        {/* Active Listings */}
        <div>
          <h2 className="font-semibold text-sm mb-3">الإعلانات النشطة</h2>
          <div className="space-y-2">
            {landlord.listings.map(listing => (
              <Link key={listing.id} href={`/shared/${listing.id}`} className="flex gap-3 p-2 rounded-xl border hover:shadow-sm transition-shadow">
                <Image src={listing.image} alt={listing.title} width={80} height={60} className="rounded-lg object-cover" unoptimized />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{listing.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded">
                      {listing.type === 'bed' ? 'سرير' : 'غرفة'}
                    </span>
                    {listing.beds && <span className="text-[10px] text-muted-foreground">{listing.beds} مشغول</span>}
                  </div>
                  <p className="text-xs font-bold text-primary mt-1">{listing.price.toLocaleString()} جنيه/شهر</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Reviews Summary */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm">التقييمات</h2>
            <span className="text-[10px] text-muted-foreground">{landlord.totalReviews} تقييم</span>
          </div>

          {/* Sentiment Bar */}
          <div className="flex rounded-full overflow-hidden h-2 mb-4">
            <div className="bg-emerald-500" style={{ width: `${(landlord.stats.positive / landlord.totalReviews) * 100}%` }} />
            <div className="bg-amber-400" style={{ width: `${(landlord.stats.neutral / landlord.totalReviews) * 100}%` }} />
            <div className="bg-red-500" style={{ width: `${(landlord.stats.negative / landlord.totalReviews) * 100}%` }} />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground mb-4">
            <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3 text-emerald-500" /> {landlord.stats.positive} إيجابي</span>
            <span>{landlord.stats.neutral} محايد</span>
            <span className="flex items-center gap-1"><ThumbsDown className="h-3 w-3 text-red-500" /> {landlord.stats.negative} سلبي</span>
          </div>

          {/* Review List */}
          <div className="space-y-3">
            {landlord.reviews.map(review => (
              <div key={review.id} className="p-3 rounded-xl bg-muted/50">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                      {review.author[0]}
                    </div>
                    <span className="text-xs font-medium">{review.author}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{review.date}</span>
                </div>
                <div className="flex gap-0.5 mb-1.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={cn("h-3 w-3", i < review.rating ? "text-amber-500 fill-amber-500" : "text-muted")} />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{review.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Report */}
        <button className="flex items-center gap-2 text-xs text-muted-foreground hover:text-red-500 transition-colors">
          <AlertTriangle className="h-3.5 w-3.5" /> الإبلاغ عن هذا المالك
        </button>
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
