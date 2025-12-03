import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TriggersController } from './triggers.controller';
import { TriggersService } from './triggers.service';
import { TriggerProcessor } from './trigger.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'triggers',
    }),
  ],
  controllers: [TriggersController],
  providers: [TriggersService, TriggerProcessor],
  exports: [TriggersService],
})
export class TriggersModule {}
