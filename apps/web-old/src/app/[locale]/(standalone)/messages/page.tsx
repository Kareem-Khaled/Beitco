"use client"

import Image from 'next/image'
import { Search, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Link } from '@/i18n/routing'

const conversations = [
  {
    id: 'c1',
    name: 'أحمد محمد',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    lastMessage: 'تمام، السرير متاح من يوم 15. تقدر تيجي تشوف المكان',
    time: 'منذ 5 د',
    unread: 2,
    listingTitle: 'سرير في التجمع الخامس',
    verified: true,
  },
  {
    id: 'c2',
    name: 'عمر خالد',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
    lastMessage: 'هل السرير لسه متاح؟',
    time: 'منذ 3 س',
    unread: 0,
    listingTitle: 'سرير في مدينة نصر',
    verified: false,
  },
  {
    id: 'c3',
    name: 'سامي علي',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    lastMessage: 'شكراً جداً. التجربة كانت ممتازة 👍',
    time: 'أمس',
    unread: 0,
    listingTitle: 'غرفة في الشيخ زايد',
    verified: true,
  },
  {
    id: 'c4',
    name: 'يوسف إبراهيم',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face',
    lastMessage: 'المكان بعيد عن المترو شوية بس الباص قريب',
    time: 'منذ 3 أيام',
    unread: 0,
    listingTitle: null,
    verified: false,
  },
]

export default function MessagesPage() {
  const totalUnread = conversations.reduce((sum, c) => sum + c.unread, 0)

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background border-b px-4 py-3">
        <h1 className="font-bold text-lg mb-3">الرسائل</h1>
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="ابحث في المحادثات..." className="pr-10 h-9 rounded-xl text-xs" />
        </div>
      </div>

      {/* Conversations */}
      <div className="divide-y">
        {conversations.map(convo => (
          <Link
            key={convo.id}
            href={`/messages/${convo.id}`}
            className={cn("flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors")}
          >
            <div className="relative shrink-0">
              <Image src={convo.avatar} alt={convo.name} width={48} height={48} className="rounded-full object-cover" unoptimized />
              {convo.verified && (
                <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-background flex items-center justify-center">
                  <span className="text-[8px] text-white">✓</span>
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className={cn("text-sm", convo.unread > 0 ? "font-bold" : "font-medium")}>{convo.name}</p>
                <span className="text-[9px] text-muted-foreground">{convo.time}</span>
              </div>
              {convo.listingTitle && (
                <p className="text-[9px] text-primary truncate">🏠 {convo.listingTitle}</p>
              )}
              <p className={cn("text-[11px] truncate mt-0.5", convo.unread > 0 ? "text-foreground font-medium" : "text-muted-foreground")}>
                {convo.lastMessage}
              </p>
            </div>
            {convo.unread > 0 && (
              <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
                {convo.unread}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}
