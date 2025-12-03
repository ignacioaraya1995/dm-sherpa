import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PaginationDto, PaginatedResponseDto } from '@/common/dto/pagination.dto';
import {
  DealStatus,
  DealType,
  DispoType,
  AttributionType,
  Prisma,
  ConversionType,
} from '@prisma/client';

export interface CreateDealDto {
  accountId: string;
  createdById: string;
  propertyId: string;
  type: DealType;
  contractPrice: number;
  mailedOffer?: number;
  negotiatedPrice?: number;
  arvAtContract?: number;
  assignmentFee?: number;
  rehabBudget?: number;
  contractDate?: Date;
  attributedCampaignId?: string;
  attributedVariantId?: string;
  callId?: string;
}

export interface DealAttributionDto {
  dealId: string;
  attributedCampaignId?: string;
  attributedVariantId?: string;
  attributionType: AttributionType;
  attributionWindow: number;
}

@Injectable()
export class DealsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateDealDto) {
    const deal = await this.prisma.deal.create({
      data: {
        accountId: dto.accountId,
        createdById: dto.createdById,
        propertyId: dto.propertyId,
        type: dto.type,
        contractPrice: dto.contractPrice,
        mailedOffer: dto.mailedOffer,
        negotiatedPrice: dto.negotiatedPrice,
        arvAtContract: dto.arvAtContract,
        assignmentFee: dto.assignmentFee,
        rehabBudget: dto.rehabBudget,
        contractDate: dto.contractDate || new Date(),
        attributedCampaignId: dto.attributedCampaignId,
        attributedVariantId: dto.attributedVariantId,
        status: DealStatus.PENDING,
      },
      include: {
        property: true,
        createdBy: { select: { name: true } },
      },
    });

    // Create conversion event if linked to a call
    if (dto.callId) {
      await this.prisma.conversionEvent.create({
        data: {
          callId: dto.callId,
          dealId: deal.id,
          type: ConversionType.CONTRACT_SIGNED,
        },
      });
    }

    // Update variant metrics
    if (dto.attributedVariantId) {
      await this.prisma.variant.update({
        where: { id: dto.attributedVariantId },
        data: { contracts: { increment: 1 } },
      });
    }

    this.eventEmitter.emit('deal.created', { deal });

