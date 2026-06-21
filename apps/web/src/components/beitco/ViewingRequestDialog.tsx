import { useState } from "react";
import { Calendar, BedDouble, DoorOpen } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import type { LeadUnit } from "@/lib/beitco/types";

export function ViewingRequestDialog({
  open,
  onOpenChange,
  propertyTitle,
  units,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  propertyTitle: string;
  /** When non-empty, this is a booking request for specific bed(s)/room(s). */
  units?: LeadUnit[];
  onSubmit: (data: { preferredDate?: string; note?: string }) => void;
}) {
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const list = units ?? [];
  const isBooking = list.length > 0;
  const total = list.reduce((s, u) => s + (u.price ?? 0), 0);

  const handle = async () => {
    setSubmitting(true);
    onSubmit({ preferredDate: date || undefined, note: note.trim() || undefined });
    setSubmitting(false);
    onOpenChange(false);
    setDate("");
    setNote("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">
            {isBooking ? "اطلب الحجز" : "اطلب معاينة"}
          </DialogTitle>
          <DialogDescription>
            هنبعت طلبك لصاحب الشقة.{" "}
            <span className="font-medium text-foreground">{propertyTitle}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Targeted units summary (booking mode) */}
        {isBooking && (
          <div className="space-y-1.5 rounded-xl border border-trust/30 bg-trust-soft p-2.5">
            {list.map((u, i) => {
              const UnitIcon = u.kind === "room" ? DoorOpen : BedDouble;
              return (
                <div key={i} className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-2 text-sm font-medium">
                    <UnitIcon className="h-4 w-4 shrink-0 text-trust" />
                    <span>
                      {u.label}
                      {u.kind === "bed" && u.roomName ? (
                        <span className="block text-[11px] font-normal text-muted-foreground">
                          في {u.roomName}
                        </span>
                      ) : null}
                    </span>
                  </span>
                  {u.price ? (
                    <span className="font-display text-sm font-semibold tabular-nums">
                      {u.price.toLocaleString("ar-EG-u-nu-latn")}{" "}
                      <span className="text-[11px] font-normal text-muted-foreground">ج.م</span>
                    </span>
                  ) : null}
                </div>
              );
            })}
            {list.length > 1 && total > 0 && (
              <div className="flex items-center justify-between gap-2 border-t border-trust/20 pt-1.5 text-sm font-semibold">
                <span>الإجمالي</span>
                <span className="tabular-nums">
                  {total.toLocaleString("ar-EG-u-nu-latn")}{" "}
                  <span className="text-[11px] font-normal text-muted-foreground">ج.م/شهر</span>
                </span>
              </div>
            )}
          </div>
        )}

        <div className="space-y-4 py-2">
          <div>
            <label className="mb-1 block text-sm font-medium">
              <Calendar className="me-1 inline h-4 w-4" />
              {isBooking ? "ميعاد دخول مقترح (اختياري)" : "ميعاد مقترح (اختياري)"}
            </label>
            <DatePicker
              value={date}
              onChange={(v) => setDate(v ?? "")}
              disablePast
              placeholder="اختار ميعاد يناسبك"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">رسالة لصاحب الشقة (اختياري)</label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                isBooking
                  ? "مثلاً: حابب أعاين الأول، أو أأكّد الحجز على طول..."
                  : "مثلاً: هحب أعرف لو في أسرّة فاضية للشهر الجاي..."
              }
              rows={4}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button onClick={handle} disabled={submitting}>
            {isBooking ? "ابعت طلب الحجز" : "ابعت الطلب"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
