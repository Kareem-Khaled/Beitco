// OBS-2: Sentry instrumentation. MUST be imported before anything else in
// main.ts so Sentry can auto-instrument http/express/etc. No-op when SENTRY_DSN
// is unset (local/dev), so it never interferes with running without a DSN.
import * as Sentry from '@sentry/node';

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    // Conservative defaults; tune per traffic. 0 disables perf tracing.
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0),
    // Don't ship local secrets/PII by default.
    sendDefaultPii: false,
  });
}

export const sentryEnabled = Boolean(dsn);
