import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

// ADMIN-3: listing-management query + mutation DTOs.
export class AdminListingsQueryDto {
  @ApiPropertyOptional({ description: 'Search by title / area / address' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ enum: ['draft', 'pending_approval', 'published', 'paused', 'rejected'] })
  @IsOptional()
  @IsIn(['draft', 'pending_approval', 'published', 'paused', 'rejected'])
  status?: string;

  @ApiPropertyOptional({ description: 'Type (Arabic UI value)', enum: ['شقة', 'أوضة', 'سرير'] })
  @IsOptional()
  @IsIn(['شقة', 'أوضة', 'سرير'])
  type?: string;

  @ApiPropertyOptional({ enum: ['rent', 'sale'] })
  @IsOptional()
  @IsIn(['rent', 'sale'])
  purpose?: 'rent' | 'sale';

  @ApiPropertyOptional({ enum: ['true', 'false'] })
  @IsOptional()
  @IsIn(['true', 'false'])
  verified?: string;

  @ApiPropertyOptional({ description: 'Filter by owner id' })
  @IsOptional()
  @IsString()
  ownerId?: string;

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

export class AdminTakedownDto {
  @ApiPropertyOptional({ description: 'Why the listing is being taken down (shown to the owner)' })
  @IsString()
  @MaxLength(280)
  reason!: string;
}

export class AdminUpdateListingDto {
  @ApiPropertyOptional({ description: 'Set the verified badge' })
  @Transform(({ value }) => (typeof value === 'boolean' ? value : value === 'true'))
  @IsBoolean()
  verified!: boolean;

  @ApiPropertyOptional({ description: 'Reason (audited)' })
  @IsOptional()
  @IsString()
  @MaxLength(280)
  reason?: string;
}

export class AdminDeleteListingDto {
  @ApiPropertyOptional({ description: 'Reason (audited)' })
  @IsOptional()
  @IsString()
  @MaxLength(280)
  reason?: string;
}
