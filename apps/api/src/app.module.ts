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
import { PostsModule } from './posts/posts.module';
import { CommentsModule } from './comments/comments.module';
import { SocialModule } from './social/social.module';
import { LikesModule } from './likes/likes.module';
import { FeedModule } from './feed/feed.module';
import { GroupsModule } from './groups/groups.module';
import { ModerationModule } from './moderation/moderation.module';
import { ListingsModule } from './listings/listings.module';
import { VideosModule } from './videos/videos.module';
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
    PostsModule,
    CommentsModule,
    SocialModule,
    LikesModule,
    FeedModule,
    GroupsModule,
    ModerationModule,
    ListingsModule,
    VideosModule,
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
