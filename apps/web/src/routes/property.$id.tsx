import { createFileRoute, Link, notFound, useNavigate, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  MapPin,
  ShieldCheck,
  Star,
  Users,
  Wifi,
  Snowflake,
  WashingMachine,
  Microwave,
  Refrigerator,
  ArrowUpDown,
  Car,
  Lock,
  Sofa,
  Coffee,
  MessageCircle,
  Heart,
  Share2,
  ChevronRight,
  BedDouble,
  CheckCircle2,
  HelpCircle,
  Pencil,
  DoorOpen,
  Home,
  Bath,
  Layers,
  Maximize,
  TrainFront,
  GraduationCap,
  Bus,
  ShoppingBag,
  Stethoscope,
  Store,
  Sparkles,
  Footprints,
  Mars,
  Venus,
  CalendarDays,
  Check,
  ThumbsUp,
  CornerDownLeft,
} from "lucide-react";
import { SiteHeader } from "@/components/beitco/SiteHeader";
import { SiteFooter } from "@/components/beitco/SiteFooter";
import { TrustBadge } from "@/components/beitco/TrustBadge";
import { TrustBadgeExplained } from "@/components/beitco/TrustBadgeExplained";
import { ScoreBar } from "@/components/beitco/ScoreBar";
import { PropertyGallery } from "@/components/beitco/PropertyGallery";
import { PageSkeleton } from "@/components/beitco/PageSkeleton";
import { ReportButton } from "@/components/beitco/ReportButton";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getProperty, timeAgo, formatDate } from "@/lib/beitco/store";
import { USE_API, apiGetProperty } from "@/lib/beitco/api";
import {
  useSavedListings,
  toggleSavedListing,
  submitLead,
  submitQuestion,
  submitAnswer,
  useReviewMeta,
  submitReview,
  toggleHelpful,
  replyReview,
  startThread,
  sendChatMessage,
} from "@/lib/beitco/queries";
import { useAuth } from "@/lib/beitco/auth";
import { toast } from "sonner";
import { ViewingRequestDialog } from "@/components/beitco/ViewingRequestDialog";
import { ReviewDialog, type ReviewSubmit } from "@/components/beitco/ReviewDialog";
import { QuestionDialog } from "@/components/beitco/QuestionDialog";
import type { Property, Room, BedStatus, NearbyType, LeadUnit } from "@/lib/beitco/types";

export const Route = createFileRoute("/property/$id")({
  loader: async ({ params }) => {
    // API-aware (B-1): with the flag on, fetch from the backend; otherwise read
    // the localStorage mock synchronously. Feeds both head() (SEO) and the page.
    if (USE_API) {
      const fromApi = await apiGetProperty(params.id);
      if (!fromApi) throw notFound();
      return fromApi;
    }
    const property = getProperty(params.id);
    if (!property) throw notFound();
    return property;
  },
  head: ({ loaderData }) => {
    const p = loaderData;
    if (!p) {
      return {
        meta: [
          { title: "بيت — بيتون" },
          {
            name: "description",
            content: "سكن متأكدين منه، بآراء حقيقية ومعلومات عن المنطقة على بيتون.",
          },
        ],
      };
    }
    const kind = p.listingType === "sale" ? "للبيع" : "للإيجار";
    const title = `${p.title} — ${p.area} | بيتون`;
    const priceNum = p.listingType === "sale" ? (p.salePrice ?? p.price) : (p.priceFrom ?? p.price);
    const price = priceNum.toLocaleString("ar-EG-u-nu-latn");
    const unit = p.listingType === "sale" ? "ج.م" : "ج.م/شهر";
    const description = `${p.type} ${kind} في ${p.area} — ${price} ${unit}. درجة الثقة ${p.trust.toFixed(1)}، ${p.reviewsCount.toLocaleString("ar-EG-u-nu-latn")} رأي من ساكنين حقيقيين على بيتون.`;
    const image = p.image || "/og.svg";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:image", content: image },
        { property: "og:locale", content: "ar_EG" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: image },
      ],
    };
  },
  component: PropertyPage,
});

const amenityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  نت: Wifi,
  تكييف: Snowflake,
  غسالة: WashingMachine,
  ميكروويف: Microwave,
  تلاجة: Refrigerator,
  أسانسير: ArrowUpDown,
  جراج: Car,
  أمن: Lock,
  مفروشة: Sofa,
  "مطبخ مشترك": Coffee,
  "نضافة أسبوعية": Sofa,
  "مكان شغل": Sofa,
};

function iconFor(name: string) {
  const key = Object.keys(amenityIcons).find((k) => name.startsWith(k));
  return amenityIcons[key ?? ""] ?? CheckCircle2;
}

function PropertyPage() {
  const { id } = Route.useParams();
  const { user, isLoading } = useAuth();
  const loaderData = Route.useLoaderData() as Property;
  // Mock path re-reads the store for live updates; API path uses loader data.
  const p = USE_API ? loaderData : getProperty(id)!;

  // Avoid flashing the gate before auth hydrates.
  if (isLoading) return <PageSkeleton variant="detail" />;
  // Un-authenticated users see a teaser only — full details are gated behind sign-in.
  if (!user) return <PropertyGate p={p} />;
  return <PropertyDetail />;
}

