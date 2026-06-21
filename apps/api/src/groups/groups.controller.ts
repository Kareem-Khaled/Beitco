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
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { GroupQueryDto, MemberQueryDto, UpdateMemberDto } from './dto/group-query.dto';

@ApiTags('Groups')
@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  // ── POST /groups — create group (Tier 2+) ─────────
  @Post()
  @RequireTier(2)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateGroupDto,
  ) {
    const group = await this.groupsService.create(userId, dto);
    return { success: true, data: group };
  }

  // ── GET /groups — list groups ─────────────────────
  @Get()
  @Public()
  async findAll(@Query() query: GroupQueryDto) {
    const result = await this.groupsService.findAll(query);
    return { success: true, data: result.data, meta: result.meta };
  }

  // ── GET /groups/:id — group detail ────────────────
  @Get(':id')
  @Public()
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId?: string,
  ) {
    const group = await this.groupsService.findById(id, userId ?? undefined);
    return { success: true, data: group };
  }

  // ── PATCH /groups/:id — update group (admin) ──────
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('permissionTier') permissionTier: string,
    @Body() dto: UpdateGroupDto,
  ) {
    const group = await this.groupsService.update(id, userId, permissionTier, dto);
    return { success: true, data: group };
  }

  // ── DELETE /groups/:id — soft delete ──────────────
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('permissionTier') permissionTier: string,
  ) {
    await this.groupsService.softDelete(id, userId, permissionTier);
  }

  // ── POST /groups/:id/join — join group ────────────
  @Post(':id/join')
  @HttpCode(HttpStatus.OK)
  async join(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.groupsService.join(id, userId);
    return { success: true, data: result };
  }

  // ── DELETE /groups/:id/leave — leave group ────────
  @Delete(':id/leave')
  @HttpCode(HttpStatus.NO_CONTENT)
  async leave(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    await this.groupsService.leave(id, userId);
  }

  // ── GET /groups/:id/members — member list ─────────
  @Get(':id/members')
  @Public()
  async getMembers(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: MemberQueryDto,
  ) {
    const result = await this.groupsService.getMembers(id, query);
    return { success: true, data: result.data, meta: result.meta };
  }

  // ── GET /groups/:id/posts — group feed ────────────
  @Get(':id/posts')
  @Public()
  async getGroupPosts(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: PaginationQueryDto,
  ) {
    const result = await this.groupsService.getGroupPosts(id, query);
    return { success: true, data: result.data, meta: result.meta };
  }

  // ── PATCH /groups/:id/members/:userId — manage member
  @Patch(':id/members/:userId')
  async updateMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) targetUserId: string,
    @CurrentUser('id') actingUserId: string,
    @CurrentUser('permissionTier') permissionTier: string,
    @Body() dto: UpdateMemberDto,
  ) {
    const result = await this.groupsService.updateMember(
      id,
      targetUserId,
      actingUserId,
      permissionTier,
      dto,
    );
    return { success: true, data: result };
  }
}
