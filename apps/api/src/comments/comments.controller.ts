import {
  Body,
  Controller,
  Delete,
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
import { CurrentUser, Public, RequireTier } from '../auth/decorators';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentQueryDto } from './dto/comment-query.dto';

@ApiTags('Comments')
@Controller()
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  // ═══════════════════════════════════════════════════════
  // POST /posts/:postId/comments — create comment
  // ═══════════════════════════════════════════════════════

  @Post('posts/:postId/comments')
  @RequireTier(3)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('postId', ParseUUIDPipe) postId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCommentDto,
  ) {
    const comment = await this.commentsService.create(postId, userId, dto);
    return { success: true, data: comment };
  }

  // ═══════════════════════════════════════════════════════
  // GET /posts/:postId/comments — list threaded comments
  // ═══════════════════════════════════════════════════════

  @Get('posts/:postId/comments')
  @Public()
  async findByPost(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Query() query: CommentQueryDto,
  ) {
    const result = await this.commentsService.findByPost(postId, query);
    return { success: true, data: result.data, meta: result.meta };
  }

  // ═══════════════════════════════════════════════════════
  // PATCH /comments/:id — edit comment (within 15 min)
  // ═══════════════════════════════════════════════════════

  @Patch('comments/:id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateCommentDto,
  ) {
    const comment = await this.commentsService.update(id, userId, dto);
    return { success: true, data: comment };
  }

  // ═══════════════════════════════════════════════════════
  // DELETE /comments/:id — soft delete
  // ═══════════════════════════════════════════════════════

  @Delete('comments/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('permissionTier') permissionTier: string,
  ) {
    await this.commentsService.softDelete(id, userId, permissionTier);
  }

  // ═══════════════════════════════════════════════════════
  // POST /comments/:id/pin — toggle pin (post author only)
  // ═══════════════════════════════════════════════════════

  @Post('comments/:id/pin')
  @HttpCode(HttpStatus.OK)
  async pin(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.commentsService.pin(id, userId);
    return { success: true, data: result };
  }
}
