import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { IsEgyptArea } from '../../common/validators/is-egypt-area.validator';

class SpecDto {
  @ApiProperty({ enum: ['شقة', 'استوديو', 'دوبلكس', 'روف', 'فيلا'] })
  @IsIn(['شقة', 'استوديو', 'دوبلكس', 'روف', 'فيلا'])
  unitType!: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  bedrooms!: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  bathrooms!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  floor?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  sizeM2?: number;

  @ApiProperty()
  @IsBoolean()
  furnished!: boolean;
}

class BedInputDto {
  @ApiProperty()
  @IsString()
  label!: string;

  @ApiProperty({ enum: ['available', 'occupied', 'reserved'] })
  @IsIn(['available', 'occupied', 'reserved'])
  status!: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  price!: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];
}

class RoomInputDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  features!: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  sizeM2?: number;

  @ApiPropertyOptional({ description: 'by_room: room price' })
  @IsOptional()
  @IsInt()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ enum: ['available', 'occupied', 'reserved'] })
  @IsOptional()
  @IsIn(['available', 'occupied', 'reserved'])
  status?: string;

  @ApiPropertyOptional({ type: [BedInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BedInputDto)
  beds?: BedInputDto[];
}

class NearbyInputDto {
  @ApiProperty({ enum: ['مترو', 'جامعة', 'مواصلات', 'مول', 'مستشفى', 'سوبر ماركت', 'حاجة تانية'] })
  @IsIn(['مترو', 'جامعة', 'مواصلات', 'مول', 'مستشفى', 'سوبر ماركت', 'حاجة تانية'])
  type!: string;

  @ApiProperty()
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  line?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  minutes?: number;
}

class CustomSpecInputDto {
  @ApiProperty()
  @IsString()
  label!: string;

  @ApiProperty()
  @IsString()
  value!: string;
}

class CostInputDto {
  @ApiProperty()
  @IsString()
  label!: string;

  @ApiProperty()
  @IsInt()
  amount!: number;
}

// Create/edit a listing. Mirrors the wizard's structured apartment model.
// `type` and the card fields (priceFrom, bed counts) are DERIVED server-side.
export class CreateListingDto {
  @ApiProperty()
  @IsString()
  @MaxLength(200)
  title!: string;

  @ApiProperty()
  @IsString()
  @IsEgyptArea()
  area!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  lat?: number;

  @ApiPropertyOptional()
  @IsOptional()
  lng?: number;

  @ApiPropertyOptional({ enum: ['rent', 'sale'], default: 'rent' })
  @IsOptional()
  @IsIn(['rent', 'sale'])
  listingType?: 'rent' | 'sale';

  @ApiPropertyOptional({ enum: ['whole', 'by_room', 'by_bed'] })
  @IsOptional()
  @IsIn(['whole', 'by_room', 'by_bed'])
  rentalMode?: 'whole' | 'by_room' | 'by_bed';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: SpecDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SpecDto)
  spec?: SpecDto;

  // Pricing
  @ApiPropertyOptional({ description: 'whole-rent monthly price' })
  @IsOptional()
  @IsInt()
  @Min(0)
  wholePrice?: number;

  @ApiPropertyOptional({ enum: ['available', 'occupied', 'reserved'] })
  @IsOptional()
  @IsIn(['available', 'occupied', 'reserved'])
  wholeStatus?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  nightlyPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  salePrice?: number;

  @ApiPropertyOptional({ enum: ['available', 'sold'] })
  @IsOptional()
  @IsIn(['available', 'sold'])
  saleStatus?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  negotiable?: boolean;

  @ApiPropertyOptional({ enum: ['male_only', 'female_only'] })
  @IsOptional()
  @IsIn(['male_only', 'female_only'])
  rentToGender?: 'male_only' | 'female_only';

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @ApiPropertyOptional({ type: [CostInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CostInputDto)
  costs?: CostInputDto[];

  @ApiPropertyOptional({ type: [RoomInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoomInputDto)
  rooms?: RoomInputDto[];

  @ApiPropertyOptional({ type: [NearbyInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NearbyInputDto)
  nearby?: NearbyInputDto[];

  @ApiPropertyOptional({ type: [CustomSpecInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomSpecInputDto)
  customSpecs?: CustomSpecInputDto[];
}

export class RejectListingDto {
  @ApiProperty()
  @IsString()
  @MaxLength(500)
  reason!: string;
}

// ── Manage (status + occupancy) ─────────────────────────────────────────────
// Owner-only granular updates from the dashboard management grid. Each call
// carries exactly one concern; the service applies whichever field is present.
class OccupantInputDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @ApiPropertyOptional({ description: 'ISO move-in date' })
  @IsOptional()
  @IsString()
  moveInDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

class WholeOccupancyDto {
  @ApiProperty({ enum: ['available', 'occupied', 'reserved'] })
  @IsIn(['available', 'occupied', 'reserved'])
  status!: string;

  @ApiPropertyOptional({ type: OccupantInputDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => OccupantInputDto)
  occupant?: OccupantInputDto;
}

class RoomOccupancyDto extends WholeOccupancyDto {
  @ApiProperty()
  @IsString()
  roomId!: string;
}

class BedOccupancyDto extends WholeOccupancyDto {
  @ApiProperty()
  @IsString()
  bedId!: string;
}

export class ManageListingDto {
  @ApiPropertyOptional({ enum: ['published', 'paused'] })
  @IsOptional()
  @IsIn(['published', 'paused'])
  listingStatus?: 'published' | 'paused';

  @ApiPropertyOptional({ enum: ['available', 'sold'] })
  @IsOptional()
  @IsIn(['available', 'sold'])
  saleStatus?: 'available' | 'sold';

  @ApiPropertyOptional({ type: WholeOccupancyDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => WholeOccupancyDto)
  whole?: WholeOccupancyDto;

  @ApiPropertyOptional({ type: RoomOccupancyDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => RoomOccupancyDto)
  room?: RoomOccupancyDto;

  @ApiPropertyOptional({ type: BedOccupancyDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => BedOccupancyDto)
  bed?: BedOccupancyDto;
}
