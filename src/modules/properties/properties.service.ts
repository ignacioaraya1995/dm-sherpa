import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  CreatePropertyDto,
  UpdatePropertyDto,
  PropertySearchDto,
  CreateDistressFlagDto,
} from './dto/property.dto';
import { PaginationDto, PaginatedResponseDto } from '@/common/dto/pagination.dto';
import { Prisma, PriceBand } from '@prisma/client';

@Injectable()
export class PropertiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreatePropertyDto) {
    // Auto-calculate price band if not provided
    const priceBand = dto.priceBand || this.calculatePriceBand(dto.avmValue);

    const property = await this.prisma.property.create({
      data: {
        streetAddress: dto.streetAddress,
        city: dto.city,
        state: dto.state,
        zipCodeId: dto.zipCodeId,
        marketId: dto.marketId,
        propertyType: dto.propertyType,
        beds: dto.beds,
        baths: dto.baths,
        sqft: dto.sqft,
        yearBuilt: dto.yearBuilt,
        avmValue: dto.avmValue,
        arvValue: dto.arvValue,
        priceBand,
        isVacant: dto.isVacant || false,
        isAbsenteeOwner: dto.isAbsenteeOwner || false,
        owner: dto.owner
          ? {
              create: {
                firstName: dto.owner.firstName,
                lastName: dto.owner.lastName,
                fullName: `${dto.owner.firstName} ${dto.owner.lastName}`,
                mailingStreet: dto.owner.mailingStreet,
                mailingCity: dto.owner.mailingCity,
                mailingState: dto.owner.mailingState,
                mailingZip: dto.owner.mailingZip,
                phone: dto.owner.phone,
                email: dto.owner.email,
                ownershipType: dto.owner.ownershipType,
                ownershipLength: dto.owner.ownershipLength,
                isAbsentee: dto.owner.isAbsentee || false,
                distanceFromProperty: dto.owner.distanceFromProperty,
              },
            }
          : undefined,
      },
      include: {
        owner: true,
        zipCode: true,
        market: { select: { id: true, name: true, state: true, county: true } },
        distressFlags: { where: { isActive: true } },
      },
    });

    this.eventEmitter.emit('property.created', { property });

