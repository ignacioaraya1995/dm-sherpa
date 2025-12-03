import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { CashCycleService } from './cash-cycle.service';

@Module({
  controllers: [AnalyticsController],
  providers: [AnalyticsService, CashCycleService],
  exports: [AnalyticsService, CashCycleService],
})
export class AnalyticsModule {}
