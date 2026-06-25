import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  computeListingTrust,
  computeOwnerTrust,
  computeQualityFromReviews,
  computeRenterReputation,
  computeResponseRate,
  type QualityScores,
  type TrustBreakdown,
} from './trust.engine';

const DEFAULT_QUALITY: QualityScores = {
  internet: 7.5,
  safety: 7.5,
  noise: 7.5,
  maintenance: 7.5,
  cleanliness: 7.5,
};

// Recomputes and persists trust from real activity. Mirrors store.ts's two-pass
// recompute: (1) per-owner response rate, (2) listing trust, (3) owner trust.
@Injectable()
export class TrustService {
  constructor(private readonly prisma: PrismaService) {}

  // Owner's response rate from real ResponseEvents (T-3); undefined when none.
  async ownerResponseRate(ownerId: string): Promise<number | undefined> {
    const events = await this.prisma.responseEvent.findMany({
      where: { ownerId },
      select: { firstRenterMessageAt: true, firstOwnerReplyAt: true },
    });
    return computeResponseRate(events);
  }

  // Recompute one listing's quality + trust, persist, then refresh its owner.
  async recomputeListing(propertyId: string): Promise<void> {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        reviews: {
          where: { removedAt: null }, // ADMIN-4: removed reviews don't count toward trust
          select: { rating: true, monthsLived: true, createdAt: true, scores: true },
        },
      },
    });
    if (!property) return;

    await this.applyListingTrust(propertyId, property.ownerId, property.verified, property.reviews);
    await this.recomputeOwner(property.ownerId);
  }

  // Recompute an owner's trust from their listings + response rate, persist, and
  // sync the response rate back onto the owner record.
  async recomputeOwner(ownerId: string): Promise<void> {
    const owner = await this.prisma.user.findUnique({
      where: { id: ownerId },
      select: { id: true, verified: true, createdAt: true, responseRate: true },
    });
    if (!owner) return;

    const trusts = await this.prisma.property.findMany({
      where: { ownerId, deletedAt: null },
      select: { trust: true },
    });

    const responseRate = (await this.ownerResponseRate(ownerId)) ?? owner.responseRate ?? undefined;

    const breakdown = computeOwnerTrust({
      verified: owner.verified,
      listingTrusts: trusts.map((l) => l.trust),
      responseRate,
      accountCreatedAt: owner.createdAt,
    });

    await this.prisma.user.update({
      where: { id: ownerId },
      data: {
        trust: breakdown.score,
        trustBreakdown: breakdown as unknown as object,
        responseRate: responseRate ?? null,
      },
    });
  }

  // (T-4) Recompute a renter's reputation from owner reviews of them.
  async recomputeRenterReputation(renterId: string): Promise<void> {
    const reviews = await this.prisma.renterReview.findMany({
      where: { renterId },
      select: { rating: true },
    });
    if (reviews.length === 0) {
      await this.prisma.user.update({
        where: { id: renterId },
        data: { renterReputation: null, renterReviewsCount: 0 },
      });
      return;
    }
    const { score, count } = computeRenterReputation(reviews.map((r) => r.rating));
    await this.prisma.user.update({
      where: { id: renterId },
      data: { renterReputation: score, renterReviewsCount: count },
    });
  }

  // Public-facing computed breakdown for GET /properties/:id/trust.
  async listingBreakdown(propertyId: string): Promise<TrustBreakdown | null> {
    const p = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        verified: true,
        ownerId: true,
        reviews: {
          where: { removedAt: null },
          select: { rating: true, monthsLived: true, createdAt: true },
        },
      },
    });
    if (!p) return null;
    const responseRate = await this.ownerResponseRate(p.ownerId);
    return computeListingTrust({
      verified: p.verified,
      reviews: p.reviews.map((r) => ({
        rating: r.rating,
        monthsLived: r.monthsLived,
        createdAtISO: r.createdAt.toISOString(),
      })),
      responseRate,
    });
  }

  // ─── private ──────────────────────────────────────────
  private async applyListingTrust(
    propertyId: string,
    ownerId: string,
    verified: boolean,
    reviews: { rating: number; monthsLived: number; createdAt: Date; scores: unknown }[],
  ): Promise<void> {
    const quality = computeQualityFromReviews(
      reviews.map((r) => ({ scores: r.scores as Partial<QualityScores> | null })),
      DEFAULT_QUALITY,
    );
    const responseRate = await this.ownerResponseRate(ownerId);
    const breakdown = computeListingTrust({
      verified,
      reviews: reviews.map((r) => ({
        rating: r.rating,
        monthsLived: r.monthsLived,
        createdAtISO: r.createdAt.toISOString(),
      })),
      responseRate,
    });

    await this.prisma.property.update({
      where: { id: propertyId },
      data: {
        trust: breakdown.score,
        trustBreakdown: breakdown as unknown as object,
        quality: quality as unknown as object,
        reviewsCount: reviews.length,
      },
    });
  }
}
