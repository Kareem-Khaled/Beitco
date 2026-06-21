import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export enum VideoUploadType {
  REEL = 'reel',
  TOUR = 'tour',
  TIP = 'tip',
}

/** Max duration in seconds per upload type */
export const MAX_DURATION: Record<VideoUploadType, number> = {
  [VideoUploadType.REEL]: 180, // 3 min
  [VideoUploadType.TOUR]: 600, // 10 min
  [VideoUploadType.TIP]: 600, // 10 min
};

export class CreateUploadUrlDto {
  /** Estimated video duration in seconds */
  @IsInt()
  @Min(1)
  @Max(600)
  duration!: number;

  @IsEnum(VideoUploadType)
  type!: VideoUploadType;

  /** Optional listing to attach the video to */
  @IsOptional()
  @IsUUID()
  listingId?: string;
}
