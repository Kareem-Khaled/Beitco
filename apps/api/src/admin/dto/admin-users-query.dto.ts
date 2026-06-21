import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { PermissionTier, UserRole } from '@prisma/client';

/**
 * Query parameters for admin user listing.
 */
export class AdminUsersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by permission tier',
    enum: PermissionTier,
    example: 'new_user',
  })
  @IsOptional()
  @IsEnum(PermissionTier)
  tier?: PermissionTier;

  @ApiPropertyOptional({
    description: 'Filter by role',
    enum: UserRole,
    example: 'agent',
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({
    description: 'Search by name, phone, or email',
    example: 'kareem',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
