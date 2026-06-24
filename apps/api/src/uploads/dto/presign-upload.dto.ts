import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Max, Min } from 'class-validator';

// Request a presigned upload URL for a single listing image.
export class PresignUploadDto {
  @ApiProperty({ example: 'image/jpeg', description: 'MIME type of the image' })
  @IsString()
  contentType!: string;

  @ApiProperty({ example: 1048576, description: 'File size in bytes' })
  @IsInt()
  @Min(1)
  @Max(10 * 1024 * 1024)
  contentLength!: number;
}
