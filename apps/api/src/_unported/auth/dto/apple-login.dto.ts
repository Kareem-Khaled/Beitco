import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AppleLoginDto {
  @ApiProperty({
    description: 'Apple identity token from Sign in with Apple',
    example: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  identityToken!: string;

  @ApiProperty({
    description: 'Apple authorization code',
    example: 'c1234567890abcdef',
  })
  @IsString()
  authorizationCode!: string;
}
