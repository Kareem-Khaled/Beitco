import { Module } from '@nestjs/common';
import { ListingsController } from './listings.controller';
import { ListingsService } from './listings.service';
import { ListingsWriteService } from './listings.write.service';

@Module({
  controllers: [ListingsController],
  providers: [ListingsService, ListingsWriteService],
})
export class ListingsModule {}
