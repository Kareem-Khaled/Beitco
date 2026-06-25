import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminOverviewController } from './admin.overview.controller';
import { AdminService } from './admin.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [AdminController, AdminOverviewController],
  providers: [AdminService],
})
export class AdminModule {}
