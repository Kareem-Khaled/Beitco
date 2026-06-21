import { createFileRoute } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { SiteHeader } from "@/components/beitco/SiteHeader";
import { SiteFooter } from "@/components/beitco/SiteFooter";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "سياسة الخصوصية — بيتكو" },
      {
        name: "description",
        content: "إزاي بيتكو بتحمي بياناتك وبتستخدمها — بكل وضوح.",
      },
    ],
  }),
  component: PrivacyPage,
});

const sections: { title: string; body: string }[] = [
  {
    title: "إيه البيانات اللي بنجمعها؟",
    body: "رقم تليفونك (عشان تدخل وتتواصل)، اسمك، ونوع حسابك (ساكن ولا صاحب شقة). لو عملت توثيق، بناخد صورة بطاقتك وسيلفي بس عشان نتأكد إنك إنت فعلاً.",
  },
  {
    title: "بنستخدمها في إيه؟",
    body: "عشان نوصّلك بالسكن أو المستأجر المناسب، نأمّن حسابك، ونحسب درجة الثقة. بنستخدم تفضيلاتك (الميزانية، المنطقة) عشان نرشّحلك أماكن تناسبك.",
  },
  {
    title: "مين بيشوف بياناتك؟",
    body: "رقم تليفونك مش بيظهر للعامة. بيتكشف للطرف التاني بس بعد ما تبدأوا تتكلموا أو تأكّد حجز/سكن. مستندات التوثيق سرّية تمامًا ومحدش بيشوفها غير فريق المراجعة.",
  },
  {
    title: "حقوقك",
    body: "تقدر تعدّل بياناتك أو تمسح حسابك في أي وقت من الإعدادات. لو مسحت حسابك، بنشيل بياناتك الشخصية من غير ما نأثّر على آراء الناس المجهّلة.",
  },
  {
    title: "الأمان",
    body: "بنأمّن بياناتك بأحدث المعايير، وما بنبيعش بياناتك لأي حد. خصوصيتك جزء من الثقة اللي بنبنيها.",
  },
];

function PrivacyPage() {
  return (
    <div dir="rtl" className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <header className="text-center">
          <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-trust-soft text-trust">
            <Lock className="h-6 w-6" />
          </span>
          <h1 className="mt-4 font-display text-3xl font-bold sm:text-4xl">سياسة الخصوصية</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
            خصوصيتك مهمة عندنا. ده شرح بسيط وواضح لإزاي بنتعامل مع بياناتك.
          </p>
        </header>

        <div className="mt-10 space-y-4">
          {sections.map((s) => (
            <section key={s.title} className="rounded-2xl border border-border bg-card p-5">
              <h2 className="font-display text-lg font-semibold">{s.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </section>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          آخر تحديث: يونيو 2026 · لو عندك أي سؤال، تواصل معانا من صفحة المساعدة.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
