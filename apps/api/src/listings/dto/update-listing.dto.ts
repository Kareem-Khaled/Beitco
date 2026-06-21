import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

const LISTING_TYPES = ['sale', 'rent', 'commercial'] as const;
const PROPERTY_TYPES = ['apartment', 'villa', 'office', 'land', 'duplex', 'penthouse', 'studio', 'chalet', 'townhouse', 'twin_house'] as const;
const FINISHING_TYPES = ['fully_finished', 'semi_finished', 'core_shell'] as const;
const LISTING_STATUSES = ['active', 'pending', 'sold', 'rented', 'expired'] as const;

export class UpdateListingDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  titleAr?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  titleEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  descriptionAr?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  descriptionEn?: string;

  @ApiPropertyOptional({ enum: LISTING_TYPES })
  @IsOptional()
  @IsEnum(LISTING_TYPES)
  listingType?: (typeof LISTING_TYPES)[number];

  @ApiPropertyOptional({ enum: PROPERTY_TYPES })
  @IsOptional()
  @IsEnum(PROPERTY_TYPES)
  propertyType?: (typeof PROPERTY_TYPES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  area?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  bedrooms?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  bathrooms?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  floor?: number;

  @ApiPropertyOptional({ enum: FINISHING_TYPES })
  @IsOptional()
  @IsEnum(FINISHING_TYPES)
  finishing?: (typeof FINISHING_TYPES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  locationLat?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  locationLng?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({ enum: LISTING_STATUSES })
  @IsOptional()
  @IsEnum(LISTING_STATUSES)
  status?: (typeof LISTING_STATUSES)[number];
}
