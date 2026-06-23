import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

// A friendly, consistent empty state: an icon in a soft tinted circle, a title,
// an optional hint, and an optional action. Replaces the plain dashed text
// boxes scattered across the app so "nothing here yet" still feels designed.
export function EmptyState({
  icon: Icon,
  title,
  hint,
  action,
  className = "",
  compact = false,
}: {
  icon: LucideIcon;
  title: string;
  hint?: string;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface text-center ${
        compact ? "p-6" : "p-10 sm:p-12"
      } ${className}`}
    >
      <span
        className={`relative mb-4 inline-flex items-center justify-center rounded-2xl bg-trust-soft text-trust ${
          compact ? "h-12 w-12" : "h-16 w-16"
        }`}
      >
        {/* soft glow */}
        <span className="absolute inset-0 rounded-2xl bg-trust/10 blur-md" aria-hidden="true" />
        <Icon className={compact ? "h-6 w-6" : "h-8 w-8"} />
      </span>
      <h3 className={`font-display font-semibold ${compact ? "text-base" : "text-lg"}`}>{title}</h3>
      {hint ? <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{hint}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
