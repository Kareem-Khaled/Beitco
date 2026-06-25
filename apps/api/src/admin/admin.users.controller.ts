import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from './admin.guard';
import { AdminUsersService } from './admin.users.service';
import { CurrentUser, type AuthUser } from '../auth/decorators/current-user.decorator';
import { AdminUsersQueryDto, AdminUpdateUserDto, BanUserDto } from './dto/admin-users.dto';

// ADMIN-2: user management. Admin-only. Every mutation is audit-logged in the
// service (ADMIN-12).
@Controller({ path: 'admin/users', version: '1' })
@ApiTags('Admin')
@UseGuards(AdminGuard)
export class AdminUsersController {
  constructor(private readonly users: AdminUsersService) {}

  @Get()
  @ApiOperation({ summary: 'Search / filter users (cursor-paginated)' })
  async list(@Query() query: AdminUsersQueryDto) {
    const { data, meta } = await this.users.list(query);
    return { success: true, data, meta };
  }

  @Get(':id')
  @ApiOperation({ summary: 'User detail + activity counts + KYC history' })
  detail(@Param('id') id: string) {
    return this.users.detail(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edit role / manual verify / trust override' })
  update(@CurrentUser() me: AuthUser, @Param('id') id: string, @Body() dto: AdminUpdateUserDto) {
    return this.users.update(me, id, dto);
  }

  @Post(':id/ban')
  @ApiOperation({ summary: 'Suspend an account (with a reason)' })
  ban(@CurrentUser() me: AuthUser, @Param('id') id: string, @Body() dto: BanUserDto) {
    return this.users.ban(me, id, dto);
  }

  @Post(':id/reinstate')
  @ApiOperation({ summary: 'Lift a suspension' })
  reinstate(@CurrentUser() me: AuthUser, @Param('id') id: string) {
    return this.users.reinstate(me, id);
  }

  @Post(':id/make-admin')
  @ApiOperation({ summary: 'Grant platform-admin' })
  makeAdmin(@CurrentUser() me: AuthUser, @Param('id') id: string) {
    return this.users.setAdmin(me, id, true);
  }

  @Post(':id/revoke-admin')
  @ApiOperation({ summary: 'Revoke platform-admin' })
  revokeAdmin(@CurrentUser() me: AuthUser, @Param('id') id: string) {
    return this.users.setAdmin(me, id, false);
  }
}
