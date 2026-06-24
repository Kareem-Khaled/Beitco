import { Module } from '@nestjs/common';
import { VerificationController } from './verification.controller';
import { VerificationService } from './verification.service';

// PROD-5: KYC verification. TrustModule is global (recompute on approve).
@Module({
  controllers: [VerificationController],
  providers: [VerificationService],
})
export class VerificationModule {}
