import { useState } from "react";
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

export function QuestionDialog({
  open,
  onOpenChange,
  propertyTitle,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  propertyTitle: string;
  onSubmit: (question: string) => void;
}) {
  const [q, setQ] = useState("");
  const valid = q.trim().length >= 5;

  const handle = () => {
    if (!valid) return;
    onSubmit(q.trim());
    setQ("");
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) setQ("");
        onOpenChange(v);
      }}
    >
      <DialogContent dir="rtl" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">اسأل سؤال</DialogTitle>
          <DialogDescription>
            صاحب الشقة أو الساكنين هيردوا عليك.{" "}
            <span className="font-medium text-foreground">{propertyTitle}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <Textarea
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="مثلاً: النت سرعته كام؟ في مواصلات قريبة؟ ساعات الهدوء إمتى؟"
            rows={4}
            className="resize-none"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button onClick={handle} disabled={!valid}>
            ابعت السؤال
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
