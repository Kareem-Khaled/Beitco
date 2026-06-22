import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListingsService } from './listings.service';
import { ListPropertiesQueryDto } from './dto/list-properties-query.dto';
import { Public } from '../auth/decorators/public.decorator';

// Public read API for listings (B-1). Browsing doesn't require auth.
// The ResponseEnvelopeInterceptor wraps returns in { success, data, meta? }.
@Controller({ path: 'properties', version: '1' })
@ApiTags('Properties')
export class ListingsController {
  constructor(private readonly listings: ListingsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List published properties (cursor-paginated, filterable)' })
  list(@Query() query: ListPropertiesQueryDto) {
    // Returns { data, meta } -> interceptor lifts meta to the envelope top level.
    return this.listings.list(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get a single published property by id' })
  findOne(@Param('id') id: string) {
    return this.listings.findOne(id);
  }
}
