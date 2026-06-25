import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

// ADMIN-9: analytics query.
export class AnalyticsTimeseriesDto {
  @ApiPropertyOptional({ enum: ['signups', 'listings', 'leads', 'tenancies'], default: 'signups' })
  @IsOptional()
  @IsIn(['signups', 'listings', 'leads', 'tenancies'])
  metric?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 365, default: 30 })
  @IsOptional()
  @Transform(({ value }) => (value === '' || value == null ? undefined : Number(value)))
  @IsInt()
  @Min(1)
  @Max(365)
  days?: number;
}
