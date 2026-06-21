"use client"

import { useState } from 'react'
import { Camera, Plus, MapPin, BedDouble, Info, ImagePlus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const genderOptions = [
  { key: 'male', label: 'شباب فقط' },
  { key: 'female', label: 'بنات فقط' },
  { key: 'mixed', label: 'مختلط' },
]

const amenities = ['واي فاي', 'تكييف', 'غسالة', 'سخان', 'مطبخ مجهز', 'موقف', 'أسانسير', 'بلكونة', 'حارس', 'قريب من مواصلات']

export default function PostApartmentPage() {
  const [step, setStep] = useState(1)
  const [gender, setGender] = useState('')
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])

  const toggleAmenity = (a: string) => {
    setSelectedAmenities(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a])
  }

  return (
    <div className="min-h-screen pb-28">
      {/* Header */}
      <div className="sticky top-14 z-20 bg-background border-b px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <h1 className="font-bold">أضف شقتك</h1>
          <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">خطوة {step}/3</span>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3].map(s => (
            <div key={s} className={cn("h-1.5 flex-1 rounded-full transition-all", s <= step ? "bg-primary" : "bg-muted")} />
          ))}
        </div>
      </div>

      <div className="px-4 py-5 space-y-5">
        {step === 1 && (
          <>
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-800 dark:text-amber-200">🏠 أضف شقتك مرة واحدة وحدّث عدد الأسرّة المتاحة في أي وقت</p>
            </div>

            {/* Apartment Title */}
            <div>
              <label className="text-sm font-semibold block mb-2">اسم أو وصف مختصر</label>
              <Input placeholder="مثال: شقة 3 غرف مفروشة — التجمع الخامس" />
            </div>

            {/* Location */}
            <div>
              <label className="text-sm font-semibold block mb-2">المنطقة</label>
              <div className="relative">
                <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="اختر المنطقة" className="pr-10" />
              </div>
              <Input placeholder="العنوان التفصيلي (اختياري — يظهر بعد الحجز)" className="mt-2" />
            </div>

            {/* Gender */}
            <div>
              <label className="text-sm font-semibold block mb-2">الشقة مخصصة لـ</label>
              <div className="flex gap-2">
                {genderOptions.map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setGender(opt.key)}
                    className={cn(
                      "flex-1 py-3 rounded-xl border text-xs font-medium transition-all",
                      gender === opt.key ? "border-primary bg-primary/5 text-primary ring-1 ring-primary" : ""
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Nearby Landmarks */}
            <div>
              <label className="text-sm font-semibold block mb-2">أقرب معلم (جامعة، شركة، محطة)</label>
              <Input placeholder="مثال: جامعة المستقبل — 10 دقائق" />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            {/* Beds */}
            <div>
              <label className="text-sm font-semibold block mb-2">الأسرّة</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-1">عدد الأسرّة الكلي في الشقة</label>
                  <Input type="number" placeholder="6" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-1">المتاح حالياً</label>
                  <Input type="number" placeholder="2" />
                </div>
              </div>
            </div>

            {/* Price */}
            <div>
              <label className="text-sm font-semibold block mb-2">سعر السرير الواحد شهرياً</label>
              <div className="relative">
                <Input type="number" placeholder="2500" className="pl-20" />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">جنيه/شهر</span>
              </div>
            </div>

            {/* Deposit */}
            <div>
              <label className="text-sm font-semibold block mb-2">التأمين (اختياري)</label>
              <Input type="number" placeholder="5000" />
            </div>

            {/* Amenities */}
            <div>
              <label className="text-sm font-semibold block mb-2">المميزات</label>
              <div className="flex flex-wrap gap-2">
                {amenities.map(a => (
                  <button
                    key={a}
                    onClick={() => toggleAmenity(a)}
                    className={cn(
                      "px-3 py-2 rounded-xl border text-xs transition-all",
                      selectedAmenities.includes(a) ? "border-primary bg-primary/10 text-primary font-medium" : ""
                    )}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-semibold block mb-2">وصف الشقة</label>
              <textarea
                placeholder="اكتب تفاصيل عن المكان... (الدور، المواصلات، جو السكان، قواعد)"
                className="w-full h-28 rounded-xl border bg-background px-3 py-2.5 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </>
        )}

        {step === 3 && (
          <>
            {/* Photos */}
            <div>
              <label className="text-sm font-semibold block mb-1">صور الشقة</label>
              <p className="text-[10px] text-muted-foreground mb-3">أضف 3 صور على الأقل — الغرف، الحمام، المطبخ</p>
              <div className="grid grid-cols-3 gap-2">
                <button className="aspect-square rounded-xl border-2 border-dashed border-primary/40 flex flex-col items-center justify-center gap-1 text-primary hover:bg-primary/5 transition-colors">
                  <Camera className="h-6 w-6" />
                  <span className="text-[9px] font-medium">صورة رئيسية</span>
                </button>
                {[1, 2, 3, 4, 5].map(i => (
                  <button key={i} className="aspect-square rounded-xl border-2 border-dashed flex items-center justify-center text-muted-foreground hover:border-primary/40 transition-colors">
                    <ImagePlus className="h-5 w-5" />
                  </button>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div>
              <label className="text-sm font-semibold block mb-2">رقم التواصل</label>
              <Input placeholder="01xxxxxxxxx" type="tel" />
              <p className="text-[9px] text-muted-foreground mt-1">يظهر فقط للمهتمين بعد طلب الحجز</p>
            </div>

            {/* Info Box */}
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                <div className="text-[11px] text-blue-800 dark:text-blue-200 space-y-1">
                  <p className="font-medium">بعد النشر:</p>
                  <p>• هيتم مراجعة الإعلان خلال ساعات</p>
                  <p>• تقدر تعدّل عدد الأسرّة المتاحة أي وقت</p>
                  <p>• هتوصلك رسالة لما حد يطلب حجز</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="fixed bottom-16 inset-x-0 p-4 bg-background/95 backdrop-blur-md border-t">
        <div className="flex gap-2">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)} className="px-6">رجوع</Button>
          )}
          <Button className="flex-1" onClick={() => step < 3 ? setStep(step + 1) : undefined}>
            {step < 3 ? 'التالي' : '🚀 نشر الإعلان'}
          </Button>
        </div>
      </div>
    </div>
  )
}
