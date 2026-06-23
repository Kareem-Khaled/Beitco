import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListingsService } from './listings.service';
import { ListingsWriteService } from './listings.write.service';
import { ListPropertiesQueryDto } from './dto/list-properties-query.dto';
import { CreateListingDto, ManageListingDto } from './dto/create-listing.dto';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser, type AuthUser } from '../auth/decorators/current-user.decorator';

// Listings API (B-1 reads, B-2c writes). Reads are public; writes require auth.
@Controller({ path: 'properties', version: '1' })
@ApiTags('Properties')
export class ListingsController {
  constructor(
    private readonly listings: ListingsService,
    private readonly write: ListingsWriteService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List published properties (cursor-paginated, filterable)' })
  list(@Query() query: ListPropertiesQueryDto) {
    // Returns { data, meta } -> interceptor lifts meta to the envelope top level.
    return this.listings.list(query);
  }

  // Owner's own listings (all statuses) — must be declared before :id.
  @Get('mine')
  @ApiOperation({ summary: "My listings (owner, all statuses)" })
  mine(@CurrentUser() me: AuthUser) {
    return this.write.listMine(me.id);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get a single published property by id' })
  findOne(@Param('id') id: string) {
    return this.listings.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a listing (moderation-gated by verification)' })
  create(@CurrentUser() me: AuthUser, @Body() dto: CreateListingDto) {
    return this.write.create(me.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edit my listing' })
  update(@CurrentUser() me: AuthUser, @Param('id') id: string, @Body() dto: CreateListingDto) {
    return this.write.update(me.id, id, dto);
  }

  @Patch(':id/manage')
  @ApiOperation({ summary: 'Manage my listing: pause / sale-status / occupancy' })
  manage(@CurrentUser() me: AuthUser, @Param('id') id: string, @Body() dto: ManageListingDto) {
    return this.write.manage(me.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete (soft) my listing' })
  remove(@CurrentUser() me: AuthUser, @Param('id') id: string) {
    return this.write.remove(me.id, id);
  }
}
