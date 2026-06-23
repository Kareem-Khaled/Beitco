import { Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CurrentUser, type AuthUser } from '../auth/decorators/current-user.decorator';

// Derived notification feed (NOTIF-1). Auth-required; reads the caller's own
// activity. Read-state is a per-user "last seen" marker.
@Controller({ path: 'me/notifications', version: '1' })
@ApiTags('Notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'My notification feed (+ last-seen marker)' })
  feed(@CurrentUser() me: AuthUser) {
    return this.notifications.feedWithState(me.id);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Unread notification count (for the bell badge)' })
  unread(@CurrentUser() me: AuthUser) {
    return this.notifications.unreadCount(me.id);
  }

  @Post('seen')
  @ApiOperation({ summary: 'Mark all notifications seen (sets the last-seen marker)' })
  seen(@CurrentUser() me: AuthUser) {
    return this.notifications.markSeen(me.id);
  }
}
