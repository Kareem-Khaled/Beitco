'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function WelcomePage() {
  const [slide, setSlide] = useState(0);
  const router = useRouter();

  const slides = [
    { title: 'شارك، ناقش، واكتشف', emoji: '🤝' },
    { title: 'محتوى موثوق من خبراء', emoji: '✅' },
    { title: 'ابحث عن شقتك مع المجتمع', emoji: '🏠' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col px-lg py-xl">
      <div className="flex-1 flex flex-col items-center justify-center">
        <p className="text-6xl mb-2xl">{slides[slide].emoji}</p>
        <h1 className="text-h1 font-bold text-center mb-md">{slides[slide].title}</h1>
      </div>

      <div className="flex justify-center gap-2 mb-2xl">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setSlide(idx)}
            className={`w-2 h-2 rounded-full transition-all ${
              idx === slide
                ? 'bg-beitco-blue-DEFAULT w-6'
                : 'bg-border'
            }`}
          />
        ))}
      </div>

      <div className="flex gap-md">
        {slide > 0 && (
          <Button
            variant="outline"
            className="flex-1 rounded-button py-6 text-body font-medium"
            size="lg"
            onClick={() => setSlide(slide - 1)}
          >
            السابق
          </Button>
        )}

        <Button
          className={`flex-1 rounded-button py-6 text-body font-medium ${
            slide === slides.length - 1
              ? 'bg-beitco-blue-DEFAULT'
              : 'bg-beitco-blue-DEFAULT'
          }`}
          size="lg"
          onClick={() => {
            if (slide === slides.length - 1) {
              router.push('/onboarding/phone');
            } else {
              setSlide(slide + 1);
            }
          }}
        >
          {slide === slides.length - 1 ? 'ابدأ' : 'التالي'}
        </Button>
      </div>
    </div>
  );
}
