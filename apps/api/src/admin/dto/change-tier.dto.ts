import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PermissionTier } from '@prisma/client';

/**
 * DTO for changing a user's permission tier.
 */
export class ChangeTierDto {
  @ApiProperty({
    description: 'New permission tier',
    enum: PermissionTier,
    example: 'verified_contributor',
  })
  @IsEnum(PermissionTier)
  tier!: PermissionTier;

  @ApiPropertyOptional({
    description: 'Reason for tier change',
    example: 'Verified agent license',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
