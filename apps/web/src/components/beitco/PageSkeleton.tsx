import { SiteHeader } from "./SiteHeader";
import { Skeleton } from "@/components/ui/skeleton";

// A generic full-page loading skeleton shown while auth hydrates / data resolves.
// Mirrors the common layout (header + content block) so the transition is smooth.
export function PageSkeleton({ variant = "detail" }: { variant?: "detail" | "list" }) {
  return (
    <div dir="rtl" className="min-h-screen bg-background">
      <SiteHeader />
      <main
        className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8"
        role="status"
        aria-busy="true"
        aria-live="polite"
      >
        <span className="sr-only">بنحمّل المحتوى…</span>
        {variant === "detail" ? (
          <>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="mt-4 h-8 w-2/3" />
            <Skeleton className="mt-2 h-4 w-1/3" />
            <Skeleton className="mt-5 aspect-[16/9] w-full rounded-3xl" />
            <div className="mt-8 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
              <div className="space-y-4">
                <Skeleton className="h-32 w-full rounded-2xl" />
                <Skeleton className="h-24 w-full rounded-2xl" />
                <Skeleton className="h-40 w-full rounded-2xl" />
              </div>
              <Skeleton className="h-72 w-full rounded-3xl" />
            </div>
          </>
        ) : (
          <>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="mt-2 h-4 w-72" />
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-2xl border border-border">
                  <Skeleton className="aspect-[4/3] w-full rounded-none" />
                  <div className="space-y-2 p-4">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-8 w-full rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
