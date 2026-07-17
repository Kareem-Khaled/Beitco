import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, Inbox, MessageCircle, Star, ShieldCheck, Search, BadgeCheck, ShieldAlert, Home } from "lucide-react";
import { useAuth } from "@/lib/beitco/auth";
import { type AppNotification, timeAgo } from "@/lib/beitco/store";
import { useNotifications, markNotificationsSeen } from "@/lib/beitco/queries";
import { SiteHeader } from "@/components/beitco/SiteHeader";
import { SiteFooter } from "@/components/beitco/SiteFooter";
import { EmptyState } from "@/components/beitco/EmptyState";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/notifications")({
  component: NotificationsPage,
});

const META: Record<
  AppNotification["type"],
  { icon: React.ComponentType<{ className?: string }>; tone: string }
> = {
  lead: { icon: Inbox, tone: "bg-trust-soft text-trust" },
  message: { icon: MessageCircle, tone: "bg-primary/10 text-primary" },
  review: { icon: Star, tone: "bg-amber-500/15 text-amber-600" },
  verification: { icon: ShieldCheck, tone: "bg-trust-soft text-trust" },
  link: { icon: BadgeCheck, tone: "bg-amber-500/15 text-amber-600" },
  saved_search: { icon: Search, tone: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
  moderation: { icon: ShieldAlert, tone: "bg-primary/10 text-primary" },
  listing_status: { icon: Home, tone: "bg-trust-soft text-trust" },
};

function NotificationsPage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data } = useNotifications(user?.id);
  // Captured at fetch time: lastSeen is the PRE-view marker, so items newer than
  // it render as "new" even though we mark everything seen on view (below).
  const items = data?.items ?? [];
  const lastSeen = data?.lastSeen ?? 0;

  useEffect(() => {
    if (!isLoading && !user) navigate({ to: "/auth/login" });
  }, [user, isLoading, navigate]);

  // Mark everything seen on view, then refresh the bell badge.
  useEffect(() => {
    if (!user) return;
    void markNotificationsSeen(user.id).then(() => {
      qc.invalidateQueries({ queryKey: ["notificationsUnread", user.id] });
    });
  }, [user, qc]);

  if (!user) return null;

  return (
    <div dir="rtl" className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-6">
        <header className="mb-5">
          <h1 className="font-display text-2xl font-semibold tracking-tight">الإشعارات</h1>
          <p className="text-sm text-muted-foreground">كل اللي محتاج تعرفه عن نشاطك على بيتون.</p>
        </header>

        {items.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="مفيش إشعارات لسه"
            hint="أول ما يحصل نشاط على حسابك — طلب معاينة، رسالة، أو رأي — هتلاقيه هنا."
            action={
              <Button asChild variant="outline">
                <Link to="/search">
                  <Search className="me-1 h-3.5 w-3.5" />
                  دوّر على بيت
                </Link>
              </Button>
            }
          />
        ) : (
          <ul className="grid gap-2">
            {items.map((n) => {
              const m = META[n.type];
              const Icon = m.icon;
              const unread = +new Date(n.date) > lastSeen;
              const inner = (
                <div
                  className={`flex items-start gap-3 rounded-2xl border bg-card p-4 transition-colors hover:bg-muted/40 ${
                    unread ? "border-primary/40" : "border-border"
                  }`}
                >
                  <span
                    className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${m.tone}`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-base font-semibold text-foreground">{n.title}</p>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {timeAgo(n.date)}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                      {n.body}
                    </p>
                  </div>
                  {unread ? (
                    <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
                  ) : null}
                </div>
              );

              // Route to the most relevant place for each notification type.
              if (n.type === "message" && n.threadId) {
                return (
                  <li key={n.id}>
                    <Link to="/messages/$threadId" params={{ threadId: n.threadId }}>
                      {inner}
                    </Link>
                  </li>
                );
              }
              if (n.type === "lead") {
                return (
                  <li key={n.id}>
                    <Link to="/dashboard/leads">{inner}</Link>
                  </li>
                );
              }
              if ((n.type === "review" || n.type === "saved_search") && n.propertyId) {
                return (
                  <li key={n.id}>
                    <Link to="/property/$id" params={{ id: n.propertyId }}>
                      {inner}
                    </Link>
                  </li>
                );
              }
              if (n.type === "verification") {
                return (
                  <li key={n.id}>
                    <Link to="/dashboard/verify">{inner}</Link>
                  </li>
                );
              }
              if (n.type === "link") {
                return (
                  <li key={n.id}>
                    <Link to="/me/tenancies">{inner}</Link>
                  </li>
                );
              }
              if (n.type === "moderation") {
                return (
                  <li key={n.id}>
                    <Link to="/dashboard/moderation">{inner}</Link>
                  </li>
                );
              }
              if (n.type === "listing_status") {
                return (
                  <li key={n.id}>
                    <Link to="/dashboard/listings">{inner}</Link>
                  </li>
                );
              }
              return <li key={n.id}>{inner}</li>;
            })}
          </ul>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
