import { PrismaService } from '../prisma/prisma.service';
import { MatchingService } from './matching.service';

// TEST-1: MatchingService.getMatches — the orchestration over the pure
// scoreMatch engine (covered by matching.engine.spec). Mocked Prisma verifies
// the no-prefs short-circuit and the rent-vs-sale candidate filter.

type Mock = jest.Mock;

function makePrisma() {
  return {
    user: { findUnique: jest.fn() },
    property: { findMany: jest.fn().mockResolvedValue([]) },
  };
}

// A complete RenterProfile row (the mapper reads arrays + several flags).
const profile = (over: Record<string, unknown> = {}) => ({
  intent: 'rent',
  budgetMin: 2000,
  budgetMax: 6000,
  areas: ['المعادي'],
  lookingFor: ['room'],
  nearMetro: false,
  metroLines: [],
  maxWalkMinutes: null,
  nearTransit: false,
  mustHaveAmenities: [],
  furnishedPref: null,
  ...over,
});

describe('MatchingService.getMatches', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let service: MatchingService;

  beforeEach(() => {
    prisma = makePrisma();
    service = new MatchingService(prisma as unknown as PrismaService);
  });

  it('returns no matches when the user has no saved preferences', async () => {
    prisma.user.findUnique.mockResolvedValue({ gender: null, profile: null });
    await expect(service.getMatches('u1')).resolves.toEqual([]);
    expect(prisma.property.findMany).not.toHaveBeenCalled();
  });

  it('queries published RENT listings for a renter with rent intent', async () => {
    prisma.user.findUnique.mockResolvedValue({ gender: 'female', profile: profile() });
    await service.getMatches('u1');
    const where = (prisma.property.findMany as Mock).mock.calls[0][0].where;
    expect(where).toMatchObject({ status: 'published', deletedAt: null, listingType: 'rent' });
  });

  it('queries SALE listings when the renter intent is to buy', async () => {
    prisma.user.findUnique.mockResolvedValue({
      gender: 'male',
      profile: profile({ intent: 'sale', lookingFor: ['apartment'], areas: ['التجمع'] }),
    });
    await service.getMatches('u1');
    const where = (prisma.property.findMany as Mock).mock.calls[0][0].where;
    expect(where.listingType).toBe('sale');
  });
});
