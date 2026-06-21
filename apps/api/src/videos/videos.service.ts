import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateUploadUrlDto,
  MAX_DURATION,
} from './dto/create-upload-url.dto';
import { RecordWatchDto } from './dto/record-watch.dto';
import { randomUUID } from 'crypto';

/** Fields returned in video responses */
const VIDEO_SELECT = {
  id: true,
  uploaderId: true,
  listingId: true,
  muxAssetId: true,
  muxPlaybackId: true,
  muxUploadId: true,
  status: true,
  playbackUrl: true,
  thumbnailUrl: true,
  duration: true,
  aspectRatio: true,
  watchCount: true,
  totalWatchTime: true,
  metadata: true,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class VideosService {
  private readonly logger = new Logger(VideosService.name);
  private readonly isMuxConfigured: boolean;
  private muxClient: unknown = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    const tokenId = this.config.get<string>('MUX_TOKEN_ID');
    const tokenSecret = this.config.get<string>('MUX_TOKEN_SECRET');
    this.isMuxConfigured = !!(tokenId && tokenSecret);

    if (this.isMuxConfigured) {
      void this.initMuxClient(tokenId!, tokenSecret!);
    } else {
      this.logger.warn(
        'MUX_TOKEN_ID or MUX_TOKEN_SECRET not set — running in dev stub mode',
      );
    }
  }

  private async initMuxClient(
    tokenId: string,
    tokenSecret: string,
  ): Promise<void> {
    try {
      const MuxModule = await import('@mux/mux-node');
      const Mux = MuxModule.default;
      this.muxClient = new Mux({ tokenId, tokenSecret });
      this.logger.log('Mux client initialized');
    } catch (err) {
      this.logger.error('Failed to initialize Mux client', err);
    }
  }

  // ────────────────────────────────────────────────────
  // CREATE UPLOAD URL
  // ────────────────────────────────────────────────────

  async createUploadUrl(userId: string, dto: CreateUploadUrlDto) {
    const maxDuration = MAX_DURATION[dto.type];

    if (dto.duration > maxDuration) {
      throw new BadRequestException(
        `Duration exceeds maximum of ${maxDuration}s for type "${dto.type}"`,
      );
    }

    // If linking to a listing, verify it exists and belongs to user
    if (dto.listingId) {
      const listing = await this.prisma.listing.findUnique({
        where: { id: dto.listingId },
        select: { id: true, agentId: true, deletedAt: true },
      });
      if (!listing || listing.deletedAt) {
        throw new NotFoundException('Listing not found');
      }
      if (listing.agentId !== userId) {
        throw new ForbiddenException(
          'Only the listing owner can attach a video',
        );
      }
    }

    if (this.isMuxConfigured && this.muxClient) {
      return this.createMuxUpload(userId, dto, maxDuration);
    }

    return this.createDevStubUpload(userId, dto, maxDuration);
  }

  /** Real Mux direct upload */
  private async createMuxUpload(
    userId: string,
    dto: CreateUploadUrlDto,
    maxDuration: number,
  ) {
    const mux = this.muxClient as {
      video: {
        uploads: {
          create: (opts: Record<string, unknown>) => Promise<{
            id: string;
            url: string;
          }>;
        };
      };
    };

    const upload = await mux.video.uploads.create({
      new_asset_settings: {
        playback_policy: ['public'],
        max_resolution_tier: '1080p',
      },
      cors_origin: '*',
      timeout: 3600,
    });

    const video = await this.prisma.video.create({
      data: {
        uploaderId: userId,
        listingId: dto.listingId ?? null,
        muxUploadId: upload.id,
        status: 'uploading',
        duration: dto.duration,
        metadata: { type: dto.type, maxDuration },
      },
      select: VIDEO_SELECT,
    });

    return {
      videoId: video.id,
      uploadUrl: upload.url,
      maxDuration,
    };
  }

  /** Dev stub: creates video record with fake upload URL */
  private async createDevStubUpload(
    userId: string,
    dto: CreateUploadUrlDto,
    maxDuration: number,
  ) {
    const fakeUploadId = `dev-upload-${randomUUID()}`;

    const video = await this.prisma.video.create({
      data: {
        uploaderId: userId,
        listingId: dto.listingId ?? null,
        muxUploadId: fakeUploadId,
        status: 'uploading',
        duration: dto.duration,
        metadata: { type: dto.type, maxDuration, devMode: true },
      },
      select: VIDEO_SELECT,
    });

    return {
      videoId: video.id,
      uploadUrl: `https://storage.googleapis.com/mux-uploads/${fakeUploadId}`,
      maxDuration,
    };
  }

  // ────────────────────────────────────────────────────
  // GET STATUS
  // ────────────────────────────────────────────────────

  async getStatus(id: string) {
    const video = await this.prisma.video.findUnique({
      where: { id },
      select: VIDEO_SELECT,
    });

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    return {
      id: video.id,
      status: video.status,
      playbackUrl: video.playbackUrl,
      thumbnailUrl: video.thumbnailUrl,
      duration: video.duration,
      aspectRatio: video.aspectRatio,
    };
  }

  // ────────────────────────────────────────────────────
  // RECORD WATCH
  // ────────────────────────────────────────────────────

  async recordWatch(videoId: string, _userId: string, dto: RecordWatchDto) {
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
      select: { id: true, status: true },
    });

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    if (video.status !== 'ready') {
      throw new BadRequestException('Video is not ready for playback');
    }

    // Atomic increment: watchCount + totalWatchTime
    await this.prisma.video.update({
      where: { id: videoId },
      data: {
        watchCount: { increment: 1 },
        totalWatchTime: { increment: dto.watchedSeconds },
      },
    });
  }

  // ────────────────────────────────────────────────────
  // MUX WEBHOOK
  // ────────────────────────────────────────────────────

  async handleWebhook(payload: Record<string, unknown>) {
    const eventType = payload.type as string | undefined;
    const data = payload.data as Record<string, unknown> | undefined;

    if (!eventType || !data) {
      this.logger.warn('Invalid webhook payload');
      return;
    }

    this.logger.log(`Mux webhook: ${eventType}`);

    switch (eventType) {
      case 'video.upload.asset_created': {
        const uploadId = data.id as string;
        const assetId = data.asset_id as string | undefined;

        if (uploadId && assetId) {
          await this.prisma.video.updateMany({
            where: { muxUploadId: uploadId },
            data: {
              muxAssetId: assetId,
              status: 'processing',
            },
          });
        }
        break;
      }

      case 'video.asset.ready': {
        const assetId = data.id as string;
        const playbackIds = data.playback_ids as
          | Array<{ id: string; policy: string }>
          | undefined;
        const tracks = data.tracks as
          | Array<{ type: string; max_width?: number; max_height?: number }>
          | undefined;
        const durationRaw = data.duration as number | undefined;

        const playbackId = playbackIds?.[0]?.id;
        const videoTrack = tracks?.find((t) => t.type === 'video');
        const aspectRatio =
          videoTrack?.max_width && videoTrack?.max_height
            ? `${videoTrack.max_width}:${videoTrack.max_height}`
            : '16:9';

        await this.prisma.video.updateMany({
          where: { muxAssetId: assetId },
          data: {
            status: 'ready',
            muxPlaybackId: playbackId ?? null,
            playbackUrl: playbackId
              ? `https://stream.mux.com/${playbackId}.m3u8`
              : null,
            thumbnailUrl: playbackId
              ? `https://image.mux.com/${playbackId}/thumbnail.jpg`
              : null,
            duration: durationRaw ? Math.round(durationRaw) : null,
            aspectRatio,
          },
        });
        break;
      }

      case 'video.asset.errored': {
        const assetId = data.id as string;
        await this.prisma.video.updateMany({
          where: { muxAssetId: assetId },
          data: { status: 'error' },
        });
        break;
      }

      default:
        this.logger.debug(`Unhandled Mux event: ${eventType}`);
    }
  }

  // ────────────────────────────────────────────────────
  // DEV: SIMULATE READY (for testing without Mux)
  // ────────────────────────────────────────────────────

  async devSimulateReady(videoId: string) {
    if (this.isMuxConfigured) {
      throw new BadRequestException(
        'Dev simulation not available when Mux is configured',
      );
    }

    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
      select: { id: true, status: true, muxUploadId: true },
    });

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    const fakePlaybackId = `dev-playback-${randomUUID().slice(0, 8)}`;

    return this.prisma.video.update({
      where: { id: videoId },
      data: {
        status: 'ready',
        muxAssetId: `dev-asset-${randomUUID().slice(0, 8)}`,
        muxPlaybackId: fakePlaybackId,
        playbackUrl: `https://stream.mux.com/${fakePlaybackId}.m3u8`,
        thumbnailUrl: `https://image.mux.com/${fakePlaybackId}/thumbnail.jpg`,
        aspectRatio: '9:16',
      },
      select: VIDEO_SELECT,
    });
  }

  // ────────────────────────────────────────────────────
  // FIND BY ID (full detail)
  // ────────────────────────────────────────────────────

  async findById(id: string) {
    const video = await this.prisma.video.findUnique({
      where: { id },
      select: {
        ...VIDEO_SELECT,
        uploader: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    return video;
  }
}
