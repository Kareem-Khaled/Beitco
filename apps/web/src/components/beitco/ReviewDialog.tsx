import { useState } from "react";
import { Star } from "lucide-react";
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

type ScoreKey = "internet" | "safety" | "noise" | "maintenance" | "cleanliness";

const SCORE_LABELS: Record<ScoreKey, string> = {
  internet: "النت",
  safety: "الأمان",
  noise: "الدوشة",
  maintenance: "الصيانة",
  cleanliness: "النضافة",
};

export type ReviewSubmit = {
  rating: number;
  body: string;
  scores: Record<ScoreKey, number>;
};

export function ReviewDialog({
  open,
  onOpenChange,
  propertyTitle,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  propertyTitle: string;
  onSubmit: (data: ReviewSubmit) => void;
}) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [body, setBody] = useState("");
  const [scores, setScores] = useState<Record<ScoreKey, number>>({
    internet: 8,
    safety: 8,
    noise: 8,
    maintenance: 8,
    cleanliness: 8,
  });

  const reset = () => {
    setRating(0);
    setHover(0);
    setBody("");
    setScores({ internet: 8, safety: 8, noise: 8, maintenance: 8, cleanliness: 8 });
  };

  const valid = rating > 0 && body.trim().length >= 10;

  const handle = () => {
    if (!valid) return;
    onSubmit({ rating, body: body.trim(), scores });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent dir="rtl" className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">قيّم سكنك</DialogTitle>
          <DialogDescription>
            رأيك بيساعد ناس تانية تاخد قرار صح.{" "}
            <span className="font-medium text-foreground">{propertyTitle}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Star rating */}
          <div>
            <p className="mb-2 text-sm font-medium">تقييمك العام</p>
            <div className="flex items-center gap-1">
              {Array.from({ length: 10 }).map((_, i) => {
                const val = i + 1;
                const active = val <= (hover || rating);
                return (
                  <button
                    key={val}
                    type="button"
                    onMouseEnter={() => setHover(val)}
                    onMouseLeave={() => setHover(0)}
                    onClick={() => setRating(val)}
                    className="p-0.5"
                    aria-label={`${val} من 10`}
                  >
                    <Star
                      className={`h-5 w-5 transition-colors ${
                        active ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"
                      }`}
                    />
                  </button>
                );
              })}
              {rating > 0 ? (
                <span className="ms-2 text-sm font-semibold tabular-nums">{rating}/10</span>
              ) : null}
            </div>
          </div>

          {/* Score sliders */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(Object.keys(SCORE_LABELS) as ScoreKey[]).map((k) => (
              <div key={k}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{SCORE_LABELS[k]}</span>
                  <span className="font-semibold tabular-nums">{scores[k]}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={scores[k]}
                  onChange={(e) =>
                    setScores((s) => ({ ...s, [k]: Number(e.target.value) }))
                  }
                  className="w-full accent-primary"
                />
              </div>
            ))}
          </div>

          {/* Body */}
          <div>
            <p className="mb-1 text-sm font-medium">اكتب تجربتك</p>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="إيه اللي عجبك وإيه اللي مكنش حلو؟ المنطقة، الجيران، صاحب البيت..."
              rows={4}
              className="resize-none"
            />
            <p className="mt-1 text-end text-[11px] text-muted-foreground">
              {body.trim().length < 10
                ? `محتاج ${10 - body.trim().length} حرف كمان على الأقل`
                : `${body.length} حرف`}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button onClick={handle} disabled={!valid}>
            انشر رأيك
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
