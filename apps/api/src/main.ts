// OBS-2: Sentry must be the very first import so it can auto-instrument before
// any other module loads. No-op without SENTRY_DSN.
import './instrument';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ResponseEnvelopeInterceptor } from './common/interceptors/response-envelope.interceptor';

async function bootstrap() {
  // bufferLogs so early startup logs flush through pino once it's ready.
  // bodyParser:false — we register our own (below) with a larger limit so
  // listing payloads carrying downscaled base64 images (the dev fallback when
  // S3/R2 isn't configured) aren't rejected by the default 100kb cap.
  const app = await NestFactory.create(AppModule, { bufferLogs: true, bodyParser: false });
  app.useLogger(app.get(Logger));

  // ─── Security headers (SEC-2) ──────────────────────
  // HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, etc. The CSP
  // is relaxed only enough for Swagger UI's inline assets at /api/docs; the JSON
  // API itself doesn't render HTML, so this mainly hardens the docs surface.
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: [`'self'`],
          scriptSrc: [`'self'`, `'unsafe-inline'`],
          styleSrc: [`'self'`, `'unsafe-inline'`],
          imgSrc: [`'self'`, 'data:', 'https:'],
          connectSrc: [`'self'`],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );

  // ─── Cookies (auth tokens) ─────────────────────────
  app.use(cookieParser());

  // ─── Body parsing ──────────────────────────────────
  // 10mb: a listing can carry several downscaled (1600px/0.82q) base64 images
  // when object storage isn't configured. With S3/R2 on, bodies are just URLs,
  // so this headroom is only ever used by the zero-setup dev path.
  const BODY_LIMIT = process.env.BODY_LIMIT ?? '10mb';
  app.use(json({ limit: BODY_LIMIT }));
  app.use(urlencoded({ extended: true, limit: BODY_LIMIT }));

  // ─── CORS ──────────────────────────────────────────
  // Production: strict allowlist from CORS_ORIGINS (comma-separated) or a safe
  // default. Dev: also accept any localhost / 127.0.0.1 port so Vite port-hopping
  // (e.g. 8080 taken → 8081) never triggers a confusing "CORS error" that's
  // really just an unexpected origin.
  const isProd = process.env.NODE_ENV === 'production';
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',').map((o) => o.trim()) ?? [
      'http://localhost:8080',
      'http://localhost:3000',
      ...(isProd ? [] : [/^http:\/\/localhost:\d+$/, /^http:\/\/127\.0\.0\.1:\d+$/]),
    ],
    credentials: true,
  });

  // ─── API Prefix + Versioning ───────────────────────
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // ─── Global Exception Filter ──────────────────────
  app.useGlobalFilters(new AllExceptionsFilter());

  // ─── Global Response Envelope ─────────────────────
  app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());

  // ─── Global Validation Pipe ────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ─── Swagger Docs ─────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('Beitco API')
    .setDescription('Trust-first bed-level housing marketplace for Egypt')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // ─── Start ─────────────────────────────────────────
  const port = process.env.API_PORT ?? 3001;
  await app.listen(port);
  const logger = app.get(Logger);
  logger.log(`Beitco API running on http://localhost:${port}`);
  logger.log(`Swagger docs at http://localhost:${port}/api/docs`);
}

bootstrap();
