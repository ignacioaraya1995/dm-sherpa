import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // API versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Validation pipe with transformation
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

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('DM Sherpa API')
    .setDescription(
      `Direct Mail Performance OS for Real Estate & Home Services.

## Overview
DM Sherpa provides end-to-end workflows for direct mail campaigns targeting distressed properties:
- Data & Trigger Engine for distressed property data
- Campaign & Narrative Designer for multi-touch flows
- Experiment Engine for A/B testing
- Telephony & Routing Health monitoring
- Dynamic Offer Engine
- Sales Enablement & Talk Tracks
- Dispo-Aware Targeting
- Seasonality & Cash Cycle planning
- Analytics & Diagnostics ("What Changed?")

## Authentication
Use Bearer token authentication for all endpoints.
      `,
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('accounts', 'Account management')
    .addTag('markets', 'Market and geographic data')
    .addTag('properties', 'Property and owner data')
    .addTag('segments', 'Audience segmentation')
    .addTag('campaigns', 'Campaign management')
    .addTag('experiments', 'A/B testing and experiments')
    .addTag('telephony', 'Phone numbers and routing')
    .addTag('offers', 'Dynamic offer strategies')
    .addTag('sales', 'Sales enablement and talk tracks')
    .addTag('deals', 'Deal tracking and attribution')
    .addTag('diagnostics', 'Analytics and diagnostics')
    .addTag('triggers', 'Automation triggers')
    .addTag('health', 'System health checks')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🏠 DM Sherpa - Direct Mail Performance OS                   ║
║                                                               ║
║   Server running on: http://localhost:${port}                    ║
║   API Documentation: http://localhost:${port}/docs               ║
║   GraphQL Playground: http://localhost:${port}/graphql           ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
  `);
}

bootstrap();
