import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

type FooterLink = { label: string; to?: string; href?: string };

const groups: { title: string; items: FooterLink[] }[] = [
  {
    title: "الثقة",
    items: [
      { label: "إزاي بتشتغل الثقة", to: "/trust" },
      { label: "مركز المساعدة", to: "/help" },
    ],
  },
  {
    title: "بيتكو",
    items: [
      { label: "عن بيتكو", to: "/about" },
      { label: "حط شقتك", to: "/list/new" },
      { label: "حسابي", to: "/me" },
    ],
  },
  {
    title: "قانوني",
    items: [
      { label: "سياسة الخصوصية", to: "/privacy" },
      { label: "الشروط والأحكام", to: "/terms" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface-elevated">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.6fr_repeat(3,1fr)] lg:px-8">
        <div>
          <div className="flex items-center gap-2">
            <Logo className="h-7 w-7" />
            <span className="font-display text-lg font-semibold">بيتكو</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            منصة السكن اللي تقدر تثق فيها في مصر. خد قرارك وانت مرتاح.
          </p>
        </div>
        {groups.map((g) => (
          <div key={g.title}>
            <div className="text-sm font-semibold text-foreground">{g.title}</div>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {g.items.map((i) => (
                <li key={i.label}>
                  {i.to ? (
                    <Link to={i.to} className="hover:text-foreground">
                      {i.label}
                    </Link>
                  ) : (
                    <a href={i.href ?? "#"} className="hover:text-foreground">
                      {i.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <span>© {new Date().getFullYear()} بيتكو. اتعملت عشان السكن في مصر.</span>
          <span>متعمّلة بحب من القاهرة · إسكندرية</span>
        </div>
      </div>
    </footer>
  );
}
