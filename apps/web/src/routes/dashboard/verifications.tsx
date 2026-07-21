import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ScanFace, Check, X, IdCard, FileText, User as UserIcon } from "lucide-react";
import { useAuth } from "@/lib/beitoon/auth";
import { isPlatformAdmin } from "@/lib/beitoon/store";
import {
  usePendingVerifications,
  approveVerification,
  rejectVerification,
} from "@/lib/beitoon/queries";
import { EmptyState } from "@/components/beitoon/EmptyState";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/verifications")({
  component: VerificationsQueue,
});

type Request = {
  id: string;
  userId: string;
  idDocUrl?: string;
  selfieUrl?: string;
  ownershipDocUrl?: string;
  submittedAt: string;
  user?: { name: string; phone: string; role: string };
};

function VerificationsQueue() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [rejecting, setRejecting] = useState<Request | null>(null);
  const [reason, setReason] = useState("");
  const isAdmin = isPlatformAdmin(user);
  const { data: pending = [] } = usePendingVerifications(!!isAdmin);

  useEffect(() => {
    if (!isLoading && !isAdmin) navigate({ to: "/dashboard" });
  }, [isAdmin, isLoading, navigate]);

  if (isLoading || !user || !isAdmin) return null;

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["pendingVerifications"] });
    qc.invalidateQueries({ queryKey: ["verificationCount"] });
  };

  const onApprove = async (r: Request) => {
    await approveVerification(r.id);
    toast.success(`وثّقنا حساب ${r.user?.name ?? "المستخدم"}`);
    refresh();
  };

  const confirmReject = async () => {
    if (!rejecting) return;
    await rejectVerification(rejecting.id, reason);
    toast.success("رفضنا الطلب");
    setRejecting(null);
    setReason("");
    refresh();
  };

  return (
    <div className="space-y-5">
      <header className="flex items-center gap-2">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-trust-soft text-trust">
          <ScanFace className="h-5 w-5" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">توثيق الحسابات</h1>
          <p className="text-sm text-muted-foreground">
            راجع مستندات الناس قبل ما تديهم علامة موثّق.
          </p>
        </div>
      </header>

      {pending.length === 0 ? (
        <EmptyState
          icon={ScanFace}
          title="مفيش طلبات توثيق مستنية"
          hint="أول ما حد يبعت مستنداته، هتلاقيه هنا للمراجعة."
        />
      ) : (
        <ul className="grid gap-4">
          {pending.map((r) => (
            <li key={r.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <UserIcon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-display text-base font-semibold">
                      {r.user?.name ?? "مستخدم"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {r.user?.phone} ·{" "}
                      {r.user?.role === "renter"
                        ? "مستأجر"
                        : r.user?.role === "owner"
                          ? "صاحب شقة"
                          : "الاتنين"}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  {new Date(r.submittedAt).toLocaleDateString("ar-EG-u-nu-latn")}
                </span>
              </div>

              {/* Documents */}
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                <DocThumb label="البطاقة" icon={IdCard} url={r.idDocUrl} />
                <DocThumb label="سيلفي" icon={UserIcon} url={r.selfieUrl} />
                {r.ownershipDocUrl ? (
                  <DocThumb label="إثبات ملكية" icon={FileText} url={r.ownershipDocUrl} />
                ) : null}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button size="sm" onClick={() => onApprove(r)}>
                  <Check className="me-1 h-4 w-4" />
                  وثّق الحساب
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setReason("");
                    setRejecting(r);
                  }}
                >
                  <X className="me-1 h-4 w-4" />
                  ارفض
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={rejecting !== null} onOpenChange={(v) => !v && setRejecting(null)}>
        <DialogContent dir="rtl" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">سبب الرفض</DialogTitle>
            <DialogDescription>
              هنوضّح للشخص السبب عشان يقدر يبعت مستندات صح تاني.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="المستندات مش واضحة / ناقصة…"
            rows={3}
            className="resize-none"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejecting(null)}>
              إلغاء
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={confirmReject}
              disabled={!reason.trim()}
            >
              ارفض الطلب
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DocThumb({
  label,
  icon: Icon,
  url,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  url?: string;
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex aspect-[4/3] flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border border-border bg-muted text-muted-foreground"
    >
      {url ? (
        <img src={url} alt={label} className="h-full w-full object-cover" />
      ) : (
        <Icon className="h-5 w-5" />
      )}
      <span className="absolute inset-x-0 bottom-0 bg-background/85 py-1 text-center text-[11px] font-medium text-foreground">
        {label}
      </span>
    </a>
  );
}
