import { Logo } from "./Logo";

const groups = [
  { title: "Discover", items: ["Apartments", "Rooms", "Beds", "Areas", "Compounds"] },
  { title: "Trust", items: ["How trust works", "Verification", "Report listing", "Safety"] },
  { title: "Community", items: ["Discussions", "Reviews", "Ask a question", "Guides"] },
  { title: "Company", items: ["About Beitco", "Careers", "Press", "Contact"] },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface-elevated">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.4fr_repeat(4,1fr)] lg:px-8">
        <div>
          <div className="flex items-center gap-2">
            <Logo className="h-7 w-7" />
            <span className="font-display text-lg font-semibold">Beitco</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            The trusted housing platform for Egypt. Make confident decisions about where you live.
          </p>
        </div>
        {groups.map((g) => (
          <div key={g.title}>
            <div className="text-sm font-semibold text-foreground">{g.title}</div>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {g.items.map((i) => (
                <li key={i}>
                  <a href="#" className="hover:text-foreground">{i}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <span>© {new Date().getFullYear()} Beitco. Built for Egyptian housing.</span>
          <span>Made with care in Cairo · Alexandria</span>
        </div>
      </div>
    </footer>
  );
}
