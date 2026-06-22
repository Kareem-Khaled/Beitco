import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Home, ListChecks, Inbox, Star, Plus, ShieldCheck, ShieldAlert } from "lucide-react";
import { useAuth } from "@/lib/beitco/auth";
import { getVerificationStatus, isPlatformAdmin } from "@/lib/beitco/store";
import { useModerationCount } from "@/lib/beitco/queries";
import { SiteHeader } from "@/components/beitco/SiteHeader";
import { SiteFooter } from "@/components/beitco/SiteFooter";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
});

const items: { to: "/dashboard" | "/dashboard/listings" | "/dashboard/leads" | "/dashboard/reviews" | "/dashboard/verify"; label: string; icon: typeof Home; exact?: boolean }[] = [
  { to: "/dashboard", label: "نظرة عامة", icon: Home, exact: true },
  { to: "/dashboard/listings", label: "شققي", icon: ListChecks },
  { to: "/dashboard/leads", label: "طلبات المعاينة", icon: Inbox },
  { to: "/dashboard/reviews", label: "آراء الناس", icon: Star },
  { to: "/dashboard/verify", label: "التوثيق", icon: ShieldCheck },
];

function DashboardLayout() {
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
            <div className="mb-2 px-2 pt-1">
              <p className="text-xs text-muted-foreground">أهلاً</p>
              <p className="font-display text-base font-semibold">{user.name}</p>
            </div>
            <nav className="flex flex-col gap-1">
              {items.map((it) => {
                const active = it.exact
                  ? location.pathname === it.to
                  : location.pathname.startsWith(it.to);
                const Icon = it.icon;
                const vstatus = it.to === "/dashboard/verify" ? getVerificationStatus(user) : null;
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
                    {vstatus === "verified" ? (
                      <span className="ms-auto rounded-full bg-trust px-1.5 py-0.5 text-[10px] font-medium text-trust-foreground">
                        موثّق
                      </span>
                    ) : vstatus === "pending" ? (
                      <span className="ms-auto rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-600">
                        بيتراجع
                      </span>
                    ) : vstatus === "unverified" ? (
                      <span className="ms-auto h-2 w-2 rounded-full bg-amber-500" />
                    ) : null}
                  </Link>
                );
              })}

              {/* Admin-only: moderation queue */}
              {isPlatformAdmin(user) && <ModerationNavLink />}
            </nav>
            <div className="mt-3 border-t border-border pt-3">
              <Button asChild className="w-full">
                <Link to="/list/new">
                  <Plus className="me-1 h-4 w-4" />
                  حط شقة جديدة
                </Link>
              </Button>
            </div>
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

// Admin-only nav link to the moderation queue, with a pending-count badge.
function ModerationNavLink() {
  const location = useLocation();
  const active = location.pathname.startsWith("/dashboard/moderation");
  const { data: pending = 0 } = useModerationCount();
  return (
    <Link
      to="/dashboard/moderation"
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
        active
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      <ShieldAlert className="h-4 w-4" />
      <span>مراجعة الإعلانات</span>
      {pending > 0 ? (
        <span className="ms-auto rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
          {pending.toLocaleString("ar-EG-u-nu-latn")}
        </span>
      ) : null}
    </Link>
  );
}
