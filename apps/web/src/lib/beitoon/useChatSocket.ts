// CHAT-3: connect the chat socket while authenticated (API mode only) and turn
// live `message:new` events into TanStack Query invalidations, so the open
// thread, the threads list, and the notification bell all refetch in real time.
// Mounted once at the app root.
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./auth";
import { USE_API } from "./api";
import { getChatSocket, type NewMessageEvent } from "./socket";

export function useChatSocket(): void {
  const { user } = useAuth();
  const qc = useQueryClient();

  useEffect(() => {
    // Mock mode has no server; only connect once a user is known.
    if (!USE_API || !user) return;

    const socket = getChatSocket();
    socket.connect();

    const onMessage = ({ threadId }: NewMessageEvent) => {
      qc.invalidateQueries({ queryKey: ["thread", threadId] });
      qc.invalidateQueries({ queryKey: ["threads", user.id] });
      qc.invalidateQueries({ queryKey: ["notificationsUnread", user.id] });
    };

    socket.on("message:new", onMessage);
    return () => {
      socket.off("message:new", onMessage);
      socket.disconnect();
    };
  }, [user, qc]);
}
