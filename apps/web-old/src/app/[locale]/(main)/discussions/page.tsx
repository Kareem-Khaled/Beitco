"use client"

import { useState } from 'react'
import { MessageCircle, ArrowUp, Clock, Flame, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const mockDiscussions = [
  { id: '1', title: 'هل سعر 28,000 جنيه/م² في التجمع الخامس مناسب؟', category: 'price_check', author: 'أحمد م.', upvotes: 34, answers: 12, createdAt: 'منذ ساعتين' },
  { id: '2', title: 'مين ساكن في مدينتي ويقدر يفيدني عن الصيانة؟', category: 'advice', author: 'سارة ع.', upvotes: 21, answers: 8, createdAt: 'منذ 5 ساعات' },
  { id: '3', title: 'مقارنة: الشيخ زايد vs 6 أكتوبر للعائلات', category: 'area_comparison', author: 'محمد ر.', upvotes: 56, answers: 23, createdAt: 'منذ يوم' },
  { id: '4', title: 'تجربتي مع شركة بالم هيلز - تأخير سنتين', category: 'developer_review', author: 'مقيم مجهول', upvotes: 89, answers: 31, createdAt: 'منذ يومين' },
  { id: '5', title: 'العاصمة الإدارية: استثمار ولا سكن؟', category: 'advice', author: 'كريم أ.', upvotes: 45, answers: 19, createdAt: 'منذ 3 أيام' },
  { id: '6', title: 'أفضل كمبوند للإيجار في القاهرة الجديدة بميزانية 15K', category: 'advice', author: 'نورا ف.', upvotes: 28, answers: 14, createdAt: 'منذ 4 أيام' },
]

const categories = [
  { key: 'all', label: 'الكل' },
  { key: 'price_check', label: '💰 سعر عادل؟' },
  { key: 'area_comparison', label: '📍 مقارنة مناطق' },
  { key: 'developer_review', label: '🏢 تقييم مطور' },
  { key: 'advice', label: '💡 نصيحة' },
]

const sortOptions = [
  { key: 'hot', label: 'الأكثر تفاعلاً', icon: <Flame className="h-3.5 w-3.5" /> },
  { key: 'new', label: 'الأحدث', icon: <Clock className="h-3.5 w-3.5" /> },
  { key: 'top', label: 'الأعلى تقييماً', icon: <ArrowUp className="h-3.5 w-3.5" /> },
]

function getCategoryBadge(category: string) {
  switch (category) {
    case 'price_check': return { label: 'سعر عادل؟', className: 'bg-amber-100 text-amber-700' }
    case 'area_comparison': return { label: 'مقارنة', className: 'bg-blue-100 text-blue-700' }
    case 'developer_review': return { label: 'تقييم مطور', className: 'bg-purple-100 text-purple-700' }
    case 'advice': return { label: 'نصيحة', className: 'bg-green-100 text-green-700' }
    default: return { label: '', className: '' }
  }
}

export default function DiscussionsPage() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('hot')

  const filtered = mockDiscussions.filter(d =>
    selectedCategory === 'all' || d.category === selectedCategory
  )

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="px-4 py-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold">النقاشات</h1>
          <Button size="sm" asChild>
            <a href="discussions/new"><Plus className="h-4 w-4 ml-1" /> سؤال جديد</a>
          </Button>
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map(cat => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs whitespace-nowrap border transition-colors",
                selectedCategory === cat.key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border text-muted-foreground"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div className="px-4 py-2 flex gap-3 border-b">
        {sortOptions.map(opt => (
          <button
            key={opt.key}
            onClick={() => setSortBy(opt.key)}
            className={cn(
              "flex items-center gap-1 text-xs transition-colors",
              sortBy === opt.key ? "text-primary font-medium" : "text-muted-foreground"
            )}
          >
            {opt.icon}
            {opt.label}
          </button>
        ))}
      </div>

      {/* Threads */}
      <div className="pb-20">
        {filtered.map(discussion => {
          const badge = getCategoryBadge(discussion.category)
          return (
            <a
              key={discussion.id}
              href={`discussions/${discussion.id}`}
              className="flex gap-3 px-4 py-4 border-b hover:bg-muted/50 transition-colors"
            >
              {/* Upvote */}
              <div className="flex flex-col items-center gap-0.5 pt-1">
                <ArrowUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-bold">{discussion.upvotes}</span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium leading-snug mb-1.5">{discussion.title}</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${badge.className}`}>{badge.label}</span>
                  <span className="text-[10px] text-muted-foreground">{discussion.author}</span>
                  <span className="text-[10px] text-muted-foreground">•</span>
                  <span className="text-[10px] text-muted-foreground">{discussion.createdAt}</span>
                  <span className="text-[10px] text-muted-foreground">•</span>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                    <MessageCircle className="h-3 w-3" /> {discussion.answers}
                  </span>
                </div>
              </div>
            </a>
          )
        })}
      </div>
    </div>
  )
}