// Teaser shown to logged-out visitors: enough to entice (cover, title, area,
// price, trust) but the real details (reviews, owner, rooms, contact) are gated.
function PropertyGate({ p }: { p: Property }) {
  const isSale = p.listingType === "sale";
  const price = (isSale ? (p.salePrice ?? p.price) : (p.priceFrom ?? p.price)).toLocaleString(
    "ar-EG-u-nu-latn",
  );
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6">
        <Link
          to="/search"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronRight className="h-4 w-4" /> ارجع للاستكشاف
        </Link>

        <div className="mt-4 overflow-hidden rounded-3xl border border-border bg-card">
          {/* Cover teaser */}
          <div className="relative aspect-[16/9] bg-muted">
            {p.image ? (
              <img src={p.image} alt={p.title} className="h-full w-full object-cover" />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 text-white">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium backdrop-blur">
                  {p.type}
                </span>
                {p.verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-trust px-2 py-0.5 text-xs font-medium text-trust-foreground">
                    <ShieldCheck className="h-3 w-3" /> موثّق
                  </span>
                )}
              </div>
              <h1 className="mt-2 font-display text-xl font-semibold sm:text-2xl">{p.title}</h1>
              <div className="mt-1 flex items-center gap-1 text-sm text-white/80">
                <MapPin className="h-4 w-4" /> {p.area}
              </div>
            </div>
          </div>

          {/* Price + trust strip */}
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div className="font-display text-xl font-semibold tabular-nums">
              {price}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                {isSale ? "ج.م" : "ج.م/شهر"}
              </span>
            </div>
            <TrustBadge score={p.trust} />
          </div>

          {/* Locked details CTA */}
          <div className="p-8 text-center">
            <span className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-trust-soft text-trust">
              <Lock className="h-6 w-6" />
            </span>
            <h2 className="font-display text-lg font-semibold">التفاصيل الكاملة للأعضاء</h2>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              سجّل دخولك أو اعمل حساب بسرعة (بالموبايل بس) عشان تشوف الآراء، درجات الجودة، تفاصيل الأوض
              والسراير، وتكلّم صاحب البيت.
            </p>
            <Button asChild size="lg" className="mt-4">
              <Link to="/auth/login">سجّل دخولك عشان تشوف التفاصيل</Link>
            </Button>
            <p className="mt-3 text-xs text-muted-foreground">التسجيل مجاني وبياخد دقيقة.</p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function PropertyDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const router = useRouter();
  const { user } = useAuth();
  const loaderData = Route.useLoaderData() as Property;
  const p = USE_API ? loaderData : getProperty(id)!;
  const isSale = p.listingType === "sale";
  const [viewingOpen, setViewingOpen] = useState(false);
  // The specific bed(s)/room(s) the renter is booking (empty = generic viewing).
  const [bookingUnits, setBookingUnits] = useState<LeadUnit[]>([]);
  const qc = useQueryClient();
  const { data: savedList = [] } = useSavedListings(user?.id);
  // Optimistic override so the heart flips instantly; falls back to the cache.
  const [savedOverride, setSavedOverride] = useState<boolean | null>(null);
  const saved = savedOverride ?? savedList.some((s) => s.id === id);
  const totalCost = p.costs.reduce((s, c) => s + c.amount, 0);
  const avgQuality =
    Object.values(p.quality).reduce((s, v) => s + v, 0) / Object.values(p.quality).length;

  const requireAuth = () => {
    if (!user) {
      navigate({ to: "/auth/login" });
      return false;
    }
    if (user.id === p.ownerId) {
      alert("دي شقتك!");
      return false;
    }
    return true;
  };

  const onMessageOwner = async () => {
    if (!requireAuth() || !user) return;
    const t = await startThread(p.id, user.id);
    if (t.messages.length === 0) {
      await sendChatMessage(
        t.id,
        user.id,
        `أهلاً، أنا مهتم بـ "${p.title}". ممكن أعرف تفاصيل أكتر؟`,
      );
    }
    navigate({ to: "/messages/$threadId", params: { threadId: t.id } });
  };

  // Open the request dialog targeting one or more specific beds/rooms.
  const requestBooking = (units: LeadUnit[]) => {
    if (!requireAuth() || units.length === 0) return;
    setBookingUnits(units);
    setViewingOpen(true);
  };

  const onSubmitViewing = async (data: { preferredDate?: string; note?: string }) => {
    if (!user) return;
    const units = bookingUnits.length ? bookingUnits : undefined;
    await submitLead({
      propertyId: p.id,
      renterId: user.id,
      renterName: user.name,
      intent: units ? "booking" : "viewing",
      units,
      preferredDate: data.preferredDate,
      note: data.note,
    });
    qc.invalidateQueries({ queryKey: ["renterLeads", user.id] });
    const t = await startThread(p.id, user.id);
    const dateStr = data.preferredDate
      ? ` يوم ${new Date(data.preferredDate).toLocaleDateString("ar-EG-u-nu-latn")}`
      : "";
    let body: string;
    if (units) {
      const total = units.reduce((s, u) => s + (u.price ?? 0), 0);
      // Group beds by their room so the owner knows exactly which bed in which
      // room (bed labels like "سرير 1" repeat across rooms).
      const beds = units.filter((u) => u.kind === "bed");
      const rooms = units.filter((u) => u.kind === "room");
      const lines: string[] = [];

      if (beds.length) {
        const byRoom = new Map<string, { roomName: string; beds: string[] }>();
        for (const b of beds) {
          const key = b.roomId ?? b.roomName ?? "—";
          if (!byRoom.has(key)) byRoom.set(key, { roomName: b.roomName ?? "أوضة", beds: [] });
          byRoom.get(key)!.beds.push(b.label);
        }
        for (const { roomName, beds: bedLabels } of byRoom.values()) {
          lines.push(`• ${roomName}: ${bedLabels.join("، ")}`);
        }
      }
      for (const r of rooms) {
        lines.push(`• ${r.label} (الأوضة كاملة)`);
      }

      const count = units.length;
      const header =
        count === 1 ? "طلبت أحجز:" : `طلبت أحجز ${count.toLocaleString("ar-EG-u-nu-latn")} وحدات:`;
      const totalLine = total
        ? `\nالإجمالي: ${total.toLocaleString("ar-EG-u-nu-latn")} ج.م/شهر`
        : "";
      body = `${header}\n${lines.join("\n")}${totalLine}${dateStr ? `\nالميعاد:${dateStr}` : ""}${data.note ? `\n${data.note}` : ""}`;
    } else {
      body = `طلبت معاينة${dateStr}.${data.note ? `\n${data.note}` : ""}`;
    }
    await sendChatMessage(t.id, user.id, body, "viewing_request");
    setBookingUnits([]);
    navigate({ to: "/messages/$threadId", params: { threadId: t.id } });
  };

  const onSave = async () => {
    if (!requireAuth() || !user) return;
    const isSaved = await toggleSavedListing(user.id, p.id);
    setSavedOverride(isSaved);
    qc.invalidateQueries({ queryKey: ["saved", user.id] });
    toast.success(isSaved ? "اتحفظت في المحفوظات" : "اتشالت من المحفوظات");
  };

  const onShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const shareData = {
      title: p.title,
      text: `شوف الإعلان ده على بيتون: ${p.title}`,
      url,
    };
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share(shareData);
        return;
      }
      throw new Error("no-share");
    } catch (err) {
      // User cancelled the native share sheet — stay silent.
      if (err instanceof DOMException && err.name === "AbortError") return;
      try {
        await navigator.clipboard.writeText(url);
        toast.success("اتنسخ اللينك — ابعته لأي حد");
      } catch {
        toast.error("مقدرناش ننسخ اللينك");
      }
    }
  };

  const [reviewOpen, setReviewOpen] = useState(false);
  const [questionOpen, setQuestionOpen] = useState(false);
  const [reviewSort, setReviewSort] = useState<"newest" | "highest" | "lowest" | "helpful">(
    "newest",
  );
  const [, force] = useState(0);
  const refresh = () => force((x) => x + 1);
  // After a Q&A/review mutation: mock re-reads the store via a local re-render;
  // API re-runs the route loader so the fresh property is shown.
  const refreshDetail = async () => {
    if (USE_API) await router.invalidate();
    else refresh();
  };

  const isOwner = user?.id === p.ownerId;
  // Review context (eligibility + helpful-votes) — flag-aware, zero-flash mock.
  const { data: reviewMeta } = useReviewMeta(p.id, user?.id);
  const eligibleToReview = reviewMeta?.canReview ?? false;
  const votedReviewIds = reviewMeta?.votedReviewIds ?? [];
  const alreadyReviewed = user ? p.reviews.some((r) => r.author === user.name) : false;

  // After a review mutation: re-read the property (loader/store) and refresh the
  // per-user review meta (helpful-vote state, eligibility).
  const onReviewChange = async () => {
    await refreshDetail();
    qc.invalidateQueries({ queryKey: ["reviewMeta", p.id, user?.id] });
  };

  const onOpenReview = () => {
    if (!user) {
      navigate({ to: "/auth/login" });
      return;
    }
    if (!eligibleToReview) return;
    setReviewOpen(true);
  };

  const onSubmitReview = async (data: ReviewSubmit) => {
    if (!user) return;
    const initials = user.name
      .split(" ")
      .map((s) => s[0])
      .slice(0, 2)
      .join("");
    await submitReview(p.id, {
      author: user.name,
      initials,
      monthsLived: 1,
      rating: data.rating,
      body: data.body,
      scores: data.scores,
    });
    toast.success("اتنشر رأيك — شكراً! 🙏");
    await onReviewChange();
  };

  const onOpenQuestion = () => {
    if (!user) {
      navigate({ to: "/auth/login" });
      return;
    }
    setQuestionOpen(true);
  };

  const onSubmitQuestion = async (question: string) => {
    if (!user) return;
    await submitQuestion(p.id, user.name, question);
    toast.success("اتبعت سؤالك لصاحب البيت");
    await refreshDetail();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6 lg:px-8">
        {/* Back */}
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronRight className="h-4 w-4" /> ارجع للاستكشاف
        </Link>

        {/* Title row */}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                {p.type}
              </span>
              {isSale && (
                <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground">
                  للبيع
                </span>
              )}
              {p.rentToGender && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold text-white ${
                    p.rentToGender === "male_only" ? "bg-sky-500" : "bg-pink-500"
                  }`}
                >
                  {p.rentToGender === "male_only" ? (
                    <Mars className="h-3 w-3" />
                  ) : (
                    <Venus className="h-3 w-3" />
                  )}
                  {p.rentToGender === "male_only" ? "شباب" : "بنات"}
                </span>
              )}
              {p.verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-trust px-2 py-0.5 text-xs font-medium text-trust-foreground">
                  <ShieldCheck className="h-3 w-3" /> موثّق
                </span>
              )}
              <TrustBadge score={p.trust} />
            </div>
            <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              {p.title}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4" /> {p.address}
              </span>
              <span
                className="inline-flex items-center gap-1"
                title={`اتنشر ${formatDate(p.createdAt)}`}
              >
                <CalendarDays className="h-4 w-4" /> اتنشر {timeAgo(p.createdAt)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isOwner ? (
              <Button
                size="sm"
                className="gap-1.5"
                onClick={() => navigate({ to: "/list/new", search: { edit: p.id } })}
              >
                <Pencil className="h-4 w-4" />
                عدّل الإعلان
              </Button>
            ) : null}
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={onShare}>
              <Share2 className="h-4 w-4" />
              شير
            </Button>
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={onSave}>
              <Heart className={`h-4 w-4 ${saved ? "fill-red-500 text-red-500" : ""}`} />
              {saved ? "محفوظة" : "احفظ"}
            </Button>
          </div>
        </div>

        {/* Gallery */}
        <PropertyGallery images={p.images} alt={p.title} />

        {/* Body */}
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          <div className="flex flex-col gap-10">
            {/* Trust section */}
            <section className="rounded-3xl border border-border bg-surface p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold">الثقة والتوثيق</h2>
                <TrustBadgeExplained
                  score={p.trust}
                  verified={p.verified}
                  reviewsCount={p.reviewsCount}
                  responseRate={p.landlord.responseRate}
                  residents={p.residents}
                  breakdown={p.trustBreakdown}
                />
              </div>
              <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Stat
                  icon={ShieldCheck}
                  label="التوثيق"
                  value={p.verified ? "موثّق" : "لسه بيتراجع"}
                  tone={p.verified ? "trust" : "muted"}
                />
                <Stat icon={Star} label="الآراء" value={String(p.reviewsCount)} />
                <Stat icon={Users} label="ساكنين قبل كده" value={String(p.residents)} />
                <Stat
                  icon={MessageCircle}
                  label="بيرد بسرعة"
                  value={`${p.landlord.responseRate}%`}
                />
              </div>
            </section>

            {/* Housing quality */}
            <section>
              <div className="flex items-baseline justify-between">
                <h2 className="font-display text-lg font-semibold">جودة السكن</h2>
                <span className="text-sm text-muted-foreground">
                  المتوسط{" "}
                  <span className="font-semibold text-foreground">{avgQuality.toFixed(1)}</span> ·
                  من تقييم الساكنين
                </span>
              </div>
              <div className="mt-5 grid grid-cols-1 gap-x-8 gap-y-4 rounded-2xl border border-border bg-surface p-6 sm:grid-cols-2">
                <ScoreBar label="النت" value={p.quality.internet} />
                <ScoreBar label="الأمان" value={p.quality.safety} />
                <ScoreBar label="الهدوء (الأهدى أحسن)" value={p.quality.noise} />
                <ScoreBar label="الصيانة" value={p.quality.maintenance} />
                <ScoreBar label="النضافة" value={p.quality.cleanliness} />
              </div>
            </section>

            {/* Description */}
            <section>
              <h2 className="font-display text-lg font-semibold">عن المكان ده</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                {p.description}
              </p>
            </section>

            {/* Amenities */}
            <section>
              <h2 className="font-display text-lg font-semibold">اللي فيه</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {p.amenities.map((a) => {
                  const Icon = iconFor(a);
                  return (
                    <div
                      key={a}
                      className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3"
                    >
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-trust-soft text-primary">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="text-sm">{a}</span>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Apartment specs */}
            {p.spec && <SpecsSection p={p} />}

            {/* Location: map (always) + nearby places (when present) */}
            <LocationSection p={p} />

            {/* Rooms & pricing — not shown for sale listings (whole unit) */}
            {isSale ? null : p.rentalMode ? (
              <RoomsSection p={p} onBook={requestBooking} canBook={!isOwner} />
            ) : (
              p.beds && (
                <section className="rounded-3xl border border-border bg-surface p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BedDouble className="h-5 w-5 text-primary" />
                      <h2 className="font-display text-lg font-semibold">سكن مشترك</h2>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      فاضي {p.beds.total - p.beds.occupied} من {p.beds.total}
                    </span>
                  </div>
                  <div className="mt-5 grid grid-cols-4 gap-2 sm:grid-cols-8">
                    {Array.from({ length: p.beds.total }).map((_, i) => {
                      const occupied = i < p.beds!.occupied;
                      return (
                        <div
                          key={i}
                          className={`flex aspect-square flex-col items-center justify-center rounded-xl border ${
                            occupied
                              ? "border-border bg-muted text-muted-foreground"
                              : "border-trust/40 bg-trust-soft text-primary"
                          }`}
                        >
                          <BedDouble className="h-5 w-5" />
                          <span className="mt-1 text-[10px] font-medium">
                            {occupied ? "متحجوز" : "فاضي"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )
            )}

            {/* Reviews */}
            <section>
              <div className="flex items-baseline justify-between">
                <h2 className="font-display text-lg font-semibold">آراء الساكنين</h2>
                <span className="text-sm text-muted-foreground">{p.reviewsCount} رأي</span>
              </div>

              {!isOwner && (
                <div className="mt-3">
                  {alreadyReviewed ? (
                    <p className="rounded-xl bg-trust-soft px-4 py-2.5 text-sm text-foreground">
                      شكراً، إنت كتبت رأيك في المكان ده. 🙏
                    </p>
                  ) : eligibleToReview ? (
                    <Button size="sm" className="gap-1.5" onClick={onOpenReview}>
                      <Star className="h-4 w-4" />
                      قيّم سكنك
                    </Button>
                  ) : (
                    <p className="rounded-xl border border-dashed border-border bg-surface px-4 py-2.5 text-xs text-muted-foreground">
                      عشان تقدر تكتب رأيك، لازم تكون قعدت في المكان ده 30 يوم على الأقل. ده بيخلّي
                      الآراء موثوقة.
                    </p>
                  )}
                </div>
              )}

              <div className="mt-5 flex flex-col gap-3">
                {p.reviews.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-border bg-surface p-6 text-center text-sm text-muted-foreground">
                    لسه مفيش آراء. أول ساكن يكتب رأيه هيساعد ناس كتير.
                  </div>
                )}

                {p.reviews.length > 1 && (
                  <div className="flex flex-wrap gap-1.5">
                    {(
                      [
                        { id: "newest", label: "الأحدث" },
                        { id: "highest", label: "الأعلى تقييم" },
                        { id: "lowest", label: "الأقل تقييم" },
                        { id: "helpful", label: "الأكثر إفادة" },
                      ] as const
                    ).map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => setReviewSort(o.id)}
                        className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                          reviewSort === o.id
                            ? "border-trust bg-trust text-trust-foreground"
                            : "border-border bg-surface text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                )}

                {[...p.reviews]
                  .sort((a, b) => {
                    if (reviewSort === "highest") return b.rating - a.rating;
                    if (reviewSort === "lowest") return a.rating - b.rating;
                    if (reviewSort === "helpful") return (b.helpful ?? 0) - (a.helpful ?? 0);
                    return 0; // newest = stored order (newest unshifted)
                  })
                  .map((r) => (
                    <ReviewCard
                      key={r.id}
                      review={r}
                      propertyId={p.id}
                      isOwner={isOwner}
                      userId={user?.id}
                      voted={votedReviewIds.includes(r.id)}
                      onChange={onReviewChange}
                    />
                  ))}
              </div>
            </section>

            {/* Q&A */}
            <section>
              <div className="flex items-baseline justify-between">
                <h2 className="font-display text-lg font-semibold">أسئلة وأجوبة</h2>
                <Button size="sm" variant="ghost" className="gap-1.5" onClick={onOpenQuestion}>
                  <HelpCircle className="h-4 w-4" />
                  اسأل سؤال
                </Button>
              </div>
              <div className="mt-5 flex flex-col gap-3">
                {p.qa.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-border bg-surface p-6 text-center text-sm text-muted-foreground">
                    لسه مفيش أسئلة. كن أول واحد يسأل.
                  </div>
                )}
                {p.qa.map((q) => (
                  <article key={q.id} className="rounded-2xl border border-border bg-surface p-5">
                    <div className="text-sm font-medium">{q.q}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      سأل {q.asker} · {q.date}
                    </div>
                    {q.a ? (
                      <div className="mt-3 rounded-xl bg-trust-soft p-3 text-sm">
                        <div className="text-xs font-semibold text-primary">{q.answerer}</div>
                        <p className="mt-1 text-foreground">{q.a}</p>
                      </div>
                    ) : isOwner ? (
                      <AnswerForm
                        onAnswer={async (text) => {
                          if (!user) return;
                          await submitAnswer(p.id, q.id, user.name, text);
                          await refreshDetail();
                        }}
                      />
                    ) : (
                      <div className="mt-3 text-xs italic text-muted-foreground">لسه محدش رد</div>
                    )}
                  </article>
                ))}
              </div>
            </section>
          </div>

          {/* Sticky sidebar */}
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <div className="rounded-3xl border border-border bg-surface p-6 shadow-[var(--shadow-soft)]">
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="font-display text-3xl font-semibold tabular-nums">
                    {!isSale && p.rentalMode && p.rentalMode !== "whole" && (
                      <span className="text-sm font-normal text-muted-foreground">يبدأ من </span>
                    )}
                    {(isSale ? (p.salePrice ?? p.price) : (p.priceFrom ?? p.price)).toLocaleString(
                      "ar-EG-u-nu-latn",
                    )}
                    <span className="ms-1 text-sm font-normal text-muted-foreground">
                      {isSale ? "ج.م" : "ج.م / شهر"}
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {isSale
                      ? p.negotiable
                        ? "السعر قابل للتفاوض"
                        : "السعر الإجمالي للشقة"
                      : p.rentalMode === "by_bed"
                        ? "سعر أرخص سرير فاضي — تحت تفاصيل كل سرير"
                        : p.rentalMode === "by_room"
                          ? "سعر أرخص أوضة فاضية — تحت تفاصيل كل أوضة"
                          : "الإيجار الأساسي — تحت هتلاقي التفاصيل كاملة"}
                  </div>
                  {!isSale && p.nightlyPrice ? (
                    <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-trust-soft px-2 py-0.5 text-xs font-medium text-trust">
                      أو {p.nightlyPrice.toLocaleString("ar-EG-u-nu-latn")} ج.م / الليلة
                    </div>
                  ) : null}
                </div>
                <TrustBadge score={p.trust} />
              </div>

              <div className="mt-5 flex flex-col gap-2">
                <Button
                  size="lg"
                  className="w-full rounded-xl"
                  onClick={() => (requireAuth() ? setViewingOpen(true) : null)}
                >
                  اطلب معاينة
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full rounded-xl gap-2"
                  onClick={onMessageOwner}
                >
                  <MessageCircle className="h-4 w-4" /> كلّم صاحب الشقة
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full gap-2 text-muted-foreground"
                  onClick={onSave}
                >
                  <Heart className={`h-4 w-4 ${saved ? "fill-red-500 text-red-500" : ""}`} />
                  {saved ? "محفوظة" : "احفظها"}
                </Button>
                <ReportButton
                  targetType="listing"
                  targetId={p.id}
                  className="w-full gap-2 text-muted-foreground hover:text-destructive"
                  label="بلّغ عن الإعلان"
                />
              </div>

              {/* Cost breakdown — monthly bills only apply to rentals */}
              {!isSale && (
                <div className="mt-6 border-t border-border pt-5">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    التكلفة الشهرية بالتفصيل
                  </div>
                  <ul className="mt-3 flex flex-col gap-2">
                    {p.costs.map((c) => (
                      <li key={c.label} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{c.label}</span>
                        <span className="tabular-nums">
                          {c.amount === 0
                            ? "محسوبة في السعر"
                            : `${c.amount.toLocaleString("ar-EG-u-nu-latn")} ج.م`}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                    <span className="text-sm font-semibold">الإجمالي تقريبًا</span>
                    <span className="font-display text-lg font-semibold tabular-nums">
                      {totalCost.toLocaleString("ar-EG-u-nu-latn")} ج.م
                    </span>
                  </div>
                </div>
              )}

              {/* Landlord */}
              <div className="mt-6 border-t border-border pt-5">
                <Link
                  to="/u/$id"
                  params={{ id: p.ownerId }}
                  className="-mx-2 flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-muted/50"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
                    {p.landlord.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-sm font-semibold">
                      {p.landlord.name}
                      {p.landlord.verified && <ShieldCheck className="h-3.5 w-3.5 text-trust" />}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ثقة {p.landlord.trust.toFixed(1)} · بيرد {p.landlord.responseRate}%
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <SiteFooter />
      <ViewingRequestDialog
        open={viewingOpen}
        onOpenChange={(v) => {
          setViewingOpen(v);
          if (!v) setBookingUnits([]);
        }}
        propertyTitle={p.title}
        units={bookingUnits}
        onSubmit={onSubmitViewing}
      />
      <ReviewDialog
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        propertyTitle={p.title}
        onSubmit={onSubmitReview}
      />
      <QuestionDialog
        open={questionOpen}
        onOpenChange={setQuestionOpen}
        propertyTitle={p.title}
        onSubmit={onSubmitQuestion}
      />
    </div>
  );
}

function AnswerForm({ onAnswer }: { onAnswer: (text: string) => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 text-xs font-medium text-primary hover:underline"
      >
        رد على السؤال ده
      </button>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="اكتب ردك..."
        rows={2}
        className="w-full resize-none rounded-xl border border-border bg-background p-2.5 text-sm outline-none focus:ring-2 focus:ring-trust/30"
      />
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={() => {
            if (text.trim().length < 2) return;
            onAnswer(text.trim());
            setText("");
            setOpen(false);
          }}
          disabled={text.trim().length < 2}
        >
          ابعت الرد
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          إلغاء
        </Button>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  tone = "muted",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone?: "trust" | "muted";
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-2xl bg-muted/50 p-3">
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
            tone === "trust" ? "bg-trust text-trust-foreground" : "bg-surface text-primary"
          }`}
        >
          <Icon className="h-4 w-4" />
        </span>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
      <div className="text-sm font-semibold text-center">{value}</div>
    </div>
  );
}

