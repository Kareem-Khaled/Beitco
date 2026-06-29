import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Send, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/beitco/auth";
import { useThread, threadPropertyOf, sendChatMessage } from "@/lib/beitco/queries";
import { MessagesShell } from "@/components/beitco/MessagesShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/messages/$threadId")({
  component: ThreadPage,
});

function ThreadPage() {
  const { threadId } = Route.useParams();
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const qc = useQueryClient();
  const { data: thread, isLoading: threadLoading } = useThread(threadId, user?.id);
  const [body, setBody] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoading && !user) navigate({ to: "/auth/login" });
  }, [user, isLoading, navigate]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  });

  if (!user) return null;

  if (!thread) {
    return (
      <MessagesShell activeId={threadId}>
        <div className="flex flex-1 items-center justify-center px-4 text-center">
          <p className="text-sm text-muted-foreground">
            {threadLoading ? "بنحمّل المحادثة…" : "المحادثة دي مش موجودة."}
          </p>
        </div>
      </MessagesShell>
    );
  }

  const property = threadPropertyOf(thread);
  const isOwner = user.id === thread.ownerId;
  const otherName = isOwner ? "المستأجر" : (property?.landlord.name ?? "صاحب الشقة");
  const otherVerified = !isOwner && (property?.landlord.verified ?? false);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    const text = body.trim();
    setBody("");
    await sendChatMessage(thread.id, user.id, text);
    qc.invalidateQueries({ queryKey: ["thread", threadId] });
    qc.invalidateQueries({ queryKey: ["threads", user.id] });
  };

  return (
    <MessagesShell activeId={threadId}>
      {/* Conversation header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-3">
        <Link
          to="/messages"
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted lg:hidden"
          aria-label="رجوع للرسايل"
        >
          <ArrowRight className="h-4 w-4" />
        </Link>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-sm font-semibold text-primary">
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
              className="block truncate text-xs text-muted-foreground hover:underline"
            >
              {property.title}
            </Link>
          ) : null}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-muted/20 p-4">
        {thread.messages.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">ابدأ المحادثة دلوقتي.</p>
        ) : (
          thread.messages.map((m) => {
            const mine = m.senderId === user.id;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-start" : "justify-end"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                    mine
                      ? "rounded-se-sm bg-primary text-primary-foreground"
                      : "rounded-ss-sm bg-card text-foreground"
                  }`}
                >
                  {m.type === "viewing_request" ? (
                    <p className="mb-1 text-[11px] font-medium opacity-80">📅 طلب معاينة</p>
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
      <form onSubmit={send} className="flex shrink-0 items-end gap-2 border-t border-border p-3">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="اكتب رسالة…"
          rows={1}
          className="max-h-32 min-h-[44px] flex-1 resize-none"
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
    </MessagesShell>
  );
}

