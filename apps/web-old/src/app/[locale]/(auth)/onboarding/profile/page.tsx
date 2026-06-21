"use client"

import { useState } from 'react'
import { useRouter } from '@/i18n/routing'
import { Link } from '@/i18n/routing'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Camera, Check } from 'lucide-react'
import { egyptianCities } from '@/lib/mock-data'

const roles = [
  { value: 'buyer', label: 'مشتري', description: 'أبحث عن عقار للشراء' },
  { value: 'seller', label: 'بائع', description: 'أريد بيع عقاري' },
  { value: 'agent', label: 'وسيط', description: 'وسيط عقاري معتمد' },
  { value: 'interested', label: 'مهتم', description: 'أتابع سوق العقارات' },
]

export default function ProfileSetupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [city, setCity] = useState('')
  const [budget, setBudget] = useState(50)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    router.push('/')
  }

  const formatBudget = (value: number) => {
    if (value === 100) return '١٠+ مليون'
    if (value >= 10) return `${value / 10} مليون`
    return `${value * 100} ألف`
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="px-6 pt-12 pb-4">
        <Link href="/onboarding/otp" className="text-muted-foreground text-sm mb-8 block">
          رجوع
        </Link>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          أكمل ملفك الشخصي
        </h1>
        <p className="text-muted-foreground">
          ساعدنا نعرفك أكتر عشان نقدر نقدملك تجربة أفضل
        </p>
      </div>

      {/* Content */}
      <form onSubmit={handleSubmit} className="flex-1 px-6 py-4 overflow-y-auto">
        {/* Avatar */}
        <div className="flex justify-center mb-6">
          <button
            type="button"
            className="relative w-24 h-24 rounded-full bg-surface border-2 border-dashed border-border flex items-center justify-center"
          >
            <Camera className="w-8 h-8 text-muted-foreground" />
            <span className="absolute -bottom-1 -end-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <Camera className="w-4 h-4 text-primary-foreground" />
            </span>
          </button>
        </div>

        {/* Name */}
        <div className="mb-6">
          <Label htmlFor="name" className="text-foreground font-medium mb-2 block">
            الاسم
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="أدخل اسمك"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-12 text-base"
          />
        </div>

        {/* Role */}
        <div className="mb-6">
          <Label className="text-foreground font-medium mb-3 block">
            أنت إيه؟
          </Label>
          <div className="grid grid-cols-2 gap-3">
            {roles.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={`p-4 rounded-lg border-2 text-start transition-all ${
                  role === r.value
                    ? 'border-primary bg-primary-light'
                    : 'border-border bg-surface'
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="font-medium text-foreground">{r.label}</span>
                  {role === r.value && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">{r.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* City */}
        <div className="mb-6">
          <Label htmlFor="city" className="text-foreground font-medium mb-2 block">
            المدينة
          </Label>
          <select
            id="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full h-12 px-4 rounded-md border border-input bg-background text-foreground text-base focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
          >
            <option value="">اختر المدينة</option>
            {egyptianCities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Budget (optional) */}
        {(role === 'buyer' || role === 'interested') && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-foreground font-medium">
                الميزانية (اختياري)
              </Label>
              <span className="text-sm text-muted-foreground">
                {formatBudget(budget)} جنيه
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="w-full h-2 bg-surface rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer"
            />
            <div className="flex justify-between mt-2">
              <span className="text-xs text-muted-foreground">١٠٠ ألف</span>
              <span className="text-xs text-muted-foreground">١٠+ مليون</span>
            </div>
          </div>
        )}
      </form>

      {/* Footer */}
      <div className="px-6 py-6 border-t border-border">
        <Button
          onClick={handleSubmit}
          className="w-full h-12 text-base font-medium"
          disabled={!name || !role || !city}
        >
          ابدأ الآن
        </Button>
        <button
          onClick={() => router.push('/')}
          className="w-full mt-3 text-muted-foreground text-sm py-2"
        >
          تخطي الآن
        </button>
      </div>
    </div>
  )
}
