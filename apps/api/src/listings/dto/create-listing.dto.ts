import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

const LISTING_TYPES = ['sale', 'rent', 'commercial'] as const;
const PROPERTY_TYPES = ['apartment', 'villa', 'office', 'land', 'duplex', 'penthouse', 'studio', 'chalet', 'townhouse', 'twin_house'] as const;
const FINISHING_TYPES = ['fully_finished', 'semi_finished', 'core_shell'] as const;

export class CreateListingDto {
  @ApiProperty({ example: 'شقة ٣ غرف في التجمع' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  titleAr!: string;

  @ApiPropertyOptional({ example: '3BR Apartment in New Cairo' })
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

  @ApiProperty({ enum: LISTING_TYPES })
  @IsEnum(LISTING_TYPES)
  listingType!: (typeof LISTING_TYPES)[number];

  @ApiProperty({ enum: PROPERTY_TYPES })
  @IsEnum(PROPERTY_TYPES)
  propertyType!: (typeof PROPERTY_TYPES)[number];

  @ApiProperty({ example: 2500000 })
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiPropertyOptional({ default: 'EGP' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ example: 180 })
  @IsNumber()
  @Min(0)
  area!: number;

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

  @ApiPropertyOptional({ example: ['parking', 'gym', 'pool'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @ApiPropertyOptional({ example: ['url1', 'url2'] })
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  compound?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  videoId?: string;
}
