import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Search, ShieldCheck, ShieldX, Ban, RotateCcw, Crown, X, Phone, Star } from "lucide-react";
import {
  useAdminUsers,
  useAdminUser,
  adminUpdateUser,
  adminUserAction,
} from "@/lib/beitco/queries";
import { useAuth } from "@/lib/beitco/auth";
import { formatDate } from "@/lib/beitco/store";
import type { AdminUser, AdminUserDetail } from "@/lib/beitco/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export const Route = createFileRoute("/admin/users")({
  component: AdminUsers,
});

const ROLE_LABEL: Record<string, string> = { renter: "ساكن", owner: "مالك", both: "الاتنين" };

const ROLE_FILTERS = [
  { id: undefined, label: "الكل" },
  { id: "renter", label: "ساكنين" },
  { id: "owner", label: "ملّاك" },
  { id: "both", label: "الاتنين" },
] as const;

const STATUS_FILTERS = [
  { id: undefined, label: "كل الحالات" },
  { id: "active", label: "شغّالين" },
  { id: "banned", label: "موقوفين" },
  { id: "pending", label: "مستنيين توثيق" },
] as const;

function AdminUsers() {
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);

  const {
    items: users,
    isLoading,
    hasMore,
    fetchMore,
    isFetchingMore,
  } = useAdminUsers({ q: search || undefined, role, status });

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight">المستخدمين</h1>
        <p className="text-sm text-muted-foreground">دوّر على أي حساب وتحكّم فيه.</p>
      </header>

      {/* Search */}
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
          placeholder="دوّر بالاسم أو رقم الموبايل…"
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

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <FilterRow value={role} options={ROLE_FILTERS} onChange={setRole} />
        <FilterRow value={status} options={STATUS_FILTERS} onChange={setStatus} />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="border-b border-border bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
          {isLoading
            ? "بنحمّل…"
            : `${users.length.toLocaleString("ar-EG-u-nu-latn")}${hasMore ? "+" : ""} حساب`}
        </div>
        <ul className="divide-y divide-border">
          {users.map((u) => (
            <li key={u.id}>
              <button
                onClick={() => setSelectedId(u.id)}
                className="flex w-full items-center gap-3 px-4 py-3 text-start transition-colors hover:bg-muted/40"
              >
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                  {u.name.slice(0, 2)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                    {u.name}
                    {u.isAdmin ? <Crown className="h-3.5 w-3.5 text-amber-500" /> : null}
                    {u.verified ? <ShieldCheck className="h-3.5 w-3.5 text-trust" /> : null}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {u.phone} · {ROLE_LABEL[u.role] ?? u.role}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {u.banned ? (
                    <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive">
                      موقوف
                    </span>
                  ) : null}
                  <span className="inline-flex items-center gap-0.5 text-xs tabular-nums text-muted-foreground">
                    <Star className="h-3 w-3 text-trust" />
                    {u.trust.toLocaleString("ar-EG")}
                  </span>
                </div>
              </button>
            </li>
          ))}
          {!isLoading && users.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-muted-foreground">ما لقيناش حد</li>
          ) : null}
        </ul>
        {hasMore ? (
          <div className="border-t border-border p-3 text-center">
            <Button variant="outline" size="sm" onClick={() => fetchMore()} disabled={isFetchingMore}>
              {isFetchingMore ? "بنحمّل…" : "شوف المزيد"}
            </Button>
          </div>
        ) : null}
      </div>

      <UserDetailSheet
        id={selectedId}
        onClose={() => setSelectedId(undefined)}
        onChanged={() => {
          /* list refetch handled by query invalidation in the sheet */
        }}
      />
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

