import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * DTO for moderating text content directly (testing / manual trigger).
 */
export class ModerateContentDto {
  @ApiPropertyOptional({
    description: 'Text content to moderate',
    example: 'This is a test post about real estate',
    maxLength: 5000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  text?: string;

  @ApiPropertyOptional({
    description: 'JSON array of media URLs to moderate',
    example: '["https://example.com/img1.jpg"]',
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  mediaUrls?: string;
}
