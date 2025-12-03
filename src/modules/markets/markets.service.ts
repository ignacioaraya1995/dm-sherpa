import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CreateMarketDto, UpdateMarketDto, CreateZipCodeDto } from './dto/market.dto';
import { PaginationDto, PaginatedResponseDto } from '@/common/dto/pagination.dto';
import { Prisma, PriceBand } from '@prisma/client';

@Injectable()
export class MarketsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMarketDto) {
    // Check for duplicate state+county
    const existing = await this.prisma.market.findUnique({
      where: {
        state_county: { state: dto.state, county: dto.county },
      },
    });

    if (existing) {
      throw new ConflictException(
        `Market for ${dto.county}, ${dto.state} already exists`,
      );
    }

    return this.prisma.market.create({
      data: {
        name: dto.name,
        state: dto.state,
        county: dto.county,
        city: dto.city,
        medianPrice: dto.medianPrice,
        avgDom: dto.avgDom,
        buyerDensityScore: dto.buyerDensityScore,
      },
      include: {
        _count: {
          select: { zipCodes: true, properties: true },
        },
      },
    });
  }

  async findAll(pagination: PaginationDto, filters?: { state?: string }) {
    const where: Prisma.MarketWhereInput = {};

    if (filters?.state) {
      where.state = filters.state;
    }

    const [markets, total] = await Promise.all([
      this.prisma.market.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { [pagination.sortBy || 'name']: pagination.sortOrder || 'asc' },
        include: {
          _count: {
            select: { zipCodes: true, properties: true },
          },
        },
      }),
      this.prisma.market.count({ where }),
    ]);

    return new PaginatedResponseDto(markets, total, pagination);
  }

  async findOne(id: string) {
    const market = await this.prisma.market.findUnique({
      where: { id },
      include: {
        zipCodes: true,
        seasonalityProfiles: {
          orderBy: { year: 'desc' },
          take: 1,
        },
        dispoData: {
          orderBy: { periodEnd: 'desc' },
          take: 5,
        },
        _count: {
          select: { zipCodes: true, properties: true },
        },
      },
    });

    if (!market) {
      throw new NotFoundException(`Market with ID ${id} not found`);
    }

    return market;
  }

  async update(id: string, dto: UpdateMarketDto) {
    await this.findOne(id);

    return this.prisma.market.update({
      where: { id },
      data: dto,
      include: {
        _count: {
          select: { zipCodes: true, properties: true },
        },
      },
    });
  }

  async delete(id: string) {
    await this.findOne(id);
    return this.prisma.market.delete({ where: { id } });
  }

  async addZipCode(marketId: string, dto: CreateZipCodeDto) {
    await this.findOne(marketId);

    // Check for duplicate zip code
    const existing = await this.prisma.zipCode.findUnique({
      where: { code: dto.code },
    });

    if (existing) {
      throw new ConflictException(`Zip code ${dto.code} already exists`);
    }

    return this.prisma.zipCode.create({
      data: {
        marketId,
        code: dto.code,
        avgDom: dto.avgDom,
        medianPrice: dto.medianPrice,
        buyerDensityScore: dto.buyerDensityScore,
      },
    });
  }

  async getZipCodes(marketId: string) {
    await this.findOne(marketId);

    return this.prisma.zipCode.findMany({
      where: { marketId },
      orderBy: { code: 'asc' },
    });
  }

  async getDispoData(marketId: string, priceBand?: PriceBand) {
    await this.findOne(marketId);

    const where: Prisma.MarketDispoDataWhereInput = { marketId };
    if (priceBand) {
      where.priceBand = priceBand;
    }

    return this.prisma.marketDispoData.findMany({
      where,
      orderBy: [{ priceBand: 'asc' }, { periodEnd: 'desc' }],
    });
  }

  async upsertDispoData(
    marketId: string,
    priceBand: PriceBand,
    data: {
      avgDom: number;
      medianDom: number;
      listToSaleRatio: number;
      avgSpread: number;
      medianSpread: number;
      buyerDensity: number;
      dispoScore: number;
      periodStart: Date;
      periodEnd: Date;
    },
  ) {
    await this.findOne(marketId);

    return this.prisma.marketDispoData.upsert({
      where: {
        marketId_priceBand_periodStart: {
          marketId,
          priceBand,
          periodStart: data.periodStart,
        },
      },
      update: data,
      create: {
        marketId,
        priceBand,
        ...data,
      },
    });
  }

  async getSeasonalityProfile(marketId: string, year?: number) {
    await this.findOne(marketId);

    const targetYear = year || new Date().getFullYear();

    return this.prisma.seasonalityProfile.findUnique({
      where: {
        marketId_year: { marketId, year: targetYear },
      },
    });
  }

  async upsertSeasonalityProfile(
    marketId: string,
    year: number,
    data: {
      monthlyIndices: Record<string, number>;
      peakMonths?: number[];
      troughMonths?: number[];
      taxSeasonImpact?: number;
      holidayImpact?: number;
      stormSeasonImpact?: number;
    },
  ) {
    await this.findOne(marketId);

    return this.prisma.seasonalityProfile.upsert({
      where: {
        marketId_year: { marketId, year },
      },
      update: data,
      create: {
        marketId,
        year,
        ...data,
      },
    });
  }

  async getMarketStats(id: string) {
    const market = await this.findOne(id);

    const [propertyCount, distressBreakdown, priceBandBreakdown] = await Promise.all([
      this.prisma.property.count({ where: { marketId: id } }),

      this.prisma.distressFlag.groupBy({
        by: ['type'],
        where: {
          property: { marketId: id },
          isActive: true,
        },
        _count: true,
      }),

      this.prisma.property.groupBy({
        by: ['priceBand'],
        where: { marketId: id },
        _count: true,
        _avg: { avmValue: true },
      }),
    ]);

    return {
      market,
      stats: {
        totalProperties: propertyCount,
        distressBreakdown: distressBreakdown.map((d) => ({
          type: d.type,
          count: d._count,
        })),
        priceBandBreakdown: priceBandBreakdown.map((p) => ({
          priceBand: p.priceBand,
          count: p._count,
          avgAvm: p._avg.avmValue,
        })),
      },
    };
  }
}
