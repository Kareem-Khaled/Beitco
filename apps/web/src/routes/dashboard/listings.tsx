import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, Pause, Play, Trash2, Plus, ChevronDown, BedDouble, DoorOpen, Home, Pencil, User, Calendar, BadgeCheck, Tag, Clock, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/beitco/auth";
import { getPropertiesByOwner, saveProperty, deleteProperty, timeAgo } from "@/lib/beitco/store";
import type { Property, BedStatus, Occupant, SaleStatus } from "@/lib/beitco/types";
import { Button } from "@/components/ui/button";
import { OccupancyDialog } from "@/components/beitco/OccupancyDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/dashboard/listings")({
  component: DashboardListings,
});

function DashboardListings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [, force] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);
  const refresh = () => force((x) => x + 1);

  if (!user) return null;
  const properties = getPropertiesByOwner(user.id);

  const togglePause = (p: Property) => {
    saveProperty({ ...p, status: p.status === "paused" ? "published" : "paused" });
    refresh();
  };

  const setWholeOccupancy = (p: Property, status: BedStatus, occupant?: Occupant) => {
    saveProperty({ ...p, wholeStatus: status, wholeOccupant: occupant });
    refresh();
  };

  const setSaleStatus = (p: Property, saleStatus: SaleStatus) => {
    saveProperty({ ...p, saleStatus });
    refresh();
  };

  const setRoomOccupancy = (p: Property, roomId: string, status: BedStatus, occupant?: Occupant) => {
    saveProperty({
      ...p,
      rooms: (p.rooms ?? []).map((r) =>
        r.id === roomId ? { ...r, status, occupant } : r,
      ),
    });
    refresh();
  };

  const setBedOccupancy = (
    p: Property,
    roomId: string,
    bedId: string,
    status: BedStatus,
    occupant?: Occupant,
  ) => {
    saveProperty({
      ...p,
      rooms: (p.rooms ?? []).map((r) =>
        r.id === roomId
          ? {
              ...r,
              beds: r.beds.map((b) => (b.id === bedId ? { ...b, status, occupant } : b)),
            }
          : r,
      ),
    });
    refresh();
  };

  const onDelete = (id: string) => {
    deleteProperty(id);
    refresh();
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">شققي</h1>
          <p className="text-sm text-muted-foreground">إدارة الشقق والأوض والأسرّة الفاضية.</p>
        </div>
        <Button asChild>
          <Link to="/list/new">
            <Plus className="me-1 h-4 w-4" />
            حط شقة جديدة
          </Link>
        </Button>
      </header>

      {properties.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
          <p className="text-sm text-muted-foreground">لسه ما حطّيتش ولا شقة.</p>
          <Button asChild className="mt-4">
            <Link to="/list/new">حط شقتك دلوقتي</Link>
          </Button>
        </div>
      ) : (
        <ul className="grid gap-3">
          {properties.map((p) => {
            const open = expanded === p.id;
            return (
              <li key={p.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-start gap-4">
                  <div className="h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-muted">
                    {p.image ? (
                      <img src={p.image} alt={p.title} className="h-full w-full object-cover" />
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-base font-semibold">{p.title}</h3>
                      <StatusPill status={p.status} />
                      <ModeBadge p={p} />
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">{p.area}</p>
                    <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      اتنشر {timeAgo(p.createdAt)}
                    </p>
                    <p className="mt-1 font-display text-sm tabular-nums">
                      {!p.listingType?.includes("sale") && p.rentalMode && p.rentalMode !== "whole" ? (
                        <span className="text-xs font-normal text-muted-foreground">يبدأ من </span>
                      ) : null}
                      {(p.priceFrom ?? p.price).toLocaleString("ar-EG-u-nu-latn")}{" "}
                      <span className="text-xs font-normal text-muted-foreground">
                        {p.listingType === "sale" ? "ج.م" : "ج.م/شهر"}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {p.listingType === "sale"
                        ? p.saleStatus === "sold"
                          ? "اتباعت"
                          : "متاحة للبيع"
                        : `فاضي ${p.beds.available} من ${p.beds.total}`}
                    </p>

                    {/* Moderation feedback to the owner (MOD-1) */}
                    {p.status === "pending_approval" ? (
                      <p className="mt-2 inline-flex items-start gap-1.5 rounded-lg bg-blue-500/10 px-2.5 py-1.5 text-[11px] text-blue-600 dark:text-blue-400">
                        <Clock className="mt-0.5 h-3 w-3 shrink-0" />
                        بنراجع الإعلان دلوقتي — هيظهر للناس بعد ما نوافق عليه.
                      </p>
                    ) : p.status === "rejected" ? (
                      <div className="mt-2 rounded-lg border-s-2 border-red-500 bg-red-500/10 px-2.5 py-1.5 text-[11px] text-red-600 dark:text-red-400">
                        <span className="inline-flex items-center gap-1 font-medium">
                          <AlertCircle className="h-3 w-3" />
                          اترفض الإعلان
                        </span>
                        {p.rejectionReason ? <p className="mt-0.5 text-foreground/80">{p.rejectionReason}</p> : null}
                        <p className="mt-1">عدّل الإعلان وابعته تاني للمراجعة.</p>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate({ to: "/property/$id", params: { id: p.id } })}
                      >
                        <Eye className="me-1 h-4 w-4" />
                        شوفها
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate({ to: "/list/new", search: { edit: p.id } })}
                      >
                        <Pencil className="me-1 h-4 w-4" />
                        عدّل
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => togglePause(p)}>
                        {p.status === "paused" ? (
                          <>
                            <Play className="me-1 h-4 w-4" />
                            رجّعها
                          </>
                        ) : (
                          <>
                            <Pause className="me-1 h-4 w-4" />
                            وقّفها
                          </>
                        )}
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-red-600"
                            aria-label="امسح"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent dir="rtl">
                          <AlertDialogHeader>
                            <AlertDialogTitle>متأكد إنك عايز تمسح الشقة دي؟</AlertDialogTitle>
                            <AlertDialogDescription>
                              هتختفي خالص من الموقع. الخطوة دي مش بترجع.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>لأ، خليني</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-600 hover:bg-red-700"
                              onClick={() => onDelete(p.id)}
                            >
                              امسحها
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>

                    <button
                      type="button"
                      onClick={() => setExpanded(open ? null : p.id)}
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      إدارة الإتاحة
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
                    </button>
                  </div>
                </div>

                {open ? (
                  <div className="mt-4 border-t border-border pt-4">
                    {p.listingType === "sale" ? (
                      <div className="flex items-center justify-between gap-2 rounded-xl bg-surface p-3">
                        <span className="text-sm font-medium">حالة البيع</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSaleStatus(p, "available")}
                            className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                              (p.saleStatus ?? "available") === "available"
                                ? "border-trust bg-trust text-trust-foreground"
                                : "border-border bg-background text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            متاحة
                          </button>
                          <button
                            type="button"
                            onClick={() => setSaleStatus(p, "sold")}
                            className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                              p.saleStatus === "sold"
                                ? "border-trust bg-trust text-trust-foreground"
                                : "border-border bg-background text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            اتباعت
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="mb-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <Pencil className="h-3 w-3" />
                          اضغط على حالة أي وحدة (فاضي / محجوز / متأجّر) عشان تغيّرها وتسجّل بيانات الساكن.
                        </p>
                        <AvailabilityManager
                          p={p}
                          onSetWhole={(status, occupant) => setWholeOccupancy(p, status, occupant)}
                          onSetRoom={(roomId, status, occupant) =>
                            setRoomOccupancy(p, roomId, status, occupant)
                          }
                          onSetBed={(roomId, bedId, status, occupant) =>
                            setBedOccupancy(p, roomId, bedId, status, occupant)
                          }
                        />
                      </>
                    )}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function AvailabilityManager({
  p,
  onSetWhole,
  onSetRoom,
  onSetBed,
}: {
  p: Property;
  onSetWhole: (status: BedStatus, occupant?: Occupant) => void;
  onSetRoom: (roomId: string, status: BedStatus, occupant?: Occupant) => void;
  onSetBed: (roomId: string, bedId: string, status: BedStatus, occupant?: Occupant) => void;
}) {
  if (p.rentalMode === "whole" || !p.rentalMode) {
    return (
      <div className="rounded-xl bg-surface p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">الشقة بالكامل</span>
          <UnitOccupancy
            unitLabel="الشقة"
            status={p.wholeStatus ?? "available"}
            occupant={p.wholeOccupant}
            onSave={onSetWhole}
          />
        </div>
        <OccupantLine occupant={p.wholeOccupant} status={p.wholeStatus ?? "available"} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {(p.rooms ?? []).map((room) => (
        <div key={room.id} className="rounded-xl border border-border bg-surface p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium">{room.name}</span>
            {p.rentalMode === "by_room" ? (
              <div className="flex items-center gap-2">
                <span className="text-xs tabular-nums text-muted-foreground">
                  {(room.price ?? 0).toLocaleString("ar-EG-u-nu-latn")} ج.م
                </span>
                <UnitOccupancy
                  unitLabel={room.name}
                  status={room.status ?? "available"}
                  occupant={room.occupant}
                  onSave={(status, occupant) => onSetRoom(room.id, status, occupant)}
                />
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">
                {room.beds.filter((b) => b.status === "available").length} فاضي من {room.beds.length}
              </span>
            )}
          </div>

          {p.rentalMode === "by_room" ? (
            <OccupantLine occupant={room.occupant} status={room.status ?? "available"} />
          ) : null}

          {p.rentalMode === "by_bed" ? (
            <ul className="mt-2 space-y-1.5">
              {room.beds.map((bed) => (
                <li
                  key={bed.id}
                  className="rounded-lg bg-background px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm">
                      {bed.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {bed.price.toLocaleString("ar-EG-u-nu-latn")} ج.م
                      </span>
                      <UnitOccupancy
                        unitLabel={bed.label}
                        status={bed.status}
                        occupant={bed.occupant}
                        onSave={(status, occupant) => onSetBed(room.id, bed.id, status, occupant)}
                      />
                    </div>
                  </div>
                  <OccupantLine occupant={bed.occupant} status={bed.status} />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ))}
    </div>
  );
}

// Pill + dialog: click the pill to change status and (optionally) record renter info.
function UnitOccupancy({
  unitLabel,
  status,
  occupant,
  onSave,
}: {
  unitLabel: string;
  status: BedStatus;
  occupant?: Occupant;
  onSave: (status: BedStatus, occupant?: Occupant) => void;
}) {
  const [open, setOpen] = useState(false);
  const meta: Record<BedStatus, { dot: string; label: string; ring: string }> = {
    available: {
      dot: "bg-emerald-500",
      label: "فاضي",
      ring: "hover:border-emerald-500/50 hover:bg-emerald-500/10",
    },
    reserved: {
      dot: "bg-amber-500",
      label: "محجوز",
      ring: "hover:border-amber-500/50 hover:bg-amber-500/10",
    },
    occupied: {
      dot: "bg-muted-foreground",
      label: "متأجّر",
      ring: "hover:border-foreground/30 hover:bg-muted",
    },
  };
  const m = meta[status];
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="اضغط لتغيير الحالة"
        aria-label={`غيّر حالة ${unitLabel} — الحالة الحالية ${m.label}`}
        className={`group inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-medium shadow-sm transition-colors ${m.ring} focus:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
      >
        <span className={`h-2 w-2 rounded-full ${m.dot}`} />
        <span>{m.label}</span>
        <ChevronDown className="h-3 w-3 text-muted-foreground transition-transform group-hover:translate-y-px" />
      </button>
      <OccupancyDialog
        open={open}
        onOpenChange={setOpen}
        unitLabel={unitLabel}
        status={status}
        occupant={occupant}
        onSave={onSave}
      />
    </>
  );
}

// Compact, owner-only summary of the recorded renter under a reserved/occupied unit.
function OccupantLine({ occupant, status }: { occupant?: Occupant; status: BedStatus }) {
  if (status === "available" || !occupant) return null;
  const hasAny =
    occupant.name || occupant.phone || occupant.moveInDate || occupant.notes || occupant.userId;
  if (!hasAny) return null;
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 ps-1 text-[11px] text-muted-foreground">
      {occupant.name ? (
        <span className="inline-flex items-center gap-1">
          <User className="h-3 w-3" />
          {occupant.name}
        </span>
      ) : null}
      {occupant.userId ? (
        <span className="inline-flex items-center gap-1 text-trust">
          <BadgeCheck className="h-3 w-3" />
          حساب بيتكو
        </span>
      ) : null}
      {occupant.phone ? <span dir="ltr">{occupant.phone}</span> : null}
      {occupant.moveInDate ? (
        <span className="inline-flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {new Date(occupant.moveInDate).toLocaleDateString("ar-EG-u-nu-latn")}
        </span>
      ) : null}
      {occupant.notes ? <span className="truncate">· {occupant.notes}</span> : null}
    </div>
  );
}

function ModeBadge({ p }: { p: Property }) {
  if (p.listingType === "sale") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-foreground">
        <Tag className="h-3 w-3" />
        للبيع
      </span>
    );
  }
  const map = {
    whole: { icon: Home, label: "الشقة كاملة" },
    by_room: { icon: DoorOpen, label: "بالأوضة" },
    by_bed: { icon: BedDouble, label: "بالسرير" },
  } as const;
  const m = p.rentalMode ? map[p.rentalMode] : null;
  if (!m) {
    return (
      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
        {p.type}
      </span>
    );
  }
  const Icon = m.icon;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
      <Icon className="h-3 w-3" />
      {m.label}
    </span>
  );
}

function StatusPill({ status }: { status: Property["status"] }) {
  const map: Record<Property["status"], { tone: string; label: string }> = {
    published: { tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", label: "شغّالة" },
    paused: { tone: "bg-muted text-muted-foreground", label: "موقوفة" },
    draft: { tone: "bg-amber-500/10 text-amber-600 dark:text-amber-400", label: "مسودة" },
    pending_approval: { tone: "bg-blue-500/10 text-blue-600 dark:text-blue-400", label: "بنراجعها" },
    rejected: { tone: "bg-red-500/10 text-red-600 dark:text-red-400", label: "اترفضت" },
  };
  const s = map[status];
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${s.tone}`}>{s.label}</span>;
}
