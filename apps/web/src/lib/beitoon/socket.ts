// CHAT-3 client: a single shared Socket.io connection to the chat namespace.
// The browser sends the httpOnly auth cookie automatically (withCredentials), so
// no token handling here. The socket only signals "something changed"  -  the
// useChatSocket hook turns `message:new` into TanStack Query invalidations, so
// Query stays the single source of truth (no manual cache patching).
import { io, type Socket } from "socket.io-client";
import { API_ORIGIN } from "./api";

export interface NewMessageEvent {
  threadId: string;
  message: {
    id: string;
    threadId: string;
    senderId: string;
    body: string;
    createdAt: string;
    type?: "text" | "viewing_request";
  };
}

let socket: Socket | null = null;

export function getChatSocket(): Socket {
  if (!socket) {
    socket = io(`${API_ORIGIN}/ws/chat`, {
      withCredentials: true,
      autoConnect: false,
      transports: ["websocket"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socket;
}
