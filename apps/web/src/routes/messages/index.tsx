import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { MessageCircle } from "lucide-react";
import { useAuth } from "@/lib/beitco/auth";
import { useThreads, threadPropertyOf } from "@/lib/beitco/queries";
import { SiteHeader } from "@/components/beitco/SiteHeader";
import { SiteFooter } from "@/components/beitco/SiteFooter";

export const Route = createFileRoute("/messages/")({
  component: MessagesIndex,
});

function MessagesIndex() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const { data: threads = [] } = useThreads(user?.id);

  useEffect(() => {
    if (!isLoading && !user) navigate({ to: "/auth/login" });
  }, [user, isLoading, navigate]);

  if (!user) return null;

  return (
    <div dir="rtl" className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6">
        <header className="mb-5">
          <h1 className="font-display text-2xl font-semibold tracking-tight">الرسايل</h1>
          <p className="text-sm text-muted-foreground">كل محادثاتك مع أصحاب الشقق والمستأجرين.</p>
        </header>

        {threads.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
            <MessageCircle className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">لسه ما فيش رسايل.</p>
            <Link to="/search" className="mt-3 inline-block text-sm text-primary hover:underline">
              دوّر على بيت
            </Link>
          </div>
        ) : (
          <ul className="grid gap-2">
            {threads.map((t) => {
              const p = threadPropertyOf(t);
              const last = t.messages[t.messages.length - 1];
              const otherIsOwner = user.id !== t.ownerId;
              const otherName = otherIsOwner ? (p?.landlord.name ?? "صاحب الشقة") : "المستأجر";
              const unread = t.unreadFor === user.id;
              return (
                <li key={t.id}>
                  <Link
                    to="/messages/$threadId"
                    params={{ threadId: t.id }}
                    className={`flex items-start gap-3 rounded-2xl border bg-card p-4 transition-colors hover:bg-muted/40 ${
                      unread ? "border-primary/40" : "border-border"
                    }`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-sm font-semibold text-primary">
                      {(otherName ?? "?").slice(0, 1)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate font-medium">{otherName}</p>
                        <span className="text-[11px] text-muted-foreground">
                          {new Date(t.lastMessageAt).toLocaleDateString("ar-EG-u-nu-latn")}
                        </span>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">{p?.title ?? "—"}</p>
                      {last ? (
                        <p
                          className={`mt-1 line-clamp-1 text-sm ${
                            unread ? "font-medium text-foreground" : "text-muted-foreground"
                          }`}
                        >
                          {last.body}
                        </p>
                      ) : null}
                    </div>
                    {unread ? (
                      <span className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full bg-primary" />
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