    return property;
  }

  async findAll(pagination: PaginationDto, search?: PropertySearchDto) {
    const where = this.buildSearchWhere(search);

    const [properties, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { [pagination.sortBy || 'createdAt']: pagination.sortOrder },
        include: {
          owner: true,
          zipCode: { select: { code: true } },
          market: { select: { id: true, name: true } },
          distressFlags: { where: { isActive: true } },
        },
      }),
      this.prisma.property.count({ where }),
    ]);

    return new PaginatedResponseDto(properties, total, pagination);
  }

  async findOne(id: string) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: {
        owner: true,
        zipCode: true,
        market: true,
        distressFlags: {
          orderBy: { startDate: 'desc' },
        },
        mailPieces: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            variant: { select: { id: true, name: true } },
            batch: { select: { id: true, batchNumber: true } },
          },
        },
        deals: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!property) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }

    return property;
  }

  async update(id: string, dto: UpdatePropertyDto) {
    await this.findOne(id);

    const priceBand = dto.avmValue
      ? this.calculatePriceBand(dto.avmValue)
      : undefined;

    return this.prisma.property.update({
      where: { id },
      data: {
        ...dto,
        priceBand: priceBand || dto.priceBand,
      },
      include: {
        owner: true,
        distressFlags: { where: { isActive: true } },
      },
    });
  }

  async delete(id: string) {
    await this.findOne(id);
    return this.prisma.property.delete({ where: { id } });
  }

  async addDistressFlag(propertyId: string, dto: CreateDistressFlagDto) {
    await this.findOne(propertyId);

    const flag = await this.prisma.distressFlag.create({
      data: {
        propertyId,
        type: dto.type,
        severity: dto.severity,
        startDate: dto.startDate,
        endDate: dto.endDate,
        metadata: dto.metadata || {},
        source: dto.source,
      },
    });

    // Recalculate motivation score
    await this.updatePropertyScores(propertyId);

    this.eventEmitter.emit('distress.flag.added', {
      propertyId,
      flag,
    });

    return flag;
  }

  async getDistressFlags(propertyId: string, activeOnly = true) {
    await this.findOne(propertyId);

    return this.prisma.distressFlag.findMany({
      where: {
        propertyId,
        ...(activeOnly && { isActive: true }),
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async deactivateDistressFlag(flagId: string) {
    const flag = await this.prisma.distressFlag.update({
      where: { id: flagId },
      data: {
        isActive: false,
        endDate: new Date(),
      },
    });

    await this.updatePropertyScores(flag.propertyId);

    return flag;
  }

  async updatePropertyScores(propertyId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        distressFlags: { where: { isActive: true } },
        market: {
          include: {
            dispoData: {
              orderBy: { periodEnd: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!property) return;

    // Calculate motivation score based on distress flags
    const motivationScore = this.calculateMotivationScore(property.distressFlags);

    // Calculate dispo score based on market data
    const dispoScore = this.calculateDispoScore(property, property.market.dispoData[0]);

    await this.prisma.property.update({
      where: { id: propertyId },
      data: {
        motivationScore,
        dispoScore,
      },
    });
  }

  async bulkUpdateScores(propertyIds: string[]) {
    for (const id of propertyIds) {
      await this.updatePropertyScores(id);
    }
  }

  private buildSearchWhere(search?: PropertySearchDto): Prisma.PropertyWhereInput {
    if (!search) return {};

    const where: Prisma.PropertyWhereInput = {};

    if (search.marketId) where.marketId = search.marketId;
    if (search.propertyType) where.propertyType = search.propertyType;
    if (search.priceBand) where.priceBand = search.priceBand;
    if (search.isAbsentee !== undefined) where.isAbsenteeOwner = search.isAbsentee;
    if (search.isVacant !== undefined) where.isVacant = search.isVacant;

    if (search.zipCode) {
      where.zipCode = { code: search.zipCode };
    }

    if (search.minDispoScore !== undefined) {
      where.dispoScore = { gte: search.minDispoScore };
    }

    if (search.minMotivationScore !== undefined) {
      where.motivationScore = { gte: search.minMotivationScore };
    }

    if (search.minAvmValue !== undefined || search.maxAvmValue !== undefined) {
      where.avmValue = {};
      if (search.minAvmValue) where.avmValue.gte = search.minAvmValue;
      if (search.maxAvmValue) where.avmValue.lte = search.maxAvmValue;
    }

    if (search.distressTypes && search.distressTypes.length > 0) {
      where.distressFlags = {
        some: {
          type: { in: search.distressTypes },
          isActive: true,
        },
      };
    }

    return where;
  }

  private calculatePriceBand(avmValue?: number): PriceBand | undefined {
    if (!avmValue) return undefined;

    if (avmValue < 100000) return PriceBand.BAND_0_100K;
    if (avmValue < 200000) return PriceBand.BAND_100_200K;
    if (avmValue < 300000) return PriceBand.BAND_200_300K;
    if (avmValue < 500000) return PriceBand.BAND_300_500K;
    return PriceBand.BAND_500K_PLUS;
  }

  private calculateMotivationScore(
    distressFlags: Array<{ type: string; severity: string }>,
  ): number {
    if (distressFlags.length === 0) return 0.1;

    // Weight by distress type and severity
    const typeWeights: Record<string, number> = {
      PRE_FORECLOSURE: 0.9,
      FORECLOSURE: 0.95,
      PROBATE: 0.85,
      TAX_LIEN: 0.8,
      DIVORCE: 0.75,
      BANKRUPTCY: 0.85,
      CODE_VIOLATION: 0.6,
      EVICTION: 0.7,
      VACANT: 0.65,
      ABSENTEE: 0.4,
      HIGH_EQUITY: 0.3,
    };

    const severityMultipliers: Record<string, number> = {
      CRITICAL: 1.0,
      HIGH: 0.85,
      MEDIUM: 0.65,
      LOW: 0.4,
    };

    let maxScore = 0;
    for (const flag of distressFlags) {
      const typeWeight = typeWeights[flag.type] || 0.5;
      const severityMult = severityMultipliers[flag.severity] || 0.5;
      const score = typeWeight * severityMult;
      if (score > maxScore) maxScore = score;
    }

    // Stack bonus for multiple flags
    const stackBonus = Math.min(0.1 * (distressFlags.length - 1), 0.15);

    return Math.min(maxScore + stackBonus, 1.0);
  }

  private calculateDispoScore(
    property: { avmValue: Prisma.Decimal | null; priceBand: PriceBand | null },
    marketDispoData?: { dispoScore: Prisma.Decimal } | null,
  ): number {
    if (!marketDispoData) return 0.5;

    // Base from market dispo data
    let score = Number(marketDispoData.dispoScore) || 0.5;

    // Adjust for price band (lower prices typically easier to dispo)
    if (property.priceBand === PriceBand.BAND_0_100K) score *= 1.1;
    if (property.priceBand === PriceBand.BAND_500K_PLUS) score *= 0.85;

    return Math.min(Math.max(score, 0), 1);
  }
}
