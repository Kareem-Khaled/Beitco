'use client';

import { AlertCircle, RefreshCw, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  variant?: 'default' | 'network' | 'not-found';
}

export function ErrorState({
  title,
  message,
  onRetry,
  variant = 'default',
}: ErrorStateProps) {
  const Icon = variant === 'network' ? WifiOff : AlertCircle;
  const defaultTitle = variant === 'network'
    ? 'لا يوجد اتصال'
    : variant === 'not-found'
      ? 'غير موجود'
      : 'حدث خطأ';
  const defaultMessage = variant === 'network'
    ? 'تحقق من اتصالك بالإنترنت وحاول مرة أخرى'
    : variant === 'not-found'
      ? 'المحتوى الذي تبحث عنه غير موجود'
      : 'حدث خطأ غير متوقع. حاول مرة أخرى';

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <Icon className="h-8 w-8 text-destructive" />
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">{title ?? defaultTitle}</h3>
        <p className="text-sm text-muted-foreground">{message ?? defaultMessage}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          إعادة المحاولة
        </Button>
      )}
    </div>
  );
}
