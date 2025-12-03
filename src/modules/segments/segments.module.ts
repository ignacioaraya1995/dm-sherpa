import { Module } from '@nestjs/common';
import { SegmentsController } from './segments.controller';
import { SegmentsService } from './segments.service';
import { SegmentBuilderService } from './segment-builder.service';

@Module({
  controllers: [SegmentsController],
  providers: [SegmentsService, SegmentBuilderService],
  exports: [SegmentsService, SegmentBuilderService],
})
export class SegmentsModule {}
