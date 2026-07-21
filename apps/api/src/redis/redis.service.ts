import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

// POLISH-3: a single shared Redis connection for the whole API. Previously
// auth, notifications, and health each instantiated their own ioredis client
// (duplicated URL reading + connect/quit lifecycle + the connection itself).
// This owns one lazily-connected client, attempts an eager connect at boot
// (degrading gracefully when Redis is down), and exposes a live `ready` getter
// (used by auth/notifications to gate) plus a `ping()` for the readiness probe.
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  readonly client: Redis;

  constructor(config: ConfigService) {
    const url = config.get<string>('REDIS_URL', 'redis://localhost:6379');
    this.client = new Redis(url, { maxRetriesPerRequest: 3, lazyConnect: true });
    // Swallow connection 'error' events so a Redis outage degrades features
    // instead of crashing the process; consumers gate on `ready` / `ping()`.
    this.client.on('error', () => undefined);
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.client.connect();
      this.logger.log('Redis connected');
    } catch {
      this.logger.warn(
        'Redis unavailable  -  OTP + notification read-state degrade. Start it with: docker compose up -d redis',
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit().catch(() => undefined);
  }

  // Live readiness  -  reflects reconnects/disconnects, not just the boot attempt.
  // (Stricter than the old per-service boot flag: an outage after boot now
  // correctly reads as not-ready, so callers degrade with a friendly message.)
  get ready(): boolean {
    return this.client.status === 'ready';
  }

  // Readiness probe (SEC-3). (Re)connect only from an idle state so a recovery
  // is detected, and never issue a command while not ready (avoids hanging on
  // the offline queue). Returns 'down' on any error.
  async ping(): Promise<'up' | 'down'> {
    try {
      if (this.client.status === 'wait' || this.client.status === 'end') {
        await this.client.connect();
      }
      if (this.client.status !== 'ready') return 'down';
      const pong = await this.client.ping();
      return pong === 'PONG' ? 'up' : 'down';
    } catch {
      return 'down';
    }
  }
}
