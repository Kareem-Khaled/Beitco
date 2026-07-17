import { createFileRoute } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { SiteHeader } from "@/components/beitco/SiteHeader";
import { SiteFooter } from "@/components/beitco/SiteFooter";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "الشروط والأحكام — بيتون" },
      {
        name: "description",
        content: "شروط استخدام بيتون — بوضوح وبساطة.",
      },
    ],
  }),
  component: TermsPage,
});

const sections: { title: string; body: string }[] = [
  {
    title: "بيتون منصة، مش وسيط",
    body: "بيتون بتوصّل بين أصحاب الشقق والساكنين. إحنا مش طرف في أي عقد إيجار أو بيع — الاتفاق النهائي بينك وبين الطرف التاني.",
  },
  {
    title: "إعلانات حقيقية بس",
    body: "لازم تكون صاحب المكان أو مفوّض بعرضه. ممنوع الإعلانات الوهمية أو الصور المضلّلة. الإعلان المخالف بيتشال وممكن حسابك يتوقف.",
  },
  {
    title: "الآراء والتوثيق",
    body: "الآراء بتكون من ساكنين فعليين بس (بعد 30 يوم سكن). التوثيق بيعتمد على مستندات حقيقية. التلاعب في الآراء أو التوثيق بيخالف الشروط.",
  },
  {
    title: "السلوك على المنصة",
    body: "احترم باقي المستخدمين. ممنوع المضايقة، النصب، أو استخدام بيانات حد تاني. السكن المشترك بيحترم سياسة الجنس اللي صاحب الشقة حدّدها.",
  },
  {
    title: "المدفوعات",
    body: "بيتون دلوقتي مجانية للساكنين وللإعلان الأساسي. أي رسوم مستقبلية (زي اشتراك التوثيق) هتكون واضحة قبل ما تدفع أي حاجة.",
  },
  {
    title: "حدود المسؤولية",
    body: "بنبذل مجهودنا عشان نوفّر بيئة موثوقة، لكن إنت مسؤول عن قرارك النهائي. عاين المكان واتأكد قبل أي دفع.",
  },
];

function TermsPage() {
  return (
    <div dir="rtl" className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <header className="text-center">
          <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-trust-soft text-trust">
            <FileText className="h-6 w-6" />
          </span>
          <h1 className="mt-4 font-display text-3xl font-bold sm:text-4xl">الشروط والأحكام</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
            باستخدامك بيتون، إنت موافق على الشروط دي. كتبناها بوضوح من غير لفّ ودوران.
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
