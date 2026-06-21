"use client"

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function VerifyPage() {
  const router = useRouter()
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [countdown, setCountdown] = useState(30)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value[0]
    }

    const newOtp = [...otp]
    newOtp[index] = value.replace(/\D/g, '')
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all filled
    if (newOtp.every(digit => digit) && newOtp.join('').length === 6) {
      router.push('/onboarding/profile-setup')
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const newOtp = [...otp]
    pastedData.split('').forEach((char, index) => {
      if (index < 6) newOtp[index] = char
    })
    setOtp(newOtp)
    
    if (pastedData.length === 6) {
      router.push('/onboarding/profile-setup')
    }
  }

  const handleResend = () => {
    setCountdown(30)
    setOtp(['', '', '', '', '', ''])
    inputRefs.current[0]?.focus()
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="px-6 pt-12 pb-8">
        <Link href="/onboarding/login" className="text-muted-foreground text-sm mb-8 block">
          رجوع
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 px-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          أدخل رمز التحقق
        </h1>
        <p className="text-muted-foreground mb-8">
          تم إرسال رمز التحقق إلى{' '}
          <span className="font-mono text-foreground" dir="ltr">+20 1XX XXX XXXX</span>
        </p>

        {/* OTP Input */}
        <div className="flex justify-center gap-2 mb-8" dir="ltr">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              className="w-12 h-14 text-center text-2xl font-mono font-semibold rounded-md border border-input bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          ))}
        </div>

        {/* Resend */}
        <div className="text-center mb-8">
          {countdown > 0 ? (
            <p className="text-muted-foreground">
              إعادة الإرسال خلال{' '}
              <span className="font-mono text-foreground">{countdown}</span>
              {' '}ثانية
            </p>
          ) : (
            <button
              onClick={handleResend}
              className="text-primary font-medium"
            >
              إعادة إرسال الرمز
            </button>
          )}
        </div>

        <Button
          onClick={() => router.push('/onboarding/profile-setup')}
          className="w-full h-12 text-base font-medium"
          disabled={!otp.every(digit => digit)}
        >
          تأكيد
        </Button>
      </div>

      {/* Footer */}
      <div className="px-6 py-8">
        <p className="text-center text-muted-foreground text-sm">
          لم تستلم الرمز؟{' '}
          <Link href="/onboarding/login" className="text-primary underline">
            تغيير رقم الموبايل
          </Link>
        </p>
      </div>
    </div>
  )
}
