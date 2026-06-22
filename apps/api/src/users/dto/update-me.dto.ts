import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

// Patch the authenticated user's own profile (settings page).
export class UpdateMeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  name?: string;

  @ApiPropertyOptional({ enum: ['renter', 'owner', 'both'] })
  @IsOptional()
  @IsIn(['renter', 'owner', 'both'])
  role?: 'renter' | 'owner' | 'both';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({ description: 'Notification channel prefs { leads, messages, reviews, marketing }' })
  @IsOptional()
  @IsObject()
  notifications?: Record<string, boolean>;
}
