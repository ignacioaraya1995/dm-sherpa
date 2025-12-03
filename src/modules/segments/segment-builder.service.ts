import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { SegmentFiltersDto } from './dto/segment.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class SegmentBuilderService {
  constructor(private readonly prisma: PrismaService) {}

  buildPropertyWhereClause(filters: SegmentFiltersDto): Prisma.PropertyWhereInput {
    const where: Prisma.PropertyWhereInput = {};

    // Market filters
    if (filters.markets && filters.markets.length > 0) {
      where.marketId = { in: filters.markets };
    }

    // Zip code filters
    if (filters.zipCodes && filters.zipCodes.length > 0) {
      where.zipCode = { code: { in: filters.zipCodes } };
    }

    // Price band filters
    if (filters.priceBands && filters.priceBands.length > 0) {
      where.priceBand = { in: filters.priceBands };
    }

    // AVM value range
    if (filters.minAvmValue !== undefined || filters.maxAvmValue !== undefined) {
      where.avmValue = {};
      if (filters.minAvmValue !== undefined) {
        where.avmValue.gte = filters.minAvmValue;
      }
      if (filters.maxAvmValue !== undefined) {
        where.avmValue.lte = filters.maxAvmValue;
      }
    }

    // Equity percent
    if (filters.minEquityPercent !== undefined) {
      where.equityPercent = { gte: filters.minEquityPercent };
    }

    // Absentee owner
    if (filters.isAbsentee !== undefined) {
      where.isAbsenteeOwner = filters.isAbsentee;
    }

    // Vacant property
    if (filters.isVacant !== undefined) {
      where.isVacant = filters.isVacant;
    }

    // Dispo score
    if (filters.minDispoScore !== undefined) {
      where.dispoScore = { gte: filters.minDispoScore };
    }

    // Motivation score
    if (filters.minMotivationScore !== undefined) {
      where.motivationScore = { gte: filters.minMotivationScore };
    }

    // Distress types (requires at least one active flag of specified types)
    if (filters.distressTypes && filters.distressTypes.length > 0) {
      where.distressFlags = {
        some: {
          type: { in: filters.distressTypes },
          isActive: true,
        },
      };
    }

    // Ownership length
    if (filters.minOwnershipLength !== undefined) {
      where.owner = {
        ownershipLength: { gte: filters.minOwnershipLength },
      };
    }

    // Mail history filters
    if (filters.minDaysSinceLastMail !== undefined || filters.maxTotalMails !== undefined) {
      // These require subqueries, handled separately
    }

    return where;
  }

  async getMatchingPropertyIds(
    filters: SegmentFiltersDto,
    options?: {
      excludePropertyIds?: string[];
      limit?: number;
    },
  ): Promise<string[]> {
    const where = this.buildPropertyWhereClause(filters);

    // Exclude already-targeted properties
    if (options?.excludePropertyIds && options.excludePropertyIds.length > 0) {
      where.id = { notIn: options.excludePropertyIds };
    }

    const properties = await this.prisma.property.findMany({
      where,
      select: { id: true },
      take: options?.limit,
    });

    return properties.map((p) => p.id);
  }

  async calculateSegmentStats(
    propertyIds: string[],
  ): Promise<{
    avgDispoScore: number;
    avgMotivationScore: number;
    priceBandDistribution: Record<string, number>;
    distressTypeDistribution: Record<string, number>;
    marketDistribution: Record<string, number>;
  }> {
    if (propertyIds.length === 0) {
      return {
        avgDispoScore: 0,
        avgMotivationScore: 0,
        priceBandDistribution: {},
        distressTypeDistribution: {},
        marketDistribution: {},
      };
    }

    // Get aggregated stats
    const [scores, priceBands, distressTypes, markets] = await Promise.all([
      this.prisma.property.aggregate({
        where: { id: { in: propertyIds } },
        _avg: {
          dispoScore: true,
          motivationScore: true,
        },
      }),

      this.prisma.property.groupBy({
        by: ['priceBand'],
        where: { id: { in: propertyIds } },
        _count: true,
      }),

      this.prisma.distressFlag.groupBy({
        by: ['type'],
        where: {
          propertyId: { in: propertyIds },
          isActive: true,
        },
        _count: true,
      }),

      this.prisma.property.groupBy({
        by: ['marketId'],
        where: { id: { in: propertyIds } },
        _count: true,
      }),
    ]);

    const total = propertyIds.length;

    return {
      avgDispoScore: Number(scores._avg.dispoScore) || 0,
      avgMotivationScore: Number(scores._avg.motivationScore) || 0,
      priceBandDistribution: Object.fromEntries(
        priceBands.map((p) => [p.priceBand || 'UNKNOWN', p._count / total]),
      ),
      distressTypeDistribution: Object.fromEntries(
        distressTypes.map((d) => [d.type, d._count]),
      ),
      marketDistribution: Object.fromEntries(
        markets.map((m) => [m.marketId, m._count / total]),
      ),
    };
  }

  async applyMailingConstraints(
    propertyIds: string[],
    constraints: {
      maxMailsPerProperty: number;
      minDaysBetweenMails: number;
      excludeRecentDeals: boolean;
    },
  ): Promise<string[]> {
    if (propertyIds.length === 0) return [];

    const now = new Date();
    const minMailDate = new Date(now.getTime() - constraints.minDaysBetweenMails * 24 * 60 * 60 * 1000);

    // Get mail counts and last mail dates
    const mailStats = await this.prisma.mailPiece.groupBy({
      by: ['propertyId'],
      where: {
        propertyId: { in: propertyIds },
      },
      _count: true,
      _max: {
        createdAt: true,
      },
    });

    const mailStatsMap = new Map(
      mailStats.map((s) => [
        s.propertyId,
        { count: s._count, lastMail: s._max.createdAt },
      ]),
    );

    // Get properties with recent deals
    let recentDealPropertyIds: Set<string> = new Set();
    if (constraints.excludeRecentDeals) {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const recentDeals = await this.prisma.deal.findMany({
        where: {
          propertyId: { in: propertyIds },
          createdAt: { gte: thirtyDaysAgo },
        },
        select: { propertyId: true },
      });
      recentDealPropertyIds = new Set(recentDeals.map((d) => d.propertyId));
    }

    // Filter properties
    return propertyIds.filter((id) => {
      // Exclude properties with recent deals
      if (recentDealPropertyIds.has(id)) return false;

      const stats = mailStatsMap.get(id);
      if (!stats) return true; // No mail history, include

      // Check max mails constraint
      if (stats.count >= constraints.maxMailsPerProperty) return false;

      // Check min days between mails
      if (stats.lastMail && stats.lastMail > minMailDate) return false;

      return true;
    });
  }

  async getSampleProperties(
    propertyIds: string[],
    limit: number = 10,
  ) {
    return this.prisma.property.findMany({
      where: { id: { in: propertyIds } },
      take: limit,
      include: {
        distressFlags: {
          where: { isActive: true },
          select: { type: true },
        },
      },
      orderBy: { motivationScore: 'desc' },
    });
  }
}
