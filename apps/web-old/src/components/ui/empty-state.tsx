'use client';

import { Inbox, Search, MessageCircle, Heart, Users, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/routing';

type EmptyVariant = 'posts' | 'listings' | 'chat' | 'notifications' | 'saved' | 'search' | 'groups' | 'generic';

interface EmptyStateProps {
  variant?: EmptyVariant;
  title?: string;
  message?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

const VARIANT_CONFIG: Record<EmptyVariant, { icon: typeof Inbox; title: string; message: string }> = {
  posts: {
    icon: Home,
    title: 'لا توجد منشورات',
    message: 'تابع أشخاصًا لرؤية منشوراتهم هنا',
  },
  listings: {
    icon: Search,
    title: 'لا توجد عقارات',
    message: 'جرب تغيير الفلاتر للعثور على نتائج',
  },
  chat: {
    icon: MessageCircle,
    title: 'لا توجد محادثات',
    message: 'ابدأ محادثة مع وكيل عقاري أو مستخدم آخر',
  },
  notifications: {
    icon: Inbox,
    title: 'لا توجد إشعارات',
    message: 'ستظهر هنا إشعاراتك عند وصولها',
  },
  saved: {
    icon: Heart,
    title: 'لا توجد عناصر محفوظة',
    message: 'احفظ المنشورات والعقارات للرجوع إليها لاحقًا',
  },
  search: {
    icon: Search,
    title: 'لا توجد نتائج',
    message: 'جرب كلمات بحث مختلفة',
  },
  groups: {
    icon: Users,
    title: 'لا توجد مجموعات',
    message: 'انضم إلى مجموعات لتتواصل مع مجتمعك',
  },
  generic: {
    icon: Inbox,
    title: 'لا يوجد محتوى',
    message: 'لا يوجد شيء لعرضه هنا حاليًا',
  },
};

export function EmptyState({
  variant = 'generic',
  title,
  message,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  const config = VARIANT_CONFIG[variant];
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">{title ?? config.title}</h3>
        <p className="text-sm text-muted-foreground">{message ?? config.message}</p>
      </div>
      {actionLabel && actionHref && (
        <Button asChild variant="outline" size="sm">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      )}
      {actionLabel && onAction && !actionHref && (
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
