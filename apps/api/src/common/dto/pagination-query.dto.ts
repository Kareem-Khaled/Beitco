import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

/**
 * Cursor-based pagination query parameters.
 * Reusable across all paginated endpoints.
 */
export class PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Cursor for pagination (pass the cursor from previous response)',
    example: 'abc123',
  })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({
    description: 'Number of items per page (default: 20, max: 50)',
    example: 20,
    minimum: 1,
    maximum: 50,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;
}
