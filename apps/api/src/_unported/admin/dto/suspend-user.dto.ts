import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

/**
 * DTO for suspending a user.
 */
export class SuspendUserDto {
  @ApiProperty({
    description: 'Reason for suspension',
    example: 'Repeated violation of community guidelines',
    minLength: 3,
    maxLength: 1000,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  reason!: string;
}
