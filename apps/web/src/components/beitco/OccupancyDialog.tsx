import { useEffect, useState } from "react";
import { BedDouble, CheckCircle2, Clock, User, BadgeCheck, X, Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { resolveInvitePhone } from "@/lib/beitco/store";
import type { BedStatus, Occupant } from "@/lib/beitco/types";

const STATUS_OPTIONS: {
  id: BedStatus;
  label: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
}[] = [
  {
    id: "available",
    label: "فاضي",
    hint: "متاح للحجز دلوقتي",
    icon: CheckCircle2,
    tone: "data-[on=true]:border-emerald-500/50 data-[on=true]:bg-emerald-500/10 data-[on=true]:text-emerald-600 dark:data-[on=true]:text-emerald-400",
  },
  {
    id: "reserved",
    label: "محجوز",
    hint: "اتحجز بس لسه ما سكنش",
    icon: Clock,
    tone: "data-[on=true]:border-amber-500/50 data-[on=true]:bg-amber-500/10 data-[on=true]:text-amber-600 dark:data-[on=true]:text-amber-400",
  },
  {
    id: "occupied",
    label: "متأجّر",
    hint: "فيه حد ساكن فعلاً",
    icon: BedDouble,
    tone: "data-[on=true]:border-foreground/30 data-[on=true]:bg-muted data-[on=true]:text-foreground",
  },
];

export function OccupancyDialog({
  open,
  onOpenChange,
  unitLabel,
  status,
  occupant,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  unitLabel: string;
  status: BedStatus;
  occupant?: Occupant;
  onSave: (status: BedStatus, occupant?: Occupant) => void;
}) {
  const [s, setS] = useState<BedStatus>(status);
  const [occ, setOcc] = useState<Occupant>(occupant ?? {});
  const [invitePhone, setInvitePhone] = useState("");
  const [inviteMsg, setInviteMsg] = useState<string | null>(null);

  // Re-sync whenever the dialog opens on a different unit.
  useEffect(() => {
    if (open) {
      setS(status);
      setOcc(occupant ?? {});
      setInvitePhone("");
      setInviteMsg(null);
    }
  }, [open, status, occupant]);

  const showRenter = s !== "available";

  const setField = (patch: Partial<Occupant>) => setOcc((o) => ({ ...o, ...patch }));

  // Privacy-safe invite: we never browse users or reveal whether a number has an
  // account. The owner enters their tenant's exact phone; if a Beitoon account
  // exists, we attach a *pending* link the renter must confirm.
  const sendInvite = () => {
    const { valid, userId } = resolveInvitePhone(invitePhone);
    if (!valid) {
      setInviteMsg("اكتب رقم موبايل مصري صح (01XXXXXXXXX).");
      return;
    }
    setOcc((o) => ({
      ...o,
      phone: o.phone || invitePhone.trim(),
      userId: userId,
      linkStatus: userId ? "pending" : undefined,
    }));
    setInvitePhone("");
    // Same message whether or not an account exists (no existence oracle).
    setInviteMsg("بعتنا دعوة للرقم ده. لو عنده حساب على بيتون هيوصله طلب يأكّد إنه ساكن.");
  };

  const unlinkUser = () => {
    setOcc((o) => {
      const { userId: _u, linkStatus: _l, ...rest } = o;
      return rest;
    });
    setInviteMsg(null);
  };

  const handleSave = () => {
    if (!showRenter) {
      onSave("available", undefined); // clear renter data when freeing the unit
    } else {
      // Drop empty strings so we don't store blank fields.
      const cleaned: Occupant = {
        userId: occ.userId || undefined,
        linkStatus: occ.userId ? occ.linkStatus : undefined,
        name: occ.name?.trim() || undefined,
        phone: occ.phone?.trim() || undefined,
        moveInDate: occ.moveInDate || undefined,
        notes: occ.notes?.trim() || undefined,
      };
      const hasAny = Object.values(cleaned).some(Boolean);
      onSave(s, hasAny ? cleaned : undefined);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">حالة {unitLabel}</DialogTitle>
          <DialogDescription>
            غيّر الحالة، ولو حابب سجّل بيانات المستأجر (اختياري — بتفضل خاصة بيك).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Status picker */}
          <div className="grid grid-cols-3 gap-2">
            {STATUS_OPTIONS.map((o) => {
              const Icon = o.icon;
              const on = s === o.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  data-on={on}
                  onClick={() => setS(o.id)}
                  className={`flex flex-col items-center gap-1 rounded-xl border border-border bg-surface p-3 text-center transition-colors ${o.tone}`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{o.label}</span>
                </button>
              );
            })}
          </div>
          <p className="text-center text-[11px] text-muted-foreground">
            {STATUS_OPTIONS.find((o) => o.id === s)?.hint}
          </p>

          {/* Renter details (optional) */}
          {showRenter && (
            <div className="space-y-3 rounded-xl border border-border bg-surface p-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <User className="h-3.5 w-3.5" />
                بيانات المستأجر (كله اختياري — بتفضل خاصة بيك)
              </div>

              {/* Link to a Beitoon account — consent-based, by exact phone only.
                  We never browse users or reveal who owns a number. */}
              {occ.userId ? (
                <div className="flex items-center justify-between gap-2 rounded-lg border border-trust/40 bg-trust-soft px-3 py-2">
                  <span className="inline-flex items-center gap-1.5 text-sm">
                    {occ.linkStatus === "confirmed" ? (
                      <>
                        <BadgeCheck className="h-4 w-4 text-trust" />
                        الساكن أكّد الربط
                      </>
                    ) : (
                      <>
                        <Clock className="h-4 w-4 text-amber-600" />
                        مستنيين الساكن يأكّد
                      </>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={unlinkUser}
                    className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                    فك الربط
                  </button>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border bg-background p-2.5">
                  <div className="mb-1.5 text-[11px] text-muted-foreground">
                    اربط الساكن بحساب بيتون (اختياري) — اكتب رقمه وهنبعتله دعوة يأكّدها هو بنفسه.
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="01XXXXXXXXX"
                      inputMode="tel"
                      dir="ltr"
                      value={invitePhone}
                      onChange={(e) => setInvitePhone(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={sendInvite}
                      disabled={!invitePhone.trim()}
                    >
                      <Send className="me-1 h-3.5 w-3.5" />
                      ابعت دعوة
                    </Button>
                  </div>
                  {inviteMsg && (
                    <p className="mt-1.5 text-[11px] text-muted-foreground">{inviteMsg}</p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="الاسم"
                  value={occ.name ?? ""}
                  onChange={(e) => setField({ name: e.target.value })}
                />
                <Input
                  placeholder="التليفون"
                  inputMode="tel"
                  dir="ltr"
                  value={occ.phone ?? ""}
                  onChange={(e) => setField({ phone: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-muted-foreground">تاريخ الدخول</label>
                <DatePicker
                  value={occ.moveInDate}
                  onChange={(v) => setField({ moveInDate: v })}
                  placeholder="اختار تاريخ الدخول"
                />
              </div>
              <Textarea
                placeholder="ملاحظات (مثلاً: دفع عربون، عقد لحد آخر السنة...)"
                rows={2}
                className="resize-none"
                value={occ.notes ?? ""}
                onChange={(e) => setField({ notes: e.target.value })}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button onClick={handleSave}>احفظ</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Small status pill reused across the dashboard.
export function OccupancyPill({ status }: { status: BedStatus }) {
  const map: Record<BedStatus, { tone: string; label: string }> = {
    available: {
      tone: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      label: "فاضي",
    },
    reserved: {
      tone: "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400",
      label: "محجوز",
    },
    occupied: {
      tone: "border-border bg-muted text-muted-foreground",
      label: "متأجّر",
    },
  };
  const s = map[status];
  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${s.tone}`}
    >
      {s.label}
    </span>
  );
}
