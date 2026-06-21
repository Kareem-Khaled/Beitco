export default function SkeletonCard() {
  return (
    <div className="bg-card rounded-card shadow-card p-4 animate-pulse-soft">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-muted" />
        <div className="flex-1">
          <div className="h-4 w-24 bg-muted rounded mb-1.5" />
          <div className="h-3 w-16 bg-muted rounded" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-4 bg-muted rounded w-3/4" />
      </div>
      <div className="mt-3 h-48 bg-muted rounded-lg" />
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
        <div className="h-5 w-12 bg-muted rounded" />
        <div className="h-5 w-12 bg-muted rounded" />
        <div className="h-5 w-12 bg-muted rounded" />
      </div>
    </div>
  );
}
