import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '@/common/prisma/prisma.service';
import { TriggersService } from './triggers.service';
import { TriggerExecutionStatus, TriggerActionType } from '@prisma/client';

interface TriggerJobData {
  ruleId: string;
  eventType: string;
  eventData: Record<string, unknown>;
  eventTimestamp: string;
}

@Processor('triggers')
export class TriggerProcessor extends WorkerHost {
  private readonly logger = new Logger(TriggerProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly triggersService: TriggersService,
  ) {
    super();
  }

  async process(job: Job<TriggerJobData>) {
    const { ruleId, eventType, eventData, eventTimestamp } = job.data;

    this.logger.log(`Processing trigger rule ${ruleId} for event ${eventType}`);

    try {
      const rule = await this.prisma.triggerRule.findUnique({
        where: { id: ruleId },
      });

      if (!rule || !rule.isActive) {
        this.logger.warn(`Rule ${ruleId} not found or inactive`);
        return;
      }

      // Check cooldown
      if (rule.cooldownDays && eventData.propertyId) {
        const recentExecution = await this.prisma.triggerExecution.findFirst({
          where: {
            ruleId,
            status: TriggerExecutionStatus.EXECUTED,
            executedAt: {
              gte: new Date(Date.now() - rule.cooldownDays * 24 * 60 * 60 * 1000),
            },
            triggerEventData: {
              path: ['propertyId'],
              equals: eventData.propertyId,
            },
          },
        });

        if (recentExecution) {
          await this.triggersService.recordExecution(
            ruleId,
            eventType,
            { ...eventData, timestamp: eventTimestamp },
            TriggerExecutionStatus.SKIPPED,
            { data: { reason: 'cooldown' } },
          );
          return;
        }
      }

      // Execute action
      const result = await this.executeAction(
        rule.actionType,
        rule.actionConfig as Record<string, unknown>,
        eventData,
      );

      await this.triggersService.recordExecution(
        ruleId,
        eventType,
        { ...eventData, timestamp: eventTimestamp },
        TriggerExecutionStatus.EXECUTED,
        { data: result },
      );

      this.logger.log(`Successfully executed trigger rule ${ruleId}`);
    } catch (error) {
      this.logger.error(`Failed to execute trigger rule ${ruleId}`, error);

      await this.triggersService.recordExecution(
        ruleId,
        eventType,
        { ...eventData, timestamp: eventTimestamp },
        TriggerExecutionStatus.FAILED,
        { error: error instanceof Error ? error.message : 'Unknown error' },
      );
    }
  }

  private async executeAction(
    actionType: TriggerActionType,
    actionConfig: Record<string, unknown>,
    eventData: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    switch (actionType) {
      case TriggerActionType.ADD_TO_CAMPAIGN:
        return this.addToCampaign(actionConfig, eventData);

      case TriggerActionType.UPDATE_SEGMENT:
        return this.updateSegment(actionConfig, eventData);

      case TriggerActionType.SEND_WEBHOOK:
        return this.sendWebhook(actionConfig, eventData);

      case TriggerActionType.CREATE_TASK:
        return { taskCreated: true };

      default:
        return { message: 'Action not implemented' };
    }
  }

  private async addToCampaign(
    config: Record<string, unknown>,
    eventData: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const campaignId = config.campaignId as string;
    const propertyId = eventData.propertyId as string;

    if (!campaignId || !propertyId) {
      throw new Error('Missing campaignId or propertyId');
    }

    // This would add the property to the campaign's segment
    // For now, just log it
    this.logger.log(`Would add property ${propertyId} to campaign ${campaignId}`);

    return { campaignId, propertyId, added: true };
  }

  private async updateSegment(
    config: Record<string, unknown>,
    eventData: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const segmentId = config.segmentId as string;
    const propertyId = eventData.propertyId as string;

    if (!segmentId || !propertyId) {
      throw new Error('Missing segmentId or propertyId');
    }

    // Add property to segment
    await this.prisma.segmentMember.upsert({
      where: {
        segmentId_propertyId: { segmentId, propertyId },
      },
      update: {
        removedAt: null,
      },
      create: {
        segmentId,
        propertyId,
      },
    });

    return { segmentId, propertyId, added: true };
  }

  private async sendWebhook(
    config: Record<string, unknown>,
    eventData: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const url = config.url as string;

    if (!url) {
      throw new Error('Missing webhook URL');
    }

    // Would make HTTP call here
    this.logger.log(`Would send webhook to ${url}`);

    return { url, sent: true };
  }
}
