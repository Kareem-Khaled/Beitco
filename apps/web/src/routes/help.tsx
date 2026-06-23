import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { HelpCircle, ChevronDown, MessageCircle, Mail } from "lucide-react";
import { SiteHeader } from "@/components/beitco/SiteHeader";
import { SiteFooter } from "@/components/beitco/SiteFooter";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "مساعدة — بيتكو" },
      {
        name: "description",
        content: "أسئلة شائعة عن استخدام بيتكو — للساكنين ولأصحاب البيوت.",
      },
    ],
  }),
  component: HelpPage,
});

const faqs = [
  {
    q: "إزاي أدوّر على سكن؟",
    a: "اضغط «دوّر» في الأعلى، اكتب المنطقة أو اسم المكان، واستخدم الفلاتر (النوع، السعر، الأسرّة الفاضية). لما تلاقي مكان عاجبك، اضغط عليه تشوف التفاصيل كاملة.",
  },
  {
    q: "يعني إيه «نأجّر بالسرير»؟",
    a: "غير الشقق الكاملة، تقدر تأجّر أوضة لوحدها أو حتى سرير واحد في أوضة مشتركة. ده بيخلّي السكن أرخص ومناسب للطلبة والشباب.",
  },
  {
    q: "إزاي أطلب معاينة؟",
    a: "في صفحة أي مكان، اضغط «اطلب معاينة»، اختار ميعاد يناسبك واكتب رسالة لصاحب البيت. هيوصله الطلب ويرد عليك في المحادثة.",
  },
  {
    q: "إمتى أقدر أكتب رأيي في مكان؟",
    a: "عشان نضمن إن الآراء حقيقية، لازم تكون سكنت في المكان 30 يوم على الأقل قبل ما تقدر تكتب رأيك. ده بيحمي الكل من الآراء المزيّفة.",
  },
  {
    q: "يعني إيه «متأكدين منه»؟",
    a: "العلامة دي معناها إننا راجعنا الإعلان وتأكدنا من هوية صاحبه ومن إن المكان موجود فعلاً. مش كل الإعلانات موثّقة، بس الموثّقة بتديك اطمئنان أكتر.",
  },
  {
    q: "إزاي أحط شقتي؟",
    a: "اضغط «حط شقتك»، واتبع الخطوات: النوع، المكان، عدد الأسرّة، الصور، السعر، والمميزات. الموضوع بياخد دقايق وبعدها إعلانك يظهر للناس.",
  },
  {
    q: "بيتكو بتاخد عمولة؟",
    a: "حط شقتك والتصفّح مجاني تماماً. بنوفّر خدمات إضافية لأصحاب البيوت اللي عايزين وصول أوسع، بس الأساسيات مجانية.",
  },
  {
    q: "حصل مشكلة مع صاحب بيت أو ساكن، أعمل إيه؟",
    a: "تقدر تبلّغ عن أي إعلان أو مستخدم من صفحته. فريقنا بيراجع كل البلاغات وبياخد إجراء لما يلزم. سلامتك أهم حاجة عندنا.",
  },
];

function HelpPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <section className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground">
            <HelpCircle className="h-3.5 w-3.5 text-primary" />
            مركز المساعدة
          </span>
          <h1 className="mt-5 font-display text-3xl font-bold leading-tight sm:text-4xl">
            ساعتك في إيه؟
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
            أكتر الأسئلة اللي بتتسأل. لو مش لاقي إجابتك، كلّمنا.
          </p>
        </section>

        <section className="mt-10 space-y-2">
          {faqs.map((f, i) => (
            <FaqItem key={i} q={f.q} a={f.a} />
          ))}
        </section>

        <section className="mt-10 rounded-2xl border border-border bg-card p-6 text-center">
          <MessageCircle className="mx-auto h-7 w-7 text-primary" />
          <h2 className="mt-2 font-display text-lg font-semibold">لسه محتاج مساعدة؟</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            فريقنا جاهز يساعدك. كلّمنا على واتساب أو ابعتلنا إيميل.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button asChild>
              <a href="https://wa.me/201000000000" target="_blank" rel="noopener noreferrer">
                <MessageCircle className="me-1.5 h-4 w-4" />
                واتساب
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href="mailto:support@beitco.com">
                <Mail className="me-1.5 h-4 w-4" />
                support@beitco.com
              </a>
            </Button>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-start"
        aria-expanded={open}
      >
        <span className="font-medium">{q}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open ? (
        <div className="border-t border-border px-5 py-4 text-sm leading-relaxed text-muted-foreground">
          {a}
        </div>
      ) : null}
    </div>
  );
}
