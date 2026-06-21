"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Heart, MessageCircle, UserPlus, Home, TrendingDown, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { mockNotifications } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import type { Notification } from '@/lib/types'

const tabs = [
  { id: 'all', label: 'الكل' },
  { id: 'social', label: 'اجتماعي' },
  { id: 'listings', label: 'عقارات' },
  { id: 'approvals', label: 'موافقات' },
]

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'like':
      return <Heart className="w-4 h-4 text-destructive" />
    case 'comment':
      return <MessageCircle className="w-4 h-4 text-primary" />
    case 'follow':
      return <UserPlus className="w-4 h-4 text-success" />
    case 'listing_match':
      return <Home className="w-4 h-4 text-primary" />
    case 'price_drop':
      return <TrendingDown className="w-4 h-4 text-success" />
    case 'approval':
      return <CheckCircle className="w-4 h-4 text-accent" />
    default:
      return null
  }
}

function NotificationItem({ notification }: { notification: Notification }) {
  return (
    <Link
      href="#"
      className={cn(
        "flex items-start gap-3 p-4 hover:bg-surface transition-colors",
        !notification.isRead && "bg-primary-light/30"
      )}
    >
      {/* Avatar stack or single avatar */}
      <div className="relative flex-shrink-0">
        {notification.users && notification.users.length > 1 ? (
          <div className="relative w-12 h-12">
            <Avatar className="w-8 h-8 absolute top-0 start-0 border-2 border-background">
              <AvatarImage src={notification.users[0].avatar} alt={notification.users[0].name} />
              <AvatarFallback>{notification.users[0].name[0]}</AvatarFallback>
            </Avatar>
            <Avatar className="w-8 h-8 absolute bottom-0 end-0 border-2 border-background">
              <AvatarImage src={notification.users[1].avatar} alt={notification.users[1].name} />
              <AvatarFallback>{notification.users[1].name[0]}</AvatarFallback>
            </Avatar>
          </div>
        ) : notification.users?.[0] ? (
          <Avatar className="w-12 h-12">
            <AvatarImage src={notification.users[0].avatar} alt={notification.users[0].name} />
            <AvatarFallback>{notification.users[0].name[0]}</AvatarFallback>
          </Avatar>
        ) : (
          <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center">
            {getNotificationIcon(notification.type)}
          </div>
        )}
        {/* Unread dot */}
        {!notification.isRead && (
          <span className="absolute -top-0.5 -start-0.5 w-3 h-3 bg-success rounded-full border-2 border-background" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm leading-relaxed",
          notification.isRead ? "text-muted-foreground" : "text-foreground"
        )}>
          {notification.message}
        </p>
        <p className="text-xs text-muted-foreground mt-1">{notification.createdAt}</p>
      </div>

      {/* Icon indicator */}
      <div className="flex-shrink-0 mt-1">
        {getNotificationIcon(notification.type)}
      </div>
    </Link>
  )
}

export default function NotificationsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('all')

  const filteredNotifications = mockNotifications.filter((n) => {
    if (activeTab === 'all') return true
    if (activeTab === 'social') return ['like', 'comment', 'follow'].includes(n.type)
    if (activeTab === 'listings') return ['listing_match', 'price_drop'].includes(n.type)
    if (activeTab === 'approvals') return n.type === 'approval'
    return true
  })

  const todayNotifications = filteredNotifications.filter(n => 
    n.createdAt.includes('دقيقة') || n.createdAt.includes('ساعة')
  )
  const earlierNotifications = filteredNotifications.filter(n => 
    !n.createdAt.includes('دقيقة') && !n.createdAt.includes('ساعة')
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center h-14 px-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowRight className="w-5 h-5" />
          </Button>
          <h1 className="flex-1 font-semibold text-foreground text-center">الإشعارات</h1>
          <div className="w-10" /> {/* Spacer for centering */}
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
                "px-4 py-2 text-sm font-medium rounded-full transition-colors",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-surface"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications list */}
      <div className="divide-y divide-border">
        {todayNotifications.length > 0 && (
          <div>
            <h2 className="px-4 py-2 text-sm font-medium text-muted-foreground bg-surface">
              اليوم
            </h2>
            {todayNotifications.map((notification) => (
              <NotificationItem key={notification.id} notification={notification} />
            ))}
          </div>
        )}

        {earlierNotifications.length > 0 && (
          <div>
            <h2 className="px-4 py-2 text-sm font-medium text-muted-foreground bg-surface">
              سابقاً
            </h2>
            {earlierNotifications.map((notification) => (
              <NotificationItem key={notification.id} notification={notification} />
            ))}
          </div>
        )}

        {filteredNotifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mb-4">
              <MessageCircle className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-foreground mb-1">لا توجد إشعارات</h3>
            <p className="text-sm text-muted-foreground text-center">
              ستظهر هنا الإشعارات الجديدة
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
