import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

/**
 * DTO for rejecting content in moderation.
 */
export class ModerationRejectDto {
  @ApiProperty({
    description: 'Reason for rejection',
    example: 'Contains inappropriate language',
    minLength: 3,
    maxLength: 1000,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  reason!: string;
}
