import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, BadgeCheck, Star, MessageSquareQuote, Gauge, Activity } from "lucide-react";
import { SiteHeader } from "@/components/beitco/SiteHeader";
import { SiteFooter } from "@/components/beitco/SiteFooter";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/trust")({
  head: () => ({
    meta: [
      { title: "إزاي بنبني الثقة  -  بيتون" },
      {
        name: "description",
        content:
          "اعرف إزاي بيتون بتحسب درجة الثقة وبتوثّق الإعلانات عشان تطمن وانت بتدوّر على سكن.",
      },
    ],
  }),
  component: TrustPage,
});

const pillars = [
  {
    icon: BadgeCheck,
    title: "التوثيق",
    body: "بنتأكد من هوية صاحب البيت ومن إن المكان موجود فعلاً. الإعلان اللي عليه علامة «موثّق» يعني مرّ بمراجعة.",
  },
  {
    icon: Star,
    title: "آراء الساكنين الحقيقيين",
    body: "بس اللي سكن في المكان 30 يوم على الأقل يقدر يكتب رأيه. ده بيمنع الآراء المزيّفة ويخلّي اللي مكتوب موثوق.",
  },
  {
    icon: Gauge,
    title: "درجات الجودة",
    body: "كل مكان بياخد درجات على النت، الأمان، الدوشة، الصيانة، والنضافة  -  من تقييمات الناس اللي عاشت هناك فعلاً.",
  },
  {
    icon: Activity,
    title: "سرعة رد صاحب البيت",
    body: "بنوضّحلك صاحب البيت بيرد بسرعة قد إيه، عشان تعرف إنت بتتعامل مع مين قبل ما تبعت رسالة.",
  },
  {
    icon: MessageSquareQuote,
    title: "أسئلة وأجوبة مكشوفة",
    body: "أي حد يقدر يسأل، وصاحب البيت بيرد قدّام الكل. الشفافية دي بتبني ثقة.",
  },
];

function TrustPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <section className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-trust" />
            الثقة هي الأساس
          </span>
          <h1 className="mt-5 font-display text-3xl font-bold leading-tight sm:text-4xl">
            إزاي بنبني <span className="text-trust">الثقة</span> في كل إعلان
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            «درجة الثقة» اللي بتشوفها على كل مكان مش رقم عشوائي. دي خلاصة كذا حاجة بنجمّعها ونحسبها
            عشان تاخد قرارك وانت مطمن.
          </p>
        </section>

        <section className="mt-12 space-y-3">
          {pillars.map((p, i) => {
            const Icon = p.icon;
            return (
              <div
                key={p.title}
                className="flex gap-4 rounded-2xl border border-border bg-card p-5"
              >
                <div className="relative shrink-0">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-trust-soft text-trust">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="absolute -end-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-trust text-[11px] font-bold text-trust-foreground tabular-nums shadow-sm">
                    {(i + 1).toLocaleString("ar-EG-u-nu-latn")}
                  </span>
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold">{p.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
                </div>
              </div>
            );
          })}
        </section>

        <section className="mt-10 rounded-2xl border border-dashed border-border bg-surface p-6">
          <h2 className="font-display text-lg font-semibold">إزاي بنحسب الدرجة؟</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            بنجمع التوثيق + عدد وجودة آراء الساكنين + درجات الجودة + سرعة رد صاحب البيت + نشاط
            الإعلان، وبنطلّع درجة من{" "}
            <span className="font-semibold text-foreground tabular-nums">10</span>. كل ما الدرجة
            تعلى، كل ما تقدر تثق أكتر. والدرجة بتتحدّث باستمرار مع كل رأي أو تفاعل جديد.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {["التوثيق", "آراء الساكنين", "درجات الجودة", "سرعة الرد", "نشاط الإعلان"].map((f) => (
              <span
                key={f}
                className="inline-flex items-center gap-1 rounded-full bg-trust-soft px-2.5 py-1 text-xs font-medium text-trust"
              >
                <BadgeCheck className="h-3 w-3" />
                {f}
              </span>
            ))}
          </div>
        </section>

        <section className="mt-12 text-center">
          <Button asChild size="lg">
            <Link to="/search">دوّر على سكن موثّق</Link>
          </Button>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
