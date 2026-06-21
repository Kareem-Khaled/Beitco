import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { RequireTier } from '../auth/decorators/require-tier.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import {
  AdminUsersQueryDto,
  AdminReportsQueryDto,
  ChangeTierDto,
  ReviewReportDto,
  RejectContentDto,
  SuspendUserDto,
} from './dto';

/**
 * Admin endpoints — All require Tier 1 (Admin).
 * User management, post approval, flagged content, reports, groups, stats.
 */
@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
@RequireTier(1)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ─── USER MANAGEMENT ─────────────────────────────────

  @Get('users')
  @ApiOperation({ summary: 'List all users (paginated, filterable)' })
  async getUsers(@Query() query: AdminUsersQueryDto) {
    const result = await this.adminService.getUsers(query);
    return { success: true, ...result };
  }

  @Patch('users/:id/tier')
  @ApiOperation({ summary: 'Change user permission tier' })
  async changeTier(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeTierDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const updated = await this.adminService.changeTier(id, dto, user.id);
    return { success: true, data: updated };
  }

  @Patch('users/:id/verify')
  @ApiOperation({ summary: 'Verify user (national ID + auto-upgrade tier)' })
  async verifyUser(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const updated = await this.adminService.verifyUser(id, user.id);
    return { success: true, data: updated };
  }

  @Post('users/:id/suspend')
  @ApiOperation({ summary: 'Suspend user (soft-delete + set restricted)' })
  async suspendUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SuspendUserDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const updated = await this.adminService.suspendUser(id, dto, user.id);
    return { success: true, data: updated };
  }

  // ─── POST APPROVAL ───────────────────────────────────

  @Get('posts/pending')
  @ApiOperation({ summary: 'Get pending-approval posts queue' })
  async getPendingPosts(@Query() query: PaginationQueryDto) {
    const result = await this.adminService.getPendingPosts(query);
    return { success: true, ...result };
  }

  @Patch('posts/:id/approve')
  @ApiOperation({ summary: 'Approve a pending post' })
  async approvePost(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const updated = await this.adminService.approvePost(id, user.id);
    return { success: true, data: updated };
  }

  @Patch('posts/:id/reject')
  @ApiOperation({ summary: 'Reject a pending post' })
  async rejectPost(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectContentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const updated = await this.adminService.rejectPost(id, dto, user.id);
    return { success: true, data: updated };
  }

  // ─── FLAGGED CONTENT ─────────────────────────────────

  @Get('posts/flagged')
  @ApiOperation({ summary: 'Get AI-flagged posts' })
  async getFlaggedPosts(@Query() query: PaginationQueryDto) {
    const result = await this.adminService.getFlaggedPosts(query);
    return { success: true, ...result };
  }

  @Get('comments/flagged')
  @ApiOperation({ summary: 'Get AI-flagged comments' })
  async getFlaggedComments(@Query() query: PaginationQueryDto) {
    const result = await this.adminService.getFlaggedComments(query);
    return { success: true, ...result };
  }

  // ─── REPORTS ─────────────────────────────────────────

  @Get('reports')
  @ApiOperation({ summary: 'Get report queue (filterable by status)' })
  async getReports(@Query() query: AdminReportsQueryDto) {
    const result = await this.adminService.getReports(query);
    return { success: true, ...result };
  }

  @Patch('reports/:id')
  @ApiOperation({ summary: 'Review a report (resolve/dismiss with action)' })
  async reviewReport(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewReportDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const updated = await this.adminService.reviewReport(id, dto, user.id);
    return { success: true, data: updated };
  }

  // ─── GROUPS ──────────────────────────────────────────

  @Get('groups')
  @ApiOperation({ summary: 'Get all groups (admin overview)' })
  async getGroups(@Query() query: PaginationQueryDto) {
    const result = await this.adminService.getGroups(query);
    return { success: true, ...result };
  }

  // ─── ANALYTICS / STATS ───────────────────────────────

  @Get('analytics')
  @ApiOperation({ summary: 'Get platform-wide dashboard stats' })
  async getDashboardStats() {
    const stats = await this.adminService.getDashboardStats();
    return { success: true, data: stats };
  }

  @Get('moderation/stats')
  @ApiOperation({ summary: 'Get moderation-specific statistics' })
  async getModerationStats() {
    const stats = await this.adminService.getModerationStats();
    return { success: true, data: stats };
  }
}
