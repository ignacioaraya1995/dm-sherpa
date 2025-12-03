import { Module } from '@nestjs/common';
import { ExperimentsController } from './experiments.controller';
import { ExperimentsService } from './experiments.service';
import { SampleSizeCalculator } from './sample-size-calculator.service';

@Module({
  controllers: [ExperimentsController],
  providers: [ExperimentsService, SampleSizeCalculator],
  exports: [ExperimentsService, SampleSizeCalculator],
})
export class ExperimentsModule {}
