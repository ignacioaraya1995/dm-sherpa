import { Module } from '@nestjs/common';
import { RecommendationsController } from './recommendations.controller';
import { RecommendationsService } from './recommendations.service';
import { WhoRecommendationService } from './who-recommendation.service';
import { WhatRecommendationService } from './what-recommendation.service';
import { HowRecommendationService } from './how-recommendation.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RecommendationsController],
  providers: [
    RecommendationsService,
    WhoRecommendationService,
    WhatRecommendationService,
    HowRecommendationService,
  ],
  exports: [RecommendationsService],
})
export class RecommendationsModule {}
