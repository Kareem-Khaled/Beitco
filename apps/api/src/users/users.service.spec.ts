import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from './users.service';

// TEST-1: UsersService.updateMe  -  profile + preferences. Mocked Prisma; the
// real renter-profile mapper runs (it's a pure function), so we also exercise
// the Arabic↔Latin enum translation it does.

type Mock = jest.Mock;

function makePrisma() {
  return {
    user: {
      update: jest.fn().mockResolvedValue({}),
      findUnique: jest.fn().mockResolvedValue({
        id: 'u1',
        phone: '+20111',
        name: 'سارة',
        role: 'renter',
        trust: 5,
        verified: false,
        profile: null,
      }),
    },
    renterProfile: { upsert: jest.fn().mockResolvedValue({}) },
  };
}

describe('UsersService.updateMe', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let service: UsersService;

  beforeEach(() => {
    prisma = makePrisma();
    service = new UsersService(prisma as unknown as PrismaService);
  });

  it('updates only the provided scalar fields', async () => {
    await service.updateMe('u1', { name: 'سارة علي', role: 'both' });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { name: 'سارة علي', role: 'both' },
    });
    expect(prisma.renterProfile.upsert).not.toHaveBeenCalled();
  });

  it('maps notifications to notificationPrefs', async () => {
    await service.updateMe('u1', { notifications: { leads: true } as never });
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ notificationPrefs: { leads: true } }) }),
    );
  });

  it('upserts the RenterProfile when a profile is provided', async () => {
    await service.updateMe('u1', {
      profile: { budgetMin: 2000, budgetMax: 6000, areas: ['المعادي'] } as never,
    });
    expect(prisma.renterProfile.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'u1' },
        create: expect.objectContaining({ userId: 'u1' }),
        update: expect.any(Object),
      }),
    );
  });

  it('stores the renter self-gender on the User when the profile carries it', async () => {
    await service.updateMe('u1', { profile: { selfGender: 'ذكر' } as never });
    // userGender flows from the profile mapper onto the user.update data.
    const userUpdate = (prisma.user.update as Mock).mock.calls[0]?.[0];
    expect(userUpdate.data).toHaveProperty('gender');
  });

  it('skips user.update when nothing scalar changed (profile-only)', async () => {
    await service.updateMe('u1', { profile: { areas: ['الدقي'] } as never });
    // profile upserts, but there's no scalar user field to update.
    expect(prisma.renterProfile.upsert).toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('returns the serialized user (re-read with profile)', async () => {
    const res = await service.updateMe('u1', { name: 'سارة' });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'u1' },
      include: { profile: true },
    });
    expect(res).toMatchObject({ id: 'u1', name: 'سارة' });
  });
});
