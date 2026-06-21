import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class SendOtpDto {
  @ApiProperty({
    description: 'Egyptian phone number in E.164 format',
    example: '+201234567890',
  })
  @IsString()
  @Matches(/^\+20(1[0125]\d{8})$/, {
    message: 'Phone must be a valid Egyptian number in E.164 format (+20XXXXXXXXXX)',
  })
  phone!: string;
}
