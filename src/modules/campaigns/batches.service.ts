import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '@/common/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BatchStatus, CampaignStatus } from '@prisma/client';

export interface CreateBatchDto {
  campaignId: string;
  batchNumber?: number;
  name?: string;
  scheduledDate?: Date;
  targetQuantity: number;
  variantAllocations?: Array<{ variantId: string; quantity: number }>;
}

export interface BatchResponseDto {
  id: string;
  campaignId: string;
  batchNumber: number;
  name?: string;
  status: BatchStatus;
  scheduledDate?: Date;
  sentDate?: Date;
  targetQuantity: number;
  actualQuantity: number;
  totalDelivered: number;
  totalCalls: number;
  totalContracts: number;
  printJobId?: string;
  printStatus?: string;
  isSynthetic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class BatchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    @InjectQueue('mail-processing') private readonly mailQueue: Queue,
  ) {}

  async create(dto: CreateBatchDto) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: dto.campaignId },
      include: { variants: { where: { isActive: true } } },
    });

    if (!campaign) {
      throw new NotFoundException(`Campaign ${dto.campaignId} not found`);
    }

    // Get next batch number if not provided
    let batchNumber = dto.batchNumber;
    if (!batchNumber) {
      const lastBatch = await this.prisma.batch.findFirst({
        where: { campaignId: dto.campaignId },
        orderBy: { batchNumber: 'desc' },
      });
      batchNumber = (lastBatch?.batchNumber || 0) + 1;
    }

    const batch = await this.prisma.batch.create({
      data: {
        campaignId: dto.campaignId,
        batchNumber,
        name: dto.name,
        scheduledDate: dto.scheduledDate,
        targetQuantity: dto.targetQuantity,
      },
    });

    // Create variant allocations
    if (dto.variantAllocations) {
      await this.prisma.batchVariant.createMany({
        data: dto.variantAllocations.map((va) => ({
          batchId: batch.id,
          variantId: va.variantId,
          quantity: va.quantity,
        })),
      });
    } else {
      // Distribute based on variant allocation percentages
      const totalPercent = campaign.variants.reduce(
        (sum, v) => sum + Number(v.allocationPercent),
        0,
      );

      await this.prisma.batchVariant.createMany({
        data: campaign.variants.map((v) => ({
          batchId: batch.id,
          variantId: v.id,
          quantity: Math.round(
            (Number(v.allocationPercent) / totalPercent) * dto.targetQuantity,
          ),
        })),
      });
    }

    return this.findOne(batch.id);
  }

  async findAll(campaignId: string) {
    return this.prisma.batch.findMany({
      where: { campaignId },
      include: {
        variants: {
          include: {
            variant: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { batchNumber: 'asc' },
    });
  }

  async findOne(id: string) {
    const batch = await this.prisma.batch.findUnique({
      where: { id },
      include: {
        campaign: { select: { id: true, name: true, status: true } },
        variants: {
          include: {
            variant: {
              select: {
                id: true,
                name: true,
                designVersion: { select: { id: true, template: { select: { format: true } } } },
              },
            },
          },
        },
        _count: { select: { mailPieces: true } },
      },
    });

    if (!batch) {
      throw new NotFoundException(`Batch with ID ${id} not found`);
    }

    return batch;
  }

  async schedule(id: string, scheduledDate: Date) {
    const batch = await this.findOne(id);

    if (batch.status !== BatchStatus.PENDING) {
      throw new BadRequestException('Can only schedule pending batches');
    }

    return this.prisma.batch.update({
      where: { id },
      data: {
        scheduledDate,
        status: BatchStatus.SCHEDULED,
      },
    });
  }

  async send(id: string) {
    const batch = await this.findOne(id);

    if (![BatchStatus.PENDING, BatchStatus.SCHEDULED].includes(batch.status)) {
      throw new BadRequestException('Batch already sent or in progress');
    }

    // Update status to printing
    await this.prisma.batch.update({
      where: { id },
      data: {
        status: BatchStatus.PRINTING,
        sentDate: new Date(),
      },
    });

    // Queue mail piece generation
    await this.mailQueue.add(
      'generate-batch',
      { batchId: id },
      { priority: 1 },
    );

    this.eventEmitter.emit('batch.sent', { batchId: id });

    return this.findOne(id);
  }

  async updateStatus(id: string, status: BatchStatus, metadata?: { printJobId?: string; printStatus?: string }) {
    await this.findOne(id);

    return this.prisma.batch.update({
      where: { id },
      data: {
        status,
        ...metadata,
      },
    });
  }

  async updateMetrics(id: string) {
    const batch = await this.findOne(id);

    // Aggregate from mail pieces
    const stats = await this.prisma.mailPiece.aggregate({
      where: { batchId: id },
      _count: true,
    });

    const delivered = await this.prisma.mailPiece.count({
      where: { batchId: id, status: 'DELIVERED' },
    });

    const calls = await this.prisma.callEvent.count({
      where: { mailPiece: { batchId: id } },
    });

    const contracts = await this.prisma.deal.count({
      where: {
        attributedVariantId: { in: batch.variants.map((v) => v.variantId) },
      },
    });

    await this.prisma.batch.update({
      where: { id },
      data: {
        actualQuantity: stats._count,
        totalDelivered: delivered,
        totalCalls: calls,
        totalContracts: contracts,
      },
    });
  }

  async cancel(id: string) {
    const batch = await this.findOne(id);

    if ([BatchStatus.MAILED, BatchStatus.DELIVERED, BatchStatus.COMPLETED].includes(batch.status)) {
      throw new BadRequestException('Cannot cancel a batch that has been mailed');
    }

    return this.prisma.batch.update({
      where: { id },
      data: { status: BatchStatus.PENDING },
    });
  }

  async delete(id: string) {
    const batch = await this.findOne(id);

    if (batch.status !== BatchStatus.PENDING) {
      throw new BadRequestException('Can only delete pending batches');
    }

    // Delete variant allocations first
    await this.prisma.batchVariant.deleteMany({
      where: { batchId: id },
    });

    return this.prisma.batch.delete({ where: { id } });
  }
}
