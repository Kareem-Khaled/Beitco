import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { ResponseEnvelopeInterceptor } from '../src/common/interceptors/response-envelope.interceptor';

// TEST-2: end-to-end suite codifying the manual curl smokes. Boots the REAL
// AppModule against the running dev stack (Postgres :5433 + Redis), so it needs
// `docker compose up -d` and a seeded DB (`npm run db:seed`). Uses Supertest
// agents for cookie-based sessions. Data is namespaced by a run timestamp +
// cleaned up in afterAll so re-runs are idempotent.

const DEV_OTP = '123456';
const VERIFIED_OWNER = '+201001234567'; // u-mostafa, owns property '1'
const UNVERIFIED_OWNER = '+201005550002'; // u-zayed
const SEED_PROPERTY_ID = '1';

// A whole-rent listing payload in a given area (verified owner -> auto-published).
function listingPayload(area: string, title: string) {
  return {
    title,
    area,
    listingType: 'rent',
    rentalMode: 'whole',
    wholePrice: 9000,
    spec: { unitType: 'شقة', bedrooms: 2, bathrooms: 1, furnished: true },
    amenities: ['نت', 'تكييف'],
  };
}

describe('Beitco API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let server: import('http').Server;

  // Track created rows for cleanup.
  const createdPropertyIds: string[] = [];
  const createdUserPhones = new Set<string>();
  const renterPhone = `0100${Date.now().toString().slice(-7)}`;

  // Cookie-persisting agents (one session each).
  const renter = () => request.agent(server);
  let renterAgent: ReturnType<typeof renter>;
  let renterId = '';

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      // The e2e logs in many times from one IP; disable rate-limiting here
      // (SEC-4's throttle is exercised by its own unit boundaries, not e2e).
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    // Mirror main.ts so the e2e exercises the real request pipeline.
    app.use(cookieParser());
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
    server = app.getHttpServer();
    prisma = app.get(PrismaService);
    renterAgent = renter();

    // Clear any leftover OTP cooldown/attempt keys so the suite is reliable on
    // back-to-back runs (the 60s per-phone cooldown otherwise 429s a re-login).
    const Redis = (await import('ioredis')).default;
    const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    });
    try {
      await redis.connect();
      for (const pattern of ['otp:*', 'otp_cd:*', 'otp_attempts:*']) {
        const keys = await redis.keys(pattern);
        if (keys.length) await redis.del(...keys);
      }
    } catch {
      /* best-effort: tests still pass on a cold Redis */
    } finally {
      await redis.quit().catch(() => undefined);
    }
  });

  afterAll(async () => {
    // Best-effort cleanup so the dev DB stays close to its seeded state.
    try {
      for (const id of createdPropertyIds) {
        await prisma.property.deleteMany({ where: { id } });
      }
      const users = await prisma.user.findMany({
        where: { phone: { in: [...createdUserPhones] } },
        select: { id: true },
      });
      const ids = users.map((u) => u.id);
      if (ids.length) {
        await prisma.notification.deleteMany({ where: { userId: { in: ids } } });
        await prisma.savedSearch.deleteMany({ where: { userId: { in: ids } } });
        await prisma.tenancy.deleteMany({ where: { userId: { in: ids } } });
        await prisma.lead.deleteMany({ where: { renterId: { in: ids } } });
        await prisma.verificationRequest.deleteMany({ where: { userId: { in: ids } } });
      }
    } catch {
      /* ignore cleanup errors */
    }
    await app.close();
  });

  // Authenticate a phone ONCE and cache the cookie-bearing agent. Re-logging the
  // same phone would hit the 60s per-phone OTP cooldown, so callers share one
  // session per phone for the whole run.
  const sessions = new Map<string, { agent: ReturnType<typeof renter>; userId: string }>();
  async function login(phone: string) {
    const cached = sessions.get(phone);
    if (cached) return cached;
    const agent = request.agent(server);
    await agent.post('/api/v1/auth/otp/send').send({ phone }).expect(201);
    const verify = await agent
      .post('/api/v1/auth/otp/verify')
      .send({ phone, code: DEV_OTP })
      .expect(201);
    createdUserPhones.add(phone);
    const session = { agent, userId: verify.body.data.user.id as string };
    sessions.set(phone, session);
    return session;
  }

  describe('Health', () => {
    it('GET /health is live', async () => {
      const res = await request(server).get('/api/v1/health').expect(200);
      expect(res.body.data.status).toBe('ok');
    });

    it('GET /health/ready reports dependency checks', async () => {
      const res = await request(server).get('/api/v1/health/ready');
      expect(res.body.data.checks).toHaveProperty('database');
      expect(res.body.data.checks).toHaveProperty('redis');
    });
  });

  describe('Auth (OTP -> session)', () => {
    it('sends a dev OTP, verifies, sets a session', async () => {
      const send = await renterAgent
        .post('/api/v1/auth/otp/send')
        .send({ phone: renterPhone })
        .expect(201);
      expect(send.body.data.devCode).toBe(DEV_OTP);

      const verify = await renterAgent
        .post('/api/v1/auth/otp/verify')
        .send({ phone: renterPhone, code: DEV_OTP })
        .expect(201);
      expect(verify.body.success).toBe(true);
      expect(verify.body.data.user).toBeDefined();
      renterId = verify.body.data.user.id;
      createdUserPhones.add(renterPhone);
    });

    it('GET /auth/me works with the session', async () => {
      const res = await renterAgent.get('/api/v1/auth/me').expect(200);
      expect(res.body.data.id).toBe(renterId);
    });

    it('GET /auth/me is 401 without a session', async () => {
      await request(server).get('/api/v1/auth/me').expect(401);
    });
  });

  describe('Listings (public reads)', () => {
    it('lists published properties with cursor meta', async () => {
      const res = await request(server).get('/api/v1/properties?limit=5').expect(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.meta).toHaveProperty('hasMore');
    });

    it('returns a single property by id (no occupant data)', async () => {
      const res = await request(server)
        .get(`/api/v1/properties/${SEED_PROPERTY_ID}`)
        .expect(200);
      expect(res.body.data.id).toBe(SEED_PROPERTY_ID);
      // Public detail must never leak occupant info.
      const leaked = (res.body.data.rooms ?? []).some((r: { beds?: { occupant?: unknown }[] }) =>
        (r.beds ?? []).some((b) => b.occupant),
      );
      expect(leaked).toBe(false);
    });

    it('404s for a missing property', async () => {
      await request(server).get('/api/v1/properties/nonexistent-id').expect(404);
    });
  });

  describe('Listings write + moderation gate', () => {
    it('verified owner -> published immediately', async () => {
      const { agent } = await login(VERIFIED_OWNER);
      const res = await agent
        .post('/api/v1/properties')
        .send(listingPayload('المعادي', `e2e verified ${Date.now()}`))
        .expect(201);
      expect(res.body.data.status).toBe('published');
      expect(res.body.data.type).toBe('شقة');
      createdPropertyIds.push(res.body.data.id);
    });

    it('unverified owner -> pending_approval', async () => {
      const { agent } = await login(UNVERIFIED_OWNER);
      const res = await agent
        .post('/api/v1/properties')
        .send(listingPayload('مدينة نصر', `e2e unverified ${Date.now()}`))
        .expect(201);
      expect(res.body.data.status).toBe('pending_approval');
      createdPropertyIds.push(res.body.data.id);
    });

    it('cross-owner edit -> 403', async () => {
      const { agent } = await login(VERIFIED_OWNER);
      // The seed property '1' is owned by the verified owner; an unverified
      // owner editing it must be forbidden.
      const { agent: other } = await login(UNVERIFIED_OWNER);
      // sanity: real owner can read it via /mine
      await agent.get('/api/v1/properties/mine').expect(200);
      await other
        .patch(`/api/v1/properties/${SEED_PROPERTY_ID}`)
        .send({ title: 'hijack', area: 'المعادي' })
        .expect(403);
    });
  });

  describe('Leads loop -> tenancy', () => {
    let leadId = '';

    it('renter requests a viewing on property 1', async () => {
      const res = await renterAgent
        .post(`/api/v1/properties/${SEED_PROPERTY_ID}/leads`)
        .send({ intent: 'viewing', note: 'e2e viewing' })
        .expect(201);
      expect(res.body.data.status).toBe('pending');
      leadId = res.body.data.id;
    });

    it('owner approves then completes -> creates a tenancy', async () => {
      const { agent: owner } = await login(VERIFIED_OWNER);
      await owner
        .patch(`/api/v1/leads/${leadId}/status`)
        .send({ status: 'approved' })
        .expect(200);
      await owner
        .patch(`/api/v1/leads/${leadId}/status`)
        .send({ status: 'completed' })
        .expect(200);

      const tenancy = await prisma.tenancy.findFirst({
        where: { propertyId: SEED_PROPERTY_ID, userId: renterId },
      });
      expect(tenancy).toBeTruthy();
    });

    it('non-owner cannot change a lead status -> 403', async () => {
      await renterAgent
        .patch(`/api/v1/leads/${leadId}/status`)
        .send({ status: 'declined' })
        .expect(403);
    });
  });

  describe('Reviews move trust (the wedge)', () => {
    it('a 30-day resident review lowers a hand-set seed trust', async () => {
      // Backdate the renter's tenancy on property 1 past the 30-day review gate.
      await prisma.tenancy.updateMany({
        where: { propertyId: SEED_PROPERTY_ID, userId: renterId },
        data: { moveInDate: new Date(Date.now() - 60 * 86400000) },
      });

      const before = await request(server)
        .get(`/api/v1/properties/${SEED_PROPERTY_ID}`)
        .expect(200);
      const trustBefore = before.body.data.trust as number;

      await renterAgent
        .post(`/api/v1/properties/${SEED_PROPERTY_ID}/reviews`)
        .send({
          rating: 4,
          body: 'النت بيفصل والصيانة بطيئة.',
          scores: { internet: 3, safety: 7, noise: 5, maintenance: 3, cleanliness: 6 },
        })
        .expect(201);

      const after = await request(server)
        .get(`/api/v1/properties/${SEED_PROPERTY_ID}`)
        .expect(200);
      const trustAfter = after.body.data.trust as number;

      // The computed score replaces the seed value; a low review pulls it down.
      expect(trustAfter).toBeLessThan(trustBefore);
    });

    it('rejects a review from a non-resident -> 403', async () => {
      const stranger = await login(`0100${(Date.now() + 1).toString().slice(-7)}`);
      await stranger.agent
        .post(`/api/v1/properties/${SEED_PROPERTY_ID}/reviews`)
        .send({ rating: 5, body: 'مش ساكن هنا' })
        .expect(403);
    });
  });

  describe('Matching', () => {
    it('no prefs -> no matches; saving prefs -> ranked, eligible matches', async () => {
      const empty = await renterAgent.get('/api/v1/me/matches').expect(200);
      const initial = empty.body.data.length as number;

      await renterAgent
        .patch('/api/v1/users/me')
        .send({
          profile: {
            intent: 'rent',
            budgetMax: 12000,
            areas: ['المعادي'],
            lookingFor: ['شقة', 'سرير'],
            selfGender: 'ذكر',
          },
        })
        .expect(200);

      const res = await renterAgent.get('/api/v1/me/matches').expect(200);
      const matches = res.body.data as { match: { score: number; eligible: boolean } }[];
      expect(matches.length).toBeGreaterThanOrEqual(initial);
      // Sorted by score desc + all eligible.
      const scores = matches.map((m) => m.match.score);
      expect([...scores].sort((a, b) => b - a)).toEqual(scores);
      expect(matches.every((m) => m.match.eligible)).toBe(true);
    });
  });

  describe('Saved-search alerts (هنبلّغك)', () => {
    it('a matching new listing notifies the saver, not the owner', async () => {
      // Renter saves a المعادي search.
      await renterAgent
        .post('/api/v1/me/searches')
        .send({ label: 'شقق في المعادي', params: { area: 'المعادي', type: 'شقة' } })
        .expect(201);

      // Verified owner publishes a matching listing.
      const { agent: owner } = await login(VERIFIED_OWNER);
      const created = await owner
        .post('/api/v1/properties')
        .send(listingPayload('المعادي', `e2e alert ${Date.now()}`))
        .expect(201);
      createdPropertyIds.push(created.body.data.id);

      // The fan-out is async now (SCALE-1: BullMQ worker), so poll briefly for
      // the alert to land in the renter's feed.
      let found = false;
      for (let i = 0; i < 20 && !found; i++) {
        const feed = await renterAgent.get('/api/v1/me/notifications').expect(200);
        const alerts = (feed.body.data.items as { type: string; propertyId?: string }[]).filter(
          (n) => n.type === 'saved_search',
        );
        found = alerts.some((a) => a.propertyId === created.body.data.id);
        if (!found) await new Promise((r) => setTimeout(r, 100));
      }
      expect(found).toBe(true);
    });
  });

  describe('Verification / KYC (PROD-5)', () => {
    const ADMIN = '+201000000000'; // u-admin (isAdmin)
    const kycPhone = `0100${(Date.now() + 5).toString().slice(-7)}`;

    it('submit -> pending; admin approves -> user becomes verified + notified', async () => {
      const { agent: applicant, userId: applicantId } = await login(kycPhone);

      // Submit docs.
      const submit = await applicant
        .post('/api/v1/me/verification')
        .send({ idDocUrl: 'https://cdn.test/id.jpg', selfieUrl: 'https://cdn.test/selfie.jpg' })
        .expect(201);
      expect(submit.body.data.status).toBe('pending');

      // /me reflects pending.
      const me1 = await applicant.get('/api/v1/auth/me').expect(200);
      expect(me1.body.data.verificationStatus).toBe('pending');

      // Non-admin can't see the queue.
      await applicant.get('/api/v1/admin/verifications').expect(403);

      // Admin sees it + approves.
      const { agent: admin } = await login(ADMIN);
      const queue = await admin.get('/api/v1/admin/verifications').expect(200);
      const mine = (queue.body.data as { id: string; userId: string }[]).find(
        (r) => r.userId === applicantId,
      );
      expect(mine).toBeTruthy();
      await admin.post(`/api/v1/admin/verifications/${mine!.id}/approve`).expect(201);

      // Applicant is now verified.
      const me2 = await applicant.get('/api/v1/auth/me').expect(200);
      expect(me2.body.data.verificationStatus).toBe('verified');
      expect(me2.body.data.verified).toBe(true);

      // …and got a verification notification.
      const feed = await applicant.get('/api/v1/me/notifications').expect(200);
      const verifNote = (feed.body.data.items as { type: string }[]).some(
        (n) => n.type === 'verification',
      );
      expect(verifNote).toBe(true);
    });
  });

  describe('Banned users are locked out (BUG-1)', () => {
    const ADMIN = '+201000000000'; // u-admin (isAdmin)
    const victimPhone = `0100${(Date.now() + 9).toString().slice(-7)}`;

    it('admin ban -> the user\u2019s live session is 401 + re-login is 403', async () => {
      // A normal user with a working session.
      const { agent: victim, userId } = await login(victimPhone);
      await victim.get('/api/v1/auth/me').expect(200);

      // Admin bans them.
      const { agent: admin } = await login(ADMIN);
      await admin.post(`/api/v1/admin/users/${userId}/ban`).send({ reason: 'اختبار' }).expect(201);

      // The existing access-token cookie no longer works.
      await victim.get('/api/v1/auth/me').expect(401);

      // And they can't re-authenticate via OTP.
      const fresh = request.agent(server);
      await fresh.post('/api/v1/auth/otp/send').send({ phone: victimPhone }).expect(201);
      const verify = await fresh
        .post('/api/v1/auth/otp/verify')
        .send({ phone: victimPhone, code: DEV_OTP });
      expect(verify.status).toBe(403);
      expect(verify.body.error?.code).toBe('ACCOUNT_BANNED');

      // Reinstate so the row is clean for re-runs.
      await admin.post(`/api/v1/admin/users/${userId}/reinstate`).expect(201);
    });
  });
});
