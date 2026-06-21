import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({
    description: 'Comment text content',
    example: 'تعليق رائع!',
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  content!: string;

  @ApiPropertyOptional({
    description: 'Parent comment ID for nested replies',
    example: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  parentCommentId?: string;
}
