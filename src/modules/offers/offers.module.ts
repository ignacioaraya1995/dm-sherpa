import { Module } from '@nestjs/common';
import { OffersController } from './offers.controller';
import { OffersService } from './offers.service';
import { OfferCalculatorService } from './offer-calculator.service';

@Module({
  controllers: [OffersController],
  providers: [OffersService, OfferCalculatorService],
  exports: [OffersService, OfferCalculatorService],
})
export class OffersModule {}
