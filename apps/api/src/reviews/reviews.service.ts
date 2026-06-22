import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TrustService } from '../trust/trust.service';
import { CreateRenterReviewDto, CreateReviewDto, ReplyReviewDto } from './dto/reviews.dto';

const REVIEW_GATE_DAYS = 30;

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '؟';
  if (parts.length === 1) return parts[0]!.slice(0, 2);
  return `${parts[0]![0]}.${parts[1]![0]}`;
}

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly trust: TrustService,
  ) {}

  // Resident posts a review (gated by a 30+ day tenancy). Recomputes trust.
  async create(
    propertyId: string,
    authorId: string,
    authorName: string,
    dto: CreateReviewDto,
  ): Promise<Record<string, unknown>> {
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, deletedAt: null },
      select: { id: true },
    });
    if (!property) throw new NotFoundException({ code: 'PROPERTY_NOT_FOUND', message: 'المكان ده مش موجود.' });

    const tenancy = await this.prisma.tenancy.findFirst({
      where: { propertyId, userId: authorId },
      orderBy: { moveInDate: 'asc' },
    });
    if (!tenancy) {
      throw new ForbiddenException({ code: 'NOT_A_RESIDENT', message: 'لازم تكون ساكن هنا عشان تكتب رأيك.' });
    }
    const days = (Date.now() - +new Date(tenancy.moveInDate)) / 86400000;
    if (days < REVIEW_GATE_DAYS) {
      throw new ForbiddenException({
        code: 'TENANCY_TOO_SHORT',
        message: 'تقدر تكتب رأيك بعد ما تقعد 30 يوم على الأقل.',
      });
    }

    const monthsLived = Math.max(1, Math.round(days / 30));
    const review = await this.prisma.review.create({
      data: {
        propertyId,
        authorId,
        authorName,
        initials: initialsOf(authorName),
        monthsLived,
        rating: dto.rating,
        body: dto.body,
        scores: (dto.scores as object) ?? undefined,
      },
    });

    // The wedge: a real review moves the score.
    await this.trust.recomputeListing(propertyId);

    return this.serializeReview(review);
  }

  // Toggle a "helpful" vote (one per user). Returns the new state + count.
  async toggleHelpful(reviewId: string, userId: string): Promise<{ voted: boolean; helpful: number }> {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId }, select: { id: true, helpful: true } });
    if (!review) throw new NotFoundException({ code: 'REVIEW_NOT_FOUND', message: 'الرأي ده مش موجود.' });

    const existing = await this.prisma.reviewHelpfulVote.findUnique({
      where: { reviewId_userId: { reviewId, userId } },
    });

    if (existing) {
      await this.prisma.reviewHelpfulVote.delete({ where: { id: existing.id } });
      const updated = await this.prisma.review.update({
        where: { id: reviewId },
        data: { helpful: { decrement: 1 } },
        select: { helpful: true },
      });
      return { voted: false, helpful: Math.max(0, updated.helpful) };
    }

    await this.prisma.reviewHelpfulVote.create({ data: { reviewId, userId } });
    const updated = await this.prisma.review.update({
      where: { id: reviewId },
      data: { helpful: { increment: 1 } },
      select: { helpful: true },
    });
    return { voted: true, helpful: updated.helpful };
  }

  // Owner replies to a review on their listing.
  async reply(reviewId: string, ownerId: string, dto: ReplyReviewDto): Promise<Record<string, unknown>> {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: { property: { select: { ownerId: true } } },
    });
    if (!review) throw new NotFoundException({ code: 'REVIEW_NOT_FOUND', message: 'الرأي ده مش موجود.' });
    if ((review.property as { ownerId: string }).ownerId !== ownerId) {
      throw new ForbiddenException({ code: 'NOT_OWNER', message: 'صاحب المكان بس اللي يقدر يرد.' });
    }
    const updated = await this.prisma.review.update({
      where: { id: reviewId },
      data: { ownerReply: { body: dto.body, date: new Date().toISOString() } },
    });
    return this.serializeReview(updated);
  }

  // Owner reviews a renter (T-4), gated by a confirmed tenancy between them.
  async createRenterReview(
    ownerId: string,
    renterId: string,
    dto: CreateRenterReviewDto,
  ): Promise<{ ok: true }> {
    if (ownerId === renterId) {
      throw new BadRequestException({ code: 'SELF_REVIEW', message: 'مش هتقيّم نفسك.' });
    }
    // The most recent confirmed tenancy at any property this owner owns.
    const tenancy = await this.prisma.tenancy.findFirst({
      where: { userId: renterId, property: { ownerId } },
      orderBy: { moveInDate: 'desc' },
    });
    if (!tenancy) {
      throw new ForbiddenException({ code: 'NO_TENANCY', message: 'الساكن ده ما سكنش في حتة من عندك.' });
    }
    const dup = await this.prisma.renterReview.findFirst({
      where: { tenancyId: tenancy.id, ownerId },
    });
    if (dup) {
      throw new BadRequestException({ code: 'ALREADY_REVIEWED', message: 'قيّمت الساكن ده قبل كده.' });
    }

    await this.prisma.renterReview.create({
      data: {
        tenancyId: tenancy.id,
        renterId,
        ownerId,
        propertyId: tenancy.propertyId,
        rating: dto.rating,
        body: dto.body,
        scores: dto.scores as object,
      },
    });

    await this.trust.recomputeRenterReputation(renterId);
    return { ok: true };
  }

  private serializeReview(r: {
    id: string;
    propertyId: string;
    authorName: string;
    initials: string;
    monthsLived: number;
    rating: number;
    body: string;
    helpful: number;
    ownerReply: unknown;
    scores: unknown;
    createdAt: Date;
  }): Record<string, unknown> {
    return {
      id: r.id,
      propertyId: r.propertyId,
      author: r.authorName,
      initials: r.initials,
      monthsLived: r.monthsLived,
      rating: r.rating,
      date: r.createdAt.toISOString(),
      createdAtISO: r.createdAt.toISOString(),
      body: r.body,
      helpful: r.helpful,
      ownerReply: r.ownerReply ?? undefined,
      scores: r.scores ?? undefined,
    };
  }
}
