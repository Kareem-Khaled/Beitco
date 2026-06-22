import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBooleanString, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

/**
 * Filters for GET /properties. Mirrors the frontend search params
 * (apps/web/src/routes/search.tsx). `type` accepts the Arabic UI value and is
 * mapped to the schema enum in the service.
 */
export class ListPropertiesQueryDto {
  @ApiPropertyOptional({ description: 'Free-text query (title / area / address)' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Property type (Arabic UI value)', enum: ['شقة', 'أوضة', 'سرير'] })
  @IsOptional()
  @IsIn(['شقة', 'أوضة', 'سرير'])
  type?: string;

  @ApiPropertyOptional({ enum: ['rent', 'sale'] })
  @IsOptional()
  @IsIn(['rent', 'sale'])
  purpose?: 'rent' | 'sale';

  @ApiPropertyOptional({ enum: ['male_only', 'female_only'] })
  @IsOptional()
  @IsIn(['male_only', 'female_only'])
  gender?: 'male_only' | 'female_only';

  @ApiPropertyOptional({ description: 'Area substring match' })
  @IsOptional()
  @IsString()
  area?: string;

  @ApiPropertyOptional({ description: 'Only listings with at least one free bed' })
  @IsOptional()
  @IsBooleanString()
  freeOnly?: string;

  @ApiPropertyOptional({ description: 'Only verified listings' })
  @IsOptional()
  @IsBooleanString()
  verifiedOnly?: string;

  @ApiPropertyOptional({ description: 'Only listings offering a nightly rate' })
  @IsOptional()
  @IsBooleanString()
  nightly?: string;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @Transform(({ value }) => (value === '' || value == null ? undefined : Number(value)))
  @IsInt()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @Transform(({ value }) => (value === '' || value == null ? undefined : Number(value)))
  @IsInt()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ enum: ['trust', 'price_asc', 'price_desc', 'newest'] })
  @IsOptional()
  @IsIn(['trust', 'price_asc', 'price_desc', 'newest'])
  sort?: 'trust' | 'price_asc' | 'price_desc' | 'newest';

  @ApiPropertyOptional({ description: 'Cursor (property id) for pagination' })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({ description: 'Page size (default 24, max 50)' })
  @IsOptional()
  @Transform(({ value }) => (value === '' || value == null ? undefined : Number(value)))
  @IsInt()
  @Min(1)
  limit?: number = 24;
}
