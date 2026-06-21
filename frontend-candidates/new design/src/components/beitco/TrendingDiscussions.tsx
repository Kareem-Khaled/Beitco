import { MessageCircle, TrendingUp, ArrowUpRight } from "lucide-react";
import { SectionHeader } from "./SectionHeader";

const threads = [
  { tag: "Areas", title: "Is New Cairo worth it for a young couple?", replies: 47, views: "3.2k" },
  { tag: "Students", title: "Best housing near AUC under 6,000 EGP?", replies: 31, views: "2.1k" },
  { tag: "Remote work", title: "Which Maadi streets actually have fiber?", replies: 22, views: "1.7k" },
  { tag: "Landlords", title: "Red flags before signing a 1-year lease", replies: 64, views: "5.0k" },
  { tag: "Compounds", title: "Madinaty vs Mountain View — honest take?", replies: 58, views: "4.4k" },
  { tag: "Coliving", title: "Anyone tried bed rentals in Sheikh Zayed?", replies: 18, views: "980" },
];

export function TrendingDiscussions() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <SectionHeader
        eyebrow="Community"
        title="Trending housing discussions"
        description="Real questions from real people deciding where to live. No spam, just signal."
        action="Open community"
      />

      <div className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {threads.map((t) => (
          <button
            key={t.title}
            type="button"
            className="group flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 text-left transition-all hover:border-primary/30 hover:shadow-[var(--shadow-soft)]"
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-trust-soft px-2 py-0.5 text-[11px] font-medium text-primary">
                <TrendingUp className="h-3 w-3" />
                {t.tag}
              </span>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
            </div>
            <h3 className="font-display text-base font-semibold leading-snug text-foreground">
              {t.title}
            </h3>
            <div className="mt-auto flex items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <MessageCircle className="h-3.5 w-3.5" /> {t.replies} replies
              </span>
              <span>{t.views} views</span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
