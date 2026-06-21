"use client"

import { MapPin, Star, Shield, GraduationCap, Heart, Bus, ShoppingBag, TreePine, Clock, Home, Users, TrendingUp } from 'lucide-react'
import { use } from 'react'
import { cn } from '@/lib/utils'

const mockArea = {
  slug: 'new-cairo',
  nameAr: 'القاهرة الجديدة',
  city: 'القاهرة',
  lifestyleScore: 8.4,
  avgPricePerMeter: 28000,
  avgRent: 18000,
  residents: '1.2M',
  description: 'منطقة سكنية حديثة شرق القاهرة، تتميز بالتخطيط الجيد والمساحات الخضراء والكمبوندات الراقية.',
  coverImage: 'https://images.unsplash.com/photo-1549294413-26f195200c16?w=1200&q=80',
  galleryImages: [
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&q=80',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&q=80',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&q=80',
  ],
  ratings: { safety: 8.5, education: 8.2, healthcare: 7.8, transportation: 6.5, shopping: 8.0, greenSpaces: 8.8 },
  commuteTimes: [
    { to: 'وسط البلد', minutes: 45 },
    { to: 'المعادي', minutes: 30 },
    { to: 'مدينة نصر', minutes: 20 },
    { to: 'العاصمة الإدارية', minutes: 25 },
  ],
  topCompounds: [
    { name: 'مدينتي', rating: 8.2, image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=200&q=80' },
    { name: 'هايد بارك', rating: 7.8, image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=200&q=80' },
    { name: 'ماونتن فيو', rating: 7.9, image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=200&q=80' },
  ],
  reviews: [
    { author: 'محمد ر.', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80', comment: 'منطقة ممتازة للعائلات، المدارس كتير والأمان عالي. بس المواصلات العامة ضعيفة.', rating: 8.0 },
    { author: 'نورا أ.', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80', comment: 'ساكنة من 5 سنين، أحسن قرار. الهدوء والنظافة مش موجودين في أماكن تانية.', rating: 9.0 },
  ],
}

const ratingLabels: Record<string, { label: string; icon: React.ReactNode }> = {
  safety: { label: 'الأمان', icon: <Shield className="h-4 w-4" /> },
  education: { label: 'التعليم', icon: <GraduationCap className="h-4 w-4" /> },
  healthcare: { label: 'الصحة', icon: <Heart className="h-4 w-4" /> },
  transportation: { label: 'المواصلات', icon: <Bus className="h-4 w-4" /> },
  shopping: { label: 'التسوق', icon: <ShoppingBag className="h-4 w-4" /> },
  greenSpaces: { label: 'المساحات الخضراء', icon: <TreePine className="h-4 w-4" /> },
}

export default function AreaDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const area = mockArea

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Cover */}
      <div className="relative h-56">
        <img src={area.coverImage} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-4 right-4 text-white">
          <div className="flex items-center gap-2 mb-1"><MapPin className="h-4 w-4" /><h1 className="text-xl font-bold">{area.nameAr}</h1></div>
          <p className="text-sm text-white/80">{area.city}</p>
        </div>
        <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1.5 rounded-xl text-sm font-bold shadow-lg">{area.lifestyleScore}/10</div>
      </div>

      {/* Quick Stats */}
      <div className="px-4 -mt-6 relative z-10">
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-card rounded-xl border shadow-sm p-3 text-center">
            <Home className="h-4 w-4 mx-auto text-primary mb-1" />
            <p className="text-sm font-bold">{(area.avgPricePerMeter / 1000).toFixed(0)}K</p>
            <p className="text-[9px] text-muted-foreground">جنيه/م²</p>
          </div>
          <div className="bg-card rounded-xl border shadow-sm p-3 text-center">
            <TrendingUp className="h-4 w-4 mx-auto text-emerald-500 mb-1" />
            <p className="text-sm font-bold">{(area.avgRent / 1000).toFixed(0)}K</p>
            <p className="text-[9px] text-muted-foreground">إيجار شهري</p>
          </div>
          <div className="bg-card rounded-xl border shadow-sm p-3 text-center">
            <Users className="h-4 w-4 mx-auto text-blue-500 mb-1" />
            <p className="text-sm font-bold">{area.residents}</p>
            <p className="text-[9px] text-muted-foreground">ساكن</p>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="px-4 py-4">
        <p className="text-sm text-muted-foreground leading-relaxed">{area.description}</p>
      </div>

      {/* Gallery */}
      <div className="px-4 pb-4">
        <div className="flex gap-2 overflow-x-auto">
          {area.galleryImages.map((img, i) => (
            <div key={i} className="w-32 h-24 rounded-lg overflow-hidden flex-shrink-0">
              <img src={img} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </div>

      {/* Ratings */}
      <div className="px-4 py-4">
        <h2 className="font-semibold mb-4 flex items-center gap-2"><Star className="h-4 w-4 text-amber-500" /> تقييمات المنطقة</h2>
        <div className="bg-card rounded-xl border p-4 space-y-4">
          {Object.entries(area.ratings).map(([key, value]) => {
            const { label, icon } = ratingLabels[key]
            const color = value >= 8 ? 'bg-green-500' : value >= 6 ? 'bg-amber-500' : 'bg-red-500'
            const textColor = value >= 8 ? 'text-green-600' : value >= 6 ? 'text-amber-600' : 'text-red-600'
            return (
              <div key={key} className="flex items-center gap-3">
                <div className="text-muted-foreground w-5">{icon}</div>
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1"><span className="font-medium">{label}</span><span className={`font-bold ${textColor}`}>{value}/10</span></div>
                  <div className="h-2.5 rounded-full bg-muted overflow-hidden"><div className={`h-full rounded-full ${color}`} style={{ width: `${value * 10}%` }} /></div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Commute Times */}
      <div className="px-4 py-4">
        <h2 className="font-semibold mb-3 flex items-center gap-2"><Clock className="h-4 w-4 text-blue-500" /> وقت الوصول بالسيارة</h2>
        <div className="grid grid-cols-2 gap-2">
          {area.commuteTimes.map(ct => (
            <div key={ct.to} className="p-3 rounded-xl border bg-card text-center">
              <p className="text-xl font-bold text-primary">{ct.minutes}</p>
              <p className="text-[10px] text-muted-foreground">دقيقة إلى {ct.to}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Top Compounds */}
      <div className="px-4 py-4">
        <h2 className="font-semibold mb-3">أبرز الكمبوندات</h2>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {area.topCompounds.map(c => (
            <div key={c.name} className="flex-shrink-0 w-32 rounded-xl overflow-hidden border bg-card">
              <div className="h-20 overflow-hidden"><img src={c.image} alt="" className="w-full h-full object-cover" /></div>
              <div className="p-2">
                <p className="text-xs font-medium truncate">{c.name}</p>
                <div className="flex items-center gap-1 mt-0.5"><Star className="h-3 w-3 fill-amber-400 text-amber-400" /><span className="text-xs font-bold">{c.rating}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews */}
      <div className="px-4 py-4">
        <h2 className="font-semibold mb-3">آراء السكان</h2>
        <div className="space-y-3">
          {area.reviews.map(review => (
            <div key={review.author} className="p-4 rounded-xl border bg-card">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full overflow-hidden"><img src={review.avatar} alt="" className="w-full h-full object-cover" /></div>
                <span className="text-sm font-medium flex-1">{review.author}</span>
                <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded"><Star className="h-3 w-3 fill-amber-400 text-amber-400" /><span className="text-xs font-bold">{review.rating}</span></div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
