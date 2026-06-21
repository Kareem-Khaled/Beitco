import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/**
 * DTO for creating a new conversation.
 */
export class CreateConversationDto {
  @ApiProperty({
    description: 'UUID of the recipient user',
    example: 'a0000000-b000-4000-8000-c00000000001',
  })
  @IsUUID()
  recipientId!: string;

  @ApiPropertyOptional({
    description: 'UUID of the listing this conversation is about (optional)',
    example: 'a0000000-b000-4000-8000-c00000000002',
  })
  @IsOptional()
  @IsUUID()
  listingId?: string;

  @ApiProperty({
    description: 'Initial message content',
    example: 'مرحبا، هل الشقة لسة متاحة؟',
    maxLength: 2000,
  })
  @IsString()
  @MaxLength(2000)
  message!: string;
}
