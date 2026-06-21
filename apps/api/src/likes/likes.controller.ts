import {
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators';
import { LikesService } from './likes.service';

@ApiTags('Likes')
@Controller()
@UseGuards(JwtAuthGuard)
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  // ═══════════════════════════════════════════════════════
  // POST /posts/:id/like — toggle post like
  // ═══════════════════════════════════════════════════════

  @Post('posts/:id/like')
  @HttpCode(HttpStatus.OK)
  async togglePostLike(
    @Param('id', ParseUUIDPipe) postId: string,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.likesService.togglePostLike(userId, postId);
    return { success: true, data: result };
  }

  // ═══════════════════════════════════════════════════════
  // POST /comments/:id/like — toggle comment like
  // ═══════════════════════════════════════════════════════

  @Post('comments/:id/like')
  @HttpCode(HttpStatus.OK)
  async toggleCommentLike(
    @Param('id', ParseUUIDPipe) commentId: string,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.likesService.toggleCommentLike(userId, commentId);
    return { success: true, data: result };
  }
}
