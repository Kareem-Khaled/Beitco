import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Phone, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthLayout } from "@/components/beitco/AuthLayout";
import { useAuth, isValidEgyptianPhone, normalizeEgyptianPhone } from "@/lib/beitco/auth";

export const Route = createFileRoute("/auth/login")({
  component: LoginPage,
});

function LoginPage() {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { requestOtp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isValidEgyptianPhone(phone)) {
      setError("ادخل رقم موبايل مصري صح (مثال: 01012345678)");
      return;
    }
    setLoading(true);
    try {
      const normalized = normalizeEgyptianPhone(phone);
      await requestOtp(normalized);
      navigate({ to: "/auth/verify" });
    } catch {
      setError("حصلت مشكلة. جرّب تاني.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="ادخل حسابك"
      subtitle="هنبعتلك كود على الموبايل عشان نتأكد إنك انت."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="phone" className="mb-2 block text-sm font-medium">
            رقم الموبايل
          </label>
          <div className="relative">
            <Phone className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="phone"
              type="tel"
              dir="ltr"
              placeholder="01012345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="ps-10 text-start"
              disabled={loading}
              autoFocus
            />
          </div>
          {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
        </div>

        <Button type="submit" size="lg" disabled={loading} className="w-full rounded-xl">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              لحظة...
            </>
          ) : (
            "ابعت الكود"
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          لما تدخل، يبقى انت موافق على{" "}
          <Link to="/terms" className="text-trust hover:underline">
            الشروط
          </Link>{" "}
          و{" "}
          <Link to="/privacy" className="text-trust hover:underline">
            سياسة الخصوصية
          </Link>
          .
        </p>
      </form>
    </AuthLayout>
  );
}
