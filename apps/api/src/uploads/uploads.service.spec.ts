import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { UploadsService } from './uploads.service';

// Build an UploadsService with a fake ConfigService. When `withS3` is true we
// supply credentials so the service self-configures (it constructs a real
// S3Client, but we never call AWS  -  presign only signs a URL locally).
function makeService(withS3: boolean): UploadsService {
  const env: Record<string, string> = withS3
    ? {
        AWS_REGION: 'me-south-1',
        AWS_ACCESS_KEY_ID: 'test-key',
        AWS_SECRET_ACCESS_KEY: 'test-secret',
        S3_BUCKET_NAME: 'beitco-test',
        S3_PUBLIC_URL: 'https://cdn.test',
      }
    : {};
  const config = {
    get: (k: string, d?: string) => env[k] ?? d,
  } as unknown as ConfigService;
  return new UploadsService(config);
}

describe('UploadsService', () => {
  it('reports not-configured and short-circuits presign when S3 is unset', async () => {
    const svc = makeService(false);
    expect(svc.isConfigured).toBe(false);
    await expect(svc.presign('u1', 'image/jpeg', 1000)).resolves.toEqual({ configured: false });
  });

  it('reports configured when S3 env is present', () => {
    expect(makeService(true).isConfigured).toBe(true);
  });

  it('issues a presigned PUT + public URL for a valid image', async () => {
    const svc = makeService(true);
    const res = await svc.presign('u1', 'image/jpeg', 1_000_000);
    expect(res.configured).toBe(true);
    expect(res.uploadUrl).toMatch(/^https?:\/\//);
    expect(res.publicUrl).toMatch(/^https:\/\/cdn\.test\/listings\/u1\//);
    expect(res.key).toMatch(/^listings\/u1\/.*\.jpeg$/);
    expect(res.headers).toEqual({ 'Content-Type': 'image/jpeg' });
  });

  it('rejects an unsupported content type', async () => {
    const svc = makeService(true);
    await expect(svc.presign('u1', 'application/pdf', 1000)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects an oversized file (> 10 MB)', async () => {
    const svc = makeService(true);
    await expect(svc.presign('u1', 'image/png', 11 * 1024 * 1024)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
