import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

// Derived notification feed + read-state (NOTIF-1). PrismaModule is global;
// ConfigModule is global. A saved-search matching job (BullMQ) is NOTIF-2.
@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService],
})
export class NotificationsModule {}
