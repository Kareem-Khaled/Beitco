// OBS-2: client-side Sentry init. Browser-only (SSR-safe) and a no-op without
// VITE_SENTRY_DSN, so dev/preview runs need no setup. Call initSentry() once at
// app start; report errors via reportError() (also bridges the Lovable hook).
import * as Sentry from "@sentry/react";

const DSN = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_SENTRY_DSN;

let enabled = false;

export function initSentry(): void {
  if (typeof window === "undefined" || !DSN || enabled) return;
  Sentry.init({
    dsn: DSN,
    environment:
      (import.meta as unknown as { env?: Record<string, string> }).env?.MODE ?? "production",
    tracesSampleRate: 0,
    sendDefaultPii: false,
  });
  enabled = true;
}

// Report an error to BOTH Sentry (when enabled) and the Lovable host hook, so
// the existing in-platform reporting keeps working alongside Sentry.
export function reportError(error: unknown, context: Record<string, unknown> = {}): void {
  if (typeof window === "undefined") return;
  if (enabled) {
    Sentry.withScope((scope) => {
      scope.setContext("app", { route: window.location.pathname, ...context });
      Sentry.captureException(error);
    });
  }
  // Keep the Lovable bridge (no-op if the host isn't present).
  window.__lovableEvents?.captureException?.(
    error,
    { source: "react_error_boundary", route: window.location.pathname, ...context },
    { mechanism: "react_error_boundary", handled: false, severity: "error" },
  );
}
