import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminOverviewController } from './admin.overview.controller';
import { AdminUsersController } from './admin.users.controller';
import { AdminListingsController } from './admin.listings.controller';
import { AdminService } from './admin.service';
import { AdminAuditService } from './admin.audit.service';
import { AdminUsersService } from './admin.users.service';
import { AdminListingsService } from './admin.listings.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [AdminController, AdminOverviewController, AdminUsersController, AdminListingsController],
  providers: [AdminService, AdminAuditService, AdminUsersService, AdminListingsService],
  exports: [AdminAuditService],
})
export class AdminModule {}
