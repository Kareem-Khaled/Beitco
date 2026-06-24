import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// PROD-2: SMS delivery behind a provider abstraction. The AuthService asks this
// service to send an OTP; HOW it's delivered depends on SMS_PROVIDER:
//   - 'console' (default): logs the code (dev). No real SMS.
//   - 'http': POSTs to a generic Egyptian SMS gateway (SMS_HTTP_*). The exact
//     vendor (Vodafone/SMSMisr/Twilio/...) is configured by env, not code.
// Adding a vendor = add a case here; the rest of the app is untouched.

export type SmsProvider = 'console' | 'http';

export interface SmsResult {
  delivered: boolean;
  provider: SmsProvider;
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly provider: SmsProvider;

  constructor(private readonly config: ConfigService) {
    const p = (this.config.get<string>('SMS_PROVIDER') ?? 'console').toLowerCase();
    this.provider = p === 'http' ? 'http' : 'console';
  }

  // True when a real gateway is wired (so the OTP code is never returned to the
  // client — it goes out by SMS instead).
  get isLiveProvider(): boolean {
    return this.provider === 'http';
  }

  async sendOtp(phone: string, code: string): Promise<SmsResult> {
    const text = `كود بيتكو: ${code}\nالكود صالح 5 دقائق. متديهوش لحد.`;
    return this.send(phone, text);
  }

  async send(phone: string, text: string): Promise<SmsResult> {
    if (this.provider === 'http') {
      const ok = await this.sendViaHttp(phone, text);
      return { delivered: ok, provider: 'http' };
    }
    // console provider: dev-only, no real delivery.
    this.logger.debug(`[sms:console] to ${phone}: ${text.replace(/\n/g, ' ')}`);
    return { delivered: true, provider: 'console' };
  }

  // Generic HTTP gateway: POST JSON to SMS_HTTP_URL with a bearer token.
  // The body shape is configurable enough for most Egyptian providers; tweak the
  // field names here when you pick one.
  private async sendViaHttp(phone: string, text: string): Promise<boolean> {
    const url = this.config.get<string>('SMS_HTTP_URL');
    if (!url) {
      this.logger.error('SMS_PROVIDER=http but SMS_HTTP_URL is unset; cannot send.');
      return false;
    }
    const token = this.config.get<string>('SMS_HTTP_TOKEN');
    const sender = this.config.get<string>('SMS_SENDER_ID', 'Beitco');
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ to: phone, from: sender, message: text }),
        // Don't let a slow gateway hang the request thread.
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) {
        this.logger.error(`SMS gateway ${res.status} for ${phone}`);
        return false;
      }
      return true;
    } catch (err) {
      this.logger.error(`SMS gateway error for ${phone}: ${String(err)}`);
      return false;
    }
  }
}
