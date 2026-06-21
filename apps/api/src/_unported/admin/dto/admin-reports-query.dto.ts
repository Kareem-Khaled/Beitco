import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ReportStatus } from '@prisma/client';

/**
 * Query parameters for admin report listing.
 */
export class AdminReportsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by report status',
    enum: ReportStatus,
    example: 'pending',
  })
  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;
}
