import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { FanoutService } from './fanout.service';

// Derived + persisted notification feed (NOTIF-1/2). PrismaModule + ConfigModule
// are global. Exported so the listings/admin write paths can fire saved-search
// alerts (via FanoutService, SCALE-1) when a listing goes live.
@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, FanoutService],
  exports: [NotificationsService, FanoutService],
})
export class NotificationsModule {}
