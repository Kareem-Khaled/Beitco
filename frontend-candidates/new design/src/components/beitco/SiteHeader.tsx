import { Link } from "@tanstack/react-router";
import { Search, Menu } from "lucide-react";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";

const nav = [
  { label: "Discover", to: "/" },
  { label: "Areas", to: "/" },
  { label: "Reviews", to: "/" },
  { label: "Community", to: "/" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <Logo className="h-7 w-7" />
          <span className="font-display text-lg font-semibold tracking-tight">Beitco</span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {nav.map((n) => (
            <Link
              key={n.label}
              to={n.to}
              className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            className="hidden items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-foreground/20 sm:flex"
          >
            <Search className="h-4 w-4" />
            <span>Search area, compound…</span>
          </button>
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
            Sign in
          </Button>
          <Button size="sm" className="rounded-full">List a property</Button>
          <button type="button" className="rounded-md p-2 md:hidden" aria-label="Menu">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
