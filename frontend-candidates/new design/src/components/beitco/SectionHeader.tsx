import { ArrowRight } from "lucide-react";

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: string;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow && (
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">
            {eyebrow}
          </div>
        )}
        <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h2>
        {description && (
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">{description}</p>
        )}
      </div>
      {action && (
        <button
          type="button"
          className="inline-flex items-center gap-1 self-start text-sm font-medium text-primary hover:underline"
        >
          {action} <ArrowRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
