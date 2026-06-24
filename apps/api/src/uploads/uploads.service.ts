import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

// PROD-1: presigned direct-to-storage uploads (S3 / R2). The browser PUTs the
// file straight to object storage using a short-lived signed URL, then stores
// the returned public URL on the listing (no more base64 blobs in Postgres).
// Config-gated: when S3 isn't configured, `presign` reports `configured:false`
// and the frontend falls back to its existing (downscaled base64) path, so dev
// and the mock keep working with zero setup.

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const URL_TTL_SECONDS = 300; // 5 min to complete the PUT

export interface PresignResult {
  configured: boolean;
  uploadUrl?: string; // PUT here
  publicUrl?: string; // store this on the listing
  key?: string;
  headers?: Record<string, string>; // required PUT headers (Content-Type)
  expiresIn?: number;
}

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
  private client: S3Client | null = null;
  private bucket = '';
  private publicBaseUrl = '';

  constructor(private readonly config: ConfigService) {
    const region = this.config.get<string>('AWS_REGION');
    const accessKeyId = this.config.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.config.get<string>('AWS_SECRET_ACCESS_KEY');
    this.bucket = this.config.get<string>('S3_BUCKET_NAME', '');
    // Optional: S3-compatible endpoint (Cloudflare R2 / MinIO) + public CDN base.
    const endpoint = this.config.get<string>('S3_ENDPOINT');
    this.publicBaseUrl = (this.config.get<string>('S3_PUBLIC_URL') ?? '').replace(/\/$/, '');

    if (region && accessKeyId && secretAccessKey && this.bucket) {
      this.client = new S3Client({
        region,
        credentials: { accessKeyId, secretAccessKey },
        ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
      });
      this.logger.log(`Uploads configured (bucket: ${this.bucket}${endpoint ? ', custom endpoint' : ''})`);
    }
  }

  get isConfigured(): boolean {
    return this.client !== null;
  }

  // Issue a presigned PUT URL for one image owned by `userId`.
  async presign(
    userId: string,
    contentType: string,
    contentLength: number,
  ): Promise<PresignResult> {
    if (!this.isConfigured) return { configured: false };

    if (!ALLOWED_TYPES.has(contentType)) {
      throw new BadRequestException({
        code: 'UNSUPPORTED_TYPE',
        message: 'نوع الصورة ده مش مدعوم. استخدم JPG أو PNG أو WebP.',
      });
    }
    if (!Number.isFinite(contentLength) || contentLength <= 0 || contentLength > MAX_BYTES) {
      throw new BadRequestException({
        code: 'FILE_TOO_LARGE',
        message: 'الصورة كبيرة أوي. الحد الأقصى 10 ميجا.',
      });
    }

    const ext = contentType.split('/')[1] ?? 'jpg';
    const key = `listings/${userId}/${Date.now()}-${randomUUID()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
      ContentLength: contentLength,
    });
    const uploadUrl = await getSignedUrl(this.client!, command, { expiresIn: URL_TTL_SECONDS });

    // Public URL: an explicit CDN base if set, else the S3 virtual-hosted URL.
    const publicUrl = this.publicBaseUrl
      ? `${this.publicBaseUrl}/${key}`
      : `https://${this.bucket}.s3.${this.config.get('AWS_REGION')}.amazonaws.com/${key}`;

    return {
      configured: true,
      uploadUrl,
      publicUrl,
      key,
      headers: { 'Content-Type': contentType },
      expiresIn: URL_TTL_SECONDS,
    };
  }
}
