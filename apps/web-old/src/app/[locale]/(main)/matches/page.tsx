"use client"

import { useState } from 'react'
import { Sparkles, MapPin, Briefcase, GraduationCap, Banknote, BedDouble, Shield, Star, ArrowLeft } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Link } from '@/i18n/routing'
import Image from 'next/image'

const occupationOptions = [
  { key: 'student', label: 'طالب جامعي', icon: <GraduationCap className="h-5 w-5" /> },
  { key: 'employee', label: 'موظف', icon: <Briefcase className="h-5 w-5" /> },
]

const suggestedListings = [
  { id: '1', title: 'شقة 3 غرف — التجمع الخامس', image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500&h=300&fit=crop', price: 2500, availableBeds: 2, totalBeds: 6, distance: '10 دقائق من جامعة المستقبل', matchScore: 95, verified: true },
  { id: '2', title: 'استوديو مشترك — مدينة نصر', image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=500&h=300&fit=crop', price: 1800, availableBeds: 3, totalBeds: 3, distance: '15 دقيقة من جامعة عين شمس', matchScore: 87, verified: false },
  { id: '3', title: 'شقة مفروشة — الشيخ زايد', image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=500&h=300&fit=crop', price: 3000, availableBeds: 1, totalBeds: 4, distance: '5 دقائق من هايبر وان', matchScore: 82, verified: true },
]

export default function MatchesPage() {
  const [step, setStep] = useState<'form' | 'results'>('form')
  const [occupation, setOccupation] = useState('')
  const [budget, setBudget] = useState('')
  const [location, setLocation] = useState('')

  const handleSubmit = () => {
    setStep('results')
  }

  if (step === 'results') {
    return (
      <div className="min-h-screen pb-20">
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" /> مقترحاتك
              </h1>
              <p className="text-[10px] text-muted-foreground mt-0.5">بناءً على بياناتك — الأقرب والأنسب أولاً</p>
            </div>
            <button onClick={() => setStep('form')} className="text-xs text-primary font-medium">تعديل</button>
          </div>
        </div>

        <div className="px-4 space-y-3">
          {suggestedListings.map(listing => (
            <Link key={listing.id} href={`/apartment/${listing.id}`} className="block rounded-2xl border overflow-hidden hover:shadow-md transition-shadow">
              <div className="relative h-36">
                <Image src={listing.image} alt={listing.title} fill className="object-cover" unoptimized />
                <span className="absolute top-2 right-2 bg-purple-600 text-white text-[9px] px-2 py-0.5 rounded-full font-medium">
                  {listing.matchScore}% مطابقة
                </span>
                {listing.verified && (
                  <span className="absolute top-2 left-2 bg-emerald-500 text-white text-[9px] px-2 py-0.5 rounded-full flex items-center gap-0.5">
                    <Shield className="h-2.5 w-2.5" /> موثّق
                  </span>
                )}
              </div>
              <div className="p-3">
                <h3 className="text-sm font-semibold">{listing.title}</h3>
                <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {listing.distance}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-sm font-bold text-primary">{listing.price.toLocaleString()} جنيه<span className="text-[10px] font-normal text-muted-foreground">/سرير/شهر</span></p>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                    <BedDouble className="h-3 w-3" /> {listing.availableBeds}/{listing.totalBeds} فاضي
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-28">
      <div className="px-4 pt-6 pb-4 text-center">
        <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-950/30 flex items-center justify-center mx-auto mb-3">
          <Sparkles className="h-8 w-8 text-purple-600" />
        </div>
        <h1 className="text-lg font-bold">لاقيلك المكان المناسب</h1>
        <p className="text-xs text-muted-foreground mt-1">قولنا شوية معلومات وهنقترحلك أقرب الشقق</p>
      </div>

      <div className="px-4 space-y-5">
        {/* Occupation */}
        <div>
          <label className="text-sm font-semibold block mb-2">أنت إيه؟</label>
          <div className="grid grid-cols-2 gap-3">
            {occupationOptions.map(opt => (
              <button
                key={opt.key}
                onClick={() => setOccupation(opt.key)}
                className={cn(
                  "p-4 rounded-xl border text-center transition-all",
                  occupation === opt.key ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-primary/50"
                )}
              >
                <div className={cn("mx-auto mb-2", occupation === opt.key ? "text-primary" : "text-muted-foreground")}>{opt.icon}</div>
                <span className="text-xs font-medium">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="text-sm font-semibold block mb-2">
            {occupation === 'student' ? 'اسم الجامعة أو المعهد' : 'مكان الشغل أو أقرب منطقة'}
          </label>
          <div className="relative">
            <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={occupation === 'student' ? "مثال: جامعة المستقبل" : "مثال: سمارت فيلدج"}
              value={location}
              onChange={e => setLocation(e.target.value)}
              className="pr-10"
            />
          </div>
        </div>

        {/* Budget */}
        <div>
          <label className="text-sm font-semibold block mb-2">ميزانيتك الشهرية (للسرير)</label>
          <div className="relative">
            <Banknote className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="number"
              placeholder="2500"
              value={budget}
              onChange={e => setBudget(e.target.value)}
              className="pr-10 pl-20"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">جنيه/شهر</span>
          </div>
        </div>

        {/* Gender Preference */}
        <div>
          <label className="text-sm font-semibold block mb-2">تفضل سكن</label>
          <div className="flex gap-2">
            {['شباب فقط', 'بنات فقط', 'مش مهم'].map(opt => (
              <button key={opt} className="flex-1 py-2.5 rounded-xl border text-xs font-medium hover:border-primary hover:text-primary transition-all">
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="fixed bottom-16 inset-x-0 p-4 bg-background/95 backdrop-blur-md border-t">
        <Button className="w-full gap-2" onClick={handleSubmit} disabled={!occupation || !location}>
          <Sparkles className="h-4 w-4" /> اعرض المقترحات
        </Button>
      </div>
    </div>
  )
}
