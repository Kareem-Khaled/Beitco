import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { User as UserIcon, Heart, Inbox, KeyRound, Sparkles, SlidersHorizontal, Settings } from "lucide-react";
import { useAuth } from "@/lib/beitco/auth";
import { SiteHeader } from "@/components/beitco/SiteHeader";
import { SiteFooter } from "@/components/beitco/SiteFooter";

export const Route = createFileRoute("/me")({
  component: MeLayout,
});

const items: {
  to: "/me" | "/me/matches" | "/me/preferences" | "/me/saved" | "/me/applications" | "/me/tenancies" | "/me/settings";
  label: string;
  icon: typeof UserIcon;
  exact?: boolean;
}[] = [
  { to: "/me", label: "نظرة عامة", icon: UserIcon, exact: true },
  { to: "/me/matches", label: "اللي يناسبك", icon: Sparkles },
  { to: "/me/preferences", label: "تفضيلاتي", icon: SlidersHorizontal },
  { to: "/me/saved", label: "المحفوظات", icon: Heart },
  { to: "/me/applications", label: "طلبات المعاينة", icon: Inbox },
  { to: "/me/tenancies", label: "سكني", icon: KeyRound },
  { to: "/me/settings", label: "الإعدادات", icon: Settings },
];

function MeLayout() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate({ to: "/auth/login" });
    }
  }, [user, isLoading, navigate]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        لحظة…
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[240px_1fr] lg:px-8">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-2xl border border-border bg-card p-3">
            <div className="mb-2 flex items-center gap-3 px-2 pt-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-trust text-sm font-semibold text-trust-foreground">
                {initials(user.name)}
              </div>
              <div className="min-w-0">
                <p className="truncate font-display text-sm font-semibold">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground" dir="ltr">
                  {user.phone}
                </p>
              </div>
            </div>
            <nav className="mt-2 flex flex-col gap-1">
              {items.map((it) => {
                const active = it.exact
                  ? location.pathname === it.to
                  : location.pathname.startsWith(it.to);
                const Icon = it.icon;
                return (
                  <Link
                    key={it.to}
                    to={it.to}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                      active
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{it.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
      <SiteFooter />
    </div>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2);
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
