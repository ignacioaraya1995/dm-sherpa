import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SegmentBuilderService } from './segment-builder.service';
import {
  CreateSegmentDto,
  UpdateSegmentDto,
  SegmentPreviewDto,
  RefreshSegmentResultDto,
} from './dto/segment.dto';
import { PaginationDto, PaginatedResponseDto } from '@/common/dto/pagination.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class SegmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly segmentBuilder: SegmentBuilderService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateSegmentDto) {
    // Create segment
    const segment = await this.prisma.segment.create({
      data: {
        name: dto.name,
        description: dto.description,
        accountId: dto.accountId,
        filters: dto.filters as Prisma.InputJsonValue,
        maxMailsPerProperty: dto.maxMailsPerProperty ?? 6,
        minDaysBetweenMails: dto.minDaysBetweenMails ?? 21,
        excludeRecentDeals: dto.excludeRecentDeals ?? true,
      },
    });

    // Refresh members
    await this.refreshMembers(segment.id);

    return this.findOne(segment.id);
  }

  async findAll(
    accountId: string,
    pagination: PaginationDto,
    filters?: { isActive?: boolean },
  ) {
    const where: Prisma.SegmentWhereInput = { accountId };

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const [segments, total] = await Promise.all([
      this.prisma.segment.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { [pagination.sortBy || 'createdAt']: pagination.sortOrder },
      }),
      this.prisma.segment.count({ where }),
    ]);

    return new PaginatedResponseDto(segments, total, pagination);
  }

  async findOne(id: string) {
    const segment = await this.prisma.segment.findUnique({
      where: { id },
      include: {
        account: { select: { id: true, name: true } },
        _count: {
          select: { members: true, campaigns: true },
        },
      },
    });

    if (!segment) {
      throw new NotFoundException(`Segment with ID ${id} not found`);
    }

    return segment;
  }

  async update(id: string, dto: UpdateSegmentDto) {
    await this.findOne(id);

    const segment = await this.prisma.segment.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        filters: dto.filters as Prisma.InputJsonValue,
        maxMailsPerProperty: dto.maxMailsPerProperty,
        minDaysBetweenMails: dto.minDaysBetweenMails,
        excludeRecentDeals: dto.excludeRecentDeals,
      },
    });

    // Refresh members if filters changed
    if (dto.filters) {
      await this.refreshMembers(segment.id);
    }

    return this.findOne(segment.id);
  }

  async delete(id: string) {
    await this.findOne(id);

    // Remove all members first
    await this.prisma.segmentMember.deleteMany({
      where: { segmentId: id },
    });

    return this.prisma.segment.delete({ where: { id } });
  }

  async preview(dto: CreateSegmentDto): Promise<SegmentPreviewDto> {
    // Get matching properties
    const propertyIds = await this.segmentBuilder.getMatchingPropertyIds(
      dto.filters,
      { limit: 10000 },
    );

    // Apply mailing constraints
    const filteredIds = await this.segmentBuilder.applyMailingConstraints(
      propertyIds,
      {
        maxMailsPerProperty: dto.maxMailsPerProperty ?? 6,
        minDaysBetweenMails: dto.minDaysBetweenMails ?? 21,
        excludeRecentDeals: dto.excludeRecentDeals ?? true,
      },
    );

    // Calculate stats
    const stats = await this.segmentBuilder.calculateSegmentStats(filteredIds);

    // Get sample properties
    const samples = await this.segmentBuilder.getSampleProperties(filteredIds, 10);

    return {
      totalMatching: filteredIds.length,
      avgDispoScore: stats.avgDispoScore,
      avgMotivationScore: stats.avgMotivationScore,
      priceBandDistribution: stats.priceBandDistribution,
      distressTypeDistribution: stats.distressTypeDistribution,
      marketDistribution: stats.marketDistribution,
      sampleProperties: samples.map((p) => ({
        id: p.id,
        streetAddress: p.streetAddress,
        city: p.city,
        avmValue: Number(p.avmValue) || 0,
        dispoScore: Number(p.dispoScore) || 0,
        motivationScore: Number(p.motivationScore) || 0,
        distressFlags: p.distressFlags.map((f) => f.type),
      })),
    };
  }

  async refreshMembers(id: string): Promise<RefreshSegmentResultDto> {
    const segment = await this.findOne(id);
    const filters = segment.filters as Record<string, unknown>;

    // Get current members
    const currentMembers = await this.prisma.segmentMember.findMany({
      where: { segmentId: id, removedAt: null },
      select: { propertyId: true },
    });
    const currentIds = new Set(currentMembers.map((m) => m.propertyId));
    const previousCount = currentIds.size;

    // Get matching properties
    const matchingIds = await this.segmentBuilder.getMatchingPropertyIds(
      filters as never,
      { limit: 50000 },
    );

    // Apply constraints
    const validIds = await this.segmentBuilder.applyMailingConstraints(
      matchingIds,
      {
        maxMailsPerProperty: segment.maxMailsPerProperty,
        minDaysBetweenMails: segment.minDaysBetweenMails,
        excludeRecentDeals: segment.excludeRecentDeals,
      },
    );
    const validIdSet = new Set(validIds);

    // Find additions and removals
    const toAdd = validIds.filter((id) => !currentIds.has(id));
    const toRemove = [...currentIds].filter((id) => !validIdSet.has(id));

    // Get property snapshots for new members
    const propertySnapshots = await this.prisma.property.findMany({
      where: { id: { in: toAdd } },
      select: {
        id: true,
        dispoScore: true,
        motivationScore: true,
        distressFlags: {
          where: { isActive: true },
          select: { type: true },
        },
      },
    });

    const snapshotMap = new Map(
      propertySnapshots.map((p) => [
        p.id,
        {
          dispoScore: p.dispoScore,
          motivationScore: p.motivationScore,
          distressFlags: p.distressFlags.map((f) => f.type),
        },
      ]),
    );

    // Add new members
    if (toAdd.length > 0) {
      await this.prisma.segmentMember.createMany({
        data: toAdd.map((propertyId) => {
          const snapshot = snapshotMap.get(propertyId);
          return {
            segmentId: id,
            propertyId,
            dispoScoreSnapshot: snapshot?.dispoScore,
            motivationSnapshot: snapshot?.motivationScore,
            distressFlagsSnapshot: snapshot?.distressFlags || [],
          };
        }),
        skipDuplicates: true,
      });
    }

    // Mark removed members
    if (toRemove.length > 0) {
      await this.prisma.segmentMember.updateMany({
        where: {
          segmentId: id,
          propertyId: { in: toRemove },
        },
        data: { removedAt: new Date() },
      });
    }

    // Update segment stats
    const stats = await this.segmentBuilder.calculateSegmentStats(validIds);
    const freshness = await this.calculateAverageFreshness(validIds);

    await this.prisma.segment.update({
      where: { id },
      data: {
        memberCount: validIds.length,
        avgDispoScore: stats.avgDispoScore,
        avgMotivation: stats.avgMotivationScore,
        avgFreshnessDays: freshness,
        distressMix: stats.distressTypeDistribution,
        lastRefreshedAt: new Date(),
      },
    });

    const result = {
      previousCount,
      newCount: validIds.length,
      added: toAdd.length,
      removed: toRemove.length,
      refreshedAt: new Date(),
    };

    this.eventEmitter.emit('segment.refreshed', { segmentId: id, ...result });

    return result;
  }

  async getMembers(
    id: string,
    pagination: PaginationDto,
    options?: { activeOnly?: boolean },
  ) {
    await this.findOne(id);

    const where: Prisma.SegmentMemberWhereInput = { segmentId: id };
    if (options?.activeOnly !== false) {
      where.removedAt = null;
    }

    const [members, total] = await Promise.all([
      this.prisma.segmentMember.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        include: {
          property: {
            include: {
              owner: { select: { fullName: true, isAbsentee: true } },
              distressFlags: {
                where: { isActive: true },
                select: { type: true, severity: true },
              },
            },
          },
        },
      }),
      this.prisma.segmentMember.count({ where }),
    ]);

    return new PaginatedResponseDto(members, total, pagination);
  }

  async activate(id: string) {
    await this.findOne(id);
    return this.prisma.segment.update({
      where: { id },
      data: { isActive: true },
    });
  }

  async deactivate(id: string) {
    await this.findOne(id);
    return this.prisma.segment.update({
      where: { id },
      data: { isActive: false },
    });
  }

  private async calculateAverageFreshness(propertyIds: string[]): Promise<number> {
    if (propertyIds.length === 0) return 0;

    const flags = await this.prisma.distressFlag.findMany({
      where: {
        propertyId: { in: propertyIds },
        isActive: true,
      },
      select: { startDate: true },
    });

    if (flags.length === 0) return 0;

    const now = new Date();
    const totalDays = flags.reduce((sum, f) => {
      const diffTime = Math.abs(now.getTime() - f.startDate.getTime());
      return sum + Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }, 0);

    return totalDays / flags.length;
  }
}
