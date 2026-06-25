import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminOverviewController } from './admin.overview.controller';
import { AdminUsersController } from './admin.users.controller';
import { AdminService } from './admin.service';
import { AdminAuditService } from './admin.audit.service';
import { AdminUsersService } from './admin.users.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [AdminController, AdminOverviewController, AdminUsersController],
  providers: [AdminService, AdminAuditService, AdminUsersService],
  exports: [AdminAuditService],
})
export class AdminModule {}