// ───────────────────────── Apartment specs ─────────────────────────

function SpecsSection({ p }: { p: Property }) {
  const s = p.spec!;
  const items: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
  }[] = [
    { icon: Home, label: "النوع", value: s.unitType },
    {
      icon: DoorOpen,
      label: "الأوض",
      value: `${s.bedrooms.toLocaleString("ar-EG-u-nu-latn")} أوض`,
    },
    { icon: Bath, label: "الحمّامات", value: s.bathrooms.toLocaleString("ar-EG-u-nu-latn") },
    ...(s.floor != null
      ? [{ icon: Layers, label: "الدور", value: s.floor.toLocaleString("ar-EG-u-nu-latn") }]
      : []),
    ...(s.sizeM2 != null
      ? [
          {
            icon: Maximize,
            label: "المساحة",
            value: `${s.sizeM2.toLocaleString("ar-EG-u-nu-latn")} م²`,
          },
        ]
      : []),
    { icon: Sofa, label: "الفرش", value: s.furnished ? "مفروشة" : "فاضية" },
    // Owner-defined extra specs render alongside the standard ones.
    ...(p.customSpecs ?? []).map((c) => ({
      icon: Sparkles,
      label: c.label,
      value: c.value,
    })),
  ];
  return (
    <section>
      <h2 className="font-display text-lg font-semibold">مواصفات الشقة</h2>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <div
              key={it.label}
              className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-primary">
                <Icon className="h-4 w-4" />
              </span>
              <div>
                <div className="text-xs text-muted-foreground">{it.label}</div>
                <div className="text-sm font-semibold">{it.value}</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ───────────────────────── Nearby & transit ─────────────────────────

const NEARBY_ICONS: Record<NearbyType, React.ComponentType<{ className?: string }>> = {
  مترو: TrainFront,
  جامعة: GraduationCap,
  مواصلات: Bus,
  مول: ShoppingBag,
  مستشفى: Stethoscope,
  "سوبر ماركت": Store,
  "حاجة تانية": MapPin,
};

function LocationSection({ p }: { p: Property }) {
  const items = p.nearby ?? [];
  // Google Maps everywhere (keyless embed). Prefer the exact pin the owner set;
  // otherwise geocode the free-text address — clearly labeled approximate.
  const hasPin = typeof p.lat === "number" && typeof p.lng === "number";

  let embedSrc: string;
  let openSrc: string;
  if (hasPin) {
    const q = `${p.lat},${p.lng}`;
    embedSrc = `https://maps.google.com/maps?q=${q}&z=16&hl=ar&output=embed`;
    openSrc = `https://www.google.com/maps/search/?api=1&query=${q}`;
  } else {
    const query = [p.address, p.area, p.title].find((s) => s && s.trim()) ?? "مصر";
    const encoded = encodeURIComponent(query);
    embedSrc = `https://maps.google.com/maps?q=${encoded}&z=14&hl=ar&output=embed`;
    openSrc = `https://www.google.com/maps/search/?api=1&query=${encoded}`;
  }

  return (
    <section>
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold">المكان والمواصلات</h2>
          <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {p.address || p.area}
          </p>
        </div>
        <a
          href={openSrc}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1 text-sm text-primary hover:underline"
        >
          <MapPin className="h-3.5 w-3.5" />
          افتح في الخرايط
        </a>
      </div>

      {/* Key-free map embed */}
      <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-muted">
        <iframe
          title={`خريطة ${p.area}`}
          src={embedSrc}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="block h-64 w-full border-0"
          allowFullScreen
        />
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        {hasPin
          ? "ده المكان اللي حدده صاحب البيت. العنوان بالظبط هتاخده بعد ما تتفقوا."
          : "الموقع تقريبي على مستوى المنطقة — هتاخد العنوان بالظبط بعد ما تتفق مع صاحب البيت."}
      </p>

      {items.length > 0 && (
        <>
          <h3 className="mt-6 text-sm font-semibold">أقرب الأماكن المهمة</h3>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {items.map((n) => {
              const Icon = NEARBY_ICONS[n.type] ?? MapPin;
              return (
                <div
                  key={n.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3"
                >
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-trust-soft text-trust">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-sm font-semibold">
                      {n.name || n.type}
                      {n.type === "مترو" && n.line ? (
                        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-normal text-muted-foreground">
                          {n.line}
                        </span>
                      ) : null}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {n.type}
                      {n.minutes != null ? (
                        <span className="inline-flex items-center gap-1">
                          {" · "}
                          <Footprints className="h-3 w-3" />
                          {n.minutes.toLocaleString("ar-EG-u-nu-latn")} دقيقة
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}

// ───────────────────────── Rooms & pricing ─────────────────────────

function RoomsSection({
  p,
  onBook,
  canBook,
}: {
  p: Property;
  onBook: (units: LeadUnit[]) => void;
  canBook: boolean;
}) {
  const mode = p.rentalMode;
  const rooms: Room[] = p.rooms ?? [];
  // Selected units keyed by a stable id (roomId or bedId), so a renter can pick
  // more than one bed/room in a single booking request.
  const [selected, setSelected] = useState<Record<string, LeadUnit>>({});
  const selectedList = Object.values(selected);
  const selectedTotal = selectedList.reduce((s, u) => s + (u.price ?? 0), 0);

  const toggle = (key: string, unit: LeadUnit) =>
    setSelected((cur) => {
      const next = { ...cur };
      if (next[key]) delete next[key];
      else next[key] = unit;
      return next;
    });

  if (mode === "whole") {
    return (
      <section className="rounded-3xl border border-border bg-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Home className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-semibold">الشقة بتتأجّر كاملة</h2>
          </div>
          <span className="font-display text-lg font-semibold tabular-nums">
            {(p.wholePrice ?? p.price).toLocaleString("ar-EG-u-nu-latn")}{" "}
            <span className="text-xs font-normal text-muted-foreground">ج.م/شهر</span>
          </span>
        </div>
        {rooms.length > 0 && (
          <>
            <p className="mt-4 text-xs text-muted-foreground">الأوض اللي في الشقة:</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {rooms.map((r) => (
                <div key={r.id} className="rounded-xl border border-border bg-background p-3">
                  <div className="text-sm font-medium">{r.name}</div>
                  <RoomFeatures features={r.features} />
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    );
  }

  const isBed = mode === "by_bed";
  const allBeds = rooms.flatMap((r) => r.beds);
  const available = isBed
    ? allBeds.filter((b) => b.status === "available").length
    : rooms.filter((r) => (r.status ?? "available") === "available").length;
  const total = isBed ? allBeds.length : rooms.length;

  return (
    <section className="rounded-3xl border border-border bg-surface p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {isBed ? (
            <BedDouble className="h-5 w-5 text-primary" />
          ) : (
            <DoorOpen className="h-5 w-5 text-primary" />
          )}
          <h2 className="font-display text-lg font-semibold">
            {isBed ? "السراير وأسعارها" : "الأوض وأسعارها"}
          </h2>
        </div>
        <span className="text-sm text-muted-foreground">
          فاضي {available.toLocaleString("ar-EG-u-nu-latn")} من{" "}
          {total.toLocaleString("ar-EG-u-nu-latn")}
        </span>
      </div>

      {canBook && available > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">
          اختار {isBed ? "السرير أو السراير" : "الأوضة أو الأوض"} اللي عايزها — تقدر تختار أكتر من
          واحد.
        </p>
      )}

      <div className="mt-5 space-y-3">
        {rooms.map((room) => {
          const roomFree = (room.status ?? "available") === "available";
          const roomSelected = !!selected[room.id];
          return (
            <div key={room.id} className="rounded-2xl border border-border bg-background p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-medium">{room.name}</div>
                {!isBed && (
                  <div className="flex items-center gap-2">
                    <UnitBadge status={room.status ?? "available"} />
                    <span className="font-display text-base font-semibold tabular-nums">
                      {(room.price ?? 0).toLocaleString("ar-EG-u-nu-latn")}{" "}
                      <span className="text-xs font-normal text-muted-foreground">ج.م</span>
                    </span>
                  </div>
                )}
              </div>
              <RoomFeatures features={room.features} />

              {/* Select this room (by_room mode) */}
              {!isBed && canBook && roomFree && (
                <SelectToggle
                  selected={roomSelected}
                  label="اختار الأوضة دي"
                  onClick={() =>
                    toggle(room.id, {
                      label: room.name,
                      kind: "room",
                      roomId: room.id,
                      price: room.price,
                    })
                  }
                />
              )}

              {isBed && (
                <div className="mt-3 space-y-2">
                  {room.beds.map((bed) => {
                    const bedSelected = !!selected[bed.id];
                    const bedFree = bed.status === "available";
                    const canPick = canBook && bedFree;
                    const rowClass = `flex w-full flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2 text-start transition-colors ${
                      bedSelected
                        ? "cursor-pointer border-trust bg-trust-soft"
                        : canPick
                          ? "cursor-pointer border-border bg-surface hover:border-trust/50 hover:bg-trust-soft/40"
                          : "border-border bg-surface"
                    }`;
                    const inner = (
                      <>
                        <div className="flex items-center gap-2 text-sm">
                          {/* Checkbox affordance for selectable beds */}
                          {canPick ? (
                            <span
                              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                                bedSelected
                                  ? "border-trust bg-trust text-trust-foreground"
                                  : "border-muted-foreground/40"
                              }`}
                            >
                              {bedSelected ? <Check className="h-3 w-3" /> : null}
                            </span>
                          ) : (
                            <BedDouble className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span>{bed.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <UnitBadge status={bed.status} />
                          <span className="font-display text-sm font-semibold tabular-nums">
                            {bed.price.toLocaleString("ar-EG-u-nu-latn")}{" "}
                            <span className="text-[11px] font-normal text-muted-foreground">
                              ج.م
                            </span>
                          </span>
                        </div>
                      </>
                    );

                    return canPick ? (
                      <button
                        key={bed.id}
                        type="button"
                        aria-pressed={bedSelected}
                        onClick={() =>
                          toggle(bed.id, {
                            label: bed.label,
                            kind: "bed",
                            roomId: room.id,
                            roomName: room.name,
                            bedId: bed.id,
                            price: bed.price,
                          })
                        }
                        className={rowClass}
                      >
                        {inner}
                      </button>
                    ) : (
                      <div key={bed.id} className={rowClass}>
                        {inner}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Sticky book-selected action */}
      {canBook && selectedList.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-trust/40 bg-trust-soft p-3">
          <div className="text-sm">
            <span className="font-medium">
              اخترت {selectedList.length.toLocaleString("ar-EG-u-nu-latn")}{" "}
              {isBed ? "سرير" : "أوضة"}
            </span>
            {selectedTotal > 0 && (
              <span className="text-muted-foreground">
                {" · "}إجمالي {selectedTotal.toLocaleString("ar-EG-u-nu-latn")} ج.م/شهر
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelected({})}>
              امسح الاختيار
            </Button>
            <Button size="sm" className="gap-1.5" onClick={() => onBook(selectedList)}>
              <CheckCircle2 className="h-4 w-4" />
              اطلب الحجز
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}

function SelectToggle({
  selected,
  label,
  onClick,
}: {
  selected: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`mt-3 inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
        selected
          ? "border-trust bg-trust text-trust-foreground"
          : "border-border bg-surface text-muted-foreground hover:text-foreground"
      }`}
    >
      {selected ? <Check className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
      {selected ? "متختارة" : label}
    </button>
  );
}

function RoomFeatures({ features }: { features: string[] }) {
  if (!features.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {features.map((f) => (
        <span
          key={f}
          className="inline-flex items-center rounded-full bg-trust-soft px-2 py-0.5 text-[11px] text-primary"
        >
          {f}
        </span>
      ))}
    </div>
  );
}

function ReviewCard({
  review,
  propertyId,
  isOwner,
  userId,
  voted,
  onChange,
}: {
  review: Property["reviews"][number];
  propertyId: string;
  isOwner: boolean;
  userId?: string;
  voted: boolean;
  onChange: () => void | Promise<void>;
}) {
  const [replying, setReplying] = useState(false);
  const [reply, setReply] = useState("");

  const onHelpful = async () => {
    if (!userId) {
      toast.error("سجّل دخولك الأول");
      return;
    }
    await toggleHelpful(propertyId, review.id, userId);
    await onChange();
  };

  const submitReply = async () => {
    if (!reply.trim()) return;
    await replyReview(propertyId, review.id, reply.trim());
    setReply("");
    setReplying(false);
    toast.success("اتنشر ردّك");
    await onChange();
  };

  return (
    <article className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {review.initials}
          </div>
          <div>
            <div className="text-sm font-semibold">{review.author}</div>
            <div className="text-xs text-muted-foreground">
              قعد هنا {review.monthsLived.toLocaleString("ar-EG-u-nu-latn")} شهر · {review.date}
            </div>
          </div>
        </div>
        <TrustBadge score={review.rating} />
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{review.body}</p>

      {/* Owner reply */}
      {review.ownerReply && (
        <div className="mt-3 rounded-xl border-s-2 border-trust bg-trust-soft/50 p-3">
          <div className="text-xs font-semibold text-trust">
            ردّ صاحب البيت · {review.ownerReply.date}
          </div>
          <p className="mt-1 text-sm text-foreground">{review.ownerReply.body}</p>
        </div>
      )}

      {/* Actions */}
      <div className="mt-3 flex items-center gap-3 border-t border-border pt-3">
        <button
          type="button"
          onClick={onHelpful}
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition-colors ${
            voted ? "bg-trust-soft text-trust" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <ThumbsUp className={`h-3.5 w-3.5 ${voted ? "fill-current" : ""}`} />
          مفيد
          {review.helpful ? (
            <span className="tabular-nums">{review.helpful.toLocaleString("ar-EG-u-nu-latn")}</span>
          ) : null}
        </button>

        {isOwner && !review.ownerReply && (
          <button
            type="button"
            onClick={() => setReplying((v) => !v)}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <CornerDownLeft className="h-3.5 w-3.5" />
            ردّ
          </button>
        )}

        <ReportButton
          targetType="review"
          targetId={review.id}
          size="sm"
          className="ms-auto h-auto gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-destructive"
        />
      </div>

      {replying && (
        <div className="mt-3 flex flex-col gap-2">
          <Textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="ردّك على الرأي ده…"
            rows={2}
            className="resize-none text-sm"
          />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setReplying(false)}>
              إلغاء
            </Button>
            <Button size="sm" onClick={submitReply} disabled={!reply.trim()}>
              انشر الرد
            </Button>
          </div>
        </div>
      )}
    </article>
  );
}

function UnitBadge({ status }: { status: BedStatus }) {
  const map: Record<BedStatus, { tone: string; label: string }> = {
    available: { tone: "bg-trust/10 text-trust", label: "فاضي" },
    reserved: { tone: "bg-amber-500/10 text-amber-600 dark:text-amber-400", label: "محجوز" },
    occupied: { tone: "bg-muted text-muted-foreground", label: "متأجّر" },
  };
  const s = map[status];
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${s.tone}`}>{s.label}</span>
  );
}
