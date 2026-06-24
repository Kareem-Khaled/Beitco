import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';

// POLISH-3: one shared Redis client for the API. Global (like PrismaModule) so
// auth, notifications, and health inject the same connection instead of each
// opening its own.
@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
