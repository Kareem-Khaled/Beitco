import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';

// Derived notification feed -- ported from the web mock (store.ts
// getNotificationsForUser). We DON'T store a notifications table; we compute the
// feed from existing activity (pending leads, unread threads, review-eligible
// tenancies, verification status). Read-state is a single per-user "last seen"
// epoch-ms timestamp in Redis (mirrors the mock's localStorage marker).

const REVIEW_GATE_DAYS = 30;
const SEEN_KEY = (userId: string) => `notif:seen:${userId}`;

export interface AppNotification {
  id: string;
  type: 'lead' | 'message' | 'review' | 'verification' | 'link';
  title: string;
  body: string;
  date: string; // ISO
  propertyId?: string;
  threadId?: string;
}

@Injectable()
export class NotificationsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationsService.name);
  private redis!: Redis;
  private redisReady = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    const url = this.config.get<string>('REDIS_URL', 'redis://localhost:6379');
    this.redis = new Redis(url, { maxRetriesPerRequest: 3, lazyConnect: true });
    try {
      await this.redis.connect();
      this.redisReady = true;
    } catch {
      this.logger.warn('Redis unavailable for notifications read-state.');
    }
  }

  async onModuleDestroy() {
    await this.redis?.quit();
  }

  // The full derived feed for a user, newest first.
  async feed(userId: string): Promise<AppNotification[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, verified: true, verificationStatus: true, createdAt: true },
    });
    if (!user) return [];
    const out: AppNotification[] = [];

    // 1) Owner: new pending viewing requests on their listings.
    if (user.role === 'owner' || user.role === 'both') {
      const leads = await this.prisma.lead.findMany({
        where: { status: 'pending', property: { ownerId: userId } },
        include: { property: { select: { title: true } } },
      });
      for (const l of leads) {
        out.push({
          id: `lead-${l.id}`,
          type: 'lead',
          title: 'طلب معاينة جديد',
          body: `${l.renterName} عايز يعاين «${l.property?.title ?? 'شقتك'}»`,
          date: l.createdAt.toISOString(),
          propertyId: l.propertyId,
        });
      }
    }

    // 2) Both sides: threads with unread messages for me.
    const threads = await this.prisma.thread.findMany({
      where: { unreadForId: userId },
      include: {
        property: { select: { title: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    for (const t of threads) {
      const last = t.messages[0];
      out.push({
        id: `msg-${t.id}`,
        type: 'message',
        title: 'رسالة جديدة',
        body: last?.body?.slice(0, 80) ?? `محادثة عن «${t.property?.title ?? 'شقة'}»`,
        date: t.lastMessageAt.toISOString(),
        threadId: t.id,
      });
    }

    // 3) Renter: tenancies that became review-eligible (>= 30 days).
    const tenancies = await this.prisma.tenancy.findMany({
      where: { userId },
      include: { property: { select: { title: true } } },
    });
    for (const ten of tenancies) {
      const days = (Date.now() - +new Date(ten.moveInDate)) / 86400000;
      if (days < REVIEW_GATE_DAYS) continue;
      out.push({
        id: `rev-${ten.id}`,
        type: 'review',
        title: 'تقدر تكتب رأيك دلوقتي',
        body: `عدّى 30 يوم على سكنك في «${ten.property?.title ?? 'المكان'}» — رأيك بيساعد ناس كتير.`,
        date: new Date(ten.moveInDate).toISOString(),
        propertyId: ten.propertyId,
      });
    }

    // 4) Verification status updates.
    const status = user.verificationStatus;
    if (status === 'verified') {
      out.push({
        id: 'verif-done',
        type: 'verification',
        title: 'حسابك اتوثّق ✅',
        body: 'مبروك! دلوقتي عندك علامة موثّق وبتظهر للناس بثقة أكتر.',
        date: user.createdAt.toISOString(),
      });
    } else if (status === 'pending') {
      out.push({
        id: 'verif-pending',
        type: 'verification',
        title: 'طلب التوثيق بيتراجع',
        body: 'استلمنا مستنداتك وبنراجعها. هنبلّغك أول ما يخلص.',
        date: user.createdAt.toISOString(),
      });
    }

    return out.sort((a, b) => +new Date(b.date) - +new Date(a.date));
  }

  async lastSeen(userId: string): Promise<number> {
    if (!this.redisReady) return 0;
    const raw = await this.redis.get(SEEN_KEY(userId));
    return raw ? Number(raw) : 0;
  }

  // Count of feed items newer than the last-seen marker.
  async unreadCount(userId: string): Promise<{ count: number }> {
    const [items, seen] = await Promise.all([this.feed(userId), this.lastSeen(userId)]);
    const count = items.filter((n) => +new Date(n.date) > seen).length;
    return { count };
  }

  async markSeen(userId: string): Promise<{ ok: true }> {
    if (this.redisReady) await this.redis.set(SEEN_KEY(userId), String(Date.now()));
    return { ok: true };
  }

  // Feed annotated with each item's read state (for the page UI).
  async feedWithState(userId: string): Promise<{ items: AppNotification[]; lastSeen: number }> {
    const [items, seen] = await Promise.all([this.feed(userId), this.lastSeen(userId)]);
    return { items, lastSeen: seen };
  }
}
