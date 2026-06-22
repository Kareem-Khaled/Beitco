import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { HealthController } from './health/health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { ListingsModule } from './listings/listings.module';

// Post-pivot core. After the schema rewrite to the bed-level + trust model, the
// remaining legacy modules (users, chat, search, admin, moderation, analytics,
// notifications, payments) target the OLD social schema and live in
// src/_unported/ (excluded from the TS build), ported back one at a time per
// BACKEND_TASKS. Rebuilt so far: ListingsModule (B-1), AuthModule (A-1).

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
    AuthModule,
    ListingsModule,
  ],
  controllers: [HealthController],
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
