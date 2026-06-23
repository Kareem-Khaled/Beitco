import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Search, Plus, MessageCircle, User as UserIcon } from "lucide-react";
import { useAuth } from "@/lib/beitco/auth";
import { useThreads } from "@/lib/beitco/queries";

// Mobile-only bottom tab bar — the expected navigation pattern for a phone-first
// Egyptian marketplace (and for the Capacitor shell later). Hidden on md+, where
// the SiteHeader carries navigation. The center "حط شقتك" is the brand's
// signature CTA, raised as a FAB.
export function BottomNav() {
  const { user } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: threads = [] } = useThreads(user?.id);

  const unread = user
    ? threads.filter((t) => t.unreadFor === user.id).length
    : 0;

  const isActive = (to: string) =>
    to === "/" ? pathname === "/" : pathname.startsWith(to);

  return (
    <nav
      dir="rtl"
      aria-label="التنقل السريع"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-xl md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto grid max-w-md grid-cols-5 items-end px-2 pt-1.5">
        <Tab to="/" label="الرئيسية" icon={Home} active={isActive("/")} />
        <Tab to="/search" label="دوّر" icon={Search} active={isActive("/search")} />

        {/* Center CTA — raised */}
        <Link
          to="/list/new"
          aria-label="حط شقتك"
          className="relative -top-3 mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-transform active:scale-95"
        >
          <Plus className="h-6 w-6" />
        </Link>

        <Tab
          to="/messages"
          label="رسايل"
          icon={MessageCircle}
          active={isActive("/messages")}
          badge={unread}
        />
        <Tab to="/me" label="حسابي" icon={UserIcon} active={isActive("/me")} />
      </div>
    </nav>
  );
}

function Tab({
  to,
  label,
  icon: Icon,
  active,
  badge = 0,
}: {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  badge?: number;
}) {
  return (
    <Link
      to={to}
      aria-current={active ? "page" : undefined}
      className={`relative flex flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[10px] font-medium transition-colors ${
        active ? "text-primary" : "text-muted-foreground"
      }`}
    >
      <span className="relative">
        <Icon className="h-5 w-5" />
        {badge > 0 && (
          <span className="absolute -end-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-semibold text-primary-foreground">
            {badge > 9 ? "9+" : badge.toLocaleString("ar-EG-u-nu-latn")}
          </span>
        )}
      </span>
      {label}
    </Link>
  );
}
