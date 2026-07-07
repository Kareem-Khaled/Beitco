import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LogOut,
  LayoutDashboard,
  User as UserIcon,
  Heart,
  MessageCircle,
  Plus,
  Bell,
  Settings,
  Sun,
  Moon,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/beitco/auth";
import { useNotificationUnreadCount, useUnreadMessageCount } from "@/lib/beitco/queries";
import { useNotificationSound, useNotifSoundPref } from "@/lib/beitco/notification-sound";
import { getStoredTheme, resolveTheme, setTheme } from "@/lib/beitco/theme";

export function UserMenu() {
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);
  const { data: unread = 0 } = useNotificationUnreadCount(user?.id);
  const unreadMessages = useUnreadMessageCount(user?.id);
  const [soundOn, setSoundOn] = useNotifSoundPref();

  // Chime when the unread count rises (silent on first load / user switch).
  useNotificationSound(unread, user?.id, soundOn);

  useEffect(() => {
    setIsDark(resolveTheme(getStoredTheme()) === "dark");
  }, []);

  if (isLoading) {
    return <div className="h-9 w-20 animate-pulse rounded-lg bg-muted" />;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link to="/auth/login">
          <Button size="sm" className="rounded-full">
            سجّل دخولك
          </Button>
        </Link>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    navigate({ to: "/" });
  };

  const isOwner = user.role === "owner" || user.role === "both";

  const toggleDark = () => {
    const next = resolveTheme(getStoredTheme()) === "dark" ? "light" : "dark";
    setTheme(next);
    setIsDark(next === "dark");
  };

  return (
    <div className="flex items-center gap-2">
      <Link to="/list/new" className="hidden sm:inline-flex">
        <Button size="sm" className="rounded-full gap-1">
          <Plus className="h-4 w-4" />
          اعرض مكانك
        </Button>
      </Link>

      <Link
        to="/messages"
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-muted-foreground transition-colors hover:text-foreground"
        aria-label="الرسايل"
      >
        <MessageCircle className="h-4 w-4" />
        {unreadMessages > 0 && (
          <span className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
            {unreadMessages > 9 ? "9+" : unreadMessages.toLocaleString("ar-EG-u-nu-latn")}
          </span>
        )}
      </Link>

      <Link
        to="/notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-muted-foreground transition-colors hover:text-foreground"
        aria-label="الإشعارات"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
            {unread > 9 ? "9+" : unread.toLocaleString("ar-EG-u-nu-latn")}
          </span>
        )}
      </Link>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-trust text-sm font-semibold text-trust-foreground transition-opacity hover:opacity-90"
            aria-label="القائمة"
          >
            {initials(user.name)}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5">
            <div className="text-sm font-semibold">{user.name}</div>
            <div className="text-xs text-muted-foreground" dir="ltr">
              {user.phone}
            </div>
          </div>
          <DropdownMenuSeparator />
          {isOwner && (
            <DropdownMenuItem onClick={() => navigate({ to: "/dashboard" })}>
              <LayoutDashboard className="me-2 h-4 w-4" />
              لوحتي
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => navigate({ to: "/me" })}>
            <UserIcon className="me-2 h-4 w-4" />
            حسابي
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate({ to: "/me/saved" })}>
            <Heart className="me-2 h-4 w-4" />
            المحفوظات
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate({ to: "/messages" })}>
            <MessageCircle className="me-2 h-4 w-4" />
            الرسايل
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate({ to: "/notifications" })}>
            <Bell className="me-2 h-4 w-4" />
            الإشعارات
            {unread > 0 && (
              <span className="ms-auto rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                {unread > 9 ? "9+" : unread.toLocaleString("ar-EG-u-nu-latn")}
              </span>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate({ to: "/me/settings" })}>
            <Settings className="me-2 h-4 w-4" />
            الإعدادات
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              toggleDark();
            }}
          >
            {isDark ? <Sun className="me-2 h-4 w-4" /> : <Moon className="me-2 h-4 w-4" />}
            {isDark ? "بيتكو بالنهاري" : "بيتكو بالليل"}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setSoundOn(!soundOn);
            }}
          >
            {soundOn ? <Volume2 className="me-2 h-4 w-4" /> : <VolumeX className="me-2 h-4 w-4" />}
            صوت الإشعارات
            <span className="ms-auto text-[10px] text-muted-foreground">
              {soundOn ? "شغّال" : "مقفول"}
            </span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleLogout}
            className="text-destructive focus:text-destructive"
          >
            <LogOut className="me-2 h-4 w-4" />
            اخرج من الحساب
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2);
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
