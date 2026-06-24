import { randomUUID } from 'crypto';
import type { Params } from 'nestjs-pino';
import type { IncomingMessage, ServerResponse } from 'http';

// OBS-1: structured logging config. JSON in production (ingestible by any log
// platform), pretty-printed in dev. Every request gets a correlation id
// (honours an inbound `x-request-id`, else generates one) echoed back on the
// response, and sensitive fields (cookies, auth headers, tokens) are redacted.
export function loggerConfig(): Params {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    pinoHttp: {
      level: process.env.LOG_LEVEL ?? (isProd ? 'info' : 'debug'),
      // Pretty transport in dev only; raw JSON in prod.
      transport: isProd
        ? undefined
        : {
            target: 'pino-pretty',
            options: { singleLine: true, translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname' },
          },
      // Correlation id per request, surfaced on the response header.
      genReqId: (req: IncomingMessage, res: ServerResponse) => {
        const existing = (req.headers['x-request-id'] as string) || randomUUID();
        res.setHeader('x-request-id', existing);
        return existing;
      },
      // Never log secrets / auth material.
      redact: {
        paths: [
          'req.headers.cookie',
          'req.headers.authorization',
          'res.headers["set-cookie"]',
          'req.body.password',
          'req.body.code',
          'req.body.token',
          '*.password',
          '*.accessToken',
          '*.refreshToken',
        ],
        censor: '[redacted]',
      },
      // Trim request/response objects to the useful bits.
      serializers: {
        req(req: { method: string; url: string; id: string }) {
          return { id: req.id, method: req.method, url: req.url };
        },
        res(res: { statusCode: number }) {
          return { statusCode: res.statusCode };
        },
      },
      // Health checks are noisy; drop them to debug level.
      customLogLevel: (_req, res, err) => {
        if (err || res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        if (_req.url?.startsWith('/api/v1/health')) return 'silent';
        return 'info';
      },
    },
  };
}
