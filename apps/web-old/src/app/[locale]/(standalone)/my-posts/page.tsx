"use client"

import { useState } from 'react'
import { useRouter } from '@/i18n/routing'
import { Link } from '@/i18n/routing'
import { ArrowRight, Clock, CheckCircle, XCircle, Eye, Heart, MessageCircle, Edit, Trash2, RefreshCw, Sparkles, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { mockApprovalPosts } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

const tabs = [
  { id: 'all', label: 'الكل' },
  { id: 'pending', label: 'قيد المراجعة' },
  { id: 'approved', label: 'منشور' },
  { id: 'rejected', label: 'مرفوض' },
]

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending':
      return <Clock className="w-4 h-4 text-accent" />
    case 'approved':
      return <CheckCircle className="w-4 h-4 text-success" />
    case 'rejected':
      return <XCircle className="w-4 h-4 text-destructive" />
    default:
      return null
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'pending':
      return 'قيد المراجعة'
    case 'approved':
      return 'منشور'
    case 'rejected':
      return 'مرفوض'
    default:
      return status
  }
}

export default function MyPostsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('all')

  const filteredPosts = activeTab === 'all' 
    ? mockApprovalPosts 
    : mockApprovalPosts.filter(p => p.status === activeTab)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center h-14 px-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowRight className="w-5 h-5" />
          </Button>
          <h1 className="flex-1 font-semibold text-foreground text-center">منشوراتي</h1>
          <div className="w-10" />
        </div>
      </header>

      {/* Tabs */}
      <div className="sticky top-14 z-30 bg-background border-b border-border px-4 overflow-x-auto scrollbar-hide">
        <div className="flex gap-1 min-w-max py-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-full transition-colors flex items-center gap-1.5",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-surface"
              )}
            >
              {tab.id === 'pending' && <Clock className="w-3.5 h-3.5" />}
              {tab.id === 'approved' && <CheckCircle className="w-3.5 h-3.5" />}
              {tab.id === 'rejected' && <XCircle className="w-3.5 h-3.5" />}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Posts list */}
      <div className="p-4 space-y-4">
        {filteredPosts.map((post) => (
          <div
            key={post.id}
            className={cn(
              "p-4 rounded-xl border",
              post.status === 'pending' && "bg-accent-light border-accent/20",
              post.status === 'approved' && "bg-success-light border-success/20",
              post.status === 'rejected' && "bg-destructive-light border-destructive/20",
            )}
          >
            {/* Status badge */}
            <div className="flex items-center gap-2 mb-3">
              {getStatusIcon(post.status)}
              <span className={cn(
                "text-sm font-medium",
                post.status === 'pending' && "text-accent",
                post.status === 'approved' && "text-success",
                post.status === 'rejected' && "text-destructive",
              )}>
                {getStatusLabel(post.status)}
              </span>
            </div>

            {/* Title & content preview */}
            <h3 className="font-medium text-foreground mb-1">{post.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{post.content}</p>

            {/* Metadata */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
              <span>تم الإرسال: {post.submittedAt}</span>
              {post.publishedAt && <span>تم النشر: {post.publishedAt}</span>}
            </div>

            {/* Engagement stats (approved only) */}
            {post.status === 'approved' && post.engagementStats && (
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3 py-2 px-3 rounded-md bg-background/50">
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{post.engagementStats.views}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  <span>{post.engagementStats.likes}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="w-4 h-4" />
                  <span>{post.engagementStats.comments}</span>
                </div>
              </div>
            )}

            {/* Rejection reason */}
            {post.status === 'rejected' && post.rejectionReason && (
              <div className="p-3 rounded-md bg-destructive/10 mb-3">
                <p className="text-sm text-destructive font-medium mb-1">سبب الرفض:</p>
                <p className="text-sm text-foreground">{post.rejectionReason}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              {post.status === 'pending' && (
                <>
                  <Button variant="outline" size="sm" className="flex-1 gap-1.5">
                    <Edit className="w-4 h-4" />
                    <span>تعديل</span>
                  </Button>
                  <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              )}
              {post.status === 'approved' && (
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Eye className="w-4 h-4" />
                  <span>عرض المنشور</span>
                </Button>
              )}
              {post.status === 'rejected' && (
                <Button variant="outline" size="sm" className="flex-1 gap-1.5">
                  <RefreshCw className="w-4 h-4" />
                  <span>تعديل وإعادة إرسال</span>
                </Button>
              )}
            </div>
          </div>
        ))}

        {filteredPosts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-foreground mb-1">لا توجد منشورات</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              لم ترسل أي منشورات للمراجعة بعد
            </p>
            <Button asChild>
              <Link href="/create">أنشئ منشورك الأول</Link>
            </Button>
          </div>
        )}
      </div>

      {/* Bottom banner */}
      <div className="fixed bottom-0 inset-x-0 bg-accent-light border-t border-accent/20 px-4 py-3 safe-area-bottom">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-accent flex-shrink-0" />
          <p className="flex-1 text-sm text-foreground">
            تحقق لتنشر بدون موافقة!
          </p>
          <Button size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground gap-1">
            <span>تحقق الآن</span>
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
