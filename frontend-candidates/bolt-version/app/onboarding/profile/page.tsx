'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Upload } from 'lucide-react';

export default function ProfileSetupPage() {
  const [name, setName] = useState('');
  const [role, setRole] = useState('buyer');
  const [city, setCity] = useState('cairo');
  const [budget, setBudget] = useState([500000]);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name) {
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col px-lg py-xl">
      <div className="flex-1">
        <h1 className="text-h1 font-bold mb-md">أكمل ملفك الشخصي</h1>
        <p className="text-body text-muted-foreground mb-xl">
          ساعدنا نتعرف عليك أكتر
        </p>

        <form onSubmit={handleSubmit} className="space-y-lg">
          <div className="space-y-sm">
            <label className="text-caption font-medium">الاسم</label>
            <Input
              type="text"
              placeholder="اسمك الكامل"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-input"
              required
            />
          </div>

          <div className="space-y-sm">
            <label className="text-caption font-medium">دورك</label>
            <div className="grid grid-cols-2 gap-md">
              {[
                { value: 'buyer', label: 'مشتري' },
                { value: 'seller', label: 'بائع' },
                { value: 'agent', label: 'وسيط' },
                { value: 'interested', label: 'مهتم' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setRole(opt.value)}
                  className={`p-md rounded-input border-2 transition-all text-body font-medium ${
                    role === opt.value
                      ? 'border-beitco-blue-DEFAULT bg-beitco-blue-light/10'
                      : 'border-border hover:border-beitco-blue-DEFAULT/50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-sm">
            <label className="text-caption font-medium">المدينة</label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full p-3 rounded-input border border-input bg-background text-body"
            >
              <option value="cairo">القاهرة</option>
              <option value="giza">الجيزة</option>
              <option value="alexandria">الإسكندرية</option>
            </select>
          </div>

          {role === 'buyer' && (
            <div className="space-y-sm">
              <label className="text-caption font-medium">الميزانية (اختياري)</label>
              <input
                type="range"
                min={100000}
                max={5000000}
                step={100000}
                value={budget[0]}
                onChange={(e) => setBudget([parseInt(e.target.value)])}
                className="w-full"
              />
              <p className="text-caption text-muted-foreground text-center font-mono">
                {budget[0].toLocaleString('ar-EG')} ج.م
              </p>
            </div>
          )}

          <Card className="rounded-card p-md border-border border-dashed bg-surface cursor-pointer hover:bg-border/50 transition-colors">
            <div className="flex flex-col items-center justify-center py-lg text-center">
              <Upload className="w-8 h-8 text-muted-foreground mb-md" />
              <p className="text-caption text-muted-foreground">
                أضف صورة ملفك الشخصي
              </p>
              <p className="text-micro text-muted-foreground">(اختياري)</p>
            </div>
          </Card>

          <Button
            type="submit"
            className="w-full rounded-button py-6 text-body font-medium bg-beitco-blue-DEFAULT"
            size="lg"
            disabled={!name}
          >
            ابدأ الآن
          </Button>
        </form>
      </div>
    </div>
  );
}
