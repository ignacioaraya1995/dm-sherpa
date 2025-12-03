import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DistressType, DistressSeverity, Prisma } from '@prisma/client';
type JsonValue = Prisma.InputJsonValue;

export interface DistressIngestionDto {
  propertyId: string;
  type: DistressType;
  severity: DistressSeverity;
  startDate: Date;
  metadata?: Record<string, unknown>;
  source: string;
}

export interface BulkDistressResult {
  processed: number;
  created: number;
  updated: number;
  errors: Array<{ propertyId: string; error: string }>;
}

@Injectable()
export class DistressService {
  private readonly logger = new Logger(DistressService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async ingestDistressData(data: DistressIngestionDto[]): Promise<BulkDistressResult> {
    const result: BulkDistressResult = {
      processed: 0,
      created: 0,
      updated: 0,
      errors: [],
    };

    for (const item of data) {
      try {
        result.processed++;

        // Check if property exists
        const property = await this.prisma.property.findUnique({
          where: { id: item.propertyId },
        });

        if (!property) {
          result.errors.push({
            propertyId: item.propertyId,
            error: 'Property not found',
          });
          continue;
        }

        // Check for existing active flag of same type
        const existing = await this.prisma.distressFlag.findFirst({
          where: {
            propertyId: item.propertyId,
            type: item.type,
            isActive: true,
          },
        });

        if (existing) {
          // Update existing flag
          await this.prisma.distressFlag.update({
            where: { id: existing.id },
            data: {
              severity: item.severity,
              metadata: (item.metadata || {}) as JsonValue,
              source: item.source,
              updatedAt: new Date(),
            },
          });
          result.updated++;
        } else {
          // Create new flag
          const flag = await this.prisma.distressFlag.create({
            data: {
              propertyId: item.propertyId,
              type: item.type,
              severity: item.severity,
              startDate: item.startDate,
              metadata: (item.metadata || {}) as JsonValue,
              source: item.source,
            },
          });

          result.created++;

          this.eventEmitter.emit('distress.flag.added', {
            propertyId: item.propertyId,
            flag,
          });
        }
      } catch (error) {
        this.logger.error(`Error processing distress for ${item.propertyId}`, error);
        result.errors.push({
          propertyId: item.propertyId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return result;
  }

  async getDistressSummary(marketId?: string) {
    const where: Prisma.DistressFlagWhereInput = {
      isActive: true,
      ...(marketId && {
        property: { marketId },
      }),
    };

    const [byType, bySeverity, totalCount] = await Promise.all([
      this.prisma.distressFlag.groupBy({
        by: ['type'],
        where,
        _count: true,
      }),
      this.prisma.distressFlag.groupBy({
        by: ['severity'],
        where,
        _count: true,
      }),
      this.prisma.distressFlag.count({ where }),
    ]);

    return {
      total: totalCount,
      byType: byType.map((t) => ({ type: t.type, count: t._count })),
      bySeverity: bySeverity.map((s) => ({ severity: s.severity, count: s._count })),
    };
  }

  async getRecentDistressActivity(days: number = 30, limit: number = 100) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    return this.prisma.distressFlag.findMany({
      where: {
        startDate: { gte: since },
      },
      orderBy: { startDate: 'desc' },
      take: limit,
      include: {
        property: {
          select: {
            id: true,
            streetAddress: true,
            city: true,
            state: true,
            avmValue: true,
            priceBand: true,
            market: { select: { name: true } },
          },
        },
      },
    });
  }

  async getStackedDistressProperties(
    minStackCount: number = 2,
    marketId?: string,
  ) {
    const properties = await this.prisma.property.findMany({
      where: {
        ...(marketId && { marketId }),
        distressFlags: {
          some: { isActive: true },
        },
      },
      include: {
        distressFlags: {
          where: { isActive: true },
        },
        owner: { select: { fullName: true, isAbsentee: true } },
        market: { select: { name: true } },
      },
    });

    // Filter by stack count
    return properties
      .filter((p) => p.distressFlags.length >= minStackCount)
      .map((p) => ({
        ...p,
        stackCount: p.distressFlags.length,
        distressTypes: p.distressFlags.map((f) => f.type),
      }))
      .sort((a, b) => b.stackCount - a.stackCount);
  }

  async calculateDistressFreshness(propertyId: string): Promise<{
    avgDaysActive: number;
    oldestFlag: Date | null;
    newestFlag: Date | null;
  }> {
    const flags = await this.prisma.distressFlag.findMany({
      where: {
        propertyId,
        isActive: true,
      },
      select: {
        startDate: true,
        daysActive: true,
      },
    });

    if (flags.length === 0) {
      return { avgDaysActive: 0, oldestFlag: null, newestFlag: null };
    }

    const now = new Date();
    const daysActive = flags.map((f) => {
      const diffTime = Math.abs(now.getTime() - f.startDate.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    });

    return {
      avgDaysActive: daysActive.reduce((a, b) => a + b, 0) / daysActive.length,
      oldestFlag: new Date(Math.min(...flags.map((f) => f.startDate.getTime()))),
      newestFlag: new Date(Math.max(...flags.map((f) => f.startDate.getTime()))),
    };
  }

  async expireOldDistressFlags(olderThanDays: number = 365) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.prisma.distressFlag.updateMany({
      where: {
        isActive: true,
        startDate: { lt: cutoffDate },
      },
      data: {
        isActive: false,
        endDate: new Date(),
      },
    });

    this.logger.log(`Expired ${result.count} distress flags older than ${olderThanDays} days`);

    return result;
  }
}
