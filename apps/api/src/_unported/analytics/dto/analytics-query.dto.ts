import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

/**
 * DTO for querying analytics with a date range.
 */
export class AnalyticsQueryDto {
  @ApiPropertyOptional({
    description: 'Period for analytics aggregation',
    enum: ['day', 'week', 'month', 'all'],
    example: 'week',
  })
  @IsOptional()
  @IsIn(['day', 'week', 'month', 'all'])
  period?: string = 'week';

  @ApiPropertyOptional({
    description: 'Start date (ISO 8601)',
    example: '2026-04-01',
  })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date (ISO 8601)',
    example: '2026-04-07',
  })
  @IsOptional()
  @IsString()
  endDate?: string;
}
