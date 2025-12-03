import { Module } from '@nestjs/common';
import { SalesController } from './sales.controller';
import { TalkTracksService } from './talk-tracks.service';

@Module({
  controllers: [SalesController],
  providers: [TalkTracksService],
  exports: [TalkTracksService],
})
export class SalesModule {}
