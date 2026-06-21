import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators';
import { SocialService } from './social.service';

@ApiTags('Social')
@Controller()
@UseGuards(JwtAuthGuard)
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  // ═══════════════════════════════════════════════════════
  // FOLLOWS
  // ═══════════════════════════════════════════════════════

  @Post('follows/:userId')
  @HttpCode(HttpStatus.CREATED)
  async follow(
    @CurrentUser('id') currentUserId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    const follow = await this.socialService.follow(currentUserId, userId);
    return { success: true, data: follow };
  }

  @Delete('follows/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unfollow(
    @CurrentUser('id') currentUserId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    await this.socialService.unfollow(currentUserId, userId);
  }

  @Get('follows/suggestions')
  async getSuggestions(
    @CurrentUser('id') currentUserId: string,
    @Query('limit') limit?: string,
  ) {
    const l = limit ? Math.min(parseInt(limit, 10) || 10, 50) : 10;
    const suggestions = await this.socialService.getSuggestions(currentUserId, l);
    return { success: true, data: suggestions };
  }

  // ═══════════════════════════════════════════════════════
  // BLOCKS
  // ═══════════════════════════════════════════════════════

  @Post('blocks/:userId')
  @HttpCode(HttpStatus.CREATED)
  async block(
    @CurrentUser('id') currentUserId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    await this.socialService.block(currentUserId, userId);
    return { success: true, data: null };
  }

  @Delete('blocks/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unblock(
    @CurrentUser('id') currentUserId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    await this.socialService.unblock(currentUserId, userId);
  }
}
