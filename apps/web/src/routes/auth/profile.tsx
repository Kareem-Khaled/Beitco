import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Home, User as UserIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthLayout } from "@/components/beitco/AuthLayout";
import { useAuth } from "@/lib/beitco/auth";
import type { UserRole, Gender } from "@/lib/beitco/types";

export const Route = createFileRoute("/auth/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole | null>(null);
  const [gender, setGender] = useState<Gender | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { completeProfile, user } = useAuth();

  // If already logged in, skip
  useEffect(() => {
    if (user) navigate({ to: "/" });
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !role || !gender) return;
    setLoading(true);
    try {
      completeProfile({ name: name.trim(), role, gender });
      // Owners land on their dashboard; renters on their account.
      navigate({ to: role === "owner" ? "/dashboard" : "/me" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="عرّفنا بنفسك" subtitle="معلومتين بسيطتين عشان نقدر نخدمك صح.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div>
          <label htmlFor="name" className="mb-2 block text-sm font-medium">
            اسمك
          </label>
          <Input
            id="name"
            type="text"
            placeholder="مثال: أحمد محمد"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            autoFocus
          />
        </div>

        <div>
          <label className="mb-3 block text-sm font-medium">إنت</label>
          <div className="grid grid-cols-2 gap-3">
            <GenderCard label="شاب" active={gender === "ذكر"} onClick={() => setGender("ذكر")} />
            <GenderCard label="بنت" active={gender === "أنثى"} onClick={() => setGender("أنثى")} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            بنستخدمها عشان نطابقك صح مع السكن المشترك (شباب مع شباب، بنات مع بنات).
          </p>
        </div>

        <div>
          <label className="mb-3 block text-sm font-medium">انت هنا عشان إيه؟</label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <RoleCard
              icon={UserIcon}
              title="بدوّر على سكن"
              subtitle="عايز ألاقي شقة، أوضة، أو سرير"
              active={role === "renter"}
              onClick={() => setRole("renter")}
            />
            <RoleCard
              icon={Home}
              title="عندي شقة أجّرها"
              subtitle="عايز أعرض شقتي على بيتكو"
              active={role === "owner"}
              onClick={() => setRole("owner")}
            />
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={!name.trim() || !role || !gender || loading}
          className="w-full rounded-xl"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              لحظة...
            </>
          ) : (
            "يلا نبدأ"
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          ممكن تغيّر دي بعدين من الإعدادات
        </p>
      </form>
    </AuthLayout>
  );
}

function RoleCard({
  icon: Icon,
  title,
  subtitle,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-start gap-2 rounded-xl border p-4 text-start transition-all ${
        active
          ? "border-trust bg-trust-soft ring-2 ring-trust/30"
          : "border-border bg-surface hover:border-foreground/20"
      }`}
    >
      <span
        className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${
          active ? "bg-trust text-trust-foreground" : "bg-muted text-muted-foreground"
        }`}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <div className="text-sm font-semibold">{title}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">{subtitle}</div>
      </div>
    </button>
  );
}

function GenderCard({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-4 text-center text-sm font-semibold transition-all ${
        active
          ? "border-trust bg-trust-soft ring-2 ring-trust/30"
          : "border-border bg-surface hover:border-foreground/20"
      }`}
    >
      {label}
    </button>
  );
}
