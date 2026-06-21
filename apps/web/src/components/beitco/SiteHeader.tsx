import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Search,
  Menu,
  Home,
  LayoutDashboard,
  User as UserIcon,
  Heart,
  MessageCircle,
  Bell,
  Plus,
  ShieldCheck,
  HelpCircle,
  LogIn,
  LogOut,
} from "lucide-react";
import { Logo } from "./Logo";
import { UserMenu } from "./UserMenu";
import { useAuth } from "@/lib/beitco/auth";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const nav = [{ label: "اكتشف", to: "/" as const }];

export function SiteHeader() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const isOwner = user?.role === "owner" || user?.role === "both";

  const go = (to: string) => {
    setMenuOpen(false);
    navigate({ to });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <Logo className="h-7 w-7" />
          <span className="font-display text-lg font-semibold tracking-tight">بيتكو</span>
        </Link>

        <nav className="ms-4 hidden items-center gap-1 md:flex">
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

        <div className="ms-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate({ to: "/search" })}
            className="hidden items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-foreground/20 sm:flex"
          >
            <Search className="h-4 w-4" />
            <span>دوّر على منطقة أو كومباوند…</span>
          </button>
          <UserMenu />

          {/* Mobile menu */}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <button type="button" className="rounded-md p-2 md:hidden" aria-label="القائمة">
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" dir="rtl" className="w-72">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Logo className="h-6 w-6" />
                  <span className="font-display text-base font-semibold">بيتكو</span>
                </SheetTitle>
              </SheetHeader>

              <nav className="mt-6 flex flex-col gap-1">
                <MobileItem icon={Home} label="اكتشف" onClick={() => go("/")} />
                <MobileItem icon={Search} label="دوّر على سكن" onClick={() => go("/search")} />

                {user ? (
                  <>
                    <div className="my-2 border-t border-border" />
                    {isOwner && (
                      <MobileItem
                        icon={LayoutDashboard}
                        label="لوحتي"
                        onClick={() => go("/dashboard")}
                      />
                    )}
                    <MobileItem icon={UserIcon} label="حسابي" onClick={() => go("/me")} />
                    <MobileItem icon={Heart} label="المحفوظات" onClick={() => go("/me/saved")} />
                    <MobileItem icon={MessageCircle} label="الرسايل" onClick={() => go("/messages")} />
                    <MobileItem icon={Bell} label="الإشعارات" onClick={() => go("/notifications")} />
                    <div className="my-2 border-t border-border" />
                    <MobileItem icon={HelpCircle} label="مساعدة" onClick={() => go("/help")} />
                    <MobileItem icon={ShieldCheck} label="الثقة" onClick={() => go("/trust")} />
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        logout();
                        navigate({ to: "/" });
                      }}
                      className="mt-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-start text-sm text-destructive transition-colors hover:bg-destructive/10"
                    >
                      <LogOut className="h-4 w-4" />
                      اخرج من الحساب
                    </button>
                  </>
                ) : (
                  <>
                    <div className="my-2 border-t border-border" />
                    <MobileItem icon={HelpCircle} label="مساعدة" onClick={() => go("/help")} />
                    <MobileItem icon={ShieldCheck} label="الثقة" onClick={() => go("/trust")} />
                  </>
                )}
              </nav>

              <div className="mt-6 flex flex-col gap-2">
                {user ? (
                  <Button onClick={() => go("/list/new")} className="w-full gap-1">
                    <Plus className="h-4 w-4" />
                    حط شقتك
                  </Button>
                ) : (
                  <>
                    <Button onClick={() => go("/auth/login")} className="w-full gap-1">
                      <LogIn className="h-4 w-4" />
                      ادخل حسابك
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => go("/list/new")}
                      className="w-full gap-1"
                    >
                      <Plus className="h-4 w-4" />
                      حط شقتك
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

function MobileItem({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-start text-sm text-foreground transition-colors hover:bg-muted"
    >
      <Icon className="h-4 w-4 text-muted-foreground" />
      {label}
    </button>
  );
}
