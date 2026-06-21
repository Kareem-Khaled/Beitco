import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { Inbox, Calendar, MessageCircle, Search } from "lucide-react";
import { useAuth } from "@/lib/beitco/auth";
import {
  getLeadsForRenter,
  getProperty,
  findOrCreateThread,
} from "@/lib/beitco/store";
import type { Lead } from "@/lib/beitco/types";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/beitco/EmptyState";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/me/applications")({
  component: MeApplications,
});

function MeApplications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const leads = useMemo(() => {
    if (!user) return [];
    return getLeadsForRenter(user.id).sort(
      (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
    );
  }, [user]);

  if (!user) return null;

  const openChat = (propertyId: string) => {
    const t = findOrCreateThread(propertyId, user.id);
    navigate({ to: "/messages/$threadId", params: { threadId: t.id } });
  };

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight">طلبات المعاينة</h1>
        <p className="text-sm text-muted-foreground">الأماكن اللي طلبت تشوفها وردود أصحابها.</p>
      </header>

      {leads.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="لسه ما طلبتش معاينة لأي مكان"
          hint="لما تطلب معاينة لأي شقة، هتلاقي حالة الطلب هنا."
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
        <ul className="grid gap-3">
          {leads.map((l) => {
            const p = getProperty(l.propertyId);
            return (
              <li key={l.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {p ? (
                        <Link
                          to="/property/$id"
                          params={{ id: p.id }}
                          className="font-display text-base font-semibold hover:underline"
                        >
                          {p.title}
                        </Link>
                      ) : (
                        <span className="font-display text-base font-semibold">—</span>
                      )}
                      <StatusPill status={l.status} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{p?.area}</p>
                    {l.preferredDate ? (
                      <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        طلبت ميعاد: {new Date(l.preferredDate).toLocaleDateString("ar-EG-u-nu-latn")}
                      </p>
                    ) : null}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openChat(l.propertyId)}
                    className="gap-1.5"
                  >
                    <MessageCircle className="h-4 w-4" />
                    افتح المحادثة
                  </Button>
                </div>
                {l.status === "approved" ? (
                  <p className="mt-2 rounded-lg bg-trust-soft px-3 py-2 text-xs text-foreground">
                    صاحب المكان وافق على المعاينة — كلّمه وحدّدوا الميعاد.
                  </p>
                ) : null}
                {l.status === "declined" ? (
                  <p className="mt-2 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                    للأسف اترفض الطلب. جرّب أماكن تانية، فيه كتير.
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: Lead["status"] }) {
  const map: Record<Lead["status"], { tone: string; label: string }> = {
    pending: { tone: "bg-amber-500/10 text-amber-600 dark:text-amber-400", label: "مستني الرد" },
    approved: { tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", label: "اتقبل" },
    declined: { tone: "bg-red-500/10 text-red-600 dark:text-red-400", label: "اترفض" },
    completed: { tone: "bg-muted text-muted-foreground", label: "خلص" },
  };
  const s = map[status];
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${s.tone}`}>{s.label}</span>;
}
