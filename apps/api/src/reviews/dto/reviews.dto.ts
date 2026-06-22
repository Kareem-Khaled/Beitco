import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsObject, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

// Resident -> property review (T-1/T-2). Gated by a 30+ day tenancy.
export class CreateReviewDto {
  @ApiProperty({ minimum: 1, maximum: 10 })
  @IsInt()
  @Min(1)
  @Max(10)
  rating!: number;

  @ApiProperty()
  @IsString()
  @MaxLength(2000)
  body!: string;

  @ApiPropertyOptional({ description: '{ internet, safety, noise, maintenance, cleanliness } (1-10)' })
  @IsOptional()
  @IsObject()
  scores?: Record<string, number>;
}

export class ReplyReviewDto {
  @ApiProperty()
  @IsString()
  @MaxLength(1000)
  body!: string;
}

// Owner -> renter review (two-sided trust, T-4). Gated by a confirmed tenancy.
export class CreateRenterReviewDto {
  @ApiProperty({ minimum: 1, maximum: 10 })
  @IsInt()
  @Min(1)
  @Max(10)
  rating!: number;

  @ApiProperty()
  @IsString()
  @MaxLength(2000)
  body!: string;

  @ApiProperty({ description: '{ reliability, cleanliness, communication } (1-10)' })
  @IsObject()
  scores!: Record<string, number>;
}
