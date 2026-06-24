import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

// SEC-3: readiness checks. Pings Postgres (PrismaService) + Redis (the shared
// RedisService, POLISH-3). `ready` is false if either is down, so an
// orchestrator can pull the instance out of rotation.
export interface ReadinessResult {
  ready: boolean;
  checks: { database: 'up' | 'down'; redis: 'up' | 'down' };
}

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async checkReadiness(): Promise<ReadinessResult> {
    const [database, redis] = await Promise.all([this.pingDatabase(), this.redis.ping()]);
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
}

