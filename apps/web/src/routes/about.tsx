import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, Users, BedDouble, Heart } from "lucide-react";
import { SiteHeader } from "@/components/beitco/SiteHeader";
import { SiteFooter } from "@/components/beitco/SiteFooter";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "عن بيتكو — منصة السكن اللي تقدر تثق فيها" },
      {
        name: "description",
        content: "بيتكو منصة سكن مصرية بتأجّر على مستوى السرير، مبنية على الثقة والشفافية.",
      },
    ],
  }),
  component: AboutPage,
});

const values = [
  {
    icon: ShieldCheck,
    title: "الثقة أول حاجة",
    body: "كل إعلان عليه درجة ثقة، توثيق، وآراء حقيقية من ساكنين فعليين. مفيش مفاجآت.",
  },
  {
    icon: BedDouble,
    title: "نأجّر بالسرير",
    body: "مش بس شقق — تقدر تلاقي أوضة لوحدها أو سرير في أوضة مشتركة. سكن يناسب كل ميزانية.",
  },
  {
    icon: Users,
    title: "ناس حقيقية",
    body: "بنوصّلك بأصحاب بيوت متأكدين منهم، وبنخلّي كل طرف يعرف الطرف التاني قبل ما يتحرك.",
  },
  {
    icon: Heart,
    title: "بنفهم السوق المصري",
    body: "اتعملت في مصر، للمصريين. من الطالب اللي بيدوّر على سكن لحد العيلة اللي بتنقل.",
  },
];

function AboutPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <section className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-trust" />
            عن بيتكو
          </span>
          <h1 className="mt-5 font-display text-3xl font-bold leading-tight sm:text-4xl">
            بنخلّي السكن في مصر حاجة تقدر <span className="text-trust">تثق</span> فيها
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            دوّرت على سكن في مصر قبل كده؟ تعرف القصة — صور مش حقيقية، أسعار بتتغيّر، ومحدش بيقولك
            الحقيقة عن المكان قبل ما تروح. بيتكو اتعملت عشان تحل ده. إحنا منصة سكن بتأجّر على مستوى
            السرير، مبنية على الثقة والشفافية من أول يوم.
          </p>
        </section>

        <section className="mt-12 grid gap-4 sm:grid-cols-2">
          {values.map((v) => {
            const Icon = v.icon;
            return (
              <div key={v.title} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-trust-soft text-trust">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-3 font-display text-lg font-semibold">{v.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{v.body}</p>
              </div>
            );
          })}
        </section>

        <section className="mt-12 rounded-3xl border border-border bg-gradient-to-br from-trust-soft/60 to-surface p-8 text-center">
          <h2 className="font-display text-2xl font-semibold">جاهز تبدأ؟</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            سواء بتدوّر على بيت أو عايز تأجّر مكانك، بيتكو معاك.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/search">دوّر على بيت</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/list/new">اعرض مكانك</Link>
            </Button>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