    return deal;
  }

  async findAll(
    accountId: string,
    pagination: PaginationDto,
    filters?: {
      status?: DealStatus;
      type?: DealType;
      startDate?: Date;
      endDate?: Date;
    },
  ) {
    const where: Prisma.DealWhereInput = { accountId };

    if (filters?.status) where.status = filters.status;
    if (filters?.type) where.type = filters.type;
    if (filters?.startDate || filters?.endDate) {
      where.contractDate = {};
      if (filters?.startDate) where.contractDate.gte = filters.startDate;
      if (filters?.endDate) where.contractDate.lte = filters.endDate;
    }

    const [deals, total] = await Promise.all([
      this.prisma.deal.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { contractDate: 'desc' },
        include: {
          property: {
            select: { streetAddress: true, city: true, state: true, avmValue: true },
          },
          createdBy: { select: { name: true } },
        },
      }),
      this.prisma.deal.count({ where }),
    ]);

    return new PaginatedResponseDto(deals, total, pagination);
  }

  async findOne(id: string) {
    const deal = await this.prisma.deal.findUnique({
      where: { id },
      include: {
        account: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        property: {
          include: {
            owner: true,
            distressFlags: { where: { isActive: true } },
          },
        },
        conversion: {
          include: {
            call: {
              include: {
                mailPiece: {
                  select: {
                    id: true,
                    variant: { select: { id: true, name: true } },
                    batch: { select: { id: true, campaign: { select: { name: true } } } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!deal) {
      throw new NotFoundException(`Deal ${id} not found`);
    }

    return deal;
  }

  async updateStatus(id: string, status: DealStatus, metadata?: {
    salePrice?: number;
    closeDate?: Date;
    cashReceivedDate?: Date;
    dispoType?: DispoType;
    buyerId?: string;
  }) {
    const deal = await this.findOne(id);

    const updates: Prisma.DealUpdateInput = { status };

    if (metadata?.salePrice) updates.salePrice = metadata.salePrice;
    if (metadata?.closeDate) updates.closeDate = metadata.closeDate;
    if (metadata?.cashReceivedDate) updates.cashReceivedDate = metadata.cashReceivedDate;
    if (metadata?.dispoType) updates.dispoType = metadata.dispoType;
    if (metadata?.buyerId) updates.buyerId = metadata.buyerId;

    // Calculate profit on close
    if (status === DealStatus.CLOSED && metadata?.salePrice) {
      const grossProfit = metadata.salePrice - Number(deal.contractPrice);
      const netProfit = grossProfit - Number(deal.rehabBudget || 0);
      updates.grossProfit = grossProfit;
      updates.netProfit = netProfit;

      // Calculate days to close
      if (deal.contractDate) {
        updates.daysToClose = Math.ceil(
          ((metadata.closeDate || new Date()).getTime() - deal.contractDate.getTime()) /
            (1000 * 60 * 60 * 24),
        );
      }

      // Update variant gross profit
      if (deal.attributedVariantId) {
        await this.prisma.variant.update({
          where: { id: deal.attributedVariantId },
          data: { grossProfit: { increment: grossProfit } },
        });
      }
    }

    const updatedDeal = await this.prisma.deal.update({
      where: { id },
      data: updates,
    });

    this.eventEmitter.emit('deal.status.changed', { deal: updatedDeal, previousStatus: deal.status });

    return updatedDeal;
  }

  async attributeDeal(dto: DealAttributionDto) {
    const deal = await this.findOne(dto.dealId);

    // Calculate attribution window
    let attributionWindow = dto.attributionWindow;
    if (!attributionWindow && deal.contractDate) {
      // Find the mail piece and calculate days
      const mailPiece = await this.prisma.mailPiece.findFirst({
        where: {
          variantId: dto.attributedVariantId,
          propertyId: deal.propertyId,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (mailPiece) {
        attributionWindow = Math.ceil(
          (deal.contractDate.getTime() - mailPiece.createdAt.getTime()) /
            (1000 * 60 * 60 * 24),
        );
      }
    }

    return this.prisma.deal.update({
      where: { id: dto.dealId },
      data: {
        attributedCampaignId: dto.attributedCampaignId,
        attributedVariantId: dto.attributedVariantId,
        attributionType: dto.attributionType,
      },
    });
  }

  async getDealStats(accountId: string, periodDays: number = 90) {
    const since = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

    const [
      totalDeals,
      closedDeals,
      byStatus,
      byType,
      financials,
    ] = await Promise.all([
      this.prisma.deal.count({ where: { accountId, contractDate: { gte: since } } }),

      this.prisma.deal.count({
        where: { accountId, status: DealStatus.CLOSED, closeDate: { gte: since } },
      }),

      this.prisma.deal.groupBy({
        by: ['status'],
        where: { accountId, contractDate: { gte: since } },
        _count: true,
      }),

      this.prisma.deal.groupBy({
        by: ['type'],
        where: { accountId, contractDate: { gte: since } },
        _count: true,
        _sum: { grossProfit: true },
      }),

      this.prisma.deal.aggregate({
        where: { accountId, status: DealStatus.CLOSED, closeDate: { gte: since } },
        _sum: { grossProfit: true, netProfit: true },
        _avg: { grossProfit: true, daysToClose: true },
      }),
    ]);

    return {
      period: { days: periodDays, since },
      totalDeals,
      closedDeals,
      closeRate: totalDeals > 0 ? closedDeals / totalDeals : 0,
      byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count])),
      byType: byType.map((t) => ({
        type: t.type,
        count: t._count,
        totalProfit: Number(t._sum.grossProfit) || 0,
      })),
      financials: {
        totalGrossProfit: Number(financials._sum.grossProfit) || 0,
        totalNetProfit: Number(financials._sum.netProfit) || 0,
        avgGrossProfit: Number(financials._avg.grossProfit) || 0,
        avgDaysToClose: financials._avg.daysToClose || 0,
      },
    };
  }

  async getPipelineValue(accountId: string) {
    const pipeline = await this.prisma.deal.groupBy({
      by: ['status'],
      where: {
        accountId,
        status: { in: [DealStatus.PENDING, DealStatus.UNDER_CONTRACT, DealStatus.DUE_DILIGENCE] },
      },
      _count: true,
      _sum: { contractPrice: true },
    });

    return pipeline.map((p) => ({
      status: p.status,
      count: p._count,
      totalValue: Number(p._sum.contractPrice) || 0,
    }));
  }
}
