import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { HealthController } from './health/health.controller';
import { PrismaModule } from './prisma/prisma.module';

// B-0 minimal core. After the schema rewrite to the bed-level + trust model,
// the legacy feature modules (auth, users, listings, chat, search, admin,
// moderation, analytics, notifications, payments) target the OLD social schema
// and do not compile. They are quarantined in src/_unported/ (excluded from the
// TS build) and ported back onto the new schema one at a time per BACKEND_TASKS
// (A-1 auth, B-1 listings, B-2 writes, MOD-1 moderation, ...). This keeps the
// API booting on infra-only (config, rate limiting, Prisma, health).

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 120,
      },
    ]),
    PrismaModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
