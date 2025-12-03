import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '@/common/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  CreateCampaignDto,
  UpdateCampaignDto,
  CampaignStatsDto,
  LaunchCampaignDto,
} from './dto/campaign.dto';
import { PaginationDto, PaginatedResponseDto } from '@/common/dto/pagination.dto';
import { Prisma, CampaignStatus, DealStatus } from '@prisma/client';

@Injectable()
export class CampaignsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    @InjectQueue('campaigns') private readonly campaignQueue: Queue,
  ) {}

  async create(dto: CreateCampaignDto) {
    // Validate account exists
    const account = await this.prisma.account.findUnique({
      where: { id: dto.accountId },
    });
    if (!account) {
      throw new NotFoundException(`Account ${dto.accountId} not found`);
    }

    // Validate segments exist
    if (dto.segmentIds && dto.segmentIds.length > 0) {
      const segments = await this.prisma.segment.findMany({
        where: { id: { in: dto.segmentIds } },
      });
      if (segments.length !== dto.segmentIds.length) {
        throw new BadRequestException('One or more segments not found');
      }
    }

    const campaign = await this.prisma.campaign.create({
      data: {
        name: dto.name,
        description: dto.description,
        accountId: dto.accountId,
        createdById: dto.createdById,
        type: dto.type,
        goal: dto.goal,
        totalBudget: dto.totalBudget,
        startDate: dto.startDate,
        endDate: dto.endDate,
        isMultiTouch: dto.isMultiTouch ?? true,
        touchCount: dto.touchCount ?? 3,
        segments: dto.segmentIds
          ? {
              create: dto.segmentIds.map((segmentId) => ({
                segmentId,
              })),
            }
          : undefined,
        steps: dto.steps
          ? {
              create: dto.steps.map((step) => ({
                stepNumber: step.stepNumber,
                name: step.name,
                daysSincePrevious: step.daysSincePrevious ?? 21,
                designTemplateId: step.designTemplateId,
                offerStrategyId: step.offerStrategyId,
              })),
            }
          : undefined,
      },
      include: {
        segments: { include: { segment: true } },
        steps: true,
        variants: true,
      },
    });

    // Create default steps if none provided and multi-touch
    if (campaign.isMultiTouch && (!dto.steps || dto.steps.length === 0)) {
      await this.createDefaultSteps(campaign.id, campaign.touchCount);
    }

    this.eventEmitter.emit('campaign.created', { campaign });

    return this.findOne(campaign.id);
  }

  async findAll(
    accountId: string,
    pagination: PaginationDto,
    filters?: { status?: CampaignStatus; type?: string },
  ) {
    const where: Prisma.CampaignWhereInput = { accountId };

    if (filters?.status) where.status = filters.status;
    if (filters?.type) where.type = filters.type as Prisma.EnumCampaignTypeFilter;

    const [campaigns, total] = await Promise.all([
      this.prisma.campaign.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { [pagination.sortBy || 'createdAt']: pagination.sortOrder },
        include: {
          segments: { include: { segment: { select: { id: true, name: true } } } },
          _count: { select: { variants: true, batches: true } },
        },
      }),
      this.prisma.campaign.count({ where }),
    ]);

    return new PaginatedResponseDto(campaigns, total, pagination);
  }

  async findOne(id: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      include: {
        account: { select: { id: true, name: true, type: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        segments: {
          include: {
            segment: { select: { id: true, name: true, memberCount: true } },
          },
        },
        steps: {
          orderBy: { stepNumber: 'asc' },
          include: {
            designTemplate: { select: { id: true, name: true, format: true } },
            offerStrategy: { select: { id: true, name: true } },
          },
        },
        variants: {
          where: { isActive: true },
          orderBy: { createdAt: 'asc' },
        },
        batches: {
          orderBy: { batchNumber: 'asc' },
        },
        _count: {
          select: { variants: true, batches: true },
        },
      },
    });

    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }

    return campaign;
  }

  async update(id: string, dto: UpdateCampaignDto) {
    const campaign = await this.findOne(id);

    // Validate status transitions
    if (dto.status && dto.status !== campaign.status) {
      this.validateStatusTransition(campaign.status, dto.status);
    }

    return this.prisma.campaign.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        type: dto.type,
        goal: dto.goal,
        status: dto.status,
        totalBudget: dto.totalBudget,
        startDate: dto.startDate,
        endDate: dto.endDate,
        isMultiTouch: dto.isMultiTouch,
        touchCount: dto.touchCount,
      },
      include: {
        segments: { include: { segment: true } },
        steps: true,
        variants: true,
      },
    });
  }

  async delete(id: string) {
    const campaign = await this.findOne(id);

    if (campaign.status === CampaignStatus.ACTIVE) {
      throw new ConflictException('Cannot delete an active campaign');
    }

    return this.prisma.campaign.delete({ where: { id } });
  }

  async launch(id: string, dto?: LaunchCampaignDto) {
    const campaign = await this.findOne(id);

    if (campaign.status !== CampaignStatus.DRAFT) {
      throw new BadRequestException(
        `Campaign must be in DRAFT status to launch. Current: ${campaign.status}`,
      );
    }

    // Validate campaign has required components
    if (!campaign.variants || campaign.variants.length === 0) {
      throw new BadRequestException('Campaign must have at least one variant');
    }

    if (!campaign.segments || campaign.segments.length === 0) {
      throw new BadRequestException('Campaign must have at least one segment');
    }

    const launchDate = dto?.startDate || campaign.startDate || new Date();

    await this.prisma.campaign.update({
      where: { id },
      data: {
        status: dto?.immediate ? CampaignStatus.ACTIVE : CampaignStatus.SCHEDULED,
        launchedAt: new Date(),
        startDate: launchDate,
      },
    });

    // Queue the campaign for processing
    await this.campaignQueue.add(
      'launch',
      {
        campaignId: id,
        immediate: dto?.immediate || false,
      },
      {
        delay: dto?.immediate ? 0 : launchDate.getTime() - Date.now(),
      },
    );

    this.eventEmitter.emit('campaign.launched', { campaignId: id });

    return this.findOne(id);
  }

  async pause(id: string) {
    const campaign = await this.findOne(id);

    if (campaign.status !== CampaignStatus.ACTIVE) {
      throw new BadRequestException('Only active campaigns can be paused');
    }

    await this.prisma.campaign.update({
      where: { id },
      data: { status: CampaignStatus.PAUSED },
    });

    this.eventEmitter.emit('campaign.paused', { campaignId: id });

    return this.findOne(id);
  }

  async resume(id: string) {
    const campaign = await this.findOne(id);

    if (campaign.status !== CampaignStatus.PAUSED) {
      throw new BadRequestException('Only paused campaigns can be resumed');
    }

    await this.prisma.campaign.update({
      where: { id },
      data: { status: CampaignStatus.ACTIVE },
    });

    this.eventEmitter.emit('campaign.resumed', { campaignId: id });

    return this.findOne(id);
  }

  async complete(id: string) {
    const campaign = await this.findOne(id);

    if (![CampaignStatus.ACTIVE, CampaignStatus.PAUSED].includes(campaign.status)) {
      throw new BadRequestException('Campaign must be active or paused to complete');
    }

    await this.prisma.campaign.update({
      where: { id },
      data: {
        status: CampaignStatus.COMPLETED,
        completedAt: new Date(),
      },
    });

    this.eventEmitter.emit('campaign.completed', { campaignId: id });

    return this.findOne(id);
  }

  async getStats(id: string): Promise<CampaignStatsDto> {
    const campaign = await this.findOne(id);

    // Get variant stats
    const variants = await this.prisma.variant.findMany({
      where: { campaignId: id },
      select: {
        id: true,
        name: true,
        piecesMailed: true,
        piecesDelivered: true,
        calls: true,
        qualifiedCalls: true,
        contracts: true,
        grossProfit: true,
        stepId: true,
      },
    });

    // Get step stats
    const steps = await this.prisma.campaignStep.findMany({
      where: { campaignId: id },
      select: { id: true, stepNumber: true },
    });

    // Calculate aggregates
    const totalMailed = variants.reduce((sum, v) => sum + v.piecesMailed, 0);
    const totalDelivered = variants.reduce((sum, v) => sum + v.piecesDelivered, 0);
    const totalCalls = variants.reduce((sum, v) => sum + v.calls, 0);
    const qualifiedLeads = variants.reduce((sum, v) => sum + v.qualifiedCalls, 0);
    const contracts = variants.reduce((sum, v) => sum + v.contracts, 0);
    const grossProfit = variants.reduce((sum, v) => sum + Number(v.grossProfit), 0);

    const totalCost = Number(campaign.spentBudget);

    return {
      totalMailed,
      totalDelivered,
      deliveryRate: totalMailed > 0 ? totalDelivered / totalMailed : 0,
      totalCalls,
      responseRate: totalDelivered > 0 ? totalCalls / totalDelivered : 0,
      qualifiedLeads,
      qualificationRate: totalCalls > 0 ? qualifiedLeads / totalCalls : 0,
      contracts,
      contractRate: totalDelivered > 0 ? contracts / totalDelivered : 0,
      grossProfit,
      costPerLead: totalCalls > 0 ? totalCost / totalCalls : 0,
      costPerContract: contracts > 0 ? totalCost / contracts : 0,
      roi: totalCost > 0 ? (grossProfit - totalCost) / totalCost : 0,
      byStep: steps.map((step) => {
        const stepVariants = variants.filter((v) => v.stepId === step.id);
        return {
          stepNumber: step.stepNumber,
          mailed: stepVariants.reduce((sum, v) => sum + v.piecesMailed, 0),
          delivered: stepVariants.reduce((sum, v) => sum + v.piecesDelivered, 0),
          calls: stepVariants.reduce((sum, v) => sum + v.calls, 0),
          contracts: stepVariants.reduce((sum, v) => sum + v.contracts, 0),
        };
      }),
      byVariant: variants.map((v) => ({
        variantId: v.id,
        variantName: v.name,
        mailed: v.piecesMailed,
        responseRate: v.piecesDelivered > 0 ? v.calls / v.piecesDelivered : 0,
        contractRate: v.piecesDelivered > 0 ? v.contracts / v.piecesDelivered : 0,
        profitPerPiece: v.piecesMailed > 0 ? Number(v.grossProfit) / v.piecesMailed : 0,
      })),
    };
  }

  async addSegment(campaignId: string, segmentId: string) {
    await this.findOne(campaignId);

    return this.prisma.campaignSegment.create({
      data: { campaignId, segmentId },
      include: { segment: true },
    });
  }

  async removeSegment(campaignId: string, segmentId: string) {
    await this.prisma.campaignSegment.delete({
      where: {
        campaignId_segmentId: { campaignId, segmentId },
      },
    });
  }

  async updateMetrics(id: string) {
    const variants = await this.prisma.variant.findMany({
      where: { campaignId: id },
    });

    const totalMailed = variants.reduce((sum, v) => sum + v.piecesMailed, 0);
    const totalDelivered = variants.reduce((sum, v) => sum + v.piecesDelivered, 0);
    const totalCalls = variants.reduce((sum, v) => sum + v.calls, 0);
    const totalQualifiedLeads = variants.reduce((sum, v) => sum + v.qualifiedCalls, 0);
    const totalContracts = variants.reduce((sum, v) => sum + v.contracts, 0);
    const grossProfit = variants.reduce((sum, v) => sum + Number(v.grossProfit), 0);

    await this.prisma.campaign.update({
      where: { id },
      data: {
        totalMailed,
        totalDelivered,
        totalCalls,
        totalQualifiedLeads,
        totalContracts,
        responseRate: totalDelivered > 0 ? totalCalls / totalDelivered : null,
        contractRate: totalDelivered > 0 ? totalContracts / totalDelivered : null,
        grossProfit,
        roi:
          Number(grossProfit) > 0
            ? (Number(grossProfit) - Number(this.prisma.campaign)) /
              Number(this.prisma.campaign)
            : null,
      },
    });
  }

  private async createDefaultSteps(campaignId: string, touchCount: number) {
    const defaultIntervals = [0, 21, 21, 28, 35]; // Days between touches
    const steps = [];

    for (let i = 1; i <= touchCount; i++) {
      steps.push({
        campaignId,
        stepNumber: i,
        name: `Touch ${i}`,
        daysSincePrevious: defaultIntervals[i] || 21,
      });
    }

    await this.prisma.campaignStep.createMany({ data: steps });
  }

  private validateStatusTransition(from: CampaignStatus, to: CampaignStatus) {
    const allowedTransitions: Record<CampaignStatus, CampaignStatus[]> = {
      [CampaignStatus.DRAFT]: [CampaignStatus.SCHEDULED, CampaignStatus.CANCELLED],
      [CampaignStatus.SCHEDULED]: [
        CampaignStatus.ACTIVE,
        CampaignStatus.CANCELLED,
        CampaignStatus.DRAFT,
      ],
      [CampaignStatus.ACTIVE]: [
        CampaignStatus.PAUSED,
        CampaignStatus.COMPLETED,
        CampaignStatus.CANCELLED,
      ],
      [CampaignStatus.PAUSED]: [
        CampaignStatus.ACTIVE,
        CampaignStatus.COMPLETED,
        CampaignStatus.CANCELLED,
      ],
      [CampaignStatus.COMPLETED]: [],
      [CampaignStatus.CANCELLED]: [],
    };

    if (!allowedTransitions[from].includes(to)) {
      throw new BadRequestException(
        `Invalid status transition from ${from} to ${to}`,
      );
    }
  }
}
