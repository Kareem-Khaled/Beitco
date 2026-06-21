"use client"

import { useState } from 'react'
import { Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { use } from 'react'

const categories = [
  { key: 'security', label: 'الأمن والحراسة' },
  { key: 'maintenance', label: 'الصيانة' },
  { key: 'construction', label: 'جودة البناء' },
  { key: 'developerCommitment', label: 'التزام المطور' },
  { key: 'community', label: 'المجتمع' },
  { key: 'internet', label: 'الإنترنت والخدمات' },
  { key: 'traffic', label: 'المواصلات' },
  { key: 'amenities', label: 'المرافق' },
]

function RatingInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <span className="text-sm">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={`w-6 h-6 rounded text-[10px] font-bold transition-colors ${
              n <= value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function WriteReviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [ratings, setRatings] = useState<Record<string, number>>({})
  const [comment, setComment] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)

  return (
    <div className="min-h-screen px-4 py-6 pb-24">
      <h1 className="text-xl font-bold mb-1">اكتب تقييمك</h1>
      <p className="text-sm text-muted-foreground mb-6">شارك تجربتك الحقيقية كمقيم</p>

      {/* Category Ratings */}
      <div className="mb-6">
        <h2 className="font-semibold text-sm mb-2">قيّم كل عنصر (1-10)</h2>
        <div className="border rounded-lg px-3">
          {categories.map(cat => (
            <RatingInput
              key={cat.key}
              label={cat.label}
              value={ratings[cat.key] || 0}
              onChange={(v) => setRatings(prev => ({ ...prev, [cat.key]: v }))}
            />
          ))}
        </div>
      </div>

      {/* Comment */}
      <div className="mb-6">
        <h2 className="font-semibold text-sm mb-2">تعليقك</h2>
        <Textarea
          placeholder="اكتب تجربتك بالتفصيل... ما الذي يعجبك؟ ما الذي يحتاج تحسين؟"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
        />
      </div>

      {/* Anonymous toggle */}
      <label className="flex items-center gap-3 mb-8">
        <input
          type="checkbox"
          checked={isAnonymous}
          onChange={(e) => setIsAnonymous(e.target.checked)}
          className="rounded"
        />
        <span className="text-sm">نشر كمقيم مجهول (هويتك ستبقى مخفية)</span>
      </label>

      <Button className="w-full" size="lg">
        نشر التقييم
      </Button>
    </div>
  )
}
