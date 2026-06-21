import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Send, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/beitco/auth";
import { getThread, getProperty, postMessage } from "@/lib/beitco/store";
import { SiteHeader } from "@/components/beitco/SiteHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/messages/$threadId")({
  loader: ({ params }) => {
    const t = getThread(params.threadId);
    if (!t) throw notFound();
    return t;
  },
  component: ThreadPage,
});

function ThreadPage() {
  const { threadId } = Route.useParams();
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const [, force] = useState(0);
  const refresh = () => force((x) => x + 1);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoading && !user) navigate({ to: "/auth/login" });
  }, [user, isLoading, navigate]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  });

  if (!user) return null;
  const thread = getThread(threadId);
  if (!thread) return null;

  const property = getProperty(thread.propertyId);
  const isOwner = user.id === thread.ownerId;
  const otherName = isOwner ? "المستأجر" : property?.landlord.name ?? "صاحب الشقة";
  const otherVerified = !isOwner && (property?.landlord.verified ?? false);

  const [body, setBody] = useState("");

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    postMessage(thread.id, user.id, body.trim());
    setBody("");
    refresh();
  };

  return (
    <div dir="rtl" className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-4 sm:px-6">
        {/* Thread header */}
        <div className="mb-3 flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
          <Link
            to="/messages"
            className="rounded-md p-2 text-muted-foreground hover:bg-muted"
            aria-label="رجوع"
          >
            <ArrowRight className="h-4 w-4" />
          </Link>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-display text-sm font-semibold text-primary">
            {(otherName ?? "?").slice(0, 1)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 font-medium">
              {otherName}
              {otherVerified ? <ShieldCheck className="h-3.5 w-3.5 text-trust" /> : null}
            </p>
            {property ? (
              <Link
                to="/property/$id"
                params={{ id: property.id }}
                className="truncate text-xs text-muted-foreground hover:underline"
              >
                {property.title}
              </Link>
            ) : null}
          </div>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 space-y-3 overflow-y-auto rounded-2xl border border-border bg-card p-4"
          style={{ maxHeight: "60vh", minHeight: "300px" }}
        >
          {thread.messages.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              ابدأ المحادثة دلوقتي.
            </p>
          ) : (
            thread.messages.map((m) => {
              const mine = m.senderId === user.id;
              return (
                <div key={m.id} className={`flex ${mine ? "justify-start" : "justify-end"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                      mine
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {m.type === "viewing_request" ? (
                      <p className="mb-1 text-[11px] font-medium opacity-80">طلب معاينة</p>
                    ) : null}
                    <p className="whitespace-pre-wrap leading-relaxed">{m.body}</p>
                    <p className={`mt-1 text-[10px] ${mine ? "opacity-70" : "text-muted-foreground"}`}>
                      {new Date(m.createdAt).toLocaleString("ar-EG-u-nu-latn", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Composer */}
        <form onSubmit={send} className="mt-3 flex items-end gap-2">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="اكتب رسالة…"
            rows={2}
            className="min-h-[44px] flex-1 resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(e as unknown as React.FormEvent);
              }
            }}
          />
          <Button type="submit" disabled={!body.trim()} size="icon" className="h-[44px] w-[44px]">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
