import type { NotificationType } from './enums';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  data: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
}

export interface UnreadCount {
  total: number;
  byType: Partial<Record<NotificationType, number>>;
}
