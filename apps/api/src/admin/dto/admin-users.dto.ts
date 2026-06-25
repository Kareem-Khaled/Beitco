import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsNumber, IsOptional, IsString, Max, Min, MaxLength } from 'class-validator';

// ADMIN-2: user-management query + mutation DTOs.
export class AdminUsersQueryDto {
  @ApiPropertyOptional({ description: 'Search by name or phone' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ enum: ['renter', 'owner', 'both'] })
  @IsOptional()
  @IsIn(['renter', 'owner', 'both'])
  role?: string;

  @ApiPropertyOptional({ enum: ['active', 'banned', 'pending'] })
  @IsOptional()
  @IsIn(['active', 'banned', 'pending'])
  status?: string;

  @ApiPropertyOptional({ enum: ['true', 'false'] })
  @IsOptional()
  @IsIn(['true', 'false'])
  verified?: string;

  @ApiPropertyOptional({ enum: ['true', 'false'] })
  @IsOptional()
  @IsIn(['true', 'false'])
  admins?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 50, default: 25 })
  @IsOptional()
  @Transform(({ value }) => (value === '' || value == null ? undefined : Number(value)))
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

export class AdminUpdateUserDto {
  @ApiPropertyOptional({ enum: ['renter', 'owner', 'both'] })
  @IsOptional()
  @IsIn(['renter', 'owner', 'both'])
  role?: string;

  @ApiPropertyOptional({ description: 'Manually set verified state' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'boolean' ? value : value === 'true'))
  verified?: boolean;

  @ApiPropertyOptional({ description: 'Manual trust override (0–10)', minimum: 0, maximum: 10 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  trust?: number;

  @ApiPropertyOptional({ description: 'Reason (audited)' })
  @IsOptional()
  @IsString()
  @MaxLength(280)
  reason?: string;
}

export class BanUserDto {
  @ApiPropertyOptional({ description: 'Why the account is being suspended (shown to the user)' })
  @IsString()
  @MaxLength(280)
  reason!: string;
}

// ADMIN-12: audit-log query.
export class AdminAuditQueryDto {
  @ApiPropertyOptional({ description: 'Filter by admin id' })
  @IsOptional()
  @IsString()
  adminId?: string;

  @ApiPropertyOptional({ description: 'Filter by target type (user|listing|review|…)' })
  @IsOptional()
  @IsString()
  targetType?: string;

  @ApiPropertyOptional({ description: 'Filter by target id' })
  @IsOptional()
  @IsString()
  targetId?: string;

  @ApiPropertyOptional({ description: 'Filter by action substring (e.g. "ban")' })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 50 })
  @IsOptional()
  @Transform(({ value }) => (value === '' || value == null ? undefined : Number(value)))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
