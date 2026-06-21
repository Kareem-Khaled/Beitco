import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationQueryDto } from './dto/notification-query.dto';
import { SubscribePushDto } from './dto/subscribe-push.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { NotificationType } from '@prisma/client';

const NOTIFICATION_SELECT = {
  id: true,
  type: true,
  title: true,
  body: true,
  data: true,
  readAt: true,
  createdAt: true,
};

/** Default notification preferences */
const DEFAULT_PREFERENCES = {
  likes: true,
  comments: true,
  follows: true,
  mentions: true,
  groupActivity: true,
  postApproval: true,
  messages: true,
  system: true,
  pushEnabled: true,
  emailEnabled: false,
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ────────────────────────────────────────────────────
  // CREATE NOTIFICATION (internal — called by other services)
  // ────────────────────────────────────────────────────

  async create(
    userId: string,
    type: NotificationType,
    title: string,
    body?: string,
    data?: Record<string, unknown>,
  ) {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type,
        title,
        body: body ?? null,
        data: (data ?? {}) as Record<string, never>,
      },
      select: NOTIFICATION_SELECT,
    });

    // Fire-and-forget push notification (dev stub)
    void this.sendPush(userId, title, body ?? '');

    this.logger.debug(`Notification created for ${userId}: ${type} — ${title}`);
    return notification;
  }

  // ────────────────────────────────────────────────────
  // GET BY USER (paginated)
  // ────────────────────────────────────────────────────

  async getByUser(userId: string, query: NotificationQueryDto) {
    const { cursor, limit = 20, unreadOnly } = query;

    const where: Record<string, unknown> = { userId };
    if (unreadOnly) {
      where.readAt = null;
    }

    const notifications = await this.prisma.notification.findMany({
      where,
      select: NOTIFICATION_SELECT,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor
        ? { cursor: { id: cursor }, skip: 1 }
        : {}),
    });

    const hasMore = notifications.length > limit;
    const data = hasMore ? notifications.slice(0, limit) : notifications;

    return {
      data,
      meta: {
        cursor: data.length > 0 ? data[data.length - 1]!.id : null,
        hasMore,
      },
    };
  }

  // ────────────────────────────────────────────────────
  // MARK AS READ
  // ────────────────────────────────────────────────────

  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
      select: { id: true, userId: true },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new NotFoundException('Notification not found');
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
      select: NOTIFICATION_SELECT,
    });
  }

  // ────────────────────────────────────────────────────
  // MARK ALL AS READ
  // ────────────────────────────────────────────────────

  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });

    return { updated: result.count };
  }

  // ────────────────────────────────────────────────────
  // UNREAD COUNT
  // ────────────────────────────────────────────────────

  async getUnreadCount(userId: string) {
    const total = await this.prisma.notification.count({
      where: { userId, readAt: null },
    });

    return { total };
  }

  // ────────────────────────────────────────────────────
  // NOTIFICATION PREFERENCES
  // ────────────────────────────────────────────────────

  async getPreferences(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true },
    });

    if (!user) throw new NotFoundException('User not found');

    const prefs = user.preferences as Record<string, unknown> | null;
    const notifPrefs = (prefs?.notifications as Record<string, boolean>) || {};

    return { ...DEFAULT_PREFERENCES, ...notifPrefs };
  }

  async updatePreferences(userId: string, dto: UpdatePreferencesDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true },
    });

    if (!user) throw new NotFoundException('User not found');

    const prefs = (user.preferences as Record<string, unknown>) || {};
    const currentNotifPrefs = (prefs.notifications as Record<string, boolean>) || {};
    const updatedNotifPrefs = { ...currentNotifPrefs };

    // Only update fields that were provided
    for (const [key, value] of Object.entries(dto)) {
      if (value !== undefined) {
        updatedNotifPrefs[key] = value;
      }
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        preferences: {
          ...prefs,
          notifications: updatedNotifPrefs,
        },
      },
    });

    return { ...DEFAULT_PREFERENCES, ...updatedNotifPrefs };
  }

  // ────────────────────────────────────────────────────
  // PUSH SUBSCRIPTION (FCM — dev stub)
  // ────────────────────────────────────────────────────

  async subscribePush(userId: string, dto: SubscribePushDto) {
    // Store push token in user preferences
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true },
    });

    if (!user) throw new NotFoundException('User not found');

    const prefs = (user.preferences as Record<string, unknown>) || {};

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        preferences: {
          ...prefs,
          pushTokens: [
            ...((prefs.pushTokens as Array<{ token: string; platform: string }>) || []).filter(
              (t) => t.token !== dto.fcmToken,
            ),
            { token: dto.fcmToken, platform: dto.platform, subscribedAt: new Date().toISOString() },
          ],
        },
      },
    });

    this.logger.log(`Push subscription registered for ${userId} (${dto.platform})`);

    return { subscribed: true };
  }

  // ────────────────────────────────────────────────────
  // SEND PUSH (dev stub — logs only)
  // ────────────────────────────────────────────────────

  private async sendPush(userId: string, title: string, body: string) {
    // TODO: Integrate real FCM when Firebase project is set up
    this.logger.debug(`📱 Push stub → user=${userId}, title="${title}", body="${body}"`);
  }
}
