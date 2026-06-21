import { Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ChatService } from './chat.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

/**
 * WebSocket gateway for real-time chat.
 * Handles: connection auth, send messages, typing indicators, room management.
 *
 * Connect: ws://localhost:3001 with { auth: { token: 'Bearer xxx' } }
 * Events:
 *   - join_conversation { conversationId }
 *   - leave_conversation { conversationId }
 *   - send_message { conversationId, content, messageType? }
 *   - typing { conversationId, isTyping }
 *
 * Server emits:
 *   - new_message { message }
 *   - user_typing { conversationId, userId, isTyping }
 *   - error { message }
 */
@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/ws/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Authenticate WebSocket connections via JWT token.
   */
  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token =
        client.handshake.auth?.token?.replace('Bearer ', '') ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        client.emit('error', { message: 'Authentication required' });
        client.disconnect();
        return;
      }

      const secret = this.configService.get<string>('JWT_ACCESS_SECRET') || 'dev-secret';
      const payload = this.jwtService.verify(token, { secret }) as { sub: string };
      client.userId = payload.sub;

      this.logger.log(`Client connected: ${client.userId}`);
    } catch {
      client.emit('error', { message: 'Invalid token' });
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.logger.log(`Client disconnected: ${client.userId}`);
    }
  }

  @SubscribeMessage('join_conversation')
  handleJoinConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    if (!client.userId) return;
    const room = `conversation:${data.conversationId}`;
    void client.join(room);
    this.logger.debug(`${client.userId} joined ${room}`);
  }

  @SubscribeMessage('leave_conversation')
  handleLeaveConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    if (!client.userId) return;
    const room = `conversation:${data.conversationId}`;
    void client.leave(room);
    this.logger.debug(`${client.userId} left ${room}`);
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string; content: string; messageType?: string },
  ) {
    if (!client.userId) return;

    try {
      const message = await this.chatService.sendMessage(
        data.conversationId,
        client.userId,
        { content: data.content, messageType: data.messageType },
      );

      // Broadcast to room (including sender for consistency)
      const room = `conversation:${data.conversationId}`;
      this.server.to(room).emit('new_message', message);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      client.emit('error', { message: errorMessage });
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string; isTyping: boolean },
  ) {
    if (!client.userId) return;
    const room = `conversation:${data.conversationId}`;
    client.to(room).emit('user_typing', {
      conversationId: data.conversationId,
      userId: client.userId,
      isTyping: data.isTyping,
    });
  }
}
