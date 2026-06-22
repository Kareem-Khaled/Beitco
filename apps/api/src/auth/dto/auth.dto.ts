import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

// Egyptian mobile numbers: +201XXXXXXXXX or 01XXXXXXXXX.
const EG_PHONE = /^(\+20|0)1[0125]\d{8}$/;

export class SendOtpDto {
  @ApiProperty({ example: '+201001234567' })
  @IsString()
  @Matches(EG_PHONE, { message: 'اكتب رقم موبايل مصري صح (01XXXXXXXXX).' })
  phone!: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: '+201001234567' })
  @IsString()
  @Matches(EG_PHONE, { message: 'اكتب رقم موبايل مصري صح (01XXXXXXXXX).' })
  phone!: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Matches(/^\d{4,6}$/, { message: 'الكود غلط.' })
  code!: string;
}

export class CompleteProfileDto {
  @ApiProperty({ example: 'أحمد سمير' })
  @IsString()
  name!: string;

  @ApiProperty({ enum: ['renter', 'owner', 'both'] })
  @IsString()
  @Matches(/^(renter|owner|both)$/)
  role!: 'renter' | 'owner' | 'both';

  @ApiProperty({ enum: ['male', 'female'], required: false })
  @IsString()
  @Matches(/^(male|female)$/)
  gender!: 'male' | 'female';
}
