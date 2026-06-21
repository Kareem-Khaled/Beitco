import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

const GROUP_TYPES = ['neighborhood', 'topic', 'compound', 'custom'] as const;

export class GroupQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Search by group name' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: GROUP_TYPES })
  @IsOptional()
  @IsEnum(GROUP_TYPES)
  type?: (typeof GROUP_TYPES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;
}

export class MemberQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ['admin', 'moderator', 'member'] })
  @IsOptional()
  @IsIn(['admin', 'moderator', 'member'])
  role?: string;
}

export class UpdateMemberDto {
  @ApiPropertyOptional({ enum: ['moderator', 'member'] })
  @IsOptional()
  @IsIn(['moderator', 'member'])
  role?: string;

  @ApiPropertyOptional({ enum: ['active', 'banned'] })
  @IsOptional()
  @IsIn(['active', 'banned'])
  status?: string;
}
