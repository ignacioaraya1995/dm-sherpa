import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CampaignsController } from './campaigns.controller';
import { CampaignsService } from './campaigns.service';
import { VariantsService } from './variants.service';
import { BatchesService } from './batches.service';
import { MailPieceService } from './mail-piece.service';
import { CampaignProcessor } from './campaign.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'campaigns',
    }),
    BullModule.registerQueue({
      name: 'mail-processing',
    }),
  ],
  controllers: [CampaignsController],
  providers: [
    CampaignsService,
    VariantsService,
    BatchesService,
    MailPieceService,
    CampaignProcessor,
  ],
  exports: [CampaignsService, VariantsService, BatchesService, MailPieceService],
})
export class CampaignsModule {}
