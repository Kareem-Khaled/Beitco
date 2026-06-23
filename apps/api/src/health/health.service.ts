import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';

// SEC-3: readiness checks. Owns a lazy Redis client (mirrors auth/notifications)
// and pings Postgres via the shared PrismaService. `ready` is false if either is
// down, so an orchestrator can pull the instance out of rotation.
export interface ReadinessResult {
  ready: boolean;
  checks: { database: 'up' | 'down'; redis: 'up' | 'down' };
}

@Injectable()
export class HealthService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(HealthService.name);
  private redis!: Redis;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  onModuleInit() {
    const url = this.config.get<string>('REDIS_URL', 'redis://localhost:6379');
    // Lazy + no retry storms: the health check decides up/down per request.
    this.redis = new Redis(url, { maxRetriesPerRequest: 1, lazyConnect: true });
    this.redis.on('error', () => {
      /* swallowed — readiness reports the state explicitly */
    });
  }

  async onModuleDestroy() {
    await this.redis?.quit().catch(() => undefined);
  }

  async checkReadiness(): Promise<ReadinessResult> {
    const [database, redis] = await Promise.all([this.pingDatabase(), this.pingRedis()]);
    return { ready: database === 'up' && redis === 'up', checks: { database, redis } };
  }

  private async pingDatabase(): Promise<'up' | 'down'> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return 'up';
    } catch {
      return 'down';
    }
  }

  private async pingRedis(): Promise<'up' | 'down'> {
    try {
      if (this.redis.status !== 'ready') await this.redis.connect();
      const pong = await this.redis.ping();
      return pong === 'PONG' ? 'up' : 'down';
    } catch {
      return 'down';
    }
  }
}
