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
import { ListingsService } from './listings.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { ListingQueryDto } from './dto/listing-query.dto';

@ApiTags('Listings')
@Controller('listings')
@UseGuards(JwtAuthGuard)
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  // ── POST /listings — create listing (Tier 2) ──────
  @Post()
  @RequireTier(2)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateListingDto,
  ) {
    const listing = await this.listingsService.create(userId, dto);
    return { success: true, data: listing };
  }

  // ── GET /listings — search/list ───────────────────
  @Get()
  @Public()
  async findAll(@Query() query: ListingQueryDto) {
    const result = await this.listingsService.findAll(query);
    return { success: true, data: result.data, meta: result.meta };
  }

  // ── GET /listings/saved — user's saved listings ───
  @Get('saved')
  async getSaved(
    @CurrentUser('id') userId: string,
    @Query() query: PaginationQueryDto,
  ) {
    const result = await this.listingsService.getSaved(userId, query);
    return { success: true, data: result.data, meta: result.meta };
  }

  // ── GET /listings/:id — listing detail ────────────
  @Get(':id')
  @Public()
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    const listing = await this.listingsService.findById(id);
    return { success: true, data: listing };
  }

  // ── GET /listings/:id/similar — similar listings ──
  @Get(':id/similar')
  @Public()
  async getSimilar(@Param('id', ParseUUIDPipe) id: string) {
    const similar = await this.listingsService.getSimilar(id);
    return { success: true, data: similar };
  }

  // ── PATCH /listings/:id — update listing ──────────
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('permissionTier') permissionTier: string,
    @Body() dto: UpdateListingDto,
  ) {
    const listing = await this.listingsService.update(id, userId, permissionTier, dto);
    return { success: true, data: listing };
  }

  // ── DELETE /listings/:id — soft delete ────────────
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('permissionTier') permissionTier: string,
  ) {
    await this.listingsService.softDelete(id, userId, permissionTier);
  }

  // ── POST /listings/:id/save — toggle save ─────────
  @Post(':id/save')
  @HttpCode(HttpStatus.OK)
  async toggleSave(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.listingsService.toggleSave(userId, id);
    return { success: true, data: result };
  }
}
