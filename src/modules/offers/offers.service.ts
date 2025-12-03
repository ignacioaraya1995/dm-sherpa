import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { OfferCalculatorService, OfferInput, OfferResult } from './offer-calculator.service';
import { PaginationDto, PaginatedResponseDto } from '@/common/dto/pagination.dto';
import { PriceBand, DistressType, Prisma } from '@prisma/client';

export interface CreateOfferStrategyDto {
  accountId: string;
  name: string;
  description?: string;
  baseOffers: Record<string, number>;
  distressAdjustments?: Record<string, number>;
  dispoAdjustments?: Record<string, number>;
  minOfferPercent?: number;
  maxOfferPercent?: number;
  useOfferRange?: boolean;
  rangeWidth?: number;
}

export interface OfferPerformanceDto {
  strategyId: string;
  strategyName: string;
  totalMailed: number;
  avgOfferPercent: number;
  responseRate: number;
  contractRate: number;
  avgSpread: number;
  avgProfit: number;
  byPriceBand: Array<{
    priceBand: PriceBand;
    count: number;
    avgOfferPercent: number;
    responseRate: number;
    contractRate: number;
  }>;
}

@Injectable()
export class OffersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly offerCalculator: OfferCalculatorService,
  ) {}

  async createStrategy(dto: CreateOfferStrategyDto) {
    return this.prisma.offerStrategy.create({
      data: {
        accountId: dto.accountId,
        name: dto.name,
        description: dto.description,
        baseOffers: dto.baseOffers,
        distressAdjustments: dto.distressAdjustments || {},
        dispoAdjustments: dto.dispoAdjustments || {},
        minOfferPercent: dto.minOfferPercent || 0.50,
        maxOfferPercent: dto.maxOfferPercent || 0.90,
        useOfferRange: dto.useOfferRange || false,
        rangeWidth: dto.rangeWidth,
      },
    });
  }

  async findAllStrategies(accountId: string, pagination: PaginationDto) {
    const where: Prisma.OfferStrategyWhereInput = { accountId };

    const [strategies, total] = await Promise.all([
      this.prisma.offerStrategy.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { variants: true, mailPieces: true } },
        },
      }),
      this.prisma.offerStrategy.count({ where }),
    ]);

    return new PaginatedResponseDto(strategies, total, pagination);
  }

  async findOneStrategy(id: string) {
    const strategy = await this.prisma.offerStrategy.findUnique({
      where: { id },
      include: {
        account: { select: { id: true, name: true } },
        variants: {
          select: {
            id: true,
            name: true,
            campaign: { select: { id: true, name: true } },
          },
        },
        _count: { select: { mailPieces: true } },
      },
    });

    if (!strategy) {
      throw new NotFoundException(`Offer strategy ${id} not found`);
    }

    return strategy;
  }

  async updateStrategy(id: string, updates: Partial<CreateOfferStrategyDto>) {
    await this.findOneStrategy(id);

    return this.prisma.offerStrategy.update({
      where: { id },
      data: updates,
    });
  }

  async deleteStrategy(id: string) {
    const strategy = await this.findOneStrategy(id);

    if (strategy._count.mailPieces > 0) {
      throw new Error('Cannot delete strategy with mail pieces. Deactivate instead.');
    }

    return this.prisma.offerStrategy.delete({ where: { id } });
  }

  async calculateOfferForProperty(
    propertyId: string,
    accountId: string,
    offerStrategyId?: string,
  ): Promise<OfferResult> {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        distressFlags: { where: { isActive: true } },
      },
    });

    if (!property) {
      throw new NotFoundException(`Property ${propertyId} not found`);
    }

    const input: OfferInput = {
      propertyId: property.id,
      avmValue: Number(property.avmValue) || 0,
      arvValue: property.arvValue ? Number(property.arvValue) : undefined,
      priceBand: property.priceBand || PriceBand.BAND_100_200K,
      distressTypes: property.distressFlags.map((f) => f.type),
      distressSeverities: property.distressFlags.map((f) => f.severity),
      dispoScore: Number(property.dispoScore) || 0.5,
      marketId: property.marketId,
      accountId,
      offerStrategyId,
    };

    return this.offerCalculator.calculateOffer(input);
  }

  async calculateOffersForSegment(
    segmentId: string,
    accountId: string,
    offerStrategyId?: string,
    limit: number = 100,
  ) {
    const segment = await this.prisma.segment.findUnique({
      where: { id: segmentId },
      include: {
        members: {
          where: { removedAt: null },
          take: limit,
          include: {
            property: {
              include: {
                distressFlags: { where: { isActive: true } },
              },
            },
          },
        },
      },
    });

    if (!segment) {
      throw new NotFoundException(`Segment ${segmentId} not found`);
    }

    const results = await Promise.all(
      segment.members.map(async (member) => {
        const offer = await this.calculateOfferForProperty(
          member.propertyId,
          accountId,
          offerStrategyId,
        );
        return {
          propertyId: member.propertyId,
          address: member.property.streetAddress,
          avmValue: Number(member.property.avmValue),
          ...offer,
        };
      }),
    );

    // Aggregate stats
    const avgOfferPercent =
      results.reduce((sum, r) => sum + r.offerPercent, 0) / results.length;
    const totalOfferAmount = results.reduce((sum, r) => sum + r.offerAmount, 0);

    return {
      segmentId,
      segmentName: segment.name,
      propertyCount: results.length,
      avgOfferPercent,
      totalOfferAmount,
      offers: results,
    };
  }

  async getStrategyPerformance(strategyId: string): Promise<OfferPerformanceDto> {
    const strategy = await this.findOneStrategy(strategyId);

    // Get mail pieces using this strategy
    const mailPieces = await this.prisma.mailPiece.findMany({
      where: { offerStrategyId: strategyId },
      include: {
        property: { select: { priceBand: true } },
        calls: { select: { id: true } },
        variant: {
          select: {
            contracts: true,
            grossProfit: true,
          },
        },
      },
    });

    if (mailPieces.length === 0) {
      return {
        strategyId,
        strategyName: strategy.name,
        totalMailed: 0,
        avgOfferPercent: 0,
        responseRate: 0,
        contractRate: 0,
        avgSpread: 0,
        avgProfit: 0,
        byPriceBand: [],
      };
    }

    const totalMailed = mailPieces.length;
    const totalCalls = mailPieces.reduce((sum, mp) => sum + mp.calls.length, 0);
    const avgOfferPercent =
      mailPieces.reduce((sum, mp) => sum + Number(mp.offerPercent || 0), 0) / totalMailed;

    // Group by price band
    const byPriceBand = new Map<
      string,
      { count: number; offerSum: number; calls: number; contracts: number }
    >();

    for (const mp of mailPieces) {
      const band = mp.property.priceBand || 'UNKNOWN';
      const existing = byPriceBand.get(band) || { count: 0, offerSum: 0, calls: 0, contracts: 0 };
      existing.count++;
      existing.offerSum += Number(mp.offerPercent || 0);
      existing.calls += mp.calls.length;
      byPriceBand.set(band, existing);
    }

    return {
      strategyId,
      strategyName: strategy.name,
      totalMailed,
      avgOfferPercent,
      responseRate: totalCalls / totalMailed,
      contractRate: 0, // Would need to link to deals
      avgSpread: 0,
      avgProfit: 0,
      byPriceBand: Array.from(byPriceBand.entries()).map(([band, stats]) => ({
        priceBand: band as PriceBand,
        count: stats.count,
        avgOfferPercent: stats.offerSum / stats.count,
        responseRate: stats.calls / stats.count,
        contractRate: stats.contracts / stats.count,
      })),
    };
  }

  async simulateOfferStrategy(
    marketId: string,
    priceBand: PriceBand,
    distressTypes: DistressType[],
    offerPercents: number[],
  ) {
    return this.offerCalculator.simulateOffers({
      marketId,
      priceBand,
      distressTypes,
      offerPercents,
    });
  }
}
