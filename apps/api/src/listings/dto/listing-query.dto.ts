import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

const LISTING_TYPES = ['sale', 'rent', 'commercial'] as const;
const PROPERTY_TYPES = ['apartment', 'villa', 'office', 'land', 'duplex', 'penthouse', 'studio', 'chalet', 'townhouse', 'twin_house'] as const;

export class ListingQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: LISTING_TYPES })
  @IsOptional()
  @IsEnum(LISTING_TYPES)
  type?: (typeof LISTING_TYPES)[number];

  @ApiPropertyOptional({ enum: PROPERTY_TYPES })
  @IsOptional()
  @IsEnum(PROPERTY_TYPES)
  propertyType?: (typeof PROPERTY_TYPES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  minArea?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  bedrooms?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}
