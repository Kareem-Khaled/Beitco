import type { UserSummary } from './user';

export interface ConversationSummary {
  id: string;
  participants: UserSummary[];
  lastMessage: MessageSummary | null;
  unreadCount: number;
  listingId: string | null;
  updatedAt: string;
}

export interface MessageSummary {
  id: string;
  sender: UserSummary;
  content: string;
  messageType: 'text' | 'image' | 'listing_card';
  metadata: Record<string, unknown>;
  createdAt: string;
}
