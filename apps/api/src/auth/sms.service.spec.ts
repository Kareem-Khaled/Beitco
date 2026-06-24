import { ConfigService } from '@nestjs/config';
import { SmsService } from './sms.service';

function makeService(env: Record<string, string> = {}): SmsService {
  const config = { get: (k: string, d?: string) => env[k] ?? d } as unknown as ConfigService;
  return new SmsService(config);
}

describe('SmsService', () => {
  afterEach(() => jest.restoreAllMocks());

  it('defaults to the console provider (dev, not live)', async () => {
    const svc = makeService();
    expect(svc.isLiveProvider).toBe(false);
    const res = await svc.sendOtp('+201000000000', '123456');
    expect(res).toEqual({ delivered: true, provider: 'console' });
  });

  it('is a live provider when SMS_PROVIDER=http', () => {
    expect(makeService({ SMS_PROVIDER: 'http', SMS_HTTP_URL: 'https://x' }).isLiveProvider).toBe(true);
  });

  it('http provider POSTs to the gateway and reports delivered on 2xx', async () => {
    const fetchMock = jest
      .spyOn(global, 'fetch' as never)
      .mockResolvedValue({ ok: true, status: 200 } as never);
    const svc = makeService({ SMS_PROVIDER: 'http', SMS_HTTP_URL: 'https://gw.test/send', SMS_HTTP_TOKEN: 't' });
    const res = await svc.sendOtp('+201000000000', '999111');
    expect(res.delivered).toBe(true);
    expect(res.provider).toBe('http');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://gw.test/send',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('http provider reports NOT delivered on a gateway error', async () => {
    jest.spyOn(global, 'fetch' as never).mockResolvedValue({ ok: false, status: 502 } as never);
    const svc = makeService({ SMS_PROVIDER: 'http', SMS_HTTP_URL: 'https://gw.test/send' });
    const res = await svc.sendOtp('+201000000000', '999111');
    expect(res.delivered).toBe(false);
  });

  it('http provider fails safe when SMS_HTTP_URL is unset', async () => {
    const svc = makeService({ SMS_PROVIDER: 'http' });
    const res = await svc.sendOtp('+201000000000', '999111');
    expect(res.delivered).toBe(false);
  });
});
