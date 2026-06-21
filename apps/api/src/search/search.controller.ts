import {
  Controller,
  Get,
  Post,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public, RequireTier } from '../auth/decorators';
import { SearchService } from './search.service';
import { SearchQueryDto } from './dto/search-query.dto';
import { SuggestQueryDto } from './dto/suggest-query.dto';

@ApiTags('Search')
@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  // ── GET /search — unified search ──────────────────
  @Get()
  @Public()
  async search(@Query() query: SearchQueryDto) {
    const result = await this.searchService.search(query);
    return { success: true, data: result };
  }

  // ── GET /search/suggestions — autocomplete ────────
  @Get('suggestions')
  @Public()
  async suggestions(@Query() query: SuggestQueryDto) {
    const suggestions = await this.searchService.suggest(query.q);
    return { success: true, data: suggestions };
  }

  // ── GET /search/trending — trending hashtags ──────
  @Get('trending')
  @Public()
  async trending() {
    const trending = await this.searchService.getTrending();
    return { success: true, data: trending };
  }

  // ── POST /search/reindex — admin: re-index all ────
  @Post('reindex')
  @RequireTier(1)
  @HttpCode(HttpStatus.OK)
  async reindex() {
    const result = await this.searchService.reindexAll();
    return { success: true, data: result };
  }
}
