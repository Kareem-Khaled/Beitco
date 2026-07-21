import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { AuthLayout } from "@/components/beitoon/AuthLayout";
import { useAuth } from "@/lib/beitoon/auth";
import { USE_API } from "@/lib/beitoon/api";

export const Route = createFileRoute("/auth/verify")({
  component: VerifyPage,
});

function VerifyPage() {
  const [code, setCode] = useState("");
  const [phone, setPhone] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { verifyOtp } = useAuth();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = localStorage.getItem("beitco:pendingPhone");
    if (!p) {
      navigate({ to: "/auth/login" });
      return;
    }
    setPhone(p);
  }, [navigate]);

  const handleSubmit = async (codeValue: string) => {
    setError(null);
    setLoading(true);
    try {
      const { isNewUser } = await verifyOtp(phone, codeValue);
      if (isNewUser) navigate({ to: "/auth/profile" });
      else navigate({ to: "/" });
    } catch {
      setError("الكود غلط. جرّب تاني.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="اكتب الكود"
      subtitle={`بعتنا كود من 6 أرقام على ${phone}. لو ما وصلش، جرّب تطلبه تاني.`}
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-3" dir="ltr">
          <InputOTP
            maxLength={6}
            value={code}
            onChange={(v) => {
              setCode(v);
              setError(null);
              if (v.length === 6) handleSubmit(v);
            }}
            disabled={loading}
            autoFocus
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
          {loading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              بنتأكد...
            </div>
          )}
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          نسيت الرقم؟{" "}
          <Link to="/auth/login" className="text-trust hover:underline">
            ارجع وغيّر الرقم
          </Link>
        </p>

        <div className="rounded-lg bg-muted/40 p-3 text-center text-xs text-muted-foreground">
          💡 وضع التجربة: {USE_API ? "الكود هو 123456" : "اكتب أي 6 أرقام عشان تكمّل"}
        </div>
      </div>
    </AuthLayout>
  );
}
