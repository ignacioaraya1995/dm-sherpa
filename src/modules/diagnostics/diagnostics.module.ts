import { Module } from '@nestjs/common';
import { DiagnosticsController } from './diagnostics.controller';
import { DiagnosticsService } from './diagnostics.service';
import { HypothesisGeneratorService } from './hypothesis-generator.service';

@Module({
  controllers: [DiagnosticsController],
  providers: [DiagnosticsService, HypothesisGeneratorService],
  exports: [DiagnosticsService],
})
export class DiagnosticsModule {}
