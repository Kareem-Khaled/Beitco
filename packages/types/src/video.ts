import type { VideoStatus } from './enums';

export interface VideoSummary {
  id: string;
  muxPlaybackId: string | null;
  playbackUrl: string | null;
  thumbnailUrl: string | null;
  status: VideoStatus;
  duration: number | null;
  aspectRatio: string | null;
  watchCount: number;
  createdAt: string;
}

export interface VideoDetail extends VideoSummary {
  uploaderId: string;
  listingId: string | null;
  totalWatchTime: number;
  metadata: Record<string, unknown>;
}
