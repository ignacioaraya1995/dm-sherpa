import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PaginationDto, PaginatedResponseDto } from '@/common/dto/pagination.dto';
import {
  PhoneNumberType,
  PhoneStatus,
  RoutingType,
  Prisma,
} from '@prisma/client';

export interface CreatePhoneNumberDto {
  accountId: string;
  number: string;
  type: PhoneNumberType;
  region?: string;
  state?: string;
  areaCode?: string;
  providerId?: string;
  providerSid?: string;
}

export interface AssignPhoneNumberDto {
  phoneNumberId: string;
  campaignId?: string;
  variantId?: string;
  marketId?: string;
  routingType: RoutingType;
  routingTarget: string;
}

@Injectable()
export class TelephonyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createPhoneNumber(dto: CreatePhoneNumberDto) {
    // Check for duplicate
    const existing = await this.prisma.phoneNumber.findUnique({
      where: { number: dto.number },
    });

    if (existing) {
      throw new ConflictException(`Phone number ${dto.number} already exists`);
    }

    const phoneNumber = await this.prisma.phoneNumber.create({
      data: {
        accountId: dto.accountId,
        number: dto.number,
        type: dto.type,
        region: dto.region,
        state: dto.state,
        areaCode: dto.areaCode || dto.number.substring(0, 3),
        providerId: dto.providerId,
        providerSid: dto.providerSid,
      },
    });

    this.eventEmitter.emit('phone.created', { phoneNumber });

    return phoneNumber;
  }

  async findAll(
    accountId: string,
    pagination: PaginationDto,
    filters?: { status?: PhoneStatus; type?: PhoneNumberType; region?: string },
  ) {
    const where: Prisma.PhoneNumberWhereInput = { accountId };

    if (filters?.status) where.status = filters.status;
    if (filters?.type) where.type = filters.type;
    if (filters?.region) where.region = filters.region;

    const [phoneNumbers, total] = await Promise.all([
      this.prisma.phoneNumber.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: pagination.sortOrder },
        include: {
          assignments: {
            where: { isActive: true },
            take: 1,
          },
          _count: { select: { calls: true } },
        },
      }),
      this.prisma.phoneNumber.count({ where }),
    ]);

    return new PaginatedResponseDto(phoneNumbers, total, pagination);
  }

  async findOne(id: string) {
    const phoneNumber = await this.prisma.phoneNumber.findUnique({
      where: { id },
      include: {
        account: { select: { id: true, name: true } },
        assignments: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        healthLogs: {
          orderBy: { timestamp: 'desc' },
          take: 10,
        },
        _count: {
          select: { calls: true, mailPieces: true },
        },
      },
    });

    if (!phoneNumber) {
      throw new NotFoundException(`Phone number with ID ${id} not found`);
    }

    return phoneNumber;
  }

  async updateStatus(id: string, status: PhoneStatus) {
    await this.findOne(id);

    return this.prisma.phoneNumber.update({
      where: { id },
      data: { status },
    });
  }

  async assignToRoute(dto: AssignPhoneNumberDto) {
    const phoneNumber = await this.findOne(dto.phoneNumberId);

    // Deactivate existing active assignment
    await this.prisma.phoneNumberAssignment.updateMany({
      where: {
        phoneNumberId: dto.phoneNumberId,
        isActive: true,
      },
      data: {
        isActive: false,
        endDate: new Date(),
      },
    });

    // Create new assignment
    const assignment = await this.prisma.phoneNumberAssignment.create({
      data: {
        phoneNumberId: dto.phoneNumberId,
        campaignId: dto.campaignId,
        variantId: dto.variantId,
        marketId: dto.marketId,
        routingType: dto.routingType,
        routingTarget: dto.routingTarget,
      },
    });

    this.eventEmitter.emit('phone.assigned', {
      phoneNumber,
      assignment,
    });

    return assignment;
  }

  async unassign(phoneNumberId: string) {
    await this.findOne(phoneNumberId);

    await this.prisma.phoneNumberAssignment.updateMany({
      where: {
        phoneNumberId,
        isActive: true,
      },
      data: {
        isActive: false,
        endDate: new Date(),
      },
    });
  }

  async getAssignment(phoneNumberId: string) {
    return this.prisma.phoneNumberAssignment.findFirst({
      where: {
        phoneNumberId,
        isActive: true,
      },
    });
  }

  async findByNumber(number: string) {
    const phoneNumber = await this.prisma.phoneNumber.findUnique({
      where: { number },
      include: {
        assignments: {
          where: { isActive: true },
          include: {
            // Include campaign/variant info for routing
          },
        },
      },
    });

    if (!phoneNumber) {
      throw new NotFoundException(`Phone number ${number} not found`);
    }

    return phoneNumber;
  }

  async getPhoneNumbersByRegion(accountId: string) {
    const phoneNumbers = await this.prisma.phoneNumber.groupBy({
      by: ['region'],
      where: { accountId },
      _count: true,
    });

    const byStatus = await this.prisma.phoneNumber.groupBy({
      by: ['region', 'status'],
      where: { accountId },
      _count: true,
    });

    return phoneNumbers.map((r) => ({
      region: r.region,
      total: r._count,
      byStatus: byStatus
        .filter((s) => s.region === r.region)
        .map((s) => ({ status: s.status, count: s._count })),
    }));
  }

  async delete(id: string) {
    const phoneNumber = await this.findOne(id);

    // Check if phone has active assignments or recent calls
    if (phoneNumber._count.calls > 0) {
      throw new ConflictException(
        'Cannot delete phone number with call history. Deactivate instead.',
      );
    }

    return this.prisma.phoneNumber.delete({ where: { id } });
  }

  async bulkCreate(phoneNumbers: CreatePhoneNumberDto[]) {
    const results = {
      created: 0,
      skipped: 0,
      errors: [] as string[],
    };

    for (const dto of phoneNumbers) {
      try {
        await this.createPhoneNumber(dto);
        results.created++;
      } catch (error) {
        if (error instanceof ConflictException) {
          results.skipped++;
        } else {
          results.errors.push(`${dto.number}: ${error}`);
        }
      }
    }

    return results;
  }
}
