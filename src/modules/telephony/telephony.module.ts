import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TelephonyController } from './telephony.controller';
import { TelephonyService } from './telephony.service';
import { PhoneHealthService } from './phone-health.service';
import { CallTrackingService } from './call-tracking.service';

@Module({
  imports: [ScheduleModule],
  controllers: [TelephonyController],
  providers: [TelephonyService, PhoneHealthService, CallTrackingService],
  exports: [TelephonyService, PhoneHealthService, CallTrackingService],
})
export class TelephonyModule {}
