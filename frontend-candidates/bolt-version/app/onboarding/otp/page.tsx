'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight } from 'lucide-react';

export default function OTPPage() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(30);
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      const inputs = document.querySelectorAll('input[type="tel"]');
      (inputs[index + 1] as HTMLInputElement)?.focus();
    }
  };

  const handleSubmit = () => {
    if (otp.join('').length === 6) {
      router.push('/onboarding/profile');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col px-lg py-xl">
      <Button variant="ghost" size="icon" className="mb-md self-start min-touch">
        <ArrowRight className="w-5 h-5" />
      </Button>

      <div className="flex-1">
        <h1 className="text-h1 font-bold mb-md">أدخل رمز التحقق</h1>
        <p className="text-body text-muted-foreground mb-xl">
          أرسلنا رمز التحقق إلى رقمك
        </p>

        <div className="flex gap-2 justify-center mb-2xl font-mono">
          {otp.map((digit, idx) => (
            <Input
              key={idx}
              type="tel"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(idx, e.target.value)}
              className="w-12 h-16 text-center text-h1 font-bold rounded-input ltr-input"
              dir="ltr"
            />
          ))}
        </div>

        <Button
          className="w-full rounded-button py-6 text-body font-medium"
          size="lg"
          onClick={handleSubmit}
          disabled={otp.join('').length < 6}
        >
          تحقق
        </Button>

        <div className="text-center mt-lg">
          <p className="text-caption text-muted-foreground mb-md">
            لم تستقبل الرمز؟
          </p>
          <Button
            variant="ghost"
            className="text-caption"
            disabled={countdown > 0}
          >
            {countdown > 0 ? `إعادة الإرسال بعد ${countdown}ث` : 'إرسال مرة أخرى'}
          </Button>
        </div>
      </div>
    </div>
  );
}
