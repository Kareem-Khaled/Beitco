import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

// ADMIN-4: content-moderation DTOs.
export class AdminReviewsQueryDto {
  @ApiPropertyOptional({ description: 'Search body / author' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Filter to one listing' })
  @IsOptional()
  @IsString()
  propertyId?: string;

  @ApiPropertyOptional({ enum: ['true', 'false'], description: 'Only removed / only active' })
  @IsOptional()
  @IsIn(['true', 'false'])
  removed?: string;

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

export class RemoveContentDto {
  @ApiProperty({ description: 'Why it is being removed (audited)' })
  @IsString()
  @MaxLength(280)
  reason!: string;
}
