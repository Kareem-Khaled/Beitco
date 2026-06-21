'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/onboarding/welcome');
    }, 1500);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-beitco-blue-light via-background to-beitco-gold-light flex flex-col items-center justify-center">
      <div className="text-center">
        <h1 className="text-display font-bold text-beitco-blue-DEFAULT mb-md">بيتكو</h1>
        <p className="text-h2 text-foreground">مجتمعك العقاري</p>
      </div>
    </div>
  );
}
