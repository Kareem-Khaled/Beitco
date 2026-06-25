import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

const TARGET_TYPES = ['listing', 'review', 'user', 'question'] as const;

// ADMIN-5: a user files a report.
export class CreateReportDto {
  @ApiProperty({ enum: TARGET_TYPES })
  @IsIn(TARGET_TYPES as unknown as string[])
  targetType!: string;

  @ApiProperty()
  @IsString()
  targetId!: string;

  @ApiProperty({ description: 'Short reason / category' })
  @IsString()
  @MaxLength(120)
  reason!: string;

  @ApiPropertyOptional({ description: 'Free-text details' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  details?: string;
}

// Admin triage query.
export class AdminReportsQueryDto {
  @ApiPropertyOptional({ enum: ['open', 'reviewing', 'resolved', 'dismissed'] })
  @IsOptional()
  @IsIn(['open', 'reviewing', 'resolved', 'dismissed'])
  status?: string;

  @ApiPropertyOptional({ enum: TARGET_TYPES })
  @IsOptional()
  @IsIn(TARGET_TYPES as unknown as string[])
  targetType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 50, default: 25 })
  @IsOptional()
  @Transform(({ value }) => (value === '' || value == null ? undefined : Number(value)))
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

// Admin updates a report's status.
export class UpdateReportDto {
  @ApiProperty({ enum: ['open', 'reviewing', 'resolved', 'dismissed'] })
  @IsIn(['open', 'reviewing', 'resolved', 'dismissed'])
  status!: string;

  @ApiPropertyOptional({ description: 'Resolution note (audited)' })
  @IsOptional()
  @IsString()
  @MaxLength(280)
  resolution?: string;
}
