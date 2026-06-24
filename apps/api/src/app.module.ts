import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { validateEnv } from './config/env.validation';
import { loggerConfig } from './config/logger.config';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { ListingsModule } from './listings/listings.module';
import { UsersModule } from './users/users.module';
import { EngagementModule } from './engagement/engagement.module';
import { TrustModule } from './trust/trust.module';
import { ReviewsModule } from './reviews/reviews.module';
import { AdminModule } from './admin/admin.module';
import { MatchingModule } from './matching/matching.module';
import { ChatModule } from './chat/chat.module';
import { NotificationsModule } from './notifications/notifications.module';
import { UploadsModule } from './uploads/uploads.module';
import { VerificationModule } from './verification/verification.module';
import { SearchModule } from './search/search.module';

// Post-pivot core. After the schema rewrite to the bed-level + trust model, the
// remaining legacy modules (chat, search, admin, moderation, analytics,
// notifications, payments) target the OLD social schema and live in
// src/_unported/ (excluded from the TS build), ported back one at a time per
// BACKEND_TASKS. Rebuilt so far: ListingsModule (B-1), AuthModule (A-1),
// UsersModule + EngagementModule (B-2), TrustModule + ReviewsModule (T-PORT/B-2b).

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      // SEC-1: fail fast in production on missing/weak JWT secrets; fill dev
      // defaults locally. The only place dev fallbacks exist.
      validate: validateEnv,
    }),
    // OBS-1: structured (pino) logging + per-request correlation ids.
    LoggerModule.forRoot(loggerConfig()),
    ThrottlerModule.forRoot({
      // Disable rate-limiting under tests (the e2e logs in many times from one
      // IP); SEC-4's throttle is covered by the live API + its own boundaries.
      skipIf: () => process.env.NODE_ENV === 'test',
      throttlers: [{ ttl: 60000, limit: 120 }],
    }),
    PrismaModule,
    RedisModule,
    TrustModule,
    SearchModule,
    AuthModule,
    ListingsModule,
    UsersModule,
    EngagementModule,
    ReviewsModule,
    AdminModule,
    MatchingModule,
    ChatModule,
    NotificationsModule,
    UploadsModule,
    VerificationModule,
    HealthModule,
  ],
  providers: [
    // 1. Rate limiting
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // 2. Auth (skipped on @Public() routes)
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
