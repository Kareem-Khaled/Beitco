"use client"

import { useState } from 'react'
import { TrendingUp, TrendingDown, Minus, Search, BarChart3, Calculator } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const priceData = [
  { area: 'التجمع الخامس', pricePerMeter: 28000, change: 12, trend: 'up' as const, image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=200&q=80' },
  { area: 'الشيخ زايد', pricePerMeter: 25000, change: 8, trend: 'up' as const, image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=200&q=80' },
  { area: '6 أكتوبر', pricePerMeter: 18000, change: 5, trend: 'up' as const, image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=200&q=80' },
  { area: 'المعادي', pricePerMeter: 32000, change: 3, trend: 'up' as const, image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=200&q=80' },
  { area: 'مصر الجديدة', pricePerMeter: 35000, change: -2, trend: 'down' as const, image: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=200&q=80' },
  { area: 'العاصمة الإدارية', pricePerMeter: 22000, change: 18, trend: 'up' as const, image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=200&q=80' },
  { area: 'الشروق', pricePerMeter: 14000, change: 10, trend: 'up' as const, image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=200&q=80' },
  { area: 'مدينة نصر', pricePerMeter: 30000, change: 0, trend: 'stable' as const, image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=200&q=80' },
]

function TrendBadge({ trend, change }: { trend: 'up' | 'down' | 'stable'; change: number }) {
  if (trend === 'up') return <span className="flex items-center gap-0.5 text-green-600 text-xs font-medium bg-green-100 dark:bg-green-950/30 px-2 py-0.5 rounded-full"><TrendingUp className="h-3 w-3" /> +{change}%</span>
  if (trend === 'down') return <span className="flex items-center gap-0.5 text-red-600 text-xs font-medium bg-red-100 dark:bg-red-950/30 px-2 py-0.5 rounded-full"><TrendingDown className="h-3 w-3" /> {change}%</span>
  return <span className="flex items-center gap-0.5 text-muted-foreground text-xs bg-muted px-2 py-0.5 rounded-full"><Minus className="h-3 w-3" /> ثابت</span>
}

export default function PricesPage() {
  const [search, setSearch] = useState('')
  const filtered = priceData.filter(p => p.area.includes(search))
  const avgPrice = Math.round(priceData.reduce((sum, p) => sum + p.pricePerMeter, 0) / priceData.length)
  const maxChange = Math.max(...priceData.map(p => p.change))

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=60" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-amber-900/70 to-amber-900/90" />
        </div>
        <div className="relative px-4 py-10 text-center text-white">
          <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-80" />
          <h1 className="text-2xl font-bold mb-2">أسعار العقارات</h1>
          <p className="text-white/80 text-sm mb-5">بيانات حقيقية ومُحدثة من السوق المصري</p>
          <div className="relative max-w-md mx-auto">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="ابحث عن منطقة..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10 bg-white/95 border-0 shadow-lg" />
          </div>
        </div>
      </div>

      {/* Market Summary */}
      <div className="px-4 -mt-4 relative z-10 grid grid-cols-2 gap-3 mb-4">
        <div className="bg-card rounded-xl border shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-primary">{(avgPrice / 1000).toFixed(0)}K</p>
          <p className="text-[10px] text-muted-foreground">متوسط سعر المتر (جنيه)</p>
        </div>
        <div className="bg-card rounded-xl border shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-green-600">+{maxChange}%</p>
          <p className="text-[10px] text-muted-foreground">أعلى نمو سنوي</p>
        </div>
      </div>

      {/* Fair Price CTA */}
      <div className="px-4 py-3">
        <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-l from-primary/10 to-primary/5 p-5">
          <Calculator className="absolute -left-2 -bottom-2 h-20 w-20 text-primary/10" />
          <h2 className="font-bold text-sm mb-1">🧮 حاسبة السعر العادل</h2>
          <p className="text-xs text-muted-foreground mb-3">ادخل مواصفات العقار واعرف إذا السعر مناسب</p>
          <Button size="sm" className="shadow-sm">جرّب الحاسبة</Button>
        </div>
      </div>

      {/* Price Cards */}
      <div className="px-4 py-4 pb-20">
        <h2 className="font-semibold mb-3">سعر المتر حسب المنطقة</h2>
        <div className="space-y-3">
          {filtered.map(row => (
            <div key={row.area} className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:shadow-sm transition-all">
              <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                <img src={row.image} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium">{row.area}</h3>
                <p className="text-lg font-bold mt-0.5">{row.pricePerMeter.toLocaleString('ar-EG')} <span className="text-xs font-normal text-muted-foreground">جنيه/م²</span></p>
              </div>
              <TrendBadge trend={row.trend} change={row.change} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
