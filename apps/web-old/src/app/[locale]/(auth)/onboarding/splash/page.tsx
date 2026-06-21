"use client"

import { useEffect } from 'react'
import { useRouter } from '@/i18n/routing'
import { motion } from 'framer-motion'

export default function SplashPage() {
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/onboarding/welcome')
    }, 1500)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-primary flex flex-col items-center justify-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center gap-4"
      >
        <div className="flex items-center justify-center w-24 h-24 rounded-2xl bg-white shadow-2xl">
          <span className="text-primary font-bold text-5xl">ب</span>
        </div>
        <h1 className="text-4xl font-bold text-primary-foreground">بيتكو</h1>
        <p className="text-primary-foreground/80 text-lg">مجتمعك العقاري</p>
      </motion.div>
    </div>
  )
}
