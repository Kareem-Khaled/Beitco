import { ConfigService } from '@nestjs/config';
import { NotificationsService } from './notifications.service';
import { FanoutService } from './fanout.service';

// SCALE-1: FanoutService. The queue/worker path needs a real Redis, so the unit
// test covers the INLINE fallback — the guarantee that dev/CI/e2e/mock still
// deliver saved-search alerts with zero setup, and that the publish path never
// hard-depends on Redis.

function makeService(redisUrl?: string) {
  const config = {
    get: (k: string) => (k === 'REDIS_URL' ? redisUrl : undefined),
  } as unknown as ConfigService;
  const notifications = {
    notifyForNewListing: jest.fn().mockResolvedValue({ created: 3 }),
  };
  const service = new FanoutService(
    config,
    notifications as unknown as NotificationsService,
  );
  return { service, notifications };
}

describe('FanoutService (inline fallback)', () => {
  it('stays inline (no queue) when REDIS_URL is unset', () => {
    const { service } = makeService(undefined);
    service.onModuleInit();
    expect((service as unknown as { queue: unknown }).queue).toBeNull();
  });

  it('enqueue runs the matcher inline when there is no queue', async () => {
    const { service, notifications } = makeService(undefined);
    service.onModuleInit(); // no Redis -> no queue
    await service.enqueue('p1');
    expect(notifications.notifyForNewListing).toHaveBeenCalledWith('p1');
  });
});
