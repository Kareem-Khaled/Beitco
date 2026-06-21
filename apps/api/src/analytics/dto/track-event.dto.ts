import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/**
 * Event types tracked by the analytics system.
 */
export const ANALYTICS_EVENT_TYPES = [
  'post_view',
  'post_like',
  'post_share',
  'post_comment',
  'listing_view',
  'listing_save',
  'listing_inquiry',
  'profile_view',
  'search_query',
  'video_watch',
  'group_join',
  'app_open',
  'feed_scroll',
] as const;

export type AnalyticsEventType = (typeof ANALYTICS_EVENT_TYPES)[number];

/**
 * DTO for tracking an analytics event.
 */
export class TrackEventDto {
  @ApiProperty({
    description: 'Event type',
    enum: ANALYTICS_EVENT_TYPES,
    example: 'post_view',
  })
  @IsIn(ANALYTICS_EVENT_TYPES)
  eventType!: string;

  @ApiPropertyOptional({
    description: 'Target entity ID (post, listing, user, etc.)',
    example: 'a0000000-b000-4000-8000-c00000000001',
  })
  @IsOptional()
  @IsUUID()
  targetId?: string;

  @ApiPropertyOptional({
    description: 'Target entity type',
    example: 'post',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  targetType?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata',
    example: '{"source": "feed", "position": 3}',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  metadata?: string;
}
