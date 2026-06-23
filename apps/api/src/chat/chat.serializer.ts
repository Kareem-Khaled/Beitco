// Serializers mapping Prisma Thread/Message rows -> the frontend Thread/Message
// shapes (apps/web/src/lib/beitco/types.ts). Threads embed a small property
// summary (title/image/area/landlord) so the messages pages need no extra
// property fetches in API mode (mirrors what getProperty gives in the mock).

interface MessageRow {
  id: string;
  threadId: string;
  senderId: string;
  body: string;
  type: string;
  createdAt: Date;
}

interface ThreadPropertyRow {
  id: string;
  title: string;
  images: string[];
  area: string;
  owner?: { name: string; verified: boolean } | null;
}

interface ThreadRow {
  id: string;
  propertyId: string;
  ownerId: string;
  renterId: string;
  lastMessageAt: Date;
  unreadForId: string | null;
  messages?: MessageRow[];
  property?: ThreadPropertyRow | null;
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2);
  return `${parts[0]![0]}.${parts[1]![0]}`;
}

export function serializeMessage(m: MessageRow): Record<string, unknown> {
  return {
    id: m.id,
    threadId: m.threadId,
    senderId: m.senderId,
    body: m.body,
    createdAt: m.createdAt.toISOString(),
    type: m.type,
  };
}

export function serializeThread(t: ThreadRow): Record<string, unknown> {
  const ownerName = t.property?.owner?.name ?? 'صاحب البيت';
  return {
    id: t.id,
    propertyId: t.propertyId,
    ownerId: t.ownerId,
    renterId: t.renterId,
    lastMessageAt: t.lastMessageAt.toISOString(),
    unreadFor: t.unreadForId ?? undefined,
    messages: (t.messages ?? []).map(serializeMessage),
    property: t.property
      ? {
          id: t.property.id,
          title: t.property.title,
          image: t.property.images[0] ?? '',
          area: t.property.area,
          landlord: {
            name: ownerName,
            initials: initialsOf(ownerName),
            verified: t.property.owner?.verified ?? false,
          },
        }
      : undefined,
  };
}
