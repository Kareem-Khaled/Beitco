import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Search,
  X,
  ShieldCheck,
  ShieldX,
  Ban,
  RotateCcw,
  Trash2,
  ExternalLink,
  Star,
} from "lucide-react";
import {
  useAdminListings,
  useAdminListing,
  adminTakedownListing,
  adminRestoreListing,
  adminSetListingVerified,
  adminDeleteListing,
} from "@/lib/beitco/queries";
import { formatDate } from "@/lib/beitco/store";
import type { AdminListing } from "@/lib/beitco/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/listings")({
  component: AdminListings,
});

const STATUS_LABEL: Record<string, string> = {
  published: "منشورة",
  pending_approval: "مستنية",
  paused: "موقوفة",
  draft: "مسودّة",
  rejected: "مرفوضة",
};

const STATUS_STYLE: Record<string, string> = {
  published: "bg-trust/10 text-trust",
  pending_approval: "bg-amber-500/10 text-amber-600",
  paused: "bg-destructive/10 text-destructive",
  draft: "bg-muted text-muted-foreground",
  rejected: "bg-destructive/10 text-destructive",
};

const STATUS_FILTERS = [
  { id: undefined, label: "الكل" },
  { id: "published", label: "منشورة" },
  { id: "pending_approval", label: "مستنية" },
  { id: "paused", label: "موقوفة" },
  { id: "rejected", label: "مرفوضة" },
] as const;

const TYPE_FILTERS = [
  { id: undefined, label: "كل الأنواع" },
  { id: "شقة", label: "شقق" },
  { id: "أوضة", label: "أوض" },
  { id: "سرير", label: "أسرّة" },
] as const;

