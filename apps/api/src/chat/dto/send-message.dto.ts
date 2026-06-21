import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, IsIn } from 'class-validator';

/**
 * DTO for sending a message in a conversation.
 */
export class SendMessageDto {
  @ApiProperty({
    description: 'Message content',
    example: 'شكرا للرد! الميعاد ده مناسب.',
    maxLength: 2000,
  })
  @IsString()
  @MaxLength(2000)
  content!: string;

  @ApiPropertyOptional({
    description: 'Message type',
    example: 'text',
    enum: ['text', 'image', 'listing', 'location'],
  })
  @IsOptional()
  @IsIn(['text', 'image', 'listing', 'location'])
  messageType?: string = 'text';
}
