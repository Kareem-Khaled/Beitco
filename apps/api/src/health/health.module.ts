import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

// Liveness + readiness (SEC-3). PrismaModule + ConfigModule are global.
@Module({
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
