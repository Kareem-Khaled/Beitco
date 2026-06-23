import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TrustService } from '../trust/trust.service';
import { serializeThread, serializeMessage } from './chat.serializer';
import { CreateThreadDto, SendMessageDto } from './dto/chat.dto';

// Property fields embedded in a serialized thread (title/image/area/landlord).
const threadProperty = {
  select: {
    id: true,
    title: true,
    images: true,
    area: true,
    owner: { select: { name: true, verified: true } },
  },
};

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly trust: TrustService,
  ) {}

  // A user's threads (as owner or renter), newest activity first. No message
  // bodies here -- the list only needs the last-activity + property summary.
  async listThreads(userId: string): Promise<Record<string, unknown>[]> {
    const rows = await this.prisma.thread.findMany({
      where: { OR: [{ ownerId: userId }, { renterId: userId }] },
      orderBy: { lastMessageAt: 'desc' },
      include: {
        property: threadProperty,
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    return rows.map((t) => serializeThread(t as never));
  }

  // One thread with its full message history. Participants only. Opening it
  // clears the caller's unread flag.
  async getThread(userId: string, threadId: string): Promise<Record<string, unknown>> {
    const thread = await this.prisma.thread.findUnique({
      where: { id: threadId },
      include: {
        property: threadProperty,
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!thread) throw new NotFoundException({ code: 'THREAD_NOT_FOUND', message: 'المحادثة دي مش موجودة.' });
    if (thread.ownerId !== userId && thread.renterId !== userId) {
      throw new ForbiddenException({ code: 'NOT_PARTICIPANT', message: 'مش من حقك تشوف المحادثة دي.' });
    }
    // Mark read for the viewer.
    if (thread.unreadForId === userId) {
      await this.prisma.thread.update({ where: { id: threadId }, data: { unreadForId: null } });
      thread.unreadForId = null;
    }
    return serializeThread(thread as never);
  }

  // Renter opens (or re-opens) a thread about a listing. Idempotent on the
  // unique (propertyId, renterId). The renter can't message their own listing.
  async findOrCreate(renterId: string, dto: CreateThreadDto): Promise<Record<string, unknown>> {
    const property = await this.prisma.property.findFirst({
      where: { id: dto.propertyId, deletedAt: null },
      select: { id: true, ownerId: true },
    });
    if (!property) throw new NotFoundException({ code: 'PROPERTY_NOT_FOUND', message: 'المكان ده مش موجود.' });
    if (property.ownerId === renterId) {
      throw new ForbiddenException({ code: 'OWN_LISTING', message: 'دي شقتك — مش هتكلّم نفسك.' });
    }

    const existing = await this.prisma.thread.findUnique({
      where: { propertyId_renterId: { propertyId: dto.propertyId, renterId } },
      include: { property: threadProperty, messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (existing) return serializeThread(existing as never);

    const created = await this.prisma.thread.create({
      data: { propertyId: dto.propertyId, ownerId: property.ownerId, renterId },
      include: { property: threadProperty, messages: true },
    });
    return serializeThread(created as never);
  }

  // Send a message. Participants only. Updates last-activity + the other party's
  // unread flag, and maintains the ResponseEvent (T-3): the renter's first
  // message opens it, the owner's first reply closes it + recomputes owner trust.
  async sendMessage(
    userId: string,
    threadId: string,
    dto: SendMessageDto,
  ): Promise<Record<string, unknown>> {
    const thread = await this.prisma.thread.findUnique({
      where: { id: threadId },
      include: { responseEvent: true },
    });
    if (!thread) throw new NotFoundException({ code: 'THREAD_NOT_FOUND', message: 'المحادثة دي مش موجودة.' });
    if (thread.ownerId !== userId && thread.renterId !== userId) {
      throw new ForbiddenException({ code: 'NOT_PARTICIPANT', message: 'مش من حقك تبعت هنا.' });
    }

    const now = new Date();
    const message = await this.prisma.message.create({
      data: {
        threadId,
        senderId: userId,
        body: dto.body,
        type: (dto.type ?? 'text') as never,
      },
    });
    await this.prisma.thread.update({
      where: { id: threadId },
      data: {
        lastMessageAt: now,
        // Whoever DIDN'T send now has an unread message.
        unreadForId: userId === thread.ownerId ? thread.renterId : thread.ownerId,
      },
    });

    await this.maintainResponseEvent(thread, userId, now);
    return serializeMessage(message as never);
  }

  // T-3 bookkeeping: open on the renter's first message, close on the owner's
  // first reply (and recompute the owner's response-rate-backed trust).
  private async maintainResponseEvent(
    thread: { id: string; ownerId: string; renterId: string; responseEvent: { id: string; firstOwnerReplyAt: Date | null } | null },
    senderId: string,
    at: Date,
  ): Promise<void> {
    if (senderId === thread.renterId) {
      if (!thread.responseEvent) {
        await this.prisma.responseEvent.create({
          data: { threadId: thread.id, ownerId: thread.ownerId, firstRenterMessageAt: at },
        });
      }
      return;
    }
    if (
      senderId === thread.ownerId &&
      thread.responseEvent &&
      !thread.responseEvent.firstOwnerReplyAt
    ) {
      await this.prisma.responseEvent.update({
        where: { id: thread.responseEvent.id },
        data: { firstOwnerReplyAt: at },
      });
      await this.trust.recomputeOwner(thread.ownerId);
    }
  }
}
