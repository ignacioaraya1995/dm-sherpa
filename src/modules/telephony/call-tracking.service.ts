import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PaginationDto, PaginatedResponseDto } from '@/common/dto/pagination.dto';
import { CallStatus, CallOutcome, Prisma } from '@prisma/client';

export interface RecordCallDto {
  phoneNumberId: string;
  mailPieceId?: string;
  callerNumber?: string;
  callSid?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: CallStatus;
  outcome?: CallOutcome;
  assigneeId?: string;
  talkTrackId?: string;
  isQualified?: boolean;
  qualificationScore?: number;
  recordingUrl?: string;
  notes?: string;
}

export interface CallStatsDto {
  totalCalls: number;
  answeredCalls: number;
  missedCalls: number;
  avgDuration: number;
  qualifiedCalls: number;
  qualificationRate: number;
  byOutcome: Record<string, number>;
  byHour: Array<{ hour: number; count: number }>;
}

@Injectable()
export class CallTrackingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async recordCall(dto: RecordCallDto) {
    const call = await this.prisma.callEvent.create({
      data: {
        phoneNumberId: dto.phoneNumberId,
        mailPieceId: dto.mailPieceId,
        callerNumber: dto.callerNumber,
        callSid: dto.callSid,
        startTime: dto.startTime,
        endTime: dto.endTime,
        duration: dto.duration,
        status: dto.status,
        outcome: dto.outcome,
        assigneeId: dto.assigneeId,
        talkTrackId: dto.talkTrackId,
        isQualified: dto.isQualified || false,
        qualificationScore: dto.qualificationScore,
        recordingUrl: dto.recordingUrl,
        notes: dto.notes,
      },
      include: {
        phoneNumber: { select: { id: true, number: true } },
        mailPiece: {
          select: {
            id: true,
            variant: { select: { id: true, name: true, campaignId: true } },
            property: { select: { id: true, streetAddress: true, city: true } },
          },
        },
      },
    });

    // Update variant metrics if linked to a mail piece
    if (call.mailPiece) {
      await this.prisma.variant.update({
        where: { id: call.mailPiece.variant.id },
        data: {
          calls: { increment: 1 },
          qualifiedCalls: dto.isQualified ? { increment: 1 } : undefined,
        },
      });
    }

    this.eventEmitter.emit('call.recorded', { call });

    return call;
  }

  async findAll(
    pagination: PaginationDto,
    filters?: {
      phoneNumberId?: string;
      campaignId?: string;
      assigneeId?: string;
      status?: CallStatus;
      outcome?: CallOutcome;
      isQualified?: boolean;
      startDate?: Date;
      endDate?: Date;
    },
  ) {
    const where: Prisma.CallEventWhereInput = {};

    if (filters?.phoneNumberId) where.phoneNumberId = filters.phoneNumberId;
    if (filters?.assigneeId) where.assigneeId = filters.assigneeId;
    if (filters?.status) where.status = filters.status;
    if (filters?.outcome) where.outcome = filters.outcome;
    if (filters?.isQualified !== undefined) where.isQualified = filters.isQualified;

    if (filters?.campaignId) {
      where.mailPiece = {
        variant: { campaignId: filters.campaignId },
      };
    }

    if (filters?.startDate || filters?.endDate) {
      where.startTime = {};
      if (filters?.startDate) where.startTime.gte = filters.startDate;
      if (filters?.endDate) where.startTime.lte = filters.endDate;
    }

    const [calls, total] = await Promise.all([
      this.prisma.callEvent.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { startTime: 'desc' },
        include: {
          phoneNumber: { select: { id: true, number: true } },
          assignee: { select: { id: true, name: true } },
          mailPiece: {
            select: {
              id: true,
              property: { select: { streetAddress: true, city: true } },
              variant: { select: { name: true } },
            },
          },
          talkTrack: { select: { id: true, name: true } },
        },
      }),
      this.prisma.callEvent.count({ where }),
    ]);

    return new PaginatedResponseDto(calls, total, pagination);
  }

  async findOne(id: string) {
    const call = await this.prisma.callEvent.findUnique({
      where: { id },
      include: {
        phoneNumber: true,
        mailPiece: {
          include: {
            property: {
              include: {
                owner: true,
                distressFlags: { where: { isActive: true } },
              },
            },
            variant: {
              include: {
                campaign: { select: { id: true, name: true } },
                offerStrategy: true,
              },
            },
          },
        },
        assignee: true,
        talkTrack: true,
        conversion: true,
      },
    });

    if (!call) {
      throw new NotFoundException(`Call with ID ${id} not found`);
    }

    return call;
  }

  async updateCall(
    id: string,
    updates: Partial<{
      endTime: Date;
      duration: number;
      status: CallStatus;
      outcome: CallOutcome;
      isQualified: boolean;
      qualificationScore: number;
      notes: string;
      talkTrackId: string;
    }>,
  ) {
    await this.findOne(id);

    return this.prisma.callEvent.update({
      where: { id },
      data: updates,
    });
  }

  async getCallStats(
    accountId: string,
    periodDays: number = 30,
  ): Promise<CallStatsDto> {
    const since = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

    const [total, byStatus, byOutcome, durationAgg, qualified] = await Promise.all([
      this.prisma.callEvent.count({
        where: {
          phoneNumber: { accountId },
          startTime: { gte: since },
        },
      }),

      this.prisma.callEvent.groupBy({
        by: ['status'],
        where: {
          phoneNumber: { accountId },
          startTime: { gte: since },
        },
        _count: true,
      }),

      this.prisma.callEvent.groupBy({
        by: ['outcome'],
        where: {
          phoneNumber: { accountId },
          startTime: { gte: since },
          outcome: { not: null },
        },
        _count: true,
      }),

      this.prisma.callEvent.aggregate({
        where: {
          phoneNumber: { accountId },
          startTime: { gte: since },
          duration: { not: null },
        },
        _avg: { duration: true },
      }),

      this.prisma.callEvent.count({
        where: {
          phoneNumber: { accountId },
          startTime: { gte: since },
          isQualified: true,
        },
      }),
    ]);

    const answeredCalls = byStatus.find((s) => s.status === 'COMPLETED')?._count || 0;
    const missedCalls = byStatus.find((s) => s.status === 'MISSED')?._count || 0;

    return {
      totalCalls: total,
      answeredCalls,
      missedCalls,
      avgDuration: durationAgg._avg.duration || 0,
      qualifiedCalls: qualified,
      qualificationRate: total > 0 ? qualified / total : 0,
      byOutcome: Object.fromEntries(byOutcome.map((o) => [o.outcome || 'NONE', o._count])),
      byHour: [], // Would need raw SQL for hourly breakdown
    };
  }

  async attributeCallToMailPiece(
    callId: string,
    mailPieceId: string,
  ) {
    const call = await this.findOne(callId);

    if (call.mailPieceId) {
      throw new Error('Call already attributed to a mail piece');
    }

    return this.prisma.callEvent.update({
      where: { id: callId },
      data: { mailPieceId },
    });
  }

  async getRecentCallsForProperty(propertyId: string, limit: number = 10) {
    return this.prisma.callEvent.findMany({
      where: {
        mailPiece: { propertyId },
      },
      orderBy: { startTime: 'desc' },
      take: limit,
      include: {
        assignee: { select: { name: true } },
        talkTrack: { select: { name: true } },
      },
    });
  }
}
