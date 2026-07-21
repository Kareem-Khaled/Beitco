// SEC-1: centralized env validation. Runs once at boot via
// ConfigModule.forRoot({ validate }). The dev-only secret fallbacks live HERE
// and nowhere else  -  in production a missing/weak secret throws immediately so
// the app can never silently sign tokens with a publicly-known dev secret.

const DEV_JWT_SECRET = 'dev-jwt-secret';
const DEV_JWT_REFRESH_SECRET = 'dev-jwt-refresh-secret';

// Secrets that must never be used in production (the known dev defaults).
const WEAK_SECRETS = new Set([DEV_JWT_SECRET, DEV_JWT_REFRESH_SECRET, '', 'changeme', 'secret']);

export interface ValidatedEnv extends Record<string, unknown> {
  NODE_ENV: string;
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
}

export function validateEnv(config: Record<string, unknown>): ValidatedEnv {
  const nodeEnv = (config.NODE_ENV as string) ?? 'development';
  const isProd = nodeEnv === 'production';

  let jwtSecret = config.JWT_SECRET as string | undefined;
  let jwtRefreshSecret = config.JWT_REFRESH_SECRET as string | undefined;

  if (isProd) {
    // Fail fast: real secrets are mandatory and must not be the dev defaults.
    const problems: string[] = [];
    if (!jwtSecret || WEAK_SECRETS.has(jwtSecret)) problems.push('JWT_SECRET');
    if (!jwtRefreshSecret || WEAK_SECRETS.has(jwtRefreshSecret)) problems.push('JWT_REFRESH_SECRET');
    if (jwtSecret && jwtSecret.length < 32) problems.push('JWT_SECRET (too short, need >= 32 chars)');
    if (jwtRefreshSecret && jwtRefreshSecret.length < 32) {
      problems.push('JWT_REFRESH_SECRET (too short, need >= 32 chars)');
    }
    if (jwtSecret && jwtSecret === jwtRefreshSecret) {
      problems.push('JWT_SECRET must differ from JWT_REFRESH_SECRET');
    }
    if (problems.length > 0) {
      throw new Error(
        `[env] Production startup blocked  -  fix these secrets: ${problems.join(', ')}. ` +
          'Set strong, distinct values (>= 32 chars) in the environment.',
      );
    }
  } else {
    // Dev/test convenience: fill the known dev defaults so local runs need no setup.
    jwtSecret ??= DEV_JWT_SECRET;
    jwtRefreshSecret ??= DEV_JWT_REFRESH_SECRET;
  }

  return {
    ...config,
    NODE_ENV: nodeEnv,
    JWT_SECRET: jwtSecret!,
    JWT_REFRESH_SECRET: jwtRefreshSecret!,
  };
}
