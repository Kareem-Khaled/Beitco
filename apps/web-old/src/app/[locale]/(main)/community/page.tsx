"use client"

import { Link } from '@/i18n/routing'
import { MessageCircle, Users, TrendingUp, Plus, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const discussionCategories = [
  { key: 'all', label: 'الكل', emoji: '📋' },
  { key: 'price_check', label: 'سعر عادل؟', emoji: '💰' },
  { key: 'area', label: 'مناطق', emoji: '📍' },
  { key: 'developer', label: 'مطورين', emoji: '🏢' },
  { key: 'advice', label: 'نصيحة', emoji: '💡' },
  { key: 'shared', label: 'سكن مشترك', emoji: '🛏️' },
]

const hotDiscussions = [
  { id: '1', title: 'هل سعر 28K/م² في التجمع الخامس مناسب؟', category: 'price_check', upvotes: 34, answers: 12, time: 'منذ ساعتين' },
  { id: '2', title: 'مقارنة: الشيخ زايد vs 6 أكتوبر للعائلات', category: 'area', upvotes: 56, answers: 23, time: 'منذ يوم' },
  { id: '3', title: 'تجربتي مع بالم هيلز - تأخير سنتين', category: 'developer', upvotes: 89, answers: 31, time: 'منذ يومين' },
  { id: '4', title: 'أفضل مناطق السكن المشترك للطالبات', category: 'shared', upvotes: 28, answers: 14, time: 'منذ 3 أيام' },
  { id: '5', title: 'العاصمة الإدارية: استثمار ولا سكن؟', category: 'advice', upvotes: 45, answers: 19, time: 'منذ 4 أيام' },
]

const activeGroups = [
  { id: '1', name: 'سكان القاهرة الجديدة', members: 2340, image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=200&q=80', newPosts: 5 },
  { id: '2', name: 'سكن طلاب AUC', members: 890, image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=200&q=80', newPosts: 12 },
  { id: '3', name: 'عقارات 6 أكتوبر', members: 1560, image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=200&q=80', newPosts: 3 },
  { id: '4', name: 'سكن طلاب GUC', members: 670, image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=200&q=80', newPosts: 8 },
]

export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-background px-4 py-4 border-b">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">المجتمع</h1>
          <Button size="sm" asChild>
            <Link href="/discussions/new"><Plus className="h-4 w-4 ml-1" /> سؤال جديد</Link>
          </Button>
        </div>
      </div>

      {/* Groups - Horizontal scroll */}
      <div className="py-4">
        <div className="flex items-center justify-between px-4 mb-3">
          <h2 className="font-semibold text-sm flex items-center gap-2"><Users className="h-4 w-4 text-blue-500" /> المجموعات</h2>
          <Link href="/groups" className="text-xs text-primary font-medium">عرض الكل</Link>
        </div>
        <div className="flex gap-3 overflow-x-auto px-4 pb-1">
          {activeGroups.map(group => (
            <Link key={group.id} href={`/groups/${group.id}`} className="flex-shrink-0 w-36 rounded-xl overflow-hidden border bg-card hover:shadow-sm transition-shadow">
              <div className="h-20 overflow-hidden relative">
                <img src={group.image} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                {group.newPosts > 0 && (
                  <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                    {group.newPosts} جديد
                  </div>
                )}
              </div>
              <div className="p-2">
                <p className="text-xs font-medium truncate">{group.name}</p>
                <p className="text-[10px] text-muted-foreground">{group.members.toLocaleString('ar-EG')} عضو</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Discussion Categories */}
      <div className="px-4 pb-3 overflow-x-auto">
        <div className="flex gap-2">
          {discussionCategories.map(cat => (
            <Link
              key={cat.key}
              href={cat.key === 'all' ? '/discussions' : `/discussions?category=${cat.key}`}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs whitespace-nowrap border bg-background hover:border-primary/50 transition-colors"
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Hot Discussions */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4 text-green-500" /> نقاشات رائجة</h2>
          <Link href="/discussions" className="text-xs text-primary font-medium">عرض الكل</Link>
        </div>
        <div className="space-y-2 pb-20">
          {hotDiscussions.map(d => (
            <Link
              key={d.id}
              href={`/discussions/${d.id}`}
              className="flex gap-3 p-3 rounded-xl border bg-card hover:shadow-sm transition-all"
            >
              <div className="flex flex-col items-center gap-0.5 pt-0.5">
                <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                <span className="text-xs font-bold">{d.upvotes}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-snug">{d.title}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] text-muted-foreground">{d.time}</span>
                  <span className="text-[10px] text-muted-foreground">•</span>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                    <MessageCircle className="h-3 w-3" /> {d.answers} إجابة
                  </span>
                </div>
              </div>
              <ArrowLeft className="h-4 w-4 text-muted-foreground self-center" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
