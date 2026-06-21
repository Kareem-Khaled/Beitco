'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Chrome } from 'lucide-react';

export default function PhoneLoginPage() {
  const [phone, setPhone] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length >= 10) {
      router.push('/onboarding/otp');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col px-lg py-xl">
      <div className="flex-1">
        <h1 className="text-h1 font-bold mb-md">سجّل دخولك</h1>
        <p className="text-body text-muted-foreground mb-xl">
          أدخل رقم هاتفك للمتابعة
        </p>

        <form onSubmit={handleSubmit} className="space-y-lg">
          <div className="space-y-sm">
            <label className="text-caption font-medium">رقم الهاتف</label>
            <div className="flex gap-2">
              <div className="flex items-center gap-2 px-md py-3 border border-input rounded-input bg-surface text-center font-mono min-w-[80px]">
                <span className="text-xl">🇪🇬</span>
                <span className="text-body">+20</span>
              </div>
              <Input
                type="tel"
                placeholder="1234567890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="flex-1 text-body font-mono ltr-input"
                dir="ltr"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full rounded-button py-6 text-body font-medium"
            size="lg"
            disabled={phone.length < 10}
          >
            إرسال الرمز
          </Button>
        </form>

        <div className="mt-xl">
          <div className="flex items-center gap-md mb-lg">
            <Separator className="flex-1" />
            <span className="text-caption text-muted-foreground">أو</span>
            <Separator className="flex-1" />
          </div>

          <div className="space-y-sm">
            <Button
              variant="outline"
              className="w-full rounded-button py-6 text-body font-medium"
              size="lg"
            >
              <Chrome className="w-5 h-5 me-2" />
              متابعة مع Google
            </Button>

            <Button
              variant="outline"
              className="w-full rounded-button py-6 text-body font-medium"
              size="lg"
            >
              <span className="text-xl me-2">🍎</span>
              متابعة مع Apple
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
