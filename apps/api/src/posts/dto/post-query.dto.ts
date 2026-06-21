import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto';

const POST_TYPES = ['text', 'image', 'video', 'listing', 'poll', 'discussion', 'repost'] as const;
const POST_STATUSES = ['published', 'pending_approval', 'rejected', 'hidden'] as const;

export class PostQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by post type',
    enum: POST_TYPES,
  })
  @IsOptional()
  @IsEnum(POST_TYPES)
  postType?: (typeof POST_TYPES)[number];

  @ApiPropertyOptional({
    description: 'Filter by status (admin only)',
    enum: POST_STATUSES,
  })
  @IsOptional()
  @IsEnum(POST_STATUSES)
  status?: (typeof POST_STATUSES)[number];

  @ApiPropertyOptional({
    description: 'Filter by group ID',
  })
  @IsOptional()
  @IsUUID()
  groupId?: string;

  @ApiPropertyOptional({
    description: 'Filter by hashtag',
    example: 'عقارات',
  })
  @IsOptional()
  @IsString()
  hashtag?: string;
}
