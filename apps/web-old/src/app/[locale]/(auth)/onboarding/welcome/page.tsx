"use client"

import { useState } from 'react'
import { useRouter } from '@/i18n/routing'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Users, Shield, Search } from 'lucide-react'

const slides = [
  {
    icon: Users,
    title: 'شارك، ناقش، واكتشف',
    description: 'انضم لمجتمع من آلاف المهتمين بالعقارات في مصر. شارك تجاربك واستفد من خبرات الآخرين.',
  },
  {
    icon: Shield,
    title: 'محتوى موثوق من خبراء',
    description: 'وسطاء وخبراء معتمدين يقدمون نصائح ومعلومات موثوقة تساعدك في قراراتك العقارية.',
  },
  {
    icon: Search,
    title: 'ابحث عن شقتك مع المجتمع',
    description: 'استفد من تجارب المجتمع في إيجاد العقار المناسب. اسأل، ناقش، واحصل على أفضل الخيارات.',
  },
]

export default function WelcomePage() {
  const router = useRouter()
  const [currentSlide, setCurrentSlide] = useState(0)

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1)
    } else {
      router.push('/onboarding/phone')
    }
  }

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center text-center max-w-sm"
          >
            <div className="w-32 h-32 rounded-full bg-primary-light flex items-center justify-center mb-8">
              {(() => {
                const IconComponent = slides[currentSlide].icon
                return <IconComponent className="w-16 h-16 text-primary" />
              })()}
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              {slides[currentSlide].title}
            </h2>
            <p className="text-muted-foreground text-base leading-relaxed">
              {slides[currentSlide].description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="px-6 pb-12">
        {/* Dots indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? 'w-8 bg-primary'
                  : 'w-2 bg-border'
              }`}
            />
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center gap-3">
          {currentSlide > 0 && (
            <Button
              variant="outline"
              size="icon"
              onClick={prevSlide}
              className="w-12 h-12"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          )}
          <Button
            onClick={nextSlide}
            className="flex-1 h-12 text-base font-medium"
          >
            {currentSlide === slides.length - 1 ? 'ابدأ' : 'التالي'}
            <ChevronLeft className="w-5 h-5 me-2" />
          </Button>
        </div>

        {/* Skip button */}
        <button
          onClick={() => router.push('/onboarding/phone')}
          className="w-full mt-4 text-muted-foreground text-sm py-2"
        >
          تخطي
        </button>
      </div>
    </div>
  )
}
