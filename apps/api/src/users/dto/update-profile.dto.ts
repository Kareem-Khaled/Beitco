import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsJSON,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: 'Arabic display name',
    example: 'أحمد محمد',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  nameAr?: string;

  @ApiPropertyOptional({
    description: 'English display name',
    example: 'Ahmed Mohamed',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  nameEn?: string;

  @ApiPropertyOptional({
    description: 'Unique username (3-30 chars, lowercase alphanumeric + underscores)',
    example: 'ahmed_realtor',
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-z0-9_]+$/, {
    message: 'Username must contain only lowercase letters, numbers, and underscores',
  })
  username?: string;

  @ApiPropertyOptional({
    description: 'User bio / about text',
    example: 'وسيط عقاري معتمد في القاهرة الجديدة',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiPropertyOptional({
    description: 'Email address',
    example: 'ahmed@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Avatar image URL',
    example: 'https://storage.beitco.app/avatars/user-123.jpg',
  })
  @IsOptional()
  @IsUrl()
  avatarUrl?: string;

  @ApiPropertyOptional({
    description: 'Cover photo URL',
    example: 'https://storage.beitco.app/covers/user-123.jpg',
  })
  @IsOptional()
  @IsUrl()
  coverPhotoUrl?: string;

  @ApiPropertyOptional({
    description: 'User preferences as JSON',
    example: '{"language": "ar", "notifications": {"email": true}}',
  })
  @IsOptional()
  @IsJSON()
  preferences?: string;
}
