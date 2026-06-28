import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { serializeSummary, type PropertyRow } from '../listings/listings.serializer';
import {
  AnswerQuestionDto,
  AskQuestionDto,
  CreateLeadDto,
  CreateSavedSearchDto,
  UpdateLeadStatusDto,
} from './dto/engagement.dto';

const summaryInclude = {
  rooms: { include: { beds: true } },
};

// SCALE-2: a defensive cap on per-user collection reads. A real user has dozens
// of saved items/leads, not thousands — this bounds memory + serialization and
// stops a runaway/abusive account from pulling its whole history in one request.
const MAX_USER_ROWS = 200;

interface LeadRow {
  id: string;
  propertyId: string;
  renterId: string;
  renterName: string;
  status: string;
  intent: string | null;
  preferredDate: Date | null;
  note: string | null;
  createdAt: Date;
  units?: {
    label: string;
    kind: string;
    roomId: string | null;
    roomName: string | null;
    bedId: string | null;
    price: number | null;
  }[];
}

function serializeLead(l: LeadRow): Record<string, unknown> {
  return {
    id: l.id,
    propertyId: l.propertyId,
    renterId: l.renterId,
    renterName: l.renterName,
    status: l.status,
    intent: l.intent ?? undefined,
    units: (l.units ?? []).map((u) => ({
      label: u.label,
      kind: u.kind,
      roomId: u.roomId ?? undefined,
      roomName: u.roomName ?? undefined,
      bedId: u.bedId ?? undefined,
      price: u.price ?? undefined,
    })),
    preferredDate: l.preferredDate?.toISOString(),
    note: l.note ?? undefined,
    createdAt: l.createdAt.toISOString(),
  };
}

