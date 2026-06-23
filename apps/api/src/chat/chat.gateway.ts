import { Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

// CHAT-3: live message delivery. Authenticates the socket via the same httpOnly
// JWT cookie the REST API uses (no token exposed to JS), then puts each client
// in a per-user room. ChatService calls notifyNewMessage() after persisting, so
// the FE can refetch the affected thread/list in real time (TanStack Query stays
// the source of truth -- the socket only triggers invalidation).
const WEB_ORIGINS = process.env.CORS_ORIGINS?.split(',') ?? [
  'http://localhost:8080',
  'http://localhost:8081',
  'http://localhost:3000',
];

function cookieValue(cookieHeader: string | undefined, name: string): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}

@WebSocketGateway({
  namespace: '/ws/chat',
  cors: { origin: WEB_ORIGINS, credentials: true },
})
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer() private server!: Server;
  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = cookieValue(client.handshake.headers.cookie, 'beitco_at');
      if (!token) {
        client.disconnect();
        return;
      }
      const secret = this.config.get<string>('JWT_SECRET');
      const payload = this.jwt.verify<{ sub: string }>(token, { secret });
      const userId = payload.sub;
      (client.data as { userId?: string }).userId = userId;
      await client.join(`user:${userId}`);
    } catch {
      client.disconnect();
    }
  }

  // Emit a freshly-sent message to every participant's room. Called by
  // ChatService after the message is persisted.
  notifyNewMessage(
    participantIds: string[],
    threadId: string,
    message: Record<string, unknown>,
  ): void {
    if (!this.server) return;
    for (const id of new Set(participantIds)) {
      this.server.to(`user:${id}`).emit('message:new', { threadId, message });
    }
  }
}
