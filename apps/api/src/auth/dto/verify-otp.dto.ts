import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({
    description: 'Egyptian phone number in E.164 format',
    example: '+201234567890',
  })
  @IsString()
  @Matches(/^\+20(1[0125]\d{8})$/, {
    message: 'Phone must be a valid Egyptian number in E.164 format (+20XXXXXXXXXX)',
  })
  phone!: string;

  @ApiProperty({
    description: '6-digit OTP code',
    example: '123456',
  })
  @IsString()
  @Length(6, 6, { message: 'OTP code must be exactly 6 digits' })
  @Matches(/^\d{6}$/, { message: 'OTP code must be numeric' })
  code!: string;
}
