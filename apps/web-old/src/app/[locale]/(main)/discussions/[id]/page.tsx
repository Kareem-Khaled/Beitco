"use client"

import { ArrowUp, ArrowDown, MessageCircle, Share2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useState } from 'react'
import { use } from 'react'

const mockThread = {
  id: '1',
  title: 'هل سعر 28,000 جنيه/م² في التجمع الخامس مناسب؟',
  body: 'محتاج رأيكم. لقيت شقة 150م² في كمبوند في التجمع الخامس بسعر 4.2 مليون جنيه (28K/م²). الشقة تشطيب سوبر لوكس، دور 5 من 8، فيو حديقة. هل السعر ده مناسب للسوق دلوقتي؟',
  author: 'أحمد م.',
  category: 'price_check',
  upvotes: 34,
  createdAt: 'منذ ساعتين',
  answers: [
    {
      id: '1',
      author: 'محمد حسن',
      body: 'السعر ده كويس جداً للتجمع الخامس دلوقتي. متوسط الأسعار في الكمبوندات الكويسة بين 25-35K/م². لو التشطيب فعلاً سوبر لوكس والكمبوند نظيف ومُدار كويس، ده سعر عادل.',
      upvotes: 18,
      isExpert: true,
      createdAt: 'منذ ساعة',
    },
    {
      id: '2',
      author: 'سارة أحمد',
      body: 'أنا اشتريت في نفس المنطقة من 6 شهور بـ 25K/م². السعر زاد شوية بس لسه مقبول. الأهم تشوف حالة الكمبوند والصيانة.',
      upvotes: 12,
      isExpert: false,
      createdAt: 'منذ ساعة',
    },
    {
      id: '3',
      author: 'خبير عقاري',
      body: 'نصيحتي تقارن بين 3-4 شقق في نفس المنطقة قبل ما تاخد قرار. 28K مش غالي بس مش رخيص. لو الكمبوند عنده خدمات (نادي، أمن 24 ساعة، صيانة) يبقى مناسب.',
      upvotes: 8,
      isExpert: true,
      createdAt: 'منذ 30 دقيقة',
    },
  ]
}

export default function DiscussionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [newAnswer, setNewAnswer] = useState('')
  const thread = mockThread

  return (
    <div className="min-h-screen pb-20">
      {/* Question */}
      <div className="px-4 py-4 border-b">
        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-700 mb-2 inline-block">سعر عادل؟</span>
        <h1 className="text-lg font-bold leading-snug mb-2">{thread.title}</h1>
        <p className="text-sm text-muted-foreground leading-relaxed mb-3">{thread.body}</p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{thread.author}</span>
          <span>•</span>
          <span>{thread.createdAt}</span>
        </div>
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1">
            <button className="p-1 hover:bg-muted rounded"><ArrowUp className="h-4 w-4" /></button>
            <span className="text-sm font-bold">{thread.upvotes}</span>
            <button className="p-1 hover:bg-muted rounded"><ArrowDown className="h-4 w-4" /></button>
          </div>
          <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <Share2 className="h-3.5 w-3.5" /> مشاركة
          </button>
        </div>
      </div>

      {/* Answers */}
      <div className="px-4 py-3">
        <h2 className="text-sm font-semibold mb-3">{thread.answers.length} إجابة</h2>
        <div className="space-y-4">
          {thread.answers.map(answer => (
            <div key={answer.id} className="p-3 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium">{answer.author}</span>
                {answer.isExpert && (
                  <span className="flex items-center gap-0.5 text-[10px] text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full">
                    <CheckCircle2 className="h-3 w-3" /> خبير
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-2">{answer.body}</p>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <button className="p-0.5 hover:bg-muted rounded"><ArrowUp className="h-3.5 w-3.5" /></button>
                  <span className="text-xs font-bold">{answer.upvotes}</span>
                  <button className="p-0.5 hover:bg-muted rounded"><ArrowDown className="h-3.5 w-3.5" /></button>
                </div>
                <span className="text-[10px] text-muted-foreground">{answer.createdAt}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Write Answer */}
      <div className="px-4 py-4 border-t mt-4">
        <h3 className="text-sm font-semibold mb-2">أضف إجابتك</h3>
        <Textarea
          placeholder="شارك رأيك أو تجربتك..."
          value={newAnswer}
          onChange={(e) => setNewAnswer(e.target.value)}
          rows={3}
        />
        <Button className="mt-2 w-full" size="sm">نشر الإجابة</Button>
      </div>
    </div>
  )
}
