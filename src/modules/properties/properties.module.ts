import { Module } from '@nestjs/common';
import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';
import { DistressService } from './distress.service';

@Module({
  controllers: [PropertiesController],
  providers: [PropertiesService, DistressService],
  exports: [PropertiesService, DistressService],
})
export class PropertiesModule {}
