import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ShieldCheck,
  IdCard,
  FileText,
  Upload,
  Check,
  Clock,
  Sparkles,
  ScanFace,
} from "lucide-react";
import { useAuth } from "@/lib/beitco/auth";
import { getVerificationStatus, submitVerification } from "@/lib/beitco/store";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard/verify")({
  component: VerifyPage,
});

function VerifyPage() {
  const { user, isLoading, updateUser } = useAuth();
  const navigate = useNavigate();
  const [idDoc, setIdDoc] = useState<string | null>(null);
  const [selfieDoc, setSelfieDoc] = useState<string | null>(null);
  const [ownershipDoc, setOwnershipDoc] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) navigate({ to: "/auth/login" });
  }, [user, isLoading, navigate]);

  if (!user) return null;
  const status = getVerificationStatus(user);
  // Proof of ownership only applies to owners; renters just verify identity.
  const isOwner = user.role === "owner" || user.role === "both";

  const submit = () => {
    setSubmitting(true);
    submitVerification(user.id);
    // Keep the session user in sync so the badge/status updates everywhere.
    updateUser({ verificationStatus: "pending" });
    setSubmitting(false);
    toast.success("اتبعت طلب التوثيق — هنراجعه ونبلّغك");
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mt-2 text-center">
        <span className="mx-auto mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-trust-soft text-trust">
          <ShieldCheck className="h-7 w-7" />
        </span>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">وثّق حسابك</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          {isOwner
            ? "التوثيق بيدّي الناس ثقة إن إعلاناتك حقيقية — وبيخلّي شققك تظهر بعلامة «موثّق» وتترتّب أعلى."
            : "التوثيق بيدّي أصحاب الشقق اطمئنان إنك شخص حقيقي — وبيخلّي طلباتك تتقبل أسرع."}
        </p>
      </div>

      {status === "verified" ? (
        <StateCard
          tone="done"
          icon={Check}
          title="حسابك موثّق"
          body="مبروك! كل إعلاناتك بتظهر بعلامة موثّق. مفيش حاجة تانية مطلوبة."
          cta={
            <Button asChild>
              <Link to="/dashboard">ارجع للوحتك</Link>
            </Button>
          }
        />
      ) : status === "pending" ? (
        <StateCard
          tone="pending"
          icon={Clock}
          title="طلبك بيتراجع"
          body="استلمنا مستنداتك وفريقنا بيراجعها. عادةً بياخد أقل من 24 ساعة، وهنبلّغك أول ما يخلص."
          cta={
            <Button asChild variant="outline">
              <Link to="/dashboard">ارجع للوحتك</Link>
            </Button>
          }
        />
      ) : (
        <>
          {/* Benefits */}
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Benefit icon={ShieldCheck} text="علامة «موثّق» على حسابك" />
            {isOwner ? (
              <Benefit icon={Sparkles} text="ترتيب أعلى في نتائج البحث" />
            ) : (
              <Benefit icon={Sparkles} text="طلباتك تتقبل أسرع" />
            )}
            <Benefit
              icon={Check}
              text={isOwner ? "ثقة أسرع من المستأجرين" : "ثقة أسرع من أصحاب الشقق"}
            />
          </div>

          {/* Upload docs */}
          <div className="mt-6 space-y-3">
            <DocUpload
              icon={IdCard}
              title="صورة البطاقة"
              subtitle="وجه البطاقة الشخصية — بنتأكد من هويتك بس."
              value={idDoc}
              onChange={setIdDoc}
            />
            <DocUpload
              icon={ScanFace}
              title="سيلفي وانت ماسك البطاقة"
              subtitle="صورة لوشك وانت ماسك بطاقتك جنب وشك — عشان نتأكد إنها فعلاً إنت."
              value={selfieDoc}
              onChange={setSelfieDoc}
              selfie
            />
            {isOwner && (
              <DocUpload
                icon={FileText}
                title="إثبات ملكية أو إيجار"
                subtitle="عقد، فاتورة مرافق، أو أي ورقة بتثبت علاقتك بالشقة."
                value={ownershipDoc}
                onChange={setOwnershipDoc}
              />
            )}
          </div>

          <p className="mt-4 text-center text-[11px] text-muted-foreground">
            مستنداتك سرّية وبتُستخدم للتوثيق بس — مش بتظهر لأي حد.
          </p>

          <Button
            size="lg"
            className="mt-4 w-full rounded-xl"
            disabled={!idDoc || !selfieDoc || (isOwner && !ownershipDoc) || submitting}
            onClick={submit}
          >
            {submitting ? "بنبعت..." : "ابعت للتوثيق"}
          </Button>
        </>
      )}
    </div>
  );
}

function Benefit({
  icon: Icon,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-surface p-3 text-center">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-trust-soft text-trust">
        <Icon className="h-4 w-4" />
      </span>
      <span className="text-xs text-muted-foreground">{text}</span>
    </div>
  );
}

function DocUpload({
  icon: Icon,
  title,
  subtitle,
  value,
  onChange,
  selfie,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  value: string | null;
  onChange: (v: string | null) => void;
  /** When true, opens the front camera for a live selfie (images only). */
  selfie?: boolean;
}) {
  const onFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
  };

  return (
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition-colors ${
        value
          ? "border-trust bg-trust-soft"
          : "border-dashed border-border bg-surface hover:border-trust"
      }`}
    >
      <span
        className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${
          value ? "bg-trust text-trust-foreground" : "bg-muted text-muted-foreground"
        }`}
      >
        {value ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-[11px] text-muted-foreground">
          {value ? "تم الرفع — اضغط للتغيير" : subtitle}
        </div>
      </div>
      <span className="inline-flex items-center gap-1 text-xs text-primary">
        <Upload className="h-3.5 w-3.5" />
        {value ? "غيّر" : "ارفع"}
      </span>
      <input
        type="file"
        accept={selfie ? "image/*" : "image/*,application/pdf"}
        capture={selfie ? "user" : undefined}
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0])}
      />
    </label>
  );
}

function StateCard({
  tone,
  icon: Icon,
  title,
  body,
  cta,
}: {
  tone: "done" | "pending";
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  cta: React.ReactNode;
}) {
  return (
    <div className="mt-6 rounded-2xl border border-border bg-card p-8 text-center">
      <span
        className={`mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full ${
          tone === "done" ? "bg-trust text-trust-foreground" : "bg-amber-500/15 text-amber-600"
        }`}
      >
        <Icon className="h-6 w-6" />
      </span>
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>
      <div className="mt-4">{cta}</div>
    </div>
  );
}