function UserDetailSheet({
  id,
  onClose,
  onChanged,
}: {
  id: string | undefined;
  onClose: () => void;
  onChanged: () => void;
}) {
  const { user: me } = useAuth();
  const qc = useQueryClient();
  const { data: u } = useAdminUser(id);
  const [banning, setBanning] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["adminUsers"] });
    qc.invalidateQueries({ queryKey: ["adminUser", id] });
    qc.invalidateQueries({ queryKey: ["adminStats"] });
    onChanged();
  };

  const isSelf = !!me && !!u && me.id === u.id;

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    try {
      await fn();
      toast.success(ok);
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "حصل خطأ");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Sheet open={!!id} onOpenChange={(open) => !open && onClose()}>
        <SheetContent side="left" className="w-full overflow-y-auto sm:max-w-md" dir="rtl">
          {u ? (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  {u.name}
                  {u.isAdmin ? <Crown className="h-4 w-4 text-amber-500" /> : null}
                  {u.verified ? <ShieldCheck className="h-4 w-4 text-trust" /> : null}
                </SheetTitle>
              </SheetHeader>

              <div className="mt-4 space-y-5">
                {u.banned ? (
                  <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm">
                    <p className="font-medium text-destructive">الحساب موقوف</p>
                    {u.banReason ? (
                      <p className="mt-0.5 text-xs text-muted-foreground">{u.banReason}</p>
                    ) : null}
                  </div>
                ) : null}

                {/* Identity */}
                <div className="space-y-1.5 text-sm">
                  <DetailRow icon={Phone} label="الموبايل" value={u.phone} />
                  <DetailRow label="النوع" value={ROLE_LABEL[u.role] ?? u.role} />
                  <DetailRow label="الثقة" value={u.trust.toLocaleString("ar-EG")} />
                  <DetailRow label="التوثيق" value={statusLabel(u.verificationStatus)} />
                  <DetailRow label="اشترك" value={formatDate(u.createdAt)} />
                </div>

                {/* Activity counts */}
                <div className="grid grid-cols-3 gap-2">
                  <CountCell label="إعلانات" value={u.counts.listings} />
                  <CountCell label="طلبات" value={u.counts.leads} />
                  <CountCell label="سكنات" value={u.counts.tenancies} />
                  <CountCell label="تقييمات كتبها" value={u.counts.reviewsAuthored} />
                  <CountCell label="تقييمات عنه" value={u.counts.reviewsReceived} />
                  <CountCell label="محادثات" value={u.counts.threads} />
                </div>

                {/* Actions */}
                {isSelf ? (
                  <p className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                    ده حسابك إنت  -  مش هتقدر توقفه أو تغيّر صلاحياته من هنا.
                  </p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">إجراءات</p>
                    <div className="grid grid-cols-2 gap-2">
                      {u.verified ? (
                        <ActionButton
                          icon={ShieldX}
                          label="شيل التوثيق"
                          disabled={busy}
                          onClick={() =>
                            run(() => adminUpdateUser(u.id, { verified: false }), "اتشال التوثيق")
                          }
                        />
                      ) : (
                        <ActionButton
                          icon={ShieldCheck}
                          label="وثّقه"
                          disabled={busy}
                          onClick={() =>
                            run(() => adminUpdateUser(u.id, { verified: true }), "اتوثّق")
                          }
                        />
                      )}

                      {u.banned ? (
                        <ActionButton
                          icon={RotateCcw}
                          label="رجّعه"
                          disabled={busy}
                          onClick={() =>
                            run(() => adminUserAction(u.id, "reinstate"), "رجع الحساب")
                          }
                        />
                      ) : (
                        <ActionButton
                          icon={Ban}
                          danger
                          label="أوقفه"
                          disabled={busy}
                          onClick={() => {
                            setBanReason("");
                            setBanning(true);
                          }}
                        />
                      )}

                      {u.isAdmin ? (
                        <ActionButton
                          icon={Crown}
                          label="اسحب الأدمن"
                          disabled={busy}
                          onClick={() =>
                            run(() => adminUserAction(u.id, "revoke-admin"), "اتسحبت صلاحية الأدمن")
                          }
                        />
                      ) : (
                        <ActionButton
                          icon={Crown}
                          label="خلّيه أدمن"
                          disabled={busy}
                          onClick={() => run(() => adminUserAction(u.id, "make-admin"), "بقى أدمن")}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
              لحظة…
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Ban reason dialog */}
      <Dialog open={banning} onOpenChange={setBanning}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>إيقاف الحساب</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            هتكتب السبب اللي هيتبعت للمستخدم. الإجراء ده بيتسجّل في سجل الأدمن.
          </p>
          <Textarea
            value={banReason}
            onChange={(e) => setBanReason(e.target.value)}
            placeholder="مثلاً: إعلانات وهمية متكررة"
            rows={3}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setBanning(false)}>
              إلغاء
            </Button>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={async () => {
                if (!u) return;
                setBanning(false);
                await run(() => adminUserAction(u.id, "ban", banReason), "اتوقف الحساب");
              }}
            >
              أوقف الحساب
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function statusLabel(s: string): string {
  return s === "verified" ? "موثّق" : s === "pending" ? "بيتراجع" : "مش موثّق";
}

function DetailRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: typeof Phone;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
        {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
        {label}
      </span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}

function CountCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-2.5 text-center">
      <p className="font-display text-lg font-semibold tabular-nums">
        {value.toLocaleString("ar-EG-u-nu-latn")}
      </p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
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

export type { AdminUser, AdminUserDetail };
