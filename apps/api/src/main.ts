import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ResponseEnvelopeInterceptor } from './common/interceptors/response-envelope.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ─── Cookies (auth tokens) ─────────────────────────
  app.use(cookieParser());

  // ─── CORS ──────────────────────────────────────────
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') ?? ['http://localhost:8080', 'http://localhost:3000'],
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
  console.log(`🏠 Beitco API running on http://localhost:${port}`);
  console.log(`📚 Swagger docs at http://localhost:${port}/api/docs`);
}

bootstrap();
