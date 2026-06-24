import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';

// PROD-1: presigned image uploads (S3/R2). ConfigModule is global.
@Module({
  controllers: [UploadsController],
  providers: [UploadsService],
})
export class UploadsModule {}