@Injectable()
export class EngagementService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Saved listings ───────────────────────────────────
  async listSaved(userId: string): Promise<Record<string, unknown>[]> {
    const saved = await this.prisma.savedListing.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: MAX_USER_ROWS,
      include: { property: { include: summaryInclude } },
    });
    return saved
      .filter((s) => s.property && (s.property as { status: string }).status === 'published')
      .map((s) => serializeSummary(s.property as unknown as PropertyRow));
  }

  // Returns the new saved state (true = saved).
  async toggleSaved(userId: string, propertyId: string): Promise<{ saved: boolean }> {
    const existing = await this.prisma.savedListing.findUnique({
      where: { userId_propertyId: { userId, propertyId } },
    });
    if (existing) {
      await this.prisma.savedListing.delete({ where: { id: existing.id } });
      return { saved: false };
    }
    await this.assertProperty(propertyId);
    await this.prisma.savedListing.create({ data: { userId, propertyId } });
    return { saved: true };
  }

  // ─── Saved searches ───────────────────────────────────
  async listSearches(userId: string): Promise<Record<string, unknown>[]> {
    const rows = await this.prisma.savedSearch.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: MAX_USER_ROWS,
    });
    return rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      label: r.label,
      params: r.params,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async createSearch(userId: string, dto: CreateSavedSearchDto): Promise<Record<string, unknown>> {
    const row = await this.prisma.savedSearch.create({
      data: { userId, label: dto.label, params: dto.params as object },
    });
    return { id: row.id, userId, label: row.label, params: row.params, createdAt: row.createdAt.toISOString() };
  }

  async deleteSearch(userId: string, id: string): Promise<{ ok: true }> {
    await this.prisma.savedSearch.deleteMany({ where: { id, userId } });
    return { ok: true };
  }

  // ─── Leads ────────────────────────────────────────────
  async createLead(
    propertyId: string,
    renterId: string,
    renterName: string,
    dto: CreateLeadDto,
  ): Promise<Record<string, unknown>> {
    await this.assertProperty(propertyId);
    const lead = await this.prisma.lead.create({
      data: {
        propertyId,
        renterId,
        renterName,
        intent: dto.intent ?? null,
        preferredDate: dto.preferredDate ? new Date(dto.preferredDate) : null,
        note: dto.note ?? null,
        units: dto.units?.length
          ? {
              create: dto.units.map((u) => ({
                label: u.label,
                kind: u.kind,
                roomId: u.roomId ?? null,
                roomName: u.roomName ?? null,
                bedId: u.bedId ?? null,
                price: u.price ?? null,
              })),
            }
          : undefined,
      },
      include: { units: true },
    });
    return serializeLead(lead as unknown as LeadRow);
  }

  async listRenterLeads(renterId: string): Promise<Record<string, unknown>[]> {
    const rows = await this.prisma.lead.findMany({
      where: { renterId },
      orderBy: { createdAt: 'desc' },
      take: MAX_USER_ROWS,
      include: { units: true },
    });
    return rows.map((r) => serializeLead(r as unknown as LeadRow));
  }

  async listOwnerLeads(ownerId: string): Promise<Record<string, unknown>[]> {
    const rows = await this.prisma.lead.findMany({
      where: { property: { ownerId } },
      orderBy: { createdAt: 'desc' },
      take: MAX_USER_ROWS,
      include: { units: true },
    });
    const renterIds = [...new Set(rows.map((r) => r.renterId))];
    if (renterIds.length === 0) return [];

    // Renter reputations (T-4) for the privacy-safe badge (score + count only).
    const renters = await this.prisma.user.findMany({
      where: { id: { in: renterIds } },
      select: { id: true, renterReputation: true, renterReviewsCount: true },
    });
    const repMap = new Map(renters.map((u) => [u.id, u]));

    // Which renters this owner can still review: a confirmed owner<->renter
    // tenancy not yet reviewed (mirrors the mock's canOwnerReviewRenter).
    const tenancies = await this.prisma.tenancy.findMany({
      where: { userId: { in: renterIds }, property: { ownerId } },
      select: { id: true, userId: true },
    });
    const reviewed = await this.prisma.renterReview.findMany({
      where: { ownerId, tenancyId: { in: tenancies.map((t) => t.id) } },
      select: { tenancyId: true },
    });
    const reviewedTenancies = new Set(reviewed.map((r) => r.tenancyId));
    const reviewableRenters = new Set<string>();
    for (const t of tenancies) {
      if (!reviewedTenancies.has(t.id)) reviewableRenters.add(t.userId);
    }

    return rows.map((r) => {
      const rep = repMap.get(r.renterId);
      return {
        ...serializeLead(r as unknown as LeadRow),
        renterReputation:
          rep?.renterReputation != null
            ? { score: rep.renterReputation, count: rep.renterReviewsCount }
            : null,
        canReview: reviewableRenters.has(r.renterId),
      };
    });
  }

  // Owner-only. Completing a lead creates a confirmed tenancy (idempotent).
  async updateLeadStatus(
    ownerId: string,
    leadId: string,
    dto: UpdateLeadStatusDto,
  ): Promise<Record<string, unknown>> {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      include: { property: { select: { ownerId: true } }, units: true },
    });
    if (!lead) throw new NotFoundException({ code: 'LEAD_NOT_FOUND', message: 'الطلب ده مش موجود.' });
    if ((lead.property as { ownerId: string }).ownerId !== ownerId) {
      throw new ForbiddenException({ code: 'NOT_OWNER', message: 'مش من حقك تعدّل الطلب ده.' });
    }

    const updated = await this.prisma.lead.update({
      where: { id: leadId },
      data: { status: dto.status },
      include: { units: true },
    });

    if (dto.status === 'completed') {
      const exists = await this.prisma.tenancy.findFirst({
        where: { propertyId: lead.propertyId, userId: lead.renterId },
      });
      if (!exists) {
        await this.prisma.tenancy.create({
          data: { propertyId: lead.propertyId, userId: lead.renterId, moveInDate: new Date(), monthsLived: 0 },
        });
      }
    }
    return serializeLead(updated as unknown as LeadRow);
  }

  // ─── Q&A ──────────────────────────────────────────────
  async ask(
    propertyId: string,
    askerId: string,
    askerName: string,
    dto: AskQuestionDto,
  ): Promise<Record<string, unknown>> {
    await this.assertProperty(propertyId);
    const q = await this.prisma.question.create({
      data: { propertyId, askerId, askerName, body: dto.body },
    });
    return this.serializeQuestion(q);
  }

  async answer(
    ownerId: string,
    ownerName: string,
    questionId: string,
    dto: AnswerQuestionDto,
  ): Promise<Record<string, unknown>> {
    const q = await this.prisma.question.findUnique({
      where: { id: questionId },
      include: { property: { select: { ownerId: true } } },
    });
    if (!q) throw new NotFoundException({ code: 'QUESTION_NOT_FOUND', message: 'السؤال ده مش موجود.' });
    if ((q.property as { ownerId: string }).ownerId !== ownerId) {
      throw new ForbiddenException({ code: 'NOT_OWNER', message: 'صاحب المكان بس اللي يقدر يرد.' });
    }
    const updated = await this.prisma.question.update({
      where: { id: questionId },
      data: { answer: dto.body, answererId: ownerId, answererName: ownerName, answeredAt: new Date() },
    });
    return this.serializeQuestion(updated);
  }

  // ─── Helpers ──────────────────────────────────────────
  private async assertProperty(propertyId: string) {
    const p = await this.prisma.property.findFirst({
      where: { id: propertyId, deletedAt: null },
      select: { id: true },
    });
    if (!p) throw new NotFoundException({ code: 'PROPERTY_NOT_FOUND', message: 'المكان ده مش موجود.' });
  }

  private serializeQuestion(q: {
    id: string;
    propertyId: string;
    askerName: string;
    body: string;
    answer: string | null;
    answererName: string | null;
    createdAt: Date;
    answeredAt: Date | null;
  }): Record<string, unknown> {
    return {
      id: q.id,
      propertyId: q.propertyId,
      asker: q.askerName,
      q: q.body,
      a: q.answer ?? undefined,
      answerer: q.answererName ?? undefined,
      date: (q.answeredAt ?? q.createdAt).toISOString(),
    };
  }
}
