import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { serializeProperty, type PropertyRow } from '../listings/listings.serializer';
import {
  propertyMatchesSavedSearch,
  type MatchableListing,
  type SavedSearchParams,
} from './saved-search.matcher';

// Notification feed = DERIVED items (computed from current activity: pending
// leads, unread threads, review-eligible tenancies, verification) MERGED with
// PERSISTED rows (saved-search alerts, NOTIF-2). Ported from the web mock
// (store.ts getNotificationsForUser). Read-state is a single per-user "last
// seen" epoch-ms timestamp in Redis (mirrors the mock's localStorage marker).

const REVIEW_GATE_DAYS = 30;
const SEEN_KEY = (userId: string) => `notif:seen:${userId}`;

export interface AppNotification {
  id: string;
  type: 'lead' | 'message' | 'review' | 'verification' | 'link' | 'saved_search';
  title: string;
  body: string;
  date: string; // ISO
  propertyId?: string;
  threadId?: string;
}

// Relations needed to serialize a property for matching (Arabic type + beds).
const matchInclude = {
  owner: true,
  rooms: { include: { beds: true } },
  nearby: true,
  customSpecs: true,
  reviews: true,
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  // Shared Redis connection (POLISH-3). The getter keeps the read-state call
  // sites (`this.redis.get/set`) unchanged.
  private get redis() {
    return this.redisService.client;
  }

  // The full feed for a user, newest first (derived + persisted).
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
        body: `عدّى 30 يوم على سكنك في «${ten.property?.title ?? 'المكان'}»، رأيك بيساعد ناس كتير.`,
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
        title: 'حسابك اتوثّق',
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

    // 5) Persisted rows (saved-search alerts, NOTIF-2).
    const stored = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    for (const n of stored) {
      out.push({
        id: n.id,
        type: n.type as AppNotification['type'],
        title: n.title,
        body: n.body,
        date: n.createdAt.toISOString(),
        propertyId: n.propertyId ?? undefined,
        threadId: n.threadId ?? undefined,
      });
    }

    return out.sort((a, b) => +new Date(b.date) - +new Date(a.date));
  }

  async lastSeen(userId: string): Promise<number> {
    if (!this.redisService.ready) return 0;
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
    if (this.redisService.ready) await this.redis.set(SEEN_KEY(userId), String(Date.now()));
    return { ok: true };
  }

  // Feed annotated with the last-seen marker (for the page UI).
  async feedWithState(userId: string): Promise<{ items: AppNotification[]; lastSeen: number }> {
    const [items, seen] = await Promise.all([this.feed(userId), this.lastSeen(userId)]);
    return { items, lastSeen: seen };
  }

  // NOTIF-2: when a listing goes live, alert every user whose saved search it
  // matches ("hanballaghak awwel ma yinzil makan yutabe2u"). Best-effort: it must
  // never break listing creation, so callers wrap it / it swallows its own errors.
  // One alert per (user, property); the property owner is never alerted.
  async notifyForNewListing(propertyId: string): Promise<{ created: number }> {
    try {
      const row = (await this.prisma.property.findFirst({
        where: { id: propertyId, status: 'published', deletedAt: null },
        include: matchInclude,
      })) as unknown as (PropertyRow & { ownerId: string }) | null;
      if (!row) return { created: 0 };

      const full = serializeProperty(row) as Record<string, unknown>;
      const matchable: MatchableListing = {
        title: full.title as string,
        area: full.area as string,
        address: (full.address as string) ?? '',
        type: full.type as string,
        listingType: full.listingType as string | undefined,
        rentToGender: (full.rentToGender as string | null) ?? null,
        verified: full.verified as boolean,
        price: full.price as number,
        beds: { available: (full.beds as { available?: number })?.available ?? 0 },
      };

      const searches = await this.prisma.savedSearch.findMany({
        select: { userId: true, params: true },
      });
      const matchedUserIds = new Set<string>();
      for (const s of searches) {
        if (s.userId === row.ownerId) continue;
        if (propertyMatchesSavedSearch(matchable, s.params as SavedSearchParams)) {
          matchedUserIds.add(s.userId);
        }
      }
      if (matchedUserIds.size === 0) return { created: 0 };

      let created = 0;
      for (const userId of matchedUserIds) {
        const exists = await this.prisma.notification.findFirst({
          where: { userId, propertyId, type: 'saved_search' },
          select: { id: true },
        });
        if (exists) continue;
        await this.prisma.notification.create({
          data: {
            userId,
            type: 'saved_search',
            propertyId,
            title: 'نزل مكان يطابق بحثك',
            body: `«${full.title as string}» في ${full.area as string}، شكله بيطابق اللي بتدوّر عليه.`,
          },
        });
        created++;
      }
      if (created > 0) this.logger.log(`Saved-search alerts: ${created} for listing ${propertyId}`);
      return { created };
    } catch (err) {
      this.logger.warn(`notifyForNewListing(${propertyId}) failed: ${String(err)}`);
      return { created: 0 };
    }
  }
}
