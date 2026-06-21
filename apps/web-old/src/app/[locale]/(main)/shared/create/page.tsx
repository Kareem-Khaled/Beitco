"use client"

import { useState } from 'react'
import { Camera, Plus, X, BedDouble, MapPin, Info } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const typeOptions = [
  { key: 'bed', label: 'سرير', icon: '🛏️' },
  { key: 'room', label: 'غرفة خاصة', icon: '🚪' },
  { key: 'apartment', label: 'شقة مشتركة', icon: '🏠' },
]

const genderOptions = [
  { key: 'male', label: 'شباب فقط' },
  { key: 'female', label: 'بنات فقط' },
  { key: 'mixed', label: 'مختلط' },
]

const amenityOptions = ['واي فاي', 'تكييف', 'غسالة', 'مطبخ مجهز', 'سخان', 'موقف سيارات', 'حارس أمن', 'بلكونة', 'أسانسير', 'قريب من مواصلات']

export default function CreateSharedListingPage() {
  const [step, setStep] = useState(1)
  const [type, setType] = useState('')
  const [gender, setGender] = useState('')
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
  const [images, setImages] = useState<string[]>([])

  const toggleAmenity = (a: string) => {
    setSelectedAmenities(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a])
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Progress */}
      <div className="sticky top-14 z-20 bg-background border-b px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <h1 className="font-bold text-sm">إضافة سكن مشترك</h1>
          <span className="text-[10px] text-muted-foreground">خطوة {step}/3</span>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3].map(s => (
            <div key={s} className={cn("h-1 flex-1 rounded-full", s <= step ? "bg-primary" : "bg-muted")} />
          ))}
        </div>
      </div>

      <div className="px-4 py-5 space-y-6">
        {step === 1 && (
          <>
            {/* Type Selection */}
            <div>
              <label className="text-sm font-semibold block mb-3">نوع السكن</label>
              <div className="grid grid-cols-3 gap-2">
                {typeOptions.map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setType(opt.key)}
                    className={cn(
                      "p-4 rounded-xl border text-center transition-all",
                      type === opt.key ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-primary/50"
                    )}
                  >
                    <span className="text-2xl block mb-1">{opt.icon}</span>
                    <span className="text-xs font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Gender */}
            <div>
              <label className="text-sm font-semibold block mb-3">مخصص لـ</label>
              <div className="flex gap-2">
                {genderOptions.map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setGender(opt.key)}
                    className={cn(
                      "flex-1 py-2.5 rounded-xl border text-xs font-medium transition-all",
                      gender === opt.key ? "border-primary bg-primary/5 text-primary" : ""
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="text-sm font-semibold block mb-2">الموقع</label>
              <div className="relative">
                <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="المنطقة أو الكمبوند" className="pr-10" />
              </div>
              <Input placeholder="العنوان التفصيلي (اختياري)" className="mt-2" />
            </div>

            {/* Beds */}
            {type === 'bed' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">عدد الأسرّة الكلي</label>
                  <Input type="number" placeholder="3" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">المتاح حالياً</label>
                  <Input type="number" placeholder="1" />
                </div>
              </div>
            )}
          </>
        )}

        {step === 2 && (
          <>
            {/* Pricing */}
            <div>
              <label className="text-sm font-semibold block mb-2">السعر الشهري</label>
              <div className="relative">
                <Input type="number" placeholder="2500" className="pl-16" />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">جنيه/شهر</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">التأمين (جنيه)</label>
                <Input type="number" placeholder="5000" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">الحد الأدنى للإقامة</label>
                <Input placeholder="3 أشهر" />
              </div>
            </div>

            {/* Amenities */}
            <div>
              <label className="text-sm font-semibold block mb-3">المميزات</label>
              <div className="flex flex-wrap gap-2">
                {amenityOptions.map(a => (
                  <button
                    key={a}
                    onClick={() => toggleAmenity(a)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg border text-xs transition-all",
                      selectedAmenities.includes(a) ? "border-primary bg-primary/10 text-primary" : ""
                    )}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-semibold block mb-2">وصف المكان</label>
              <textarea
                placeholder="اكتب وصف يساعد الناس تعرف المكان... (المنطقة، المواصلات، جو السكن)"
                className="w-full h-28 rounded-xl border bg-background px-3 py-2.5 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Rules */}
            <div>
              <label className="text-sm font-semibold block mb-2">قواعد السكن (اختياري)</label>
              <textarea
                placeholder="مثال: ممنوع التدخين، هدوء بعد 11..."
                className="w-full h-20 rounded-xl border bg-background px-3 py-2.5 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </>
        )}

        {step === 3 && (
          <>
            {/* Photos */}
            <div>
              <label className="text-sm font-semibold block mb-2">صور المكان</label>
              <p className="text-[10px] text-muted-foreground mb-3">أضف 3 صور على الأقل (الغرفة، الحمام، المطبخ)</p>
              <div className="grid grid-cols-3 gap-2">
                <button className="aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                  <Camera className="h-5 w-5" />
                  <span className="text-[9px]">إضافة صورة</span>
                </button>
                {[1, 2].map(i => (
                  <div key={i} className="aspect-square rounded-xl border-2 border-dashed flex items-center justify-center text-muted-foreground">
                    <Plus className="h-5 w-5" />
                  </div>
                ))}
              </div>
            </div>

            {/* Preview Info */}
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                <div className="text-xs text-blue-800 dark:text-blue-200">
                  <p className="font-medium mb-1">بعد النشر</p>
                  <ul className="space-y-1 text-[10px] text-blue-700 dark:text-blue-300">
                    <li>• سيتم مراجعة الإعلان خلال 24 ساعة</li>
                    <li>• يمكنك تعديل الإعلان في أي وقت</li>
                    <li>• الإعلان صالح لمدة 30 يوم</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="fixed bottom-16 inset-x-0 p-4 bg-background/90 backdrop-blur-md border-t">
        <div className="flex gap-2">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)} className="px-6">
              رجوع
            </Button>
          )}
          <Button
            className="flex-1"
            onClick={() => step < 3 ? setStep(step + 1) : undefined}
          >
            {step < 3 ? 'التالي' : 'نشر الإعلان'}
          </Button>
        </div>
      </div>
    </div>
  )
}
