import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsJSON,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

const POST_TYPES = ['text', 'image', 'video', 'listing', 'poll', 'discussion', 'repost'] as const;

export class CreatePostDto {
  @ApiProperty({
    description: 'Type of post',
    enum: POST_TYPES,
    example: 'text',
  })
  @IsEnum(POST_TYPES, { message: 'postType must be one of: text, image, video, listing, poll, discussion, repost' })
  postType!: (typeof POST_TYPES)[number];

  @ApiPropertyOptional({
    description: 'Post text content',
    example: 'أفضل أحياء القاهرة الجديدة للسكن العائلي',
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  contentText?: string;

  @ApiPropertyOptional({
    description: 'Media items array as JSON string — [{type, url, width, height, order}]',
    example: '[{"type":"image","url":"https://example.com/img.jpg","width":1080,"height":1080,"order":0}]',
  })
  @IsOptional()
  @IsJSON()
  media?: string;

  @ApiPropertyOptional({
    description: 'Linked listing ID (for listing-type posts)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  listingId?: string;

  @ApiPropertyOptional({
    description: 'Linked video ID (for video-type posts)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  videoId?: string;

  @ApiPropertyOptional({
    description: 'Group ID (if posting in a group)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  groupId?: string;

  @ApiPropertyOptional({
    description: 'ID of post being reposted',
  })
  @IsOptional()
  @IsUUID()
  repostOfId?: string;

  @ApiPropertyOptional({
    description: 'Hashtags — auto-extracted from contentText if not provided',
    example: ['عقارات', 'القاهرة_الجديدة'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hashtags?: string[];

  @ApiPropertyOptional({
    description: 'Additional metadata as JSON (location, poll options, mentions)',
    example: '{"location":{"lat":30.04,"lng":31.23}}',
  })
  @IsOptional()
  @IsJSON()
  metadata?: string;
}
