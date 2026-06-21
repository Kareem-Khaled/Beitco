import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators';
import { NotificationsService } from './notifications.service';
import { NotificationQueryDto } from './dto/notification-query.dto';
import { SubscribePushDto } from './dto/subscribe-push.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // ── GET /notifications — paginated list ───────────
  @Get()
  async getNotifications(
    @CurrentUser('id') userId: string,
    @Query() query: NotificationQueryDto,
  ) {
    const result = await this.notificationsService.getByUser(userId, query);
    return { success: true, data: result.data, meta: result.meta };
  }

  // ── GET /notifications/unread-count ───────────────
  @Get('unread-count')
  async getUnreadCount(@CurrentUser('id') userId: string) {
    const count = await this.notificationsService.getUnreadCount(userId);
    return { success: true, data: count };
  }

  // ── GET /notifications/preferences ────────────────
  @Get('preferences')
  async getPreferences(@CurrentUser('id') userId: string) {
    const prefs = await this.notificationsService.getPreferences(userId);
    return { success: true, data: prefs };
  }

  // ── PATCH /notifications/read-all ─────────────────
  @Patch('read-all')
  async markAllAsRead(@CurrentUser('id') userId: string) {
    const result = await this.notificationsService.markAllAsRead(userId);
    return { success: true, data: result };
  }

  // ── PATCH /notifications/preferences ──────────────
  @Patch('preferences')
  async updatePreferences(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdatePreferencesDto,
  ) {
    const prefs = await this.notificationsService.updatePreferences(userId, dto);
    return { success: true, data: prefs };
  }

  // ── PATCH /notifications/:id/read ─────────────────
  @Patch(':id/read')
  async markAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    const notification = await this.notificationsService.markAsRead(id, userId);
    return { success: true, data: notification };
  }

  // ── POST /notifications/subscribe ─────────────────
  @Post('subscribe')
  @HttpCode(HttpStatus.OK)
  async subscribePush(
    @CurrentUser('id') userId: string,
    @Body() dto: SubscribePushDto,
  ) {
    const result = await this.notificationsService.subscribePush(userId, dto);
    return { success: true, data: result };
  }
}
