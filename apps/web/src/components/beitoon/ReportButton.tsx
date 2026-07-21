import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Flag } from "lucide-react";
import { useAuth } from "@/lib/beitoon/auth";
import { createReport } from "@/lib/beitoon/queries";
import type { ReportTargetType } from "@/lib/beitoon/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

// ADMIN-5: a reusable "report" affordance. Any logged-in user can flag a
// listing / review / user. Sends to POST /reports (or the mock).
const REASONS_BY_TYPE: Record<ReportTargetType, string[]> = {
  listing: ["إعلان وهمي أو نصب", "صور مش حقيقية", "سعر مضلِّل", "مكرر", "محتوى مخالف"],
  review: ["تقييم مزيّف", "كلام مسيء", "مش متعلّق بالمكان", "سبام"],
  user: ["سلوك مسيء", "نصب", "انتحال شخصية", "سبام"],
  question: ["سؤال مسيء", "سبام"],
};

const TITLE_BY_TYPE: Record<ReportTargetType, string> = {
  listing: "بلّغ عن الإعلان",
  review: "بلّغ عن التقييم",
  user: "بلّغ عن المستخدم",
  question: "بلّغ عن السؤال",
};

export function ReportButton({
  targetType,
  targetId,
  variant = "ghost",
  size = "sm",
  className,
  label,
}: {
  targetType: ReportTargetType;
  targetId: string;
  variant?: "ghost" | "outline";
  size?: "sm" | "icon";
  className?: string;
  label?: string;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string | null>(null);
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  const onClick = () => {
    if (!user) {
      toast.error("سجّل دخولك الأول عشان تبلّغ");
      navigate({ to: "/auth/login" });
      return;
    }
    setReason(null);
    setDetails("");
    setOpen(true);
  };

  const submit = async () => {
    if (!user || !reason) return;
    setBusy(true);
    try {
      await createReport(user.id, {
        targetType,
        targetId,
        reason,
        details: details.trim() || undefined,
      });
      toast.success("وصلنا بلاغك  -  هنراجعه. شكرًا إنك بتحافظ على المكان نضيف.");
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "مش قادرين نبعت البلاغ دلوقتي");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        onClick={onClick}
        aria-label={TITLE_BY_TYPE[targetType]}
      >
        <Flag className="h-3.5 w-3.5" />
        {size !== "icon" ? (label ?? "بلّغ") : null}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>{TITLE_BY_TYPE[targetType]}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">اختر السبب  -  وفريقنا هيراجعه بسرعة.</p>
          <div className="flex flex-wrap gap-1.5">
            {REASONS_BY_TYPE[targetType].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setReason(r)}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  reason === r
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-surface text-muted-foreground hover:text-foreground"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <Textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="تفاصيل زيادة (اختياري)"
            rows={3}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              إلغاء
            </Button>
            <Button disabled={!reason || busy} onClick={submit}>
              ابعت البلاغ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
