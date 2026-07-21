// Circular match-score badge  -  shows how well a listing fits the renter.
export function MatchBadge({ score, size = "md" }: { score: number; size?: "sm" | "md" }) {
  const tone =
    score >= 80
      ? { ring: "text-emerald-500", text: "text-emerald-600 dark:text-emerald-400" }
      : score >= 55
        ? { ring: "text-trust", text: "text-trust" }
        : score >= 30
          ? { ring: "text-amber-500", text: "text-amber-600 dark:text-amber-400" }
          : { ring: "text-muted-foreground", text: "text-muted-foreground" };

  const dim = size === "sm" ? 36 : 48;
  const stroke = size === "sm" ? 3 : 4;
  const r = (dim - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.max(0, Math.min(100, score)) / 100);

  return (
    <div
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: dim, height: dim }}
      title={`نسبة التطابق ${score}%`}
    >
      <svg width={dim} height={dim} className="-rotate-90">
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="text-muted/30"
          stroke="currentColor"
        />
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className={tone.ring}
          stroke="currentColor"
        />
      </svg>
      <span
        className={`absolute font-display font-bold tabular-nums ${tone.text} ${
          size === "sm" ? "text-[10px]" : "text-xs"
        }`}
      >
        {score}
      </span>
    </div>
  );
}
