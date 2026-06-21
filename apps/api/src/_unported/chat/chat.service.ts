import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConversationDto, SendMessageDto } from './dto';

/** Select for conversation list */
const CONVERSATION_SELECT = {
  id: true,
  listingId: true,
  lastMessageAt: true,
  createdAt: true,
  participants: {
    select: {
      userId: true,
      lastReadAt: true,
      user: {
        select: {
          id: true,
          nameAr: true,
          nameEn: true,
          username: true,
          avatarUrl: true,
        },
      },
    },
  },
  messages: {
    select: {
      id: true,
      content: true,
      senderId: true,
      messageType: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' as const },
    take: 1,
  },
} as const;

/** Select for message */
const MESSAGE_SELECT = {
  id: true,
  conversationId: true,
  senderId: true,
  content: true,
  messageType: true,
  metadata: true,
  createdAt: true,
  deletedAt: true,
  sender: {
    select: {
      id: true,
      nameAr: true,
      nameEn: true,
      username: true,
      avatarUrl: true,
    },
  },
} as const;

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get user's conversations, ordered by last message (newest first).
   */
  async getConversations(userId: string, query: { cursor?: string; limit?: number }) {
    const { cursor, limit = 20 } = query;

    const conversations = await this.prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId },
        },
      },
      select: CONVERSATION_SELECT,
      orderBy: { lastMessageAt: { sort: 'desc', nulls: 'last' } },
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });

    const hasMore = conversations.length > limit;
    const items = hasMore ? conversations.slice(0, limit) : conversations;

    // Enrich with unread count for this user
    const enriched = items.map((conv) => {
      const participant = conv.participants.find((p) => p.userId === userId);
      const lastRead = participant?.lastReadAt;
      const otherParticipants = conv.participants
        .filter((p) => p.userId !== userId)
        .map((p) => p.user);
      const lastMessage = conv.messages[0] || null;

      return {
        id: conv.id,
        listingId: conv.listingId,
        lastMessageAt: conv.lastMessageAt,
        createdAt: conv.createdAt,
        otherParticipants,
        lastMessage,
        lastReadAt: lastRead,
      };
    });

    return {
      data: enriched,
      meta: {
        cursor: items.length > 0 ? items[items.length - 1]!.id : null,
        hasMore,
      },
    };
  }

  /**
   * Create a new conversation (or return existing one between the two users for the same listing).
   */
  async createConversation(userId: string, dto: CreateConversationDto) {
    if (userId === dto.recipientId) {
      throw new BadRequestException('Cannot create conversation with yourself');
    }

    // Check recipient exists
    const recipient = await this.prisma.user.findUnique({
      where: { id: dto.recipientId },
      select: { id: true, deletedAt: true },
    });

    if (!recipient || recipient.deletedAt) {
      throw new NotFoundException('Recipient not found');
    }

    // Check blocks (both directions)
    const block = await this.prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: userId, blockedId: dto.recipientId },
          { blockerId: dto.recipientId, blockedId: userId },
        ],
      },
    });

    if (block) {
      throw new ForbiddenException('Cannot message this user');
    }

    // Check for existing conversation between these users (optionally for same listing)
    const existing = await this.prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: dto.recipientId } } },
          ...(dto.listingId ? [{ listingId: dto.listingId }] : [{ listingId: null }]),
        ],
      },
      select: { id: true },
    });

    if (existing) {
      // Send message in existing conversation and return it
      await this.sendMessage(existing.id, userId, { content: dto.message });
      const conv = await this.prisma.conversation.findUnique({
        where: { id: existing.id },
        select: CONVERSATION_SELECT,
      });
      return conv;
    }

    // Create new conversation with participants and first message
    const now = new Date();
    const conversation = await this.prisma.conversation.create({
      data: {
        listingId: dto.listingId || null,
        lastMessageAt: now,
        participants: {
          create: [
            { userId, lastReadAt: now },
            { userId: dto.recipientId },
          ],
        },
        messages: {
          create: {
            senderId: userId,
            content: dto.message,
            messageType: 'text',
          },
        },
      },
      select: CONVERSATION_SELECT,
    });

    return conversation;
  }

  /**
   * Get messages in a conversation (paginated, newest first).
   */
  async getMessages(
    conversationId: string,
    userId: string,
    query: { cursor?: string; limit?: number },
  ) {
    const { cursor, limit = 30 } = query;

    // Verify user is participant
    await this.verifyParticipant(conversationId, userId);

    const messages = await this.prisma.message.findMany({
      where: {
        conversationId,
        deletedAt: null,
      },
      select: MESSAGE_SELECT,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });

    const hasMore = messages.length > limit;
    const items = hasMore ? messages.slice(0, limit) : messages;

    return {
      data: items,
      meta: {
        cursor: items.length > 0 ? items[items.length - 1]!.id : null,
        hasMore,
      },
    };
  }

  /**
   * Send a message in a conversation (REST fallback).
   */
  async sendMessage(
    conversationId: string,
    userId: string,
    dto: SendMessageDto | { content: string; messageType?: string },
  ) {
    // Verify user is participant
    await this.verifyParticipant(conversationId, userId);

    // Check blocks between participants
    const participants = await this.prisma.conversationParticipant.findMany({
      where: { conversationId },
      select: { userId: true },
    });

    const otherUserIds = participants
      .map((p) => p.userId)
      .filter((id) => id !== userId);

    if (otherUserIds.length > 0) {
      const block = await this.prisma.block.findFirst({
        where: {
          OR: [
            { blockerId: userId, blockedId: { in: otherUserIds } },
            { blockerId: { in: otherUserIds }, blockedId: userId },
          ],
        },
      });

      if (block) {
        throw new ForbiddenException('Cannot message this user');
      }
    }

    const now = new Date();

    // Create message and update conversation's lastMessageAt + sender's lastReadAt
    const [message] = await this.prisma.$transaction([
      this.prisma.message.create({
        data: {
          conversationId,
          senderId: userId,
          content: dto.content,
          messageType: dto.messageType || 'text',
        },
        select: MESSAGE_SELECT,
      }),
      this.prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: now },
      }),
      this.prisma.conversationParticipant.updateMany({
        where: { conversationId, userId },
        data: { lastReadAt: now },
      }),
    ]);

    return message;
  }

  /**
   * Mark conversation as read for the user.
   */
  async markAsRead(conversationId: string, userId: string) {
    await this.verifyParticipant(conversationId, userId);

    await this.prisma.conversationParticipant.updateMany({
      where: { conversationId, userId },
      data: { lastReadAt: new Date() },
    });

    return { marked: true };
  }

  /**
   * Get a single conversation by ID (with participant check).
   */
  async getConversation(conversationId: string, userId: string) {
    await this.verifyParticipant(conversationId, userId);

    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: CONVERSATION_SELECT,
    });

    if (!conv) {
      throw new NotFoundException('Conversation not found');
    }

    const otherParticipants = conv.participants
      .filter((p) => p.userId !== userId)
      .map((p) => p.user);
    const participant = conv.participants.find((p) => p.userId === userId);
    const lastMessage = conv.messages[0] || null;

    return {
      id: conv.id,
      listingId: conv.listingId,
      lastMessageAt: conv.lastMessageAt,
      createdAt: conv.createdAt,
      otherParticipants,
      lastMessage,
      lastReadAt: participant?.lastReadAt,
    };
  }

  /**
   * Verify that a user is a participant in a conversation.
   */
  private async verifyParticipant(conversationId: string, userId: string) {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: { conversationId, userId },
      },
    });

    if (!participant) {
      throw new NotFoundException('Conversation not found');
    }

    return participant;
  }
}
