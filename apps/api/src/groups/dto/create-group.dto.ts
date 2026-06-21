import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

const GROUP_TYPES = ['neighborhood', 'topic', 'compound', 'custom'] as const;
const PRIVACY_TYPES = ['public', 'private'] as const;
const POSTING_RULES = ['open', 'moderated', 'admin_only'] as const;

export class CreateGroupDto {
  @ApiProperty({ example: 'القاهرة الجديدة' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nameAr!: string;

  @ApiPropertyOptional({ example: 'New Cairo' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  nameEn?: string;

  @ApiPropertyOptional({ example: 'مجموعة لسكان القاهرة الجديدة' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  descriptionAr?: string;

  @ApiPropertyOptional({ example: 'Group for New Cairo residents' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  descriptionEn?: string;

  @ApiProperty({ enum: GROUP_TYPES, example: 'neighborhood' })
  @IsEnum(GROUP_TYPES)
  groupType!: (typeof GROUP_TYPES)[number];

  @ApiPropertyOptional({ enum: PRIVACY_TYPES, default: 'public' })
  @IsOptional()
  @IsEnum(PRIVACY_TYPES)
  privacy?: (typeof PRIVACY_TYPES)[number];

  @ApiPropertyOptional({ enum: POSTING_RULES, default: 'open' })
  @IsOptional()
  @IsEnum(POSTING_RULES)
  postingRules?: (typeof POSTING_RULES)[number];

  @ApiPropertyOptional({ example: 30.0 })
  @IsOptional()
  @IsNumber()
  locationLat?: number;

  @ApiPropertyOptional({ example: 31.5 })
  @IsOptional()
  @IsNumber()
  locationLng?: number;

  @ApiPropertyOptional({ example: 'القاهرة' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'التجمع الخامس' })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverPhotoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatarUrl?: string;
}
