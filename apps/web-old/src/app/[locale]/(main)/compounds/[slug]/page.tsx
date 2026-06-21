"use client"

import { Star, MapPin, Shield, Users, Wifi, Car, Trees, Wrench, ChevronLeft, Camera, MessageCircle, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { use, useState } from 'react'
import { cn } from '@/lib/utils'

const mockCompound = {
  slug: 'madinaty',
  nameAr: 'مدينتي',
  nameEn: 'Madinaty',
  developer: 'طلعت مصطفى',
  developerSlug: 'talaat-moustafa',
  city: 'القاهرة الجديدة',
  description: 'مدينة متكاملة على مساحة 8000 فدان شرق القاهرة، تضم مناطق سكنية متنوعة ومرافق تجارية وترفيهية.',
  avgRating: 8.2,
  totalReviews: 342,
  photos: [
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
    'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&q=80',
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
  ],
  ratings: { security: 8.5, maintenance: 7.2, construction: 8.0, developerCommitment: 7.8, community: 8.8, internet: 6.5, traffic: 7.0, amenities: 9.1 },
  highlights: ['نادي رياضي', 'مول تجاري', 'مدارس دولية', 'مساحات خضراء', 'أمن 24 ساعة', 'جراج خاص'],
  reviews: [
    { id: '1', author: 'أحمد م.', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80', rating: 8.5, comment: 'مكان ممتاز للعائلات، المساحات الخضراء كثيرة والأمن ممتاز. المشكلة الوحيدة هي بعض مشاكل الصيانة.', date: '2026-05-15', isVerified: true, likes: 24 },
    { id: '2', author: 'سارة ع.', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80', rating: 7.8, comment: 'ساكنة من 3 سنين، المجتمع جميل والناس محترمة. الإنترنت محتاج تحسين.', date: '2026-04-28', isVerified: true, likes: 18 },
    { id: '3', author: 'مقيم مجهول', avatar: null, rating: 9.0, comment: 'أفضل قرار سكني أخذته. الأطفال مبسوطين والنادي ممتاز.', date: '2026-04-10', isVerified: true, isAnonymous: true, likes: 31 },
  ]
}

const ratingLabels: Record<string, string> = { security: 'الأمن', maintenance: 'الصيانة', construction: 'جودة البناء', developerCommitment: 'التزام المطور', community: 'المجتمع', internet: 'الإنترنت', traffic: 'المواصلات', amenities: 'المرافق' }
const ratingIcons: Record<string, React.ReactNode> = { security: <Shield className="h-4 w-4" />, maintenance: <Wrench className="h-4 w-4" />, construction: <Star className="h-4 w-4" />, developerCommitment: <Users className="h-4 w-4" />, community: <Users className="h-4 w-4" />, internet: <Wifi className="h-4 w-4" />, traffic: <Car className="h-4 w-4" />, amenities: <Trees className="h-4 w-4" /> }

function RatingBar({ label, icon, value }: { label: string; icon: React.ReactNode; value: number }) {
  const color = value >= 8 ? 'bg-green-500' : value >= 6 ? 'bg-amber-500' : 'bg-red-500'
  const textColor = value >= 8 ? 'text-green-600' : value >= 6 ? 'text-amber-600' : 'text-red-600'
  return (
    <div className="flex items-center gap-3">
      <div className="text-muted-foreground w-5">{icon}</div>
      <div className="flex-1">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-medium">{label}</span>
          <span className={`text-xs font-bold ${textColor}`}>{value}/10</span>
        </div>
        <div className="h-2.5 rounded-full bg-muted overflow-hidden">
          <div className={`h-full rounded-full ${color}`} style={{ width: `${value * 10}%` }} />
        </div>
      </div>
    </div>
  )
}

export default function CompoundDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const compound = mockCompound
  const [activePhoto, setActivePhoto] = useState(0)

  return (
    <div className="min-h-screen pb-28">
      {/* Photo Gallery */}
      <div className="relative">
        <div className="h-64 overflow-hidden">
          <img src={compound.photos[activePhoto]} alt="" className="w-full h-full object-cover transition-all duration-300" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {compound.photos.map((photo, i) => (
              <button key={i} onClick={() => setActivePhoto(i)} className={cn("w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all", activePhoto === i ? "border-white scale-105" : "border-transparent opacity-70")}>
                <img src={photo} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
        <div className="absolute top-4 left-4 flex items-center gap-1 bg-black/50 text-white px-2 py-1 rounded-lg text-xs">
          <Camera className="h-3 w-3" /><span>{compound.photos.length} صورة</span>
        </div>
        <div className="absolute top-4 right-4 text-white">
          <h1 className="text-xl font-bold drop-shadow-lg">{compound.nameAr}</h1>
          <div className="flex items-center gap-1 text-sm opacity-90"><MapPin className="h-3 w-3" /><span>{compound.city}</span></div>
        </div>
      </div>

      {/* Overall Rating Card */}
      <div className="px-4 -mt-6 relative z-10">
        <div className="bg-card rounded-2xl border shadow-lg p-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md">
              <div className="text-center text-white">
                <span className="text-2xl font-bold block">{compound.avgRating}</span>
                <span className="text-[9px] opacity-80">/ 10</span>
              </div>
            </div>
            <div className="flex-1">
              <p className="font-semibold">التقييم العام</p>
              <p className="text-xs text-muted-foreground">بناءً على {compound.totalReviews} تقييم</p>
              <div className="flex mt-1.5">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star key={star} className={cn("h-4 w-4", star <= Math.round(compound.avgRating / 2) ? "fill-amber-400 text-amber-400" : "text-muted")} />
                ))}
              </div>
            </div>
            <button className="p-2 rounded-full hover:bg-muted"><Share2 className="h-5 w-5 text-muted-foreground" /></button>
          </div>
        </div>
      </div>

      {/* Highlights */}
      <div className="px-4 py-4">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {compound.highlights.map(h => (
            <span key={h} className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs whitespace-nowrap font-medium">{h}</span>
          ))}
        </div>
      </div>

      {/* Developer */}
      <a href={`/developers/${compound.developerSlug}`} className="mx-4 flex items-center justify-between p-3 rounded-xl border bg-card hover:shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"><Users className="h-5 w-5 text-muted-foreground" /></div>
          <div>
            <p className="text-xs text-muted-foreground">المطور العقاري</p>
            <p className="font-medium text-sm">{compound.developer}</p>
          </div>
        </div>
        <ChevronLeft className="h-4 w-4 text-muted-foreground" />
      </a>

      {/* Description */}
      <div className="px-4 py-4">
        <p className="text-sm text-muted-foreground leading-relaxed">{compound.description}</p>
      </div>

      {/* Category Ratings */}
      <div className="px-4 py-4">
        <h2 className="font-semibold mb-4 flex items-center gap-2"><Star className="h-4 w-4 text-amber-500" /> التقييمات التفصيلية</h2>
        <div className="bg-card rounded-xl border p-4 space-y-4">
          {Object.entries(compound.ratings).map(([key, value]) => (
            <RatingBar key={key} label={ratingLabels[key]} icon={ratingIcons[key]} value={value} />
          ))}
        </div>
      </div>

      {/* Reviews */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2"><MessageCircle className="h-4 w-4 text-primary" /> آراء السكان</h2>
          <a href={`/compounds/${slug}/review`} className="text-sm text-primary font-medium">اكتب تقييم ←</a>
        </div>
        <div className="space-y-3">
          {compound.reviews.map(review => (
            <div key={review.id} className="p-4 rounded-xl border bg-card">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full overflow-hidden bg-muted flex-shrink-0">
                  {review.avatar ? <img src={review.avatar} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs font-bold text-muted-foreground">م</div>}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{review.author}</span>
                    {review.isVerified && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">✓ مقيم موثق</span>}
                  </div>
                  <p className="text-[10px] text-muted-foreground">{review.date}</p>
                </div>
                <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/30 px-2 py-1 rounded-lg">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <span className="text-sm font-bold">{review.rating}</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
              <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
                <button className="hover:text-primary transition-colors">👍 {review.likes} مفيد</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-16 inset-x-0 p-4 bg-background/95 backdrop-blur-lg border-t shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
        <Button className="w-full h-12 text-base font-semibold rounded-xl shadow-lg" asChild>
          <a href={`/compounds/${slug}/review`}>✍️ شارك تقييمك كمقيم</a>
        </Button>
      </div>
    </div>
  )
}
