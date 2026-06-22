import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

// ── Saved searches ──
export class CreateSavedSearchDto {
  @ApiProperty()
  @IsString()
  @MaxLength(200)
  label!: string;

  @ApiProperty({ description: 'SavedSearchParams object' })
  @IsObject()
  params!: Record<string, unknown>;
}

// ── Leads (viewing / bed-level booking) ──
class LeadUnitInputDto {
  @ApiProperty()
  @IsString()
  label!: string;

  @ApiProperty({ enum: ['bed', 'room', 'whole'] })
  @IsIn(['bed', 'room', 'whole'])
  kind!: 'bed' | 'room' | 'whole';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  roomId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  roomName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bedId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  price?: number;
}

export class CreateLeadDto {
  @ApiPropertyOptional({ enum: ['viewing', 'booking'] })
  @IsOptional()
  @IsIn(['viewing', 'booking'])
  intent?: 'viewing' | 'booking';

  @ApiPropertyOptional({ type: [LeadUnitInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LeadUnitInputDto)
  units?: LeadUnitInputDto[];

  @ApiPropertyOptional({ description: 'Preferred viewing date (ISO)' })
  @IsOptional()
  @IsString()
  preferredDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}

export class UpdateLeadStatusDto {
  @ApiProperty({ enum: ['pending', 'approved', 'declined', 'completed'] })
  @IsIn(['pending', 'approved', 'declined', 'completed'])
  status!: 'pending' | 'approved' | 'declined' | 'completed';
}

// ── Q&A ──
export class AskQuestionDto {
  @ApiProperty()
  @IsString()
  @MaxLength(500)
  body!: string;
}

export class AnswerQuestionDto {
  @ApiProperty()
  @IsString()
  @MaxLength(1000)
  body!: string;
}
