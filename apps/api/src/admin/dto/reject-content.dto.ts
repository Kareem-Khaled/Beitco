import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

/**
 * DTO for rejecting a post or comment with a reason.
 */
export class RejectContentDto {
  @ApiProperty({
    description: 'Reason for rejection',
    example: 'المحتوى لا يتوافق مع إرشادات المجتمع',
    minLength: 3,
    maxLength: 1000,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  reason!: string;
}
