import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

// Derived + persisted notification feed (NOTIF-1/2). PrismaModule + ConfigModule
// are global. Exported so the listings/admin write paths can fire saved-search
// alerts when a listing goes live.
@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
