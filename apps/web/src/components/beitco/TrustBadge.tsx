import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function TrustBadge({ score, className }: { score: number; className?: string }) {
  const tone =
    score >= 8.5 ? "bg-trust text-trust-foreground" :
    score >= 7 ? "bg-accent text-accent-foreground" :
    "bg-muted text-muted-foreground";
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold", tone, className)}>
      <ShieldCheck className="h-3 w-3" />
      {score.toFixed(1)}
    </span>
  );
}
