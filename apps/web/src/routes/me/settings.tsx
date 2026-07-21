import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  User as UserIcon,
  Phone,
  Users2,
  KeyRound,
  Home,
  Bell,
  ShieldCheck,
  LogOut,
  RotateCcw,
  Check,
  Sun,
  Moon,
  Monitor,
  Palette,
} from "lucide-react";
import { useAuth } from "@/lib/beitoon/auth";
import { getVerificationStatus, resetAllData } from "@/lib/beitoon/store";
import { getStoredTheme, setTheme, type Theme } from "@/lib/beitoon/theme";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { UserRole, NotificationPrefs } from "@/lib/beitoon/types";

export const Route = createFileRoute("/me/settings")({
  component: SettingsPage,
});

const ROLES: { id: UserRole; label: string; hint: string }[] = [
  { id: "renter", label: "بدوّر على سكن", hint: "بتأجّر أو تشتري" },
  { id: "owner", label: "عندي شقق", hint: "بتأجّر أو تبيع" },
  { id: "both", label: "الاتنين", hint: "بدوّر وعندي كمان" },
];

const NOTIF_OPTIONS: { key: keyof NotificationPrefs; label: string; hint: string }[] = [
  { key: "leads", label: "طلبات المعاينة", hint: "لما حد يطلب يعاين شقتك" },
  { key: "messages", label: "الرسايل", hint: "لما توصلك رسالة جديدة" },
  { key: "reviews", label: "الآراء", hint: "لما تقدر تكتب رأيك أو يجيلك رأي" },
  { key: "marketing", label: "أخبار بيتون", hint: "نصايح وتحديثات (بين الحين والحين)" },
];

const THEME_OPTIONS: { id: Theme; label: string; icon: typeof Sun }[] = [
  { id: "light", label: "نهاري", icon: Sun },
  { id: "dark", label: "ليلي", icon: Moon },
  { id: "system", label: "حسب جهازك", icon: Monitor },
];

