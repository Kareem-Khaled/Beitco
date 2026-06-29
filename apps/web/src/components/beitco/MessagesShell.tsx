import { Link } from "@tanstack/react-router";
import { MessageCircle, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/beitco/auth";
import { useThreads, threadPropertyOf } from "@/lib/beitco/queries";
import type { Thread } from "@/lib/beitco/types";
import { SiteHeader } from "@/components/beitco/SiteHeader";

// Messenger-style two-pane shell for the messages section: a conversations list
// (contacts) on the start side + the active conversation on the end side. On
// mobile only one pane shows at a time — the list at /messages, the conversation
// at /messages/$threadId — which keeps the phone-first UX clean.
export function MessagesShell({
  activeId,
  children,
}: {
  activeId?: string;
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const { data: threads = [] } = useThreads(user?.id);

  return (
    <div dir="rtl" className="flex h-[100dvh] flex-col bg-background text-foreground">
      <SiteHeader />
      {/* Mobile keeps pb to clear the fixed BottomNav (visible < md); from md the
          nav is gone, so use symmetric padding all around for breathing room. */}
      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-0 overflow-hidden px-0 pb-16 sm:gap-4 sm:px-4 sm:pt-4 md:p-4">
        {/* Conversations list (contacts) */}
        <aside
          className={`min-h-0 w-full shrink-0 flex-col overflow-hidden border-border bg-card sm:rounded-2xl sm:border lg:w-[340px] ${
            activeId ? "hidden lg:flex" : "flex"
          }`}
        >
          <div className="shrink-0 border-b border-border px-4 py-3">
            <h1 className="font-display text-lg font-semibold tracking-tight">الرسايل</h1>
            <p className="text-xs text-muted-foreground">محادثاتك مع أصحاب الشقق والمستأجرين.</p>
          </div>
          <ConversationList threads={threads} activeId={activeId} userId={user?.id} />
        </aside>

        {/* Active conversation */}
        <section
          className={`min-h-0 min-w-0 flex-1 flex-col overflow-hidden border-border bg-card sm:rounded-2xl sm:border ${
            activeId ? "flex" : "hidden lg:flex"
          }`}
        >
          {children}
        </section>
      </div>
    </div>
  );
}

function ConversationList({
  threads,
  activeId,
  userId,
}: {
  threads: Thread[];
  activeId?: string;
  userId?: string;
}) {
  if (threads.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <MessageCircle className="mb-3 h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">لسه ما فيش رسايل.</p>
        <Link to="/search" className="mt-3 text-sm text-primary hover:underline">
          دوّر على بيت
        </Link>
      </div>
    );
  }

  return (
    <ul className="min-h-0 flex-1 divide-y divide-border overflow-y-auto">
      {threads.map((t) => {
        const p = threadPropertyOf(t);
        const last = t.messages[t.messages.length - 1];
        const otherIsOwner = userId !== t.ownerId;
        const otherName = otherIsOwner ? (p?.landlord.name ?? "صاحب الشقة") : "المستأجر";
        const verified = otherIsOwner && (p?.landlord.verified ?? false);
        const unread = t.unreadFor === userId;
        const active = t.id === activeId;
        return (
          <li key={t.id}>
            <Link
              to="/messages/$threadId"
              params={{ threadId: t.id }}
              className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/50 ${
                active ? "bg-muted" : ""
              }`}
            >
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-sm font-semibold text-primary">
                {(otherName ?? "?").slice(0, 1)}
                {unread ? (
                  <span className="absolute -end-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-card bg-primary" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="flex items-center gap-1 truncate font-medium">
                    {otherName}
                    {verified ? <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-trust" /> : null}
                  </p>
                  <span className="shrink-0 text-[11px] text-muted-foreground">
                    {new Date(t.lastMessageAt).toLocaleDateString("ar-EG-u-nu-latn")}
                  </span>
                </div>
                <p className="truncate text-xs text-muted-foreground">{p?.title ?? "—"}</p>
                {last ? (
                  <p
                    className={`mt-0.5 line-clamp-1 text-sm ${
                      unread ? "font-medium text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {last.type === "viewing_request" ? "📅 " : ""}
                    {last.body}
                  </p>
                ) : null}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
