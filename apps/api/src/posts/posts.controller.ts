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
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { CreatePostDto, UpdatePostDto, PostQueryDto } from './dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { RequireTier } from '../auth/decorators/require-tier.decorator';

@ApiTags('Posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  // ─── Create ────────────────────────────────────────

  @Post()
  @RequireTier(3) // trusted_member or higher can create posts
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a post (Tier 2 auto-publishes, Tier 3 pending approval)' })
  @ApiResponse({ status: 201, description: 'Post created and auto-published' })
  @ApiResponse({ status: 202, description: 'Post submitted for approval' })
  @ApiResponse({ status: 403, description: 'Insufficient tier' })
  async create(
    @CurrentUser('id') userId: string,
    @CurrentUser('permissionTier') permissionTier: string,
    @Body() dto: CreatePostDto,
  ) {
    const { post, isAutoApproved } = await this.postsService.create(
      userId,
      permissionTier,
      dto,
    );

    if (isAutoApproved) {
      return { success: true, data: post };
    }

    return {
      success: true,
      data: {
        ...post,
        message: 'تم تقديم بوستك للمراجعة. سيتم إخطارك بالنتيجة.',
      },
    };
  }

  // ─── Read ──────────────────────────────────────────

  @Get()
  @Public()
  @ApiOperation({ summary: 'List published posts (paginated, filterable)' })
  @ApiResponse({ status: 200, description: 'Paginated list of posts' })
  async findAll(@Query() query: PostQueryDto) {
    const result = await this.postsService.findAll(query);
    return { success: true, data: result.items, meta: result.meta };
  }

  @Get('me/pending')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my pending-approval posts' })
  @ApiResponse({ status: 200, description: 'List of pending posts' })
  async getMyPending(
    @CurrentUser('id') userId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
  ) {
    const result = await this.postsService.getMyPendingPosts(
      userId,
      cursor,
      limit ?? 20,
    );
    return { success: true, data: result.items, meta: result.meta };
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get a post by ID' })
  @ApiResponse({ status: 200, description: 'Post details' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') requesterId?: string,
  ) {
    const post = await this.postsService.findById(id, requesterId);
    return { success: true, data: post };
  }

  // ─── Update ────────────────────────────────────────

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Edit a post (author only, within 24h)' })
  @ApiResponse({ status: 200, description: 'Updated post' })
  @ApiResponse({ status: 403, description: 'Not author or edit window expired' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdatePostDto,
  ) {
    const post = await this.postsService.update(id, userId, dto);
    return { success: true, data: post };
  }

  // ─── Delete ────────────────────────────────────────

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft-delete a post (author or admin)' })
  @ApiResponse({ status: 204, description: 'Post deleted' })
  @ApiResponse({ status: 403, description: 'Not author and not admin' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('permissionTier') permissionTier: string,
  ) {
    await this.postsService.softDelete(id, userId, permissionTier);
  }

  // ─── Moderation ────────────────────────────────────

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @RequireTier(2) // verified_contributor or admin
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve a pending post' })
  @ApiResponse({ status: 200, description: 'Post approved' })
  @ApiResponse({ status: 403, description: 'Only pending posts or insufficient tier' })
  async approve(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') reviewerId: string,
  ) {
    const post = await this.postsService.approve(id, reviewerId);
    return { success: true, data: post };
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @RequireTier(2) // verified_contributor or admin
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject a pending post' })
  @ApiResponse({ status: 200, description: 'Post rejected' })
  @ApiResponse({ status: 403, description: 'Only pending posts or insufficient tier' })
  async reject(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') reviewerId: string,
    @Body('reason') reason: string,
  ) {
    const post = await this.postsService.reject(id, reviewerId, reason ?? 'No reason provided');
    return { success: true, data: post };
  }
}
