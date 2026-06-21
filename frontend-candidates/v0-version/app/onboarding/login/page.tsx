"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'

export default function LoginPage() {
  const router = useRouter()
  const [phone, setPhone] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (phone.length >= 10) {
      router.push('/onboarding/verify')
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="px-6 pt-12 pb-8">
        <Link href="/onboarding/welcome" className="text-muted-foreground text-sm mb-8 block">
          رجوع
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xl">ب</span>
          </div>
          <span className="font-bold text-2xl">بيتكو</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          تسجيل الدخول
        </h1>
        <p className="text-muted-foreground mb-8">
          أدخل رقم موبايلك لتسجيل الدخول أو إنشاء حساب جديد
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            {/* Country code - Egypt */}
            <div className="flex items-center gap-2 px-4 h-12 rounded-md border border-input bg-surface min-w-[100px]">
              <span className="text-lg">🇪🇬</span>
              <span className="font-mono text-foreground" dir="ltr">+20</span>
            </div>
            
            {/* Phone input */}
            <Input
              type="tel"
              placeholder="1XX XXX XXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              className="flex-1 h-12 text-base font-mono"
              dir="ltr"
              maxLength={10}
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-base font-medium"
            disabled={phone.length < 10}
          >
            إرسال الرمز
          </Button>
        </form>

        <div className="my-8 flex items-center gap-4">
          <Separator className="flex-1" />
          <span className="text-muted-foreground text-sm">أو</span>
          <Separator className="flex-1" />
        </div>

        {/* Social login */}
        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full h-12 text-base font-medium gap-3"
            onClick={() => router.push('/onboarding/profile-setup')}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            المتابعة بحساب Google
          </Button>

          <Button
            variant="outline"
            className="w-full h-12 text-base font-medium gap-3"
            onClick={() => router.push('/onboarding/profile-setup')}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
            المتابعة بحساب Apple
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-8">
        <p className="text-center text-muted-foreground text-sm">
          بتسجيل الدخول، أنت توافق على{' '}
          <Link href="#" className="text-primary underline">شروط الاستخدام</Link>
          {' '}و{' '}
          <Link href="#" className="text-primary underline">سياسة الخصوصية</Link>
        </p>
      </div>
    </div>
  )
}
