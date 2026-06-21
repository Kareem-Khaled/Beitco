import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class CommentQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['newest', 'most_liked'],
    default: 'newest',
  })
  @IsOptional()
  @IsString()
  @IsIn(['newest', 'most_liked'])
  sort?: 'newest' | 'most_liked' = 'newest';
}
