"use client"

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  ArrowRight,
  ArrowLeft,
  Home,
  Building2,
  Hotel,
  Layers,
  Castle,
  LandPlot,
  Briefcase,
  Store,
  Plus,
  Minus,
  Upload,
  X,
  GripVertical,
  Star,
  Check,
  MapPin,
  Bed,
  Bath,
  Maximize,
  Armchair,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { egyptianCities, currentUser } from '@/lib/mock-data'

const steps = [
  { id: 1, label: 'المعلومات الأساسية' },
  { id: 2, label: 'التفاصيل' },
  { id: 3, label: 'الصور' },
  { id: 4, label: 'المراجعة' },
]

const propertyTypes = [
  { value: 'apartment', label: 'شقة', icon: Home },
  { value: 'villa', label: 'فيلا', icon: Castle },
  { value: 'studio', label: 'استوديو', icon: Hotel },
  { value: 'duplex', label: 'دوبلكس', icon: Layers },
  { value: 'penthouse', label: 'بنتهاوس', icon: Building2 },
  { value: 'land', label: 'أرض', icon: LandPlot },
  { value: 'office', label: 'مكتب', icon: Briefcase },
  { value: 'shop', label: 'محل', icon: Store },
]

const finishingOptions = [
  { value: 'finished', label: 'تشطيب كامل' },
  { value: 'semi-finished', label: 'نصف تشطيب' },
  { value: 'unfinished', label: 'بدون تشطيب' },
]

interface FormData {
  title: string
  type: string
  purpose: 'sale' | 'rent'
  price: string
  city: string
  area: string
  bedrooms: number
  bathrooms: number
  areaSize: string
  floor: string
  finishing: string
  furnished: boolean
  description: string
  images: string[]
  agreedToTerms: boolean
}

