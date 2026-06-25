import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from './admin.guard';
import { AdminListingsService } from './admin.listings.service';
import { CurrentUser, type AuthUser } from '../auth/decorators/current-user.decorator';
import {
  AdminListingsQueryDto,
  AdminTakedownDto,
  AdminUpdateListingDto,
  AdminDeleteListingDto,
} from './dto/admin-listings.dto';

// ADMIN-3: listing management — search ALL listings + force-takedown. Admin-only.
// Every mutation is audit-logged in the service (ADMIN-12).
@Controller({ path: 'admin/listings', version: '1' })
@ApiTags('Admin')
@UseGuards(AdminGuard)
export class AdminListingsController {
  constructor(private readonly listings: AdminListingsService) {}

  @Get()
  @ApiOperation({ summary: 'Search / filter all listings (any status, cursor-paginated)' })
  async list(@Query() query: AdminListingsQueryDto) {
    const { data, meta } = await this.listings.list(query);
    return { success: true, data, meta };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Full listing detail (admin view, incl. occupants + moderation)' })
  detail(@Param('id') id: string) {
    return this.listings.detail(id);
  }

  @Post(':id/takedown')
  @ApiOperation({ summary: 'Force-pause a listing (with a reason)' })
  takedown(@CurrentUser() me: AuthUser, @Param('id') id: string, @Body() dto: AdminTakedownDto) {
    return this.listings.takedown(me, id, dto);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore a paused/rejected listing to published' })
  restore(@CurrentUser() me: AuthUser, @Param('id') id: string) {
    return this.listings.restore(me, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Set the verified badge' })
  update(@CurrentUser() me: AuthUser, @Param('id') id: string, @Body() dto: AdminUpdateListingDto) {
    return this.listings.update(me, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a listing' })
  remove(
    @CurrentUser() me: AuthUser,
    @Param('id') id: string,
    @Query('reason') reasonQuery?: string,
    @Body() dto?: AdminDeleteListingDto,
  ) {
    return this.listings.remove(me, id, dto?.reason ?? reasonQuery);
  }
}
