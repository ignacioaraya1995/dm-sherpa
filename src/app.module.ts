import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bullmq';

// Core modules
import { PrismaModule } from './common/prisma/prisma.module';
import { HealthModule } from './common/health/health.module';

// Feature modules - Core Direct Mail Platform
import { AccountsModule } from './modules/accounts/accounts.module';
import { MarketsModule } from './modules/markets/markets.module';
import { PropertiesModule } from './modules/properties/properties.module';
import { SegmentsModule } from './modules/segments/segments.module';
import { CampaignsModule } from './modules/campaigns/campaigns.module';
import { OffersModule } from './modules/offers/offers.module';
import { RecommendationsModule } from './modules/recommendations/recommendations.module';

// Configuration
import configuration from './config/configuration';
import { validate } from './config/env.validation';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate,
      envFilePath: ['.env.local', '.env'],
    }),

    // Event emitter for domain events
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      maxListeners: 20,
      verboseMemoryLeak: true,
    }),

    // Scheduled tasks
    ScheduleModule.forRoot(),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // Background job processing
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || undefined,
      },
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 1000,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    }),

    // Core
    PrismaModule,
    HealthModule,

    // Features - Direct Mail Management & Recommendations
    AccountsModule,      // Account & user management
    MarketsModule,       // Geographic targeting
    PropertiesModule,    // Property & owner data
    SegmentsModule,      // Audience segmentation (WHO)
    CampaignsModule,     // Campaign orchestration (HOW)
    OffersModule,        // Offer strategies (WHAT)
    RecommendationsModule, // AI-powered recommendations
  ],
})
export class AppModule {}
