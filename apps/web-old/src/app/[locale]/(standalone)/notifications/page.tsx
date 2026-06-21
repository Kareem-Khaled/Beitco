"use client"

import { CheckCheck, MessageCircle, Star, Shield, BedDouble } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Link } from '@/i18n/routing'

const notifications = [
  { id: '1', type: 'message', title: 'رسالة جديدة من أحمد محمد', subtitle: 'بخصوص السرير المتاح في التجمع الخامس', time: 'منذ 5 دقائق', read: false, href: '/messages/c1' },
  { id: '2', type: 'listing', title: 'تم قبول إعلانك', subtitle: '"سرير متاح — التجمع الخامس" أصبح نشطاً', time: 'منذ ساعة', read: false, href: '/shared/1' },
  { id: '3', type: 'review', title: 'تقييم جديد لإعلانك', subtitle: 'محمد أحمد أضاف تقييم ⭐⭐⭐⭐⭐', time: 'منذ 3 ساعات', read: true, href: '/landlords/l1' },
  { id: '4', type: 'trust', title: 'تم توثيق حسابك!', subtitle: 'أصبحت مالك موثّق — إعلاناتك ستظهر أولاً', time: 'منذ يوم', read: true, href: '/profile' },
  { id: '5', type: 'listing', title: 'إعلان قريب منك', subtitle: 'غرفة خاصة في المعادي — 3,500 جنيه/شهر', time: 'منذ يومين', read: true, href: '/shared/2' },
  { id: '6', type: 'message', title: 'رسالة من عمر خالد', subtitle: 'هل السرير لسه متاح؟', time: 'منذ 3 أيام', read: true, href: '/messages/c2' },
]

const iconMap = {
  message: <MessageCircle className="h-4 w-4 text-blue-600" />,
  listing: <BedDouble className="h-4 w-4 text-purple-600" />,
  review: <Star className="h-4 w-4 text-amber-600" />,
  trust: <Shield className="h-4 w-4 text-emerald-600" />,
}

const bgMap = {
  message: 'bg-blue-100 dark:bg-blue-950/30',
  listing: 'bg-purple-100 dark:bg-purple-950/30',
  review: 'bg-amber-100 dark:bg-amber-950/30',
  trust: 'bg-emerald-100 dark:bg-emerald-950/30',
}

export default function NotificationsPage() {
  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background border-b px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-lg">الإشعارات</h1>
          {unreadCount > 0 && (
            <p className="text-[10px] text-muted-foreground">{unreadCount} غير مقروءة</p>
          )}
        </div>
        <button className="text-xs text-primary font-medium flex items-center gap-1">
          <CheckCheck className="h-3.5 w-3.5" /> قراءة الكل
        </button>
      </div>

      {/* Notification List */}
      <div className="divide-y">
        {notifications.map(notification => (
          <Link
            key={notification.id}
            href={notification.href}
            className={cn(
              "flex items-start gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors",
              !notification.read && "bg-primary/5"
            )}
          >
            <div className={cn("w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5", bgMap[notification.type as keyof typeof bgMap])}>
              {iconMap[notification.type as keyof typeof iconMap]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className={cn("text-xs leading-relaxed", !notification.read && "font-semibold")}>{notification.title}</p>
                {!notification.read && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{notification.subtitle}</p>
              <p className="text-[9px] text-muted-foreground mt-1">{notification.time}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
