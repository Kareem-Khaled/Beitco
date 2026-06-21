"use client"

import { Building2, Star, Clock, CheckCircle2, Users, MapPin } from 'lucide-react'
import { use } from 'react'
import { cn } from '@/lib/utils'

const mockDeveloper = {
  slug: 'talaat-moustafa',
  nameAr: 'مجموعة طلعت مصطفى',
  foundedYear: 1979,
  hq: 'القاهرة',
  trustScore: 87,
  totalProjects: 12,
  totalUnitsDelivered: 45000,
  onTimeDelivery: 78,
  residentSatisfaction: 82,
  complaintResolution: 71,
  logo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=400&q=80',
  coverImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80',
  projects: [
    { name: 'مدينتي', city: 'القاهرة الجديدة', status: 'delivered', rating: 8.2, image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=300&q=80' },
    { name: 'الرحاب', city: 'القاهرة الجديدة', status: 'delivered', rating: 7.9, image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=300&q=80' },
    { name: 'سيليا', city: 'العاصمة الإدارية', status: 'under_construction', rating: null, image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=300&q=80' },
    { name: 'نور', city: 'المستقبل سيتي', status: 'under_construction', rating: null, image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=300&q=80' },
  ],
}

function TrustMeter({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  const color = value >= 80 ? 'bg-green-500' : value >= 60 ? 'bg-amber-500' : 'bg-red-500'
  const textColor = value >= 80 ? 'text-green-600' : value >= 60 ? 'text-amber-600' : 'text-red-600'
  return (
    <div className="bg-card rounded-xl border p-3">
      <div className="flex items-center gap-2 mb-2">
        <div className="text-muted-foreground">{icon}</div>
        <span className="text-xs font-medium flex-1">{label}</span>
        <span className={`text-sm font-bold ${textColor}`}>{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

export default function DeveloperDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const dev = mockDeveloper
  const trustColor = dev.trustScore >= 80 ? 'text-green-500' : dev.trustScore >= 60 ? 'text-amber-500' : 'text-red-500'

  return (
    <div className="min-h-screen pb-20">
      {/* Cover + Profile */}
      <div className="relative">
        <div className="h-40 overflow-hidden">
          <img src={dev.coverImage} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-black/30" />
        </div>
        <div className="px-4 -mt-12 relative z-10 flex items-end gap-4">
          <div className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-background shadow-lg">
            <img src={dev.logo} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="pb-1">
            <h1 className="text-lg font-bold">{dev.nameAr}</h1>
            <p className="text-xs text-muted-foreground">منذ {dev.foundedYear} • {dev.hq}</p>
          </div>
        </div>
      </div>

      {/* Trust Score */}
      <div className="px-4 py-5">
        <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-2xl p-5 border border-primary/20 text-center">
          <p className="text-xs text-muted-foreground mb-1">نقاط الثقة</p>
          <div className="flex items-center justify-center gap-1">
            <span className={`text-5xl font-bold ${trustColor}`}>{dev.trustScore}</span>
            <span className="text-lg text-muted-foreground self-end mb-2">/ 100</span>
          </div>
          {dev.trustScore >= 80 && (
            <span className="inline-flex items-center gap-1 mt-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
              <CheckCircle2 className="h-3 w-3" /> مطور موثوق
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 grid grid-cols-3 gap-2 mb-4">
        <div className="bg-card rounded-xl border p-3 text-center">
          <Building2 className="h-4 w-4 mx-auto text-primary mb-1" />
          <p className="text-lg font-bold">{dev.totalProjects}</p>
          <p className="text-[9px] text-muted-foreground">مشروع</p>
        </div>
        <div className="bg-card rounded-xl border p-3 text-center">
          <Users className="h-4 w-4 mx-auto text-blue-500 mb-1" />
          <p className="text-lg font-bold">{(dev.totalUnitsDelivered / 1000).toFixed(0)}K</p>
          <p className="text-[9px] text-muted-foreground">وحدة سُلمت</p>
        </div>
        <div className="bg-card rounded-xl border p-3 text-center">
          <Clock className="h-4 w-4 mx-auto text-amber-500 mb-1" />
          <p className="text-lg font-bold">{dev.onTimeDelivery}%</p>
          <p className="text-[9px] text-muted-foreground">بالموعد</p>
        </div>
      </div>

      {/* Trust Breakdown */}
      <div className="px-4 py-4">
        <h2 className="font-semibold mb-3">تفاصيل نقاط الثقة</h2>
        <div className="space-y-2">
          <TrustMeter label="التسليم في الموعد" value={dev.onTimeDelivery} icon={<Clock className="h-4 w-4" />} />
          <TrustMeter label="رضا السكان" value={dev.residentSatisfaction} icon={<Star className="h-4 w-4" />} />
          <TrustMeter label="حل الشكاوى" value={dev.complaintResolution} icon={<CheckCircle2 className="h-4 w-4" />} />
        </div>
      </div>

      {/* Projects Grid */}
      <div className="px-4 py-4">
        <h2 className="font-semibold mb-3">المشاريع</h2>
        <div className="grid grid-cols-2 gap-3">
          {dev.projects.map(project => (
            <div key={project.name} className="rounded-xl overflow-hidden border bg-card">
              <div className="h-24 overflow-hidden relative">
                <img src={project.image} alt="" className="w-full h-full object-cover" />
                <div className="absolute top-2 left-2">
                  <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-medium", project.status === 'delivered' ? 'bg-green-500 text-white' : 'bg-amber-500 text-white')}>
                    {project.status === 'delivered' ? '✓ تم التسليم' : '🏗 جاري'}
                  </span>
                </div>
              </div>
              <div className="p-2.5">
                <p className="text-sm font-medium">{project.name}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" /> {project.city}</span>
                  {project.rating && <span className="flex items-center gap-0.5 text-xs"><Star className="h-3 w-3 fill-amber-400 text-amber-400" /><span className="font-bold">{project.rating}</span></span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
