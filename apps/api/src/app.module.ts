import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { HealthController } from './health/health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { TierGuard } from './auth/guards/tier.guard';
import { UsersModule } from './users/users.module';
import { ModerationModule } from './moderation/moderation.module';
import { ListingsModule } from './listings/listings.module';
import { SearchModule } from './search/search.module';
import { ChatModule } from './chat/chat.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PaymentsModule } from './payments/payments.module';
import { AdminModule } from './admin/admin.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    // ─── Environment Variables ─────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // ─── Rate Limiting ─────────────────────────────
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 120,
      },
    ]),

    // ─── Database ──────────────────────────────────
    PrismaModule,

    // ─── Feature Modules ───────────────────────────
    AuthModule,
    UsersModule,
    ListingsModule,
    ModerationModule,
    SearchModule,
    ChatModule,
    NotificationsModule,
    PaymentsModule,
    AdminModule,
    AnalyticsModule,
  ],
  controllers: [HealthController],
  providers: [
    // ─── Global Guards (order matters!) ────────────
    // 1. ThrottlerGuard — rate limiting first
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // 2. JwtAuthGuard — authentication (skipped on @Public() routes)
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // 3. TierGuard — authorization (checks @RequireTier() after auth)
    {
      provide: APP_GUARD,
      useClass: TierGuard,
    },
  ],
})
export class AppModule {}
