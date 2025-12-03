import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '@/common/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CampaignStatus, BatchStatus, MailStatus } from '@prisma/client';

interface LaunchJobData {
  campaignId: string;
  immediate: boolean;
}

interface GenerateBatchJobData {
  batchId: string;
}

@Processor('campaigns')
export class CampaignProcessor extends WorkerHost {
  private readonly logger = new Logger(CampaignProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    super();
  }

  async process(job: Job<LaunchJobData | GenerateBatchJobData>) {
    this.logger.log(`Processing job ${job.name} with id ${job.id}`);

    switch (job.name) {
      case 'launch':
        return this.handleLaunch(job as Job<LaunchJobData>);
      default:
        this.logger.warn(`Unknown job type: ${job.name}`);
    }
  }

  private async handleLaunch(job: Job<LaunchJobData>) {
    const { campaignId } = job.data;

    try {
      // Update campaign status to active
      await this.prisma.campaign.update({
        where: { id: campaignId },
        data: { status: CampaignStatus.ACTIVE },
      });

      // Get campaign with segments
      const campaign = await this.prisma.campaign.findUnique({
        where: { id: campaignId },
        include: {
          segments: {
            include: {
              segment: {
                include: {
                  members: {
                    where: { removedAt: null },
                    select: { propertyId: true },
                  },
                },
              },
            },
          },
          variants: { where: { isActive: true } },
          batches: { where: { status: BatchStatus.PENDING } },
        },
      });

      if (!campaign) {
        throw new Error(`Campaign ${campaignId} not found`);
      }

      // Get all property IDs from segments
      const propertyIds = new Set<string>();
      for (const cs of campaign.segments) {
        for (const member of cs.segment.members) {
          propertyIds.add(member.propertyId);
        }
      }

      this.logger.log(
        `Campaign ${campaignId}: Found ${propertyIds.size} properties from ${campaign.segments.length} segments`,
      );

      // If there are pending batches, process them
      // Otherwise create initial batch
      if (campaign.batches.length === 0) {
        // Create initial batch with all properties
        await this.createInitialBatch(campaignId, [...propertyIds], campaign.variants);
      }

      this.eventEmitter.emit('campaign.activated', { campaignId });

      return { success: true, propertyCount: propertyIds.size };
    } catch (error) {
      this.logger.error(`Failed to launch campaign ${campaignId}`, error);
      throw error;
    }
  }

  private async createInitialBatch(
    campaignId: string,
    propertyIds: string[],
    variants: Array<{ id: string; allocationPercent: Prisma.Decimal }>,
  ) {
    const batch = await this.prisma.batch.create({
      data: {
        campaignId,
        batchNumber: 1,
        name: 'Initial Batch',
        targetQuantity: propertyIds.length,
        status: BatchStatus.PENDING,
      },
    });

    // Calculate allocation per variant
    const totalPercent = variants.reduce(
      (sum, v) => sum + Number(v.allocationPercent),
      0,
    );

    const variantAllocations = variants.map((v) => ({
      batchId: batch.id,
      variantId: v.id,
      quantity: Math.round(
        (Number(v.allocationPercent) / totalPercent) * propertyIds.length,
      ),
    }));

    await this.prisma.batchVariant.createMany({
      data: variantAllocations,
    });

    this.logger.log(
      `Created initial batch ${batch.id} with ${propertyIds.length} properties`,
    );

    return batch;
  }
}

// Import Prisma types
import { Prisma } from '@prisma/client';