function AdminListings() {
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [type, setType] = useState<string | undefined>(undefined);
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);

  const { data: listings = [], isLoading } = useAdminListings({
    q: search || undefined,
    status,
    type,
  });

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight">الإعلانات</h1>
        <p className="text-sm text-muted-foreground">راجع وتحكّم في كل الإعلانات على المنصة.</p>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSearch(q.trim());
        }}
        className="flex items-center gap-2 rounded-xl border border-border bg-card p-2"
      >
        <Search className="ms-1 h-4 w-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="دوّر بالعنوان أو المنطقة…"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        {q ? (
          <button
            type="button"
            onClick={() => {
              setQ("");
              setSearch("");
            }}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted"
            aria-label="مسح"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
        <Button type="submit" size="sm" className="rounded-lg">
          دوّر
        </Button>
      </form>

      <div className="flex flex-wrap gap-3">
        <FilterRow value={status} options={STATUS_FILTERS} onChange={setStatus} />
        <FilterRow value={type} options={TYPE_FILTERS} onChange={setType} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="border-b border-border bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
          {isLoading ? "بنحمّل…" : `${listings.length.toLocaleString("ar-EG-u-nu-latn")} إعلان`}
        </div>
        <ul className="divide-y divide-border">
          {listings.map((p) => (
            <li key={p.id}>
              <button
                onClick={() => setSelectedId(p.id)}
                className="flex w-full items-center gap-3 px-4 py-3 text-start transition-colors hover:bg-muted/40"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {p.area} · {p.type}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {p.verified ? <ShieldCheck className="h-3.5 w-3.5 text-trust" /> : null}
                  <span className="inline-flex items-center gap-0.5 text-xs tabular-nums text-muted-foreground">
                    <Star className="h-3 w-3 text-trust" />
                    {p.trust.toLocaleString("ar-EG")}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      STATUS_STYLE[p.status] ?? "bg-muted text-muted-foreground"
                    }`}
                  >
                    {STATUS_LABEL[p.status] ?? p.status}
                  </span>
                </div>
              </button>
            </li>
          ))}
          {!isLoading && listings.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-muted-foreground">
              ما لقيناش إعلانات
            </li>
          ) : null}
        </ul>
      </div>

      <ListingDetailSheet id={selectedId} onClose={() => setSelectedId(undefined)} />
    </div>
  );
}

function FilterRow<T extends string | undefined>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: readonly { id: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const active = value === o.id;
        return (
          <button
            key={o.label}
            type="button"
            onClick={() => onChange(o.id)}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-surface text-muted-foreground hover:text-foreground"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function ListingDetailSheet({ id, onClose }: { id: string | undefined; onClose: () => void }) {
  const qc = useQueryClient();
  const { data: p } = useAdminListing(id);
  const [takingDown, setTakingDown] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["adminListings"] });
    qc.invalidateQueries({ queryKey: ["adminListing", id] });
    qc.invalidateQueries({ queryKey: ["adminStats"] });
  };

  const run = async (fn: () => Promise<unknown>, ok: string, close = false) => {
    setBusy(true);
    try {
      await fn();
      toast.success(ok);
      refresh();
      if (close) onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "حصل خطأ");
    } finally {
      setBusy(false);
    }
  };

  const published = p?.status === "published";

  return (
    <>
      <Sheet open={!!id} onOpenChange={(open) => !open && onClose()}>
        <SheetContent side="left" className="w-full overflow-y-auto sm:max-w-md" dir="rtl">
          {p ? (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  {p.title}
                  {p.verified ? <ShieldCheck className="h-4 w-4 text-trust" /> : null}
                </SheetTitle>
              </SheetHeader>

              <div className="mt-4 space-y-5">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      STATUS_STYLE[p.status] ?? "bg-muted text-muted-foreground"
                    }`}
                  >
                    {STATUS_LABEL[p.status] ?? p.status}
                  </span>
                  <Link
                    to="/property/$id"
                    params={{ id: p.id }}
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    شوف الصفحة
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>

                {p.rejectionReason ? (
                  <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm">
                    <p className="font-medium text-destructive">سبب الإيقاف</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{p.rejectionReason}</p>
                  </div>
                ) : null}

                <div className="space-y-1.5 text-sm">
                  <DetailRow label="المنطقة" value={p.area} />
                  <DetailRow label="النوع" value={p.type} />
                  <DetailRow label="السعر" value={`${p.price.toLocaleString("ar-EG")} ج.م`} />
                  <DetailRow label="الثقة" value={p.trust.toLocaleString("ar-EG")} />
                  <DetailRow
                    label="الأسرّة"
                    value={`${p.beds.available.toLocaleString("ar-EG")} فاضي / ${p.beds.total.toLocaleString("ar-EG")}`}
                  />
                  <DetailRow label="اتعمل" value={formatDate(p.createdAt)} />
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">إجراءات</p>
                  <div className="grid grid-cols-2 gap-2">
                    {p.verified ? (
                      <ActionButton
                        icon={ShieldX}
                        label="شيل التوثيق"
                        disabled={busy}
                        onClick={() =>
                          run(() => adminSetListingVerified(p.id, false), "اتشال التوثيق")
                        }
                      />
                    ) : (
                      <ActionButton
                        icon={ShieldCheck}
                        label="وثّقه"
                        disabled={busy}
                        onClick={() => run(() => adminSetListingVerified(p.id, true), "اتوثّق")}
                      />
                    )}

                    {published ? (
                      <ActionButton
                        icon={Ban}
                        danger
                        label="أوقفه"
                        disabled={busy}
                        onClick={() => {
                          setReason("");
                          setTakingDown(true);
                        }}
                      />
                    ) : (
                      <ActionButton
                        icon={RotateCcw}
                        label="رجّعه"
                        disabled={busy}
                        onClick={() => run(() => adminRestoreListing(p.id), "رجع منشور")}
                      />
                    )}

                    <ActionButton
                      icon={Trash2}
                      danger
                      label="امسحه"
                      disabled={busy}
                      onClick={() => setDeleting(true)}
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
              لحظة…
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Takedown reason dialog */}
      <Dialog open={takingDown} onOpenChange={setTakingDown}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>إيقاف الإعلان</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            هيتوقف الإعلان ويختفي من البحث، وهيتبعت السبب لصاحبه. الإجراء بيتسجّل في سجل الأدمن.
          </p>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="مثلاً: صور مخالِفة أو سعر وهمي"
            rows={3}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setTakingDown(false)}>
              إلغاء
            </Button>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={() => {
                if (!p) return;
                setTakingDown(false);
                run(() => adminTakedownListing(p.id, reason), "اتوقف الإعلان");
              }}
            >
              أوقف الإعلان
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={deleting} onOpenChange={setDeleting}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>مسح الإعلان</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">هيتمسح الإعلان نهائيًا من المنصة. متأكد؟</p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleting(false)}>
              إلغاء
            </Button>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={() => {
                if (!p) return;
                setDeleting(false);
                run(() => adminDeleteListing(p.id), "اتمسح الإعلان", true);
              }}
            >
              امسحه
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  danger,
}: {
  icon: typeof ShieldCheck;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors disabled:opacity-50 ${
        danger
          ? "border-destructive/30 text-destructive hover:bg-destructive/10"
          : "border-border text-foreground hover:bg-muted"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

export type { AdminListing };
