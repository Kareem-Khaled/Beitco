import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  LayoutDashboard,
  ShieldAlert,
  ScanFace,
  ArrowRight,
  Building2,
  Users,
  Home,
  Flag,
} from "lucide-react";
import { useAuth } from "@/lib/beitco/auth";
import { isPlatformAdmin } from "@/lib/beitco/store";
import { useModerationCount, useVerificationCount, useReportsCount } from "@/lib/beitco/queries";

// ADMIN-1: the platform-operator portal (Beitco staff only). Separate from the
// landlord dashboard at /dashboard. Bounces anyone without isAdmin.
export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      navigate({ to: "/auth/login" });
    } else if (!isPlatformAdmin(user)) {
      navigate({ to: "/" });
    }
  }, [user, isLoading, navigate]);

  if (isLoading || !user || !isPlatformAdmin(user)) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        لحظة…
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-muted/30 text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Building2 className="h-4 w-4" />
            </span>
            <div>
              <p className="font-display text-sm font-semibold leading-tight">
                بيتكو · لوحة الإدارة
              </p>
              <p className="text-[11px] text-muted-foreground">للفريق بس</p>
            </div>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            رجوع للموقع
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[230px_1fr] lg:px-8">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <nav className="flex flex-col gap-1 rounded-2xl border border-border bg-card p-3">
            <AdminNavLink to="/admin" label="نظرة عامة" icon={LayoutDashboard} exact />
            <AdminNavLink to="/admin/users" label="المستخدمين" icon={Users} />
            <AdminNavLink to="/admin/listings" label="الإعلانات" icon={Home} />
            <AdminNavLink to="/admin/reports" label="البلاغات" icon={Flag} badgeHook="reports" />
            <AdminNavLink
              to="/dashboard/moderation"
              label="مراجعة الإعلانات"
              icon={ShieldAlert}
              badgeHook="moderation"
            />
            <AdminNavLink
              to="/dashboard/verifications"
              label="توثيق الحسابات"
              icon={ScanFace}
              badgeHook="verification"
            />
          </nav>
        </aside>

        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function AdminNavLink({
  to,
  label,
  icon: Icon,
  exact,
  badgeHook,
}: {
  to:
    | "/admin"
    | "/admin/users"
    | "/admin/listings"
    | "/admin/reports"
    | "/dashboard/moderation"
    | "/dashboard/verifications";
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  badgeHook?: "moderation" | "verification" | "reports";
}) {
  const location = useLocation();
  const active = exact ? location.pathname === to : location.pathname.startsWith(to);
  return (
    <Link
      to={to}
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
        active
          ? "bg-primary/10 font-medium text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
      {badgeHook ? <NavBadge hook={badgeHook} /> : null}
    </Link>
  );
}

function NavBadge({ hook }: { hook: "moderation" | "verification" | "reports" }) {
  const moderation = useModerationCount();
  const verification = useVerificationCount(true);
  const reports = useReportsCount();
  const count =
    hook === "moderation"
      ? (moderation.data ?? 0)
      : hook === "verification"
        ? (verification.data ?? 0)
        : (reports.data ?? 0);
  if (!count) return null;
  return (
    <span className="ms-auto rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
      {count.toLocaleString("ar-EG-u-nu-latn")}
    </span>
  );
}
