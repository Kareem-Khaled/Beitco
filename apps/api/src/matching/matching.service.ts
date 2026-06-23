import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { serializeProperty, serializeSummary, type PropertyRow } from '../listings/listings.serializer';
import { scoreMatch, type MatchProperty, type MatchResult } from './matching.engine';
import { toMatchProfile, wantsSale, type RenterProfileRow } from './renter-profile.mapper';

// Relations the matching engine needs to read off a property.
const matchInclude = {
  owner: true,
  rooms: { include: { beds: true }, orderBy: { createdAt: 'asc' as const } },
  nearby: true,
  customSpecs: true,
  reviews: { orderBy: { createdAt: 'desc' as const } },
};

@Injectable()
export class MatchingService {
  constructor(private readonly prisma: PrismaService) {}

  // Ranked, explainable matches for a renter. Mirrors the mock's
  // getMatchesForUser: filter by intent (rent vs buy), keep eligible, sort by
  // score desc, cap at `limit`. Returns { property: summary, match }.
  async getMatches(
    userId: string,
    limit = 24,
  ): Promise<{ property: Record<string, unknown>; match: MatchResult }[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { gender: true, profile: true },
    });
    const profileRow = (user?.profile ?? null) as RenterProfileRow | null;
    const matchProfile = toMatchProfile(profileRow, user?.gender ?? null);
    // No saved preferences -> no matches (the UI shows the "set your prefs" CTA).
    if (!matchProfile) return [];

    const forSale = wantsSale(profileRow);
    const rows = (await this.prisma.property.findMany({
      where: {
        status: 'published',
        deletedAt: null,
        listingType: forSale ? 'sale' : 'rent',
      },
      include: matchInclude,
      orderBy: { createdAt: 'desc' },
    })) as unknown as PropertyRow[];

    return rows
      .map((row) => {
        const full = serializeProperty(row) as Record<string, unknown>;
        const mp: MatchProperty = {
          area: full.area as string,
          type: full.type as string,
          price: full.price as number,
          priceFrom: full.priceFrom as number | undefined,
          rentToGender: (full.rentToGender as MatchProperty['rentToGender']) ?? null,
          amenities: (full.amenities as string[]) ?? [],
          nearby: full.nearby as MatchProperty['nearby'],
          spec: (full.spec as MatchProperty['spec']) ?? null,
          beds: { available: (full.beds as { available?: number })?.available ?? 0 },
          trust: full.trust as number,
        };
        return { row, match: scoreMatch(mp, matchProfile) };
      })
      .filter(({ match }) => match.eligible)
      .sort((a, b) => b.match.score - a.match.score)
      .slice(0, limit)
      .map(({ row, match }) => ({ property: serializeSummary(row), match }));
  }
}
