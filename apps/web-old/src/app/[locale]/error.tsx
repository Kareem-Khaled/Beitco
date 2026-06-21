'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/ui/error-state';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to error reporting service
    console.error('Unhandled error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <ErrorState
        title="حدث خطأ غير متوقع"
        message={error.message || 'يرجى المحاولة مرة أخرى'}
        onRetry={reset}
      />
    </div>
  );
}
