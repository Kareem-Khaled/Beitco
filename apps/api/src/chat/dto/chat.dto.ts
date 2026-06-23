import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

// Renter starts (or re-opens) a thread about a listing.
export class CreateThreadDto {
  @ApiProperty()
  @IsString()
  propertyId!: string;
}

// Send a message into a thread.
export class SendMessageDto {
  @ApiProperty()
  @IsString()
  @MaxLength(4000)
  body!: string;

  @ApiPropertyOptional({ enum: ['text', 'viewing_request'], default: 'text' })
  @IsOptional()
  @IsIn(['text', 'viewing_request'])
  type?: 'text' | 'viewing_request';
}
