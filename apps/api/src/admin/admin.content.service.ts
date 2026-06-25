import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TrustService } from '../trust/trust.service';
import { AdminAuditService } from './admin.audit.service';
import type { AuthUser } from '../auth/decorators/current-user.decorator';
import { AdminReviewsQueryDto, RemoveContentDto } from './dto/admin-content.dto';

interface ReviewRow {
  id: string;
  propertyId: string;
  authorId: string | null;
  authorName: string;
  rating: number;
  body: string;
  helpful: number;
  removedAt: Date | null;
  removedReason: string | null;
  createdAt: Date;
}

function serialize(r: ReviewRow, extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: r.id,
    propertyId: r.propertyId,
    authorId: r.authorId ?? undefined,
    author: r.authorName,
    rating: r.rating,
    body: r.body,
    helpful: r.helpful,
    removed: !!r.removedAt,
    removedAt: r.removedAt?.toISOString(),
    removedReason: r.removedReason ?? undefined,
    createdAt: r.createdAt.toISOString(),
    ...extra,
  };
}

// ADMIN-4: content moderation. Soft-remove a review (or Q&A) so it disappears
// everywhere + stops counting toward trust; restorable. Each removal recomputes
// the listing's trust and is audit-logged.
@Injectable()
export class AdminContentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly trust: TrustService,
    private readonly audit: AdminAuditService,
  ) {}

  // ── Reviews ──
  async listReviews(query: AdminReviewsQueryDto) {
    const limit = Math.min(Math.max(query.limit ?? 25, 1), 50);
    const where: Record<string, unknown> = {};
    if (query.propertyId) where.propertyId = query.propertyId;
    if (query.removed === 'true') where.removedAt = { not: null };
    else if (query.removed === 'false') where.removedAt = null;
    const q = query.q?.trim();
    if (q) {
      where.OR = [
        { body: { contains: q, mode: 'insensitive' } },
        { authorName: { contains: q, mode: 'insensitive' } },
      ];
    }

    const rows = (await this.prisma.review.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    })) as unknown as ReviewRow[];

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;

    const propIds = [...new Set(page.map((r) => r.propertyId))];
    const props = propIds.length
      ? await this.prisma.property.findMany({ where: { id: { in: propIds } }, select: { id: true, title: true } })
      : [];
    const titleMap = new Map(props.map((p) => [p.id, p.title]));

    return {
      data: page.map((r) => serialize(r, { propertyTitle: titleMap.get(r.propertyId) ?? undefined })),
      meta: { cursor: hasMore ? (page[page.length - 1]?.id ?? null) : null, hasMore },
    };
  }

  async removeReview(admin: AuthUser, id: string, dto: RemoveContentDto): Promise<Record<string, unknown>> {
    const review = await this.prisma.review.findUnique({
      where: { id },
      select: { id: true, propertyId: true, removedAt: true },
    });
    if (!review) throw new NotFoundException({ code: 'REVIEW_NOT_FOUND', message: 'الرأي ده مش موجود.' });

    const reason = dto.reason.trim() || 'مخالف لشروط النشر.';
    await this.prisma.review.update({
      where: { id },
      data: { removedAt: new Date(), removedReason: reason, removedById: admin.id },
    });
    // The wedge stays honest: a removed review must stop counting immediately.
    await this.trust.recomputeListing(review.propertyId);
    await this.audit.log(admin, 'review.remove', 'review', id, { reason, propertyId: review.propertyId });
    return this.detailReview(id);
  }

  async restoreReview(admin: AuthUser, id: string): Promise<Record<string, unknown>> {
    const review = await this.prisma.review.findUnique({
      where: { id },
      select: { id: true, propertyId: true },
    });
    if (!review) throw new NotFoundException({ code: 'REVIEW_NOT_FOUND', message: 'الرأي ده مش موجود.' });

    await this.prisma.review.update({
      where: { id },
      data: { removedAt: null, removedReason: null, removedById: null },
    });
    await this.trust.recomputeListing(review.propertyId);
    await this.audit.log(admin, 'review.restore', 'review', id, { propertyId: review.propertyId });
    return this.detailReview(id);
  }

  // ── Questions ──
  async removeQuestion(admin: AuthUser, id: string, dto: RemoveContentDto): Promise<{ ok: true }> {
    const q = await this.prisma.question.findUnique({ where: { id }, select: { id: true, propertyId: true } });
    if (!q) throw new NotFoundException({ code: 'QUESTION_NOT_FOUND', message: 'السؤال ده مش موجود.' });

    const reason = dto.reason.trim() || 'مخالف لشروط النشر.';
    await this.prisma.question.update({
      where: { id },
      data: { removedAt: new Date(), removedReason: reason, removedById: admin.id },
    });
    await this.audit.log(admin, 'question.remove', 'question', id, { reason, propertyId: q.propertyId });
    return { ok: true };
  }

  async restoreQuestion(admin: AuthUser, id: string): Promise<{ ok: true }> {
    const q = await this.prisma.question.findUnique({ where: { id }, select: { id: true } });
    if (!q) throw new NotFoundException({ code: 'QUESTION_NOT_FOUND', message: 'السؤال ده مش موجود.' });

    await this.prisma.question.update({
      where: { id },
      data: { removedAt: null, removedReason: null, removedById: null },
    });
    await this.audit.log(admin, 'question.restore', 'question', id, {});
    return { ok: true };
  }

  private async detailReview(id: string): Promise<Record<string, unknown>> {
    const r = (await this.prisma.review.findUnique({ where: { id } })) as unknown as ReviewRow;
    const p = await this.prisma.property.findUnique({ where: { id: r.propertyId }, select: { title: true } });
    return serialize(r, { propertyTitle: p?.title });
  }
}
