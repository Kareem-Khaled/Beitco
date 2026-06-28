import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminOverviewController } from './admin.overview.controller';
import { AdminUsersController } from './admin.users.controller';
import { AdminListingsController } from './admin.listings.controller';
import { AdminContentController } from './admin.content.controller';
import { AdminAnalyticsController } from './admin.analytics.controller';
import { AdminService } from './admin.service';
import { AdminAuditService } from './admin.audit.service';
import { AdminUsersService } from './admin.users.service';
import { AdminListingsService } from './admin.listings.service';
import { AdminContentService } from './admin.content.service';
import { AdminAnalyticsService } from './admin.analytics.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [NotificationsModule, AuthModule],
  controllers: [
    AdminController,
    AdminOverviewController,
    AdminUsersController,
    AdminListingsController,
    AdminContentController,
    AdminAnalyticsController,
  ],
  providers: [
    AdminService,
    AdminAuditService,
    AdminUsersService,
    AdminListingsService,
    AdminContentService,
    AdminAnalyticsService,
  ],
  exports: [AdminAuditService],
})
export class AdminModule {}