function SettingsPage() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name ?? "");
  const [saved, setSaved] = useState(false);
  const [theme, setThemeState] = useState<Theme>(() => getStoredTheme());

  if (!user) return null;

  const notifications = user.notifications ?? {
    leads: true,
    messages: true,
    reviews: true,
    marketing: false,
  };
  const verification = getVerificationStatus(user);

  const setRole = (role: UserRole) => {
    updateUser({ role });
    setSaved(false);
  };
  const toggleNotif = (key: keyof NotificationPrefs) => {
    updateUser({ notifications: { ...notifications, [key]: !notifications[key] } });
  };
  const pickTheme = (t: Theme) => {
    setTheme(t);
    setThemeState(t);
  };
  const saveName = () => {
    if (name.trim()) {
      updateUser({ name: name.trim() });
      toast.success("اتحفظ اسمك");
    }
    setSaved(true);
  };

  const onLogout = () => {
    logout();
    navigate({ to: "/" });
  };
  const onReset = () => {
    resetAllData();
    logout();
    navigate({ to: "/" });
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight">الإعدادات</h1>
        <p className="text-sm text-muted-foreground">عدّل بياناتك وتفضيلاتك.</p>
      </header>

      {/* Account */}
      <Section icon={UserIcon} title="الحساب">
        <div className="space-y-4">
          <div>
            <label htmlFor="settings-name" className="mb-1.5 block text-sm font-medium">
              الاسم
            </label>
            <div className="flex items-center gap-2">
              <Input
                id="settings-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="max-w-sm"
              />
              <Button
                size="sm"
                onClick={saveName}
                disabled={!name.trim() || name.trim() === user.name}
              >
                {saved ? <Check className="h-4 w-4" /> : "احفظ"}
              </Button>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">رقم التليفون</label>
            <div
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm"
              dir="ltr"
            >
              <Phone className="h-4 w-4 text-muted-foreground" />
              {user.phone}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              رقم التليفون مش بيتغيّر  -  هو هويتك على بيتون.
            </p>
          </div>
        </div>
      </Section>

      {/* Role */}
      <Section icon={KeyRound} title="إنت على بيتون إيه؟" hint="ده بيحدد شكل حسابك ولوحتك.">
        <div className="grid gap-2 sm:grid-cols-3">
          {ROLES.map((r) => {
            const active = user.role === r.id;
            const Icon = r.id === "owner" ? Home : r.id === "both" ? Users2 : UserIcon;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setRole(r.id)}
                className={`rounded-xl border p-3 text-start transition-all ${
                  active
                    ? "border-trust bg-trust-soft ring-2 ring-trust/30"
                    : "border-border bg-surface hover:border-foreground/20"
                }`}
              >
                <Icon className="mb-1 h-4 w-4 text-muted-foreground" />
                <div className="text-sm font-semibold">{r.label}</div>
                <div className="text-[11px] text-muted-foreground">{r.hint}</div>
              </button>
            );
          })}
        </div>
      </Section>

      {/* Notifications */}
      <Section icon={Bell} title="الإشعارات" hint="اختار يوصلك إيه.">
        <div className="space-y-2">
          {NOTIF_OPTIONS.map((o) => (
            <div
              key={o.key}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3"
            >
              <span>
                <span className="block text-sm font-medium">{o.label}</span>
                <span className="block text-[11px] text-muted-foreground">{o.hint}</span>
              </span>
              <Switch
                checked={notifications[o.key] ?? false}
                onCheckedChange={() => toggleNotif(o.key)}
                aria-label={o.label}
              />
            </div>
          ))}
        </div>
      </Section>

      {/* Appearance */}
      <Section icon={Palette} title="المظهر" hint="عايز بيتون يبان إزاي عندك؟">
        <div className="grid gap-2 sm:grid-cols-3">
          {THEME_OPTIONS.map((t) => {
            const active = theme === t.id;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => pickTheme(t.id)}
                className={`flex items-center gap-2 rounded-xl border p-3 text-start transition-all ${
                  active
                    ? "border-trust bg-trust-soft ring-2 ring-trust/30"
                    : "border-border bg-surface hover:border-foreground/20"
                }`}
              >
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">{t.label}</span>
                {active ? <Check className="ms-auto h-4 w-4 text-trust" /> : null}
              </button>
            );
          })}
        </div>
      </Section>

      {/* Verification */}
      <Section icon={ShieldCheck} title="التوثيق">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${
                verification === "verified"
                  ? "bg-trust text-trust-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
            </span>
            <div>
              <div className="text-sm font-medium">
                {verification === "verified"
                  ? "حسابك موثّق"
                  : verification === "pending"
                    ? "طلب التوثيق بيتراجع"
                    : "حسابك مش موثّق"}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {verification === "verified"
                  ? "بتظهر للناس بعلامة موثّق."
                  : verification === "pending"
                    ? "بنراجع مستنداتك دلوقتي."
                    : "وثّق حسابك عشان تكسب ثقة الناس بسرعة."}
              </div>
            </div>
          </div>
          {verification !== "verified" && (
            <Button asChild variant={verification === "pending" ? "outline" : "default"} size="sm">
              <Link to="/dashboard/verify">
                {verification === "pending" ? "تابع الطلب" : "وثّق حسابك"}
              </Link>
            </Button>
          )}
        </div>
      </Section>

      {/* Danger zone */}
      <Section icon={LogOut} title="الحساب" hint="إجراءات حسّاسة.">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={onLogout} className="gap-1.5">
            <LogOut className="h-4 w-4" />
            اخرج من الحساب
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="gap-1.5 text-muted-foreground">
                <RotateCcw className="h-4 w-4" />
                إعادة ضبط بيانات التجربة
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent dir="rtl">
              <AlertDialogHeader>
                <AlertDialogTitle>تعيد ضبط كل البيانات؟</AlertDialogTitle>
                <AlertDialogDescription>
                  ده هيمسح كل البيانات المحلية (الشقق، الرسايل، الحساب) ويرجّع التجربة من الأول.
                  مفيد للتجربة بس.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>لأ، خليني</AlertDialogCancel>
                <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={onReset}>
                  امسح وارجع من الأول
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </Section>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  hint,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-trust-soft text-trust">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <h2 className="font-display text-base font-semibold">{title}</h2>
          {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}
