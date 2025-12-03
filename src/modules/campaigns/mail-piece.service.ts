import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PaginationDto, PaginatedResponseDto } from '@/common/dto/pagination.dto';
import { MailStatus, MailEventType, Prisma } from '@prisma/client';

export interface CreateMailPieceDto {
  batchId: string;
  variantId: string;
  propertyId: string;
  designVersionId?: string;
  offerStrategyId?: string;
  offerAmount?: number;
  offerPercent?: number;
  phoneNumberId?: string;
  trackingNumber?: string;
}

@Injectable()
export class MailPieceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateMailPieceDto) {
    const mailPiece = await this.prisma.mailPiece.create({
      data: {
        batchId: dto.batchId,
        variantId: dto.variantId,
        propertyId: dto.propertyId,
        designVersionId: dto.designVersionId,
        offerStrategyId: dto.offerStrategyId,
        offerAmount: dto.offerAmount,
        offerPercent: dto.offerPercent,
        phoneNumberId: dto.phoneNumberId,
        trackingNumber: dto.trackingNumber,
      },
    });

    // Create initial event
    await this.addEvent(mailPiece.id, MailEventType.CREATED);

    return mailPiece;
  }

  async createMany(pieces: CreateMailPieceDto[]) {
    const result = await this.prisma.mailPiece.createMany({
      data: pieces,
      skipDuplicates: true,
    });

    return { created: result.count };
  }

  async findAll(
    pagination: PaginationDto,
    filters?: {
      batchId?: string;
      variantId?: string;
      propertyId?: string;
      status?: MailStatus;
    },
  ) {
    const where: Prisma.MailPieceWhereInput = {};

    if (filters?.batchId) where.batchId = filters.batchId;
    if (filters?.variantId) where.variantId = filters.variantId;
    if (filters?.propertyId) where.propertyId = filters.propertyId;
    if (filters?.status) where.status = filters.status;

    const [pieces, total] = await Promise.all([
      this.prisma.mailPiece.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: pagination.sortOrder },
        include: {
          property: {
            select: {
              id: true,
              streetAddress: true,
              city: true,
              state: true,
              avmValue: true,
            },
          },
          variant: { select: { id: true, name: true } },
        },
      }),
      this.prisma.mailPiece.count({ where }),
    ]);

    return new PaginatedResponseDto(pieces, total, pagination);
  }

  async findOne(id: string) {
    const mailPiece = await this.prisma.mailPiece.findUnique({
      where: { id },
      include: {
        batch: { select: { id: true, batchNumber: true } },
        variant: { select: { id: true, name: true, campaign: { select: { id: true, name: true } } } },
        property: {
          include: {
            owner: true,
            distressFlags: { where: { isActive: true } },
          },
        },
        designVersion: { include: { template: true } },
        offerStrategy: true,
        phoneNumber: { select: { id: true, number: true } },
        events: { orderBy: { timestamp: 'desc' } },
        calls: { orderBy: { startTime: 'desc' }, take: 5 },
      },
    });

    if (!mailPiece) {
      throw new NotFoundException(`Mail piece with ID ${id} not found`);
    }

    return mailPiece;
  }

  async updateStatus(id: string, status: MailStatus) {
    await this.findOne(id);

    const mailPiece = await this.prisma.mailPiece.update({
      where: { id },
      data: { status },
    });

    // Map status to event type
    const eventTypeMap: Partial<Record<MailStatus, MailEventType>> = {
      QUEUED: MailEventType.CREATED,
      PRINTING: MailEventType.PRINTED,
      MAILED: MailEventType.MAILED,
      IN_TRANSIT: MailEventType.IN_TRANSIT,
      DELIVERED: MailEventType.DELIVERED,
      RETURNED: MailEventType.RETURNED_TO_SENDER,
    };

    if (eventTypeMap[status]) {
      await this.addEvent(id, eventTypeMap[status]!);
    }

    // Update variant metrics on delivery
    if (status === MailStatus.DELIVERED) {
      await this.prisma.variant.update({
        where: { id: mailPiece.variantId },
        data: {
          piecesDelivered: { increment: 1 },
        },
      });
    }

    this.eventEmitter.emit('mail.status.updated', { mailPieceId: id, status });

    return mailPiece;
  }

  async addEvent(
    mailPieceId: string,
    eventType: MailEventType,
    metadata?: { location?: string; data?: Record<string, unknown> },
  ) {
    return this.prisma.mailEvent.create({
      data: {
        mailPieceId,
        eventType,
        location: metadata?.location,
        metadata: metadata?.data || {},
      },
    });
  }

  async getEvents(mailPieceId: string) {
    return this.prisma.mailEvent.findMany({
      where: { mailPieceId },
      orderBy: { timestamp: 'desc' },
    });
  }

  async recordCost(
    id: string,
    costs: { printCost?: number; postageCost?: number },
  ) {
    const totalCost = (costs.printCost || 0) + (costs.postageCost || 0);

    return this.prisma.mailPiece.update({
      where: { id },
      data: {
        printCost: costs.printCost,
        postageCost: costs.postageCost,
        totalCost,
      },
    });
  }

  async getDeliveryStats(batchId: string) {
    const [total, byStatus] = await Promise.all([
      this.prisma.mailPiece.count({ where: { batchId } }),
      this.prisma.mailPiece.groupBy({
        by: ['status'],
        where: { batchId },
        _count: true,
      }),
    ]);

    const statusCounts = Object.fromEntries(
      byStatus.map((s) => [s.status, s._count]),
    );

    return {
      total,
      statusCounts,
      deliveryRate: total > 0 ? (statusCounts.DELIVERED || 0) / total : 0,
      returnRate: total > 0 ? ((statusCounts.RETURNED || 0) + (statusCounts.UNDELIVERABLE || 0)) / total : 0,
    };
  }

  async bulkUpdateStatus(ids: string[], status: MailStatus) {
    const result = await this.prisma.mailPiece.updateMany({
      where: { id: { in: ids } },
      data: { status },
    });

    return { updated: result.count };
  }

  async getUndeliveredPieces(batchId: string, olderThanDays: number = 14) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - olderThanDays);

    return this.prisma.mailPiece.findMany({
      where: {
        batchId,
        status: { in: [MailStatus.MAILED, MailStatus.IN_TRANSIT] },
        createdAt: { lt: cutoff },
      },
      include: {
        property: {
          select: { id: true, streetAddress: true, city: true, state: true },
        },
      },
    });
  }
}
