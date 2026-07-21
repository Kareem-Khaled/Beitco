import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Search,
  SlidersHorizontal,
  BedDouble,
  ShieldCheck,
  Home,
  Building2,
  DoorOpen,
} from "lucide-react";
import { SiteHeader } from "@/components/beitco/SiteHeader";
import { SiteFooter } from "@/components/beitco/SiteFooter";
import { BeitoonListingCard } from "@/components/beitco/BeitoonListingCard";
import { EmptyState } from "@/components/beitco/EmptyState";
import { Button } from "@/components/ui/button";
import { usePublishedProperties } from "@/lib/beitco/queries";
import { useAuth } from "@/lib/beitco/auth";
import type { Property, PropertySummary } from "@/lib/beitco/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "بيتون  -  سكن بالسرير في مصر" },
      {
        name: "description",
        content:
          "بيتون منصة سكن موثّقة في مصر. دوّر على شقة، أوضة، أو سرير  -  أو شقة للبيع  -  بأسعار واضحة وآراء ساكنين حقيقية.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const { data: properties = [] } = usePublishedProperties();
  const { user } = useAuth();

  const onSearch = (overrides?: Record<string, unknown>) => {
    // Search + filters are registered-users-only. Send guests to login first.
    if (!user) {
      navigate({ to: "/auth/login" });
      return;
    }
    navigate({
      to: "/search",
      search: { ...(q.trim() ? { q: q.trim() } : {}), ...(overrides ?? {}) },
    });
  };

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-4 pb-24">
        <section className="py-12 text-center sm:py-16">
          <h1 className="font-display text-3xl font-bold leading-tight sm:text-5xl">
            أجّر <span className="text-trust">سرير</span>، أوضة، أو شقة كاملة
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
            بيتون أول منصة في مصر تأجّرك بالسرير  -  سكن متأكدين منه، بأسعار واضحة وآراء ساكنين حقيقية
            ودرجة ثقة لكل مكان.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSearch();
            }}
            className="mx-auto mt-8 flex max-w-2xl flex-col gap-2 rounded-2xl border border-border bg-card p-2 sm:flex-row sm:items-center"
          >
            <div className="flex flex-1 items-center gap-2 px-3 py-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="دوّر بالمنطقة، الكومباوند، أو اسم المكان…"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <Button type="submit" size="lg" className="rounded-xl">
              دوّر
            </Button>
          </form>

          <div className="mx-auto mt-3 flex max-w-2xl flex-wrap justify-center gap-2 text-xs">
            <QuickFilter
              icon={<Building2 className="h-3 w-3" />}
              onClick={() => onSearch({ type: "شقة" })}
            >
              شقق
            </QuickFilter>
            <QuickFilter
              icon={<DoorOpen className="h-3 w-3" />}
              onClick={() => onSearch({ type: "أوضة" })}
            >
              أوض
            </QuickFilter>
            <QuickFilter
              icon={<BedDouble className="h-3 w-3" />}
              onClick={() => onSearch({ type: "سرير" })}
            >
              سراير
            </QuickFilter>
            <QuickFilter
              icon={<ShieldCheck className="h-3 w-3" />}
              onClick={() => onSearch({ verifiedOnly: true })}
            >
              موثّق بس
            </QuickFilter>
          </div>
        </section>

        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-xl font-semibold">أحدث الأماكن</h2>
          <button
            type="button"
            onClick={() => onSearch()}
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            فلترة متقدمة
          </button>
        </div>

        <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">
            {properties.length.toLocaleString("ar-EG-u-nu-latn")}
          </span>{" "}
          مكان متاح دلوقتي
        </div>

        {properties.length === 0 ? (
          <EmptyState
            icon={Home}
            title="لسه ما فيش أماكن"
            hint="كن أول واحد يعرض مكانه على بيتون."
            action={
              <Button asChild>
                <Link to="/list/new">اعرض مكانك</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {properties.slice(0, 9).map((p: Property | PropertySummary) => (
              <BeitoonListingCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}

function QuickFilter({
  children,
  onClick,
  icon,
}: {
  children: React.ReactNode;
  onClick: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-3 py-1 text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
    >
      {icon}
      {children}
    </button>
  );
}
