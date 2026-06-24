import { Global, Module } from '@nestjs/common';
import { SearchService } from './search.service';

// PROD-3: Meilisearch. Global so the listings read + write paths can inject the
// search service to query and keep the index in sync. PrismaModule is global.
@Global()
@Module({
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
