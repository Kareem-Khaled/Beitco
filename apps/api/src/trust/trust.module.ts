import { Global, Module } from '@nestjs/common';
import { TrustService } from './trust.service';

// Global so any write module (reviews, leads-completion, verification) can
// trigger a recompute without re-importing.
@Global()
@Module({
  providers: [TrustService],
  exports: [TrustService],
})
export class TrustModule {}
