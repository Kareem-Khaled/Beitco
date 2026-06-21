"use client"

import { useState } from 'react'
import { Settings, Shield, BedDouble, Eye, MessageCircle, Plus, Star } from 'lucide-react'
import { Link } from '@/i18n/routing'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

const tabs = [
  { id: 'my-apartments', label: 'شققي' },
  { id: 'bookings', label: 'حجوزاتي' },
]

const myApartments = [
  { id: '1', title: 'شقة 3 غرف — التجمع الخامس', totalBeds: 6, availableBeds: 2, price: 2500, views: 45, messages: 3, status: 'active' as const },
  { id: '2', title: 'استوديو — مدينة نصر', totalBeds: 3, availableBeds: 0, price: 1800, views: 12, messages: 0, status: 'full' as const },
]

const myBookings = [
  { id: 'b1', apartment: 'شقة مفروشة — الشيخ زايد', status: 'confirmed' as const, date: 'من 15 يونيو', price: 3000 },
  { id: 'b2', apartment: 'شقة طلاب — 6 أكتوبر', status: 'pending' as const, date: 'طلب بتاريخ 28 مايو', price: 2000 },
]

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('my-apartments')

  return (
    <div className="min-h-screen pb-20">
      <div className="flex items-center justify-end px-4 py-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/settings"><Settings className="w-5 h-5" /></Link>
        </Button>
      </div>

      <div className="px-4 pb-5">
        <div className="flex items-center gap-4">
          <Avatar className="w-18 h-18 border-2 border-primary/20">
            <AvatarImage src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face" />
            <AvatarFallback className="text-xl">أ</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-lg font-bold">أحمد محمد</h1>
              <Shield className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-xs text-muted-foreground">مالك • عضو منذ يناير 2025</p>
            <div className="flex items-center gap-1 mt-1">
              <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
              <span className="text-xs font-medium">4.8</span>
              <span className="text-[10px] text-muted-foreground">(23 تقييم)</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="p-3 rounded-xl bg-muted/50 text-center">
            <p className="text-lg font-bold">2</p>
            <p className="text-[9px] text-muted-foreground">شقة</p>
          </div>
          <div className="p-3 rounded-xl bg-muted/50 text-center">
            <p className="text-lg font-bold">9</p>
            <p className="text-[9px] text-muted-foreground">سرير كلي</p>
          </div>
          <div className="p-3 rounded-xl bg-muted/50 text-center">
            <p className="text-lg font-bold text-primary">2</p>
            <p className="text-[9px] text-muted-foreground">سرير فاضي</p>
          </div>
        </div>

        <Button className="w-full mt-4 gap-2" asChild>
          <Link href="/post"><Plus className="h-4 w-4" /> أضف شقة جديدة</Link>
        </Button>
      </div>

      <div className="sticky top-14 z-30 bg-background border-b">
        <div className="flex">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 py-3 text-xs font-medium relative transition-colors",
                activeTab === tab.id ? "text-primary" : "text-muted-foreground"
              )}
            >
              {tab.label}
              {activeTab === tab.id && <span className="absolute bottom-0 inset-x-4 h-0.5 bg-primary rounded-full" />}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4">
        {activeTab === 'my-apartments' && (
          <div className="space-y-3">
            {myApartments.map(apt => (
              <Link key={apt.id} href={`/apartment/${apt.id}`} className="block p-4 rounded-xl border hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-xs font-semibold flex-1">{apt.title}</h3>
                  <span className={cn(
                    "text-[9px] px-2 py-0.5 rounded-full shrink-0 ms-2",
                    apt.status === 'active' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300" : "bg-muted text-muted-foreground"
                  )}>
                    {apt.status === 'active' ? `${apt.availableBeds} فاضي` : 'ممتلئة'}
                  </span>
                </div>
                <p className="text-sm font-bold text-primary">{apt.price.toLocaleString()} جنيه/سرير/شهر</p>
                <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><BedDouble className="h-3 w-3" /> {apt.availableBeds}/{apt.totalBeds}</span>
                  <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {apt.views}</span>
                  <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> {apt.messages}</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="space-y-3">
            {myBookings.map(booking => (
              <div key={booking.id} className="p-4 rounded-xl border">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="text-xs font-semibold">{booking.apartment}</h3>
                  <span className={cn(
                    "text-[9px] px-2 py-0.5 rounded-full",
                    booking.status === 'confirmed' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300" : "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300"
                  )}>
                    {booking.status === 'confirmed' ? 'مؤكد' : 'في الانتظار'}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground">{booking.date}</p>
                <p className="text-xs font-bold text-primary mt-1">{booking.price.toLocaleString()} جنيه/شهر</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
