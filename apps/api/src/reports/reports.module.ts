import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { AdminModule } from '../admin/admin.module';

// ADMIN-5. Imports AdminModule for the shared AdminAuditService (every status
// change is logged).
@Module({
  imports: [AdminModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
