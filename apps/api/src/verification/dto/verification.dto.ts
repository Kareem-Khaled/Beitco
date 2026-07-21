import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

// PROD-5: submit identity (+ ownership) docs for KYC review. The doc URLs come
// from the presigned-upload flow (PROD-1)  -  we store URLs, not blobs.
export class SubmitVerificationDto {
  @ApiProperty({ description: 'URL of the national ID image' })
  @IsString()
  idDocUrl!: string;

  @ApiProperty({ description: 'URL of the selfie image' })
  @IsString()
  selfieUrl!: string;

  @ApiPropertyOptional({ description: 'URL of the ownership proof (owners only)' })
  @IsOptional()
  @IsString()
  ownershipDocUrl?: string;
}

export class RejectVerificationDto {
  @ApiProperty()
  @IsString()
  @MaxLength(500)
  reason!: string;
}
