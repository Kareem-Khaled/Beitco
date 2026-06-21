import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsJSON,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdatePostDto {
  @ApiPropertyOptional({
    description: 'Updated post text content',
    example: 'Updated: أفضل أحياء القاهرة الجديدة',
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  contentText?: string;

  @ApiPropertyOptional({
    description: 'Updated media items array as JSON',
  })
  @IsOptional()
  @IsJSON()
  media?: string;

  @ApiPropertyOptional({
    description: 'Updated hashtags',
    example: ['عقارات', 'تحديث'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hashtags?: string[];

  @ApiPropertyOptional({
    description: 'Updated metadata as JSON',
  })
  @IsOptional()
  @IsJSON()
  metadata?: string;
}