export default function CreateListingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    title: '',
    type: '',
    purpose: 'sale',
    price: '',
    city: '',
    area: '',
    bedrooms: 2,
    bathrooms: 1,
    areaSize: '',
    floor: '',
    finishing: 'finished',
    furnished: false,
    description: '',
    images: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
      'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800',
    ],
    agreedToTerms: false,
  })

  const updateFormData = (field: keyof FormData, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const isStep1Valid = formData.title && formData.type && formData.price && formData.city && formData.area
  const isStep2Valid = formData.areaSize && formData.finishing && formData.description.length >= 50
  const isStep3Valid = formData.images.length >= 3
  const isStep4Valid = formData.agreedToTerms

  const canProceed = () => {
    switch (currentStep) {
      case 1: return isStep1Valid
      case 2: return isStep2Valid
      case 3: return isStep3Valid
      case 4: return isStep4Valid
      default: return false
    }
  }

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = () => {
    // In real app, would submit the listing
    router.push('/listings')
  }

  const handleRemoveImage = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index)
    updateFormData('images', newImages)
  }

  const formatPrice = (price: string) => {
    const num = parseInt(price.replace(/,/g, ''))
    if (isNaN(num)) return ''
    return num.toLocaleString('en-US')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center h-14 px-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowRight className="w-5 h-5" />
          </Button>
          <h1 className="flex-1 font-semibold text-foreground text-center">إضافة عقار</h1>
          <div className="w-9" />
        </div>
      </header>

      {/* Step Indicator */}
      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                  currentStep >= step.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-surface text-muted-foreground"
                )}
              >
                {currentStep > step.id ? <Check className="w-4 h-4" /> : step.id}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "w-12 sm:w-20 h-1 mx-1",
                    currentStep > step.id ? "bg-primary" : "bg-surface"
                  )}
                />
              )}
            </div>
          ))}
        </div>
        <p className="text-center text-sm font-medium text-foreground">
          {steps[currentStep - 1].label}
        </p>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-4 pb-24">
        {/* Step 1: Basic Info */}
        {currentStep === 1 && (
          <div className="space-y-6 max-w-lg mx-auto">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                عنوان العقار
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => updateFormData('title', e.target.value)}
                placeholder="عنوان العقار"
                className="w-full h-12 px-4 rounded-xl bg-surface border border-border focus:border-primary outline-none text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Property Type */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                نوع العقار
              </label>
              <div className="grid grid-cols-4 gap-2">
                {propertyTypes.map((type) => {
                  const Icon = type.icon
                  return (
                    <button
                      key={type.value}
                      onClick={() => updateFormData('type', type.value)}
                      className={cn(
                        "flex flex-col items-center gap-2 p-3 rounded-xl border transition-colors",
                        formData.type === type.value
                          ? "bg-primary/10 border-primary text-primary"
                          : "bg-surface border-border text-muted-foreground hover:border-primary/50"
                      )}
                    >
                      <Icon className="w-6 h-6" />
                      <span className="text-xs font-medium">{type.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Purpose Toggle */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                الغرض
              </label>
              <div className="flex rounded-xl bg-surface p-1">
                <button
                  onClick={() => updateFormData('purpose', 'sale')}
                  className={cn(
                    "flex-1 py-3 rounded-lg text-sm font-medium transition-colors",
                    formData.purpose === 'sale'
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  للبيع
                </button>
                <button
                  onClick={() => updateFormData('purpose', 'rent')}
                  className={cn(
                    "flex-1 py-3 rounded-lg text-sm font-medium transition-colors",
                    formData.purpose === 'rent'
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  للإيجار
                </button>
              </div>
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                السعر
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.price}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '')
                    updateFormData('price', formatPrice(value))
                  }}
                  placeholder="0"
                  className="w-full h-12 ps-4 pe-24 rounded-xl bg-surface border border-border focus:border-primary outline-none font-mono text-lg text-foreground placeholder:text-muted-foreground"
                />
                <div className="absolute end-4 top-1/2 -translate-y-1/2 flex items-center gap-1 text-muted-foreground">
                  <span className="font-medium">EGP</span>
                  {formData.purpose === 'rent' && (
                    <span className="text-sm">/شهرياً</span>
                  )}
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  المدينة
                </label>
                <select
                  value={formData.city}
                  onChange={(e) => updateFormData('city', e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-surface border border-border focus:border-primary outline-none text-foreground appearance-none"
                >
                  <option value="">اختر المدينة</option>
                  {egyptianCities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  المنطقة
                </label>
                <input
                  type="text"
                  value={formData.area}
                  onChange={(e) => updateFormData('area', e.target.value)}
                  placeholder="اسم المنطقة"
                  className="w-full h-12 px-4 rounded-xl bg-surface border border-border focus:border-primary outline-none text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Details */}
        {currentStep === 2 && (
          <div className="space-y-6 max-w-lg mx-auto">
            {/* Bedrooms Counter */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                غرف النوم
              </label>
              <div className="flex items-center justify-between bg-surface rounded-xl px-4 py-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => updateFormData('bedrooms', Math.max(0, formData.bedrooms - 1))}
                  disabled={formData.bedrooms <= 0}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="font-mono text-2xl font-bold text-foreground">{formData.bedrooms}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => updateFormData('bedrooms', formData.bedrooms + 1)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Bathrooms Counter */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                الحمامات
              </label>
              <div className="flex items-center justify-between bg-surface rounded-xl px-4 py-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => updateFormData('bathrooms', Math.max(1, formData.bathrooms - 1))}
                  disabled={formData.bathrooms <= 1}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="font-mono text-2xl font-bold text-foreground">{formData.bathrooms}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => updateFormData('bathrooms', formData.bathrooms + 1)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Area & Floor */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  المساحة (م²)
                </label>
                <input
                  type="number"
                  value={formData.areaSize}
                  onChange={(e) => updateFormData('areaSize', e.target.value)}
                  placeholder="0"
                  className="w-full h-12 px-4 rounded-xl bg-surface border border-border focus:border-primary outline-none font-mono text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  رقم الطابق
                </label>
                <input
                  type="number"
                  value={formData.floor}
                  onChange={(e) => updateFormData('floor', e.target.value)}
                  placeholder="0"
                  className="w-full h-12 px-4 rounded-xl bg-surface border border-border focus:border-primary outline-none font-mono text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>

            {/* Finishing */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                التشطيب
              </label>
              <div className="flex gap-2">
                {finishingOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => updateFormData('finishing', option.value)}
                    className={cn(
                      "flex-1 py-3 rounded-xl text-sm font-medium transition-colors border",
                      formData.finishing === option.value
                        ? "bg-primary/10 border-primary text-primary"
                        : "bg-surface border-border text-muted-foreground"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Furnished Toggle */}
            <div className="flex items-center justify-between bg-surface rounded-xl px-4 py-4">
              <label className="text-sm font-medium text-foreground">مفروش</label>
              <Switch
                checked={formData.furnished}
                onCheckedChange={(checked) => updateFormData('furnished', checked)}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                الوصف
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
                placeholder="اكتب وصفاً تفصيلياً للعقار..."
                rows={5}
                className="w-full p-4 rounded-xl bg-surface border border-border focus:border-primary outline-none resize-none text-foreground placeholder:text-muted-foreground"
              />
              <div className="flex justify-between mt-1">
                <span className={cn(
                  "text-xs",
                  formData.description.length < 50 ? "text-amber-500" : "text-green-600"
                )}>
                  {formData.description.length < 50 ? `الحد الأدنى ٥٠ حرف (${formData.description.length}/50)` : 'ممتاز!'}
                </span>
                <span className="text-xs text-muted-foreground">{formData.description.length} حرف</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Photos */}
        {currentStep === 3 && (
          <div className="space-y-6 max-w-lg mx-auto">
            {/* Upload Zone */}
            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
              <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-foreground font-medium mb-1">اسحب الصور هنا</p>
              <p className="text-sm text-muted-foreground mb-4">أو اضغط لاختيار الصور</p>
              <Button variant="outline" size="sm">
                اختيار الصور
              </Button>
            </div>

            {/* Min photos indicator */}
            <div className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm",
              formData.images.length >= 3
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
            )}>
              {formData.images.length >= 3 ? (
                <Check className="w-4 h-4" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              <span>
                {formData.images.length >= 3
                  ? `${formData.images.length} صور (الحد الأدنى ٣)`
                  : `أضف ${3 - formData.images.length} صور أخرى على الأقل`}
              </span>
            </div>

            {/* Photo Grid */}
            {formData.images.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {formData.images.map((image, index) => (
                  <div
                    key={index}
                    className="relative aspect-square rounded-xl overflow-hidden group"
                  >
                    <Image
                      src={image}
                      alt={`صورة ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    {index === 0 && (
                      <div className="absolute top-2 start-2 px-2 py-1 rounded-lg bg-accent text-accent-foreground text-xs font-medium flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        الرئيسية
                      </div>
                    )}
                    <button
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-2 end-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-2 start-2 w-6 h-6 rounded bg-black/50 text-white flex items-center justify-center cursor-grab opacity-0 group-hover:opacity-100 transition-opacity">
                      <GripVertical className="w-4 h-4" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-muted-foreground text-center">
              الحد الأقصى ١٠ صور • الصورة الأولى هي الصورة الرئيسية
            </p>
          </div>
        )}

        {/* Step 4: Review */}
        {currentStep === 4 && (
          <div className="space-y-6 max-w-lg mx-auto">
            {/* Summary Card */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              {/* Preview Image */}
              {formData.images[0] && (
                <div className="relative h-48">
                  <Image
                    src={formData.images[0]}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-3 start-3 px-3 py-1 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
                    {formData.purpose === 'sale' ? 'للبيع' : 'للإيجار'}
                  </div>
                </div>
              )}

              <div className="p-4">
                {/* Price */}
                <p className="font-mono text-2xl font-bold text-primary mb-1">
                  {formData.price || '0'} EGP
                  {formData.purpose === 'rent' && <span className="text-sm font-normal text-muted-foreground">/شهرياً</span>}
                </p>

                {/* Title */}
                <h3 className="font-semibold text-foreground text-lg mb-2">
                  {formData.title || 'عنوان العقار'}
                </h3>

                {/* Location */}
                <p className="text-sm text-muted-foreground flex items-center gap-1 mb-4">
                  <MapPin className="w-4 h-4" />
                  {formData.area || 'المنطقة'}، {formData.city || 'المدينة'}
                </p>

                {/* Specs */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Bed className="w-4 h-4" />
                    {formData.bedrooms} غرف
                  </span>
                  <span className="flex items-center gap-1">
                    <Bath className="w-4 h-4" />
                    {formData.bathrooms} حمام
                  </span>
                  <span className="flex items-center gap-1">
                    <Maximize className="w-4 h-4" />
                    {formData.areaSize || '0'} م²
                  </span>
                  {formData.furnished && (
                    <span className="flex items-center gap-1">
                      <Armchair className="w-4 h-4" />
                      مفروش
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Details Summary */}
            <div className="bg-surface rounded-xl p-4 space-y-3">
              <h4 className="font-medium text-foreground">ملخص التفاصيل</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">نوع العقار:</span>
                  <span className="text-foreground me-2">
                    {propertyTypes.find(t => t.value === formData.type)?.label || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">التشطيب:</span>
                  <span className="text-foreground me-2">
                    {finishingOptions.find(f => f.value === formData.finishing)?.label || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">الطابق:</span>
                  <span className="text-foreground me-2">{formData.floor || '-'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">عدد الصور:</span>
                  <span className="text-foreground me-2">{formData.images.length}</span>
                </div>
              </div>
            </div>

            {/* Description */}
            {formData.description && (
              <div className="bg-surface rounded-xl p-4">
                <h4 className="font-medium text-foreground mb-2">الوصف</h4>
                <p className="text-sm text-muted-foreground">{formData.description}</p>
              </div>
            )}

            {/* Terms Checkbox */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.agreedToTerms}
                onChange={(e) => updateFormData('agreedToTerms', e.target.checked)}
                className="mt-1 w-5 h-5 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-sm text-muted-foreground">
                أوافق على{' '}
                <a href="#" className="text-primary hover:underline">شروط الاستخدام</a>
                {' '}و{' '}
                <a href="#" className="text-primary hover:underline">سياسة الخصوصية</a>
              </span>
            </label>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="fixed bottom-0 inset-x-0 bg-background border-t border-border px-4 py-4 safe-area-bottom">
        <div className="flex gap-3 max-w-lg mx-auto">
          {currentStep > 1 && (
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={handleBack}
            >
              <ArrowLeft className="w-4 h-4" />
              السابق
            </Button>
          )}
          {currentStep < 4 ? (
            <Button
              className="flex-1 gap-2"
              onClick={handleNext}
              disabled={!canProceed()}
            >
              التالي
              <ArrowRight className="w-4 h-4 rotate-180" />
            </Button>
          ) : (
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={!canProceed()}
            >
              {currentUser.tier === 2 ? 'نشر العقار' : 'إرسال للمراجعة'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
