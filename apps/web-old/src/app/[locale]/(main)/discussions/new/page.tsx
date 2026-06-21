"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

const categories = [
  { key: 'price_check', label: '💰 سعر عادل؟', description: 'اسأل عن سعر عقار معين' },
  { key: 'area_comparison', label: '📍 مقارنة مناطق', description: 'قارن بين منطقتين أو أكثر' },
  { key: 'developer_review', label: '🏢 تقييم مطور', description: 'شارك تجربتك مع مطور' },
  { key: 'advice', label: '💡 نصيحة عامة', description: 'اطلب نصيحة من المجتمع' },
]

export default function NewDiscussionPage() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [category, setCategory] = useState('')

  return (
    <div className="min-h-screen px-4 py-6 pb-20">
      <h1 className="text-xl font-bold mb-1">سؤال جديد</h1>
      <p className="text-sm text-muted-foreground mb-6">اسأل مجتمع بيتكو واحصل على إجابات من خبراء وسكان</p>

      {/* Category */}
      <div className="mb-6">
        <label className="text-sm font-semibold mb-2 block">اختر التصنيف</label>
        <div className="grid grid-cols-2 gap-2">
          {categories.map(cat => (
            <button
              key={cat.key}
              onClick={() => setCategory(cat.key)}
              className={cn(
                "p-3 rounded-lg border text-right transition-colors",
                category === cat.key ? "border-primary bg-primary/5" : "border-border"
              )}
            >
              <p className="text-sm font-medium">{cat.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{cat.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div className="mb-4">
        <label className="text-sm font-semibold mb-2 block">العنوان</label>
        <Input
          placeholder="مثال: هل سعر 30K/م² في الشيخ زايد مناسب؟"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      {/* Body */}
      <div className="mb-6">
        <label className="text-sm font-semibold mb-2 block">التفاصيل</label>
        <Textarea
          placeholder="اكتب تفاصيل سؤالك هنا... كل ما كتبت أكتر، كل ما الإجابات هتكون أدق."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={5}
        />
      </div>

      <Button className="w-full" size="lg" disabled={!title || !category}>
        نشر السؤال
      </Button>
    </div>
  )
}
