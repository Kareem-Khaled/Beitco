import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Search } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/beitoon/auth";
import { useSavedListings, toggleSavedListing } from "@/lib/beitoon/queries";
import { BeitoonListingCard } from "@/components/beitoon/BeitoonListingCard";
import { EmptyState } from "@/components/beitoon/EmptyState";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/me/saved")({
  component: MeSaved,
});

function MeSaved() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: properties = [] } = useSavedListings(user?.id);

  if (!user) return null;

  const unsave = async (id: string) => {
    await toggleSavedListing(user.id, id);
    qc.invalidateQueries({ queryKey: ["saved", user.id] });
  };

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight">المحفوظات</h1>
        <p className="text-sm text-muted-foreground">الأماكن اللي حفظتها عشان ترجعلها بعدين.</p>
      </header>

      {properties.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="لسه ما حفظتش ولا مكان"
          hint="دوس على القلب في أي إعلان عشان تحفظه وترجعله بسهولة."
          action={
            <Button asChild>
              <Link to="/search">
                <Search className="me-1 h-4 w-4" />
                دوّر على بيت
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {properties.map((p) => (
            <div
              key={p.id}
              className="group/saved overflow-hidden rounded-2xl border border-border bg-surface transition-all hover:shadow-[var(--shadow-elevated)]"
            >
              {/* Card without its own frame  -  merges into this one container */}
              <BeitoonListingCard
                p={p}
                className="rounded-none border-0 bg-transparent hover:translate-y-0 hover:shadow-none"
              />
              {/* Remove footer  -  part of the same unified card */}
              <button
                type="button"
                onClick={() => unsave(p.id)}
                className="flex w-full items-center justify-center gap-1.5 border-t border-border py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-600"
                aria-label="شيل من المحفوظات"
              >
                <Heart className="h-3.5 w-3.5 fill-red-500 text-red-500" />
                شيل من المحفوظات
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
