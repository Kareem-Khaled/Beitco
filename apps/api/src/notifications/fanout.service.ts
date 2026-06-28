import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, Worker, type ConnectionOptions } from 'bullmq';
import { NotificationsService } from './notifications.service';

const QUEUE = 'saved-search-alerts';

interface AlertJob {
  propertyId: string;
}

// SCALE-1: the saved-search fan-out runs OFF the request path. On publish a
// caller enqueues {propertyId}; a background worker does the (potentially large)
// matching + insert. Config-gated on REDIS_URL — when Redis isn't configured (or
// a job fails to enqueue) we run the matcher INLINE so dev/CI/e2e still deliver
// alerts with zero setup. The publish request never blocks on the fan-out.
@Injectable()
export class FanoutService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(FanoutService.name);
  private queue: Queue<AlertJob> | null = null;
  private worker: Worker<AlertJob> | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly notifications: NotificationsService,
  ) {}

  onModuleInit(): void {
    const url = this.config.get<string>('REDIS_URL');
    if (!url) {
      this.logger.log('REDIS_URL unset — saved-search fan-out runs inline (no queue).');
      return;
    }
    // BullMQ requires maxRetriesPerRequest: null on its connection.
    const connection: ConnectionOptions = { url, maxRetriesPerRequest: null };
    try {
      this.queue = new Queue<AlertJob>(QUEUE, { connection });
      this.queue.on('error', (e) => this.logger.warn(`alerts queue error: ${String(e)}`));

      this.worker = new Worker<AlertJob>(
        QUEUE,
        async (job) => {
          const { created } = await this.notifications.notifyForNewListing(job.data.propertyId);
          return { created };
        },
        { connection, concurrency: 5 },
      );
      this.worker.on('failed', (job, err) =>
        this.logger.warn(`alert job ${job?.id} failed: ${String(err)}`),
      );
      this.logger.log('Saved-search fan-out: BullMQ queue + worker ready.');
    } catch (err) {
      this.logger.warn(`BullMQ unavailable; fan-out runs inline. (${String(err)})`);
      this.queue = null;
      this.worker = null;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close().catch(() => undefined);
    await this.queue?.close().catch(() => undefined);
  }

  // Schedule the saved-search alerts for a freshly-published listing. Best-effort
  // and non-blocking: enqueue when the queue is up, else run inline. Either way a
  // failure is swallowed (it must never break listing creation).
  async enqueue(propertyId: string): Promise<void> {
    if (this.queue) {
      try {
        await this.queue.add(
          'alert',
          { propertyId },
          {
            attempts: 3,
            backoff: { type: 'exponential', delay: 2000 },
            removeOnComplete: 100,
            removeOnFail: 200,
          },
        );
        return;
      } catch (err) {
        this.logger.warn(`enqueue failed for ${propertyId}; running inline. (${String(err)})`);
      }
    }
    // No queue (or enqueue failed) -> inline fallback.
    await this.notifications.notifyForNewListing(propertyId);
  }
}
