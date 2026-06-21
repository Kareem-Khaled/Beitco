import { api, fetchPaginated } from './client';
import type { ConversationSummary, MessageSummary } from '@beitco/types';

export const chatApi = {
  conversations(cursor?: string) {
    return fetchPaginated<ConversationSummary>('/chat/conversations', undefined, cursor);
  },

  messages(conversationId: string, cursor?: string) {
    return fetchPaginated<MessageSummary>(`/chat/conversations/${conversationId}/messages`, undefined, cursor);
  },

  sendMessage(conversationId: string, content: string, messageType: string = 'text') {
    return api.post<MessageSummary>(`/chat/conversations/${conversationId}/messages`, { content, messageType });
  },

  markRead(conversationId: string) {
    return api.post<{ success: boolean }>(`/chat/conversations/${conversationId}/read`);
  },

  createConversation(participantId: string, listingId?: string) {
    return api.post<ConversationSummary>('/chat/conversations', { participantId, listingId });
  },
};
