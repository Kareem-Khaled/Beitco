"use client"

import { useState } from 'react'
import { Search, Star, Building2, Shield, CheckCircle2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const mockDevelopers = [
  { id: '1', slug: 'talaat-moustafa', nameAr: 'مجموعة طلعت مصطفى', trustScore: 87, totalProjects: 12, foundedYear: 1979, logo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&q=80', topProject: 'مدينتي' },
  { id: '2', slug: 'palm-hills', nameAr: 'بالم هيلز للتعمير', trustScore: 82, totalProjects: 15, foundedYear: 2005, logo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=200&q=80', topProject: 'بالم هيلز أكتوبر' },
  { id: '3', slug: 'sodic', nameAr: 'سوديك', trustScore: 79, totalProjects: 18, foundedYear: 1996, logo: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=200&q=80', topProject: 'أليجريا' },
  { id: '4', slug: 'mountain-view', nameAr: 'ماونتن فيو', trustScore: 84, totalProjects: 10, foundedYear: 2005, logo: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=200&q=80', topProject: 'آي سيتي' },
  { id: '5', slug: 'emaar-misr', nameAr: 'إعمار مصر', trustScore: 81, totalProjects: 5, foundedYear: 2005, logo: 'https://images.unsplash.com/photo-1554469384-e58fac16e23a?w=200&q=80', topProject: 'ميفيدا' },
  { id: '6', slug: 'hyde-park', nameAr: 'هايد بارك للتطوير', trustScore: 75, totalProjects: 3, foundedYear: 2007, logo: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=200&q=80', topProject: 'هايد بارك' },
]

function TrustScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? 'text-green-500' : score >= 60 ? 'text-amber-500' : 'text-red-500'
  const circumference = 2 * Math.PI * 18
  const progress = (score / 100) * circumference
  return (
    <div className="relative w-14 h-14">
      <svg className="w-14 h-14 -rotate-90" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted" />
        <circle cx="20" cy="20" r="18" fill="none" strokeWidth="3" strokeLinecap="round" className={color} style={{ strokeDasharray: circumference, strokeDashoffset: circumference - progress, stroke: 'currentColor' }} />
      </svg>
      <div className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${color}`}>{score}</div>
    </div>
  )
}

export default function DevelopersPage() {
  const [search, setSearch] = useState('')
  const filtered = mockDevelopers.filter(d => d.nameAr.includes(search) || d.slug.includes(search.toLowerCase()))

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=60" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-blue-900/70 to-blue-900/90" />
        </div>
        <div className="relative px-4 py-10 text-center text-white">
          <Shield className="h-8 w-8 mx-auto mb-2 opacity-80" />
          <h1 className="text-2xl font-bold mb-2">المطورون العقاريون</h1>
          <p className="text-white/80 text-sm mb-5">تقييمات الثقة بناءً على الأداء الفعلي والتسليم</p>
          <div className="relative max-w-md mx-auto">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="ابحث عن مطور..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10 bg-white/95 border-0 shadow-lg" />
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 py-3 flex items-center justify-center gap-4 text-[10px] border-b bg-background">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> 80+ ممتاز</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> 60-79 جيد</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> &lt;60 ضعيف</span>
      </div>

      {/* List */}
      <div className="px-4 py-4 pb-20 space-y-3">
        {filtered.map(dev => (
          <a key={dev.id} href={`developers/${dev.slug}`} className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:shadow-md transition-all hover:-translate-y-0.5">
            <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border">
              <img src={dev.logo} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm">{dev.nameAr}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">منذ {dev.foundedYear} • {dev.totalProjects} مشروع</p>
              <div className="flex items-center gap-1 mt-1">
                <CheckCircle2 className="h-3 w-3 text-primary" />
                <span className="text-[10px] text-muted-foreground">أبرز: {dev.topProject}</span>
              </div>
            </div>
            <TrustScoreRing score={dev.trustScore} />
          </a>
        ))}
      </div>
    </div>
  )
}
