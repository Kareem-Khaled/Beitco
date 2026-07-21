import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { MessageCircle } from "lucide-react";
import { useAuth } from "@/lib/beitoon/auth";
import { MessagesShell } from "@/components/beitoon/MessagesShell";

export const Route = createFileRoute("/messages/")({
  component: MessagesIndex,
});

function MessagesIndex() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) navigate({ to: "/auth/login" });
  }, [user, isLoading, navigate]);

  if (!user) return null;

  // No active thread: the shell shows the conversations list. This placeholder
  // only appears on the desktop (lg+) second pane  -  on mobile the list is the
  // whole screen until a conversation is opened.
  return (
    <MessagesShell>
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MessageCircle className="h-7 w-7" />
        </div>
        <h2 className="font-display text-lg font-semibold">اختار محادثة</h2>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          اختار حد من القايمة عشان تكمّل الكلام، أو ابدأ محادثة جديدة من صفحة أي شقة.
        </p>
      </div>
    </MessagesShell>
  );
}

