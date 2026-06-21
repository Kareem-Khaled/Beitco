import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/beitco/SiteHeader";
import { Hero } from "@/components/beitco/Hero";
import { QuickActions } from "@/components/beitco/QuickActions";
import { TrustPillars } from "@/components/beitco/TrustPillars";
import { FeaturedHousing } from "@/components/beitco/FeaturedHousing";
import { TopAreas } from "@/components/beitco/TopAreas";
import { TrendingDiscussions } from "@/components/beitco/TrendingDiscussions";
import { SiteFooter } from "@/components/beitco/SiteFooter";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Beitco — The trusted housing platform for Egypt" },
      {
        name: "description",
        content:
          "Verified apartments, rooms and beds with real reviews, area intelligence and true monthly cost. Decide where to live with confidence.",
      },
      { property: "og:title", content: "Beitco — The trusted housing platform for Egypt" },
      {
        property: "og:description",
        content:
          "Know where you’re moving before you move in. Trust scores, resident reviews, and area intelligence — all in one place.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="flex flex-col gap-20 pb-24 pt-2 sm:gap-24">
        <Hero />
        <QuickActions />
        <TrustPillars />
        <FeaturedHousing />
        <TopAreas />
        <TrendingDiscussions />
      </main>
      <SiteFooter />
    </div>
  );
}
