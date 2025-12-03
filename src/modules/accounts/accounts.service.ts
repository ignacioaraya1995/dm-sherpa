import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CreateAccountDto, UpdateAccountDto, AccountStatsDto } from './dto/account.dto';
import { Prisma, CampaignStatus, DealStatus } from '@prisma/client';
import { PaginationDto, PaginatedResponseDto } from '@/common/dto/pagination.dto';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAccountDto) {
    return this.prisma.account.create({
      data: {
        name: dto.name,
        type: dto.type,
        settings: (dto.settings || {}) as Prisma.InputJsonValue,
      },
      include: {
        _count: {
          select: { users: true, campaigns: true, deals: true },
        },
      },
    });
  }

  async findAll(pagination: PaginationDto, filters?: { type?: string; status?: string }) {
    const where: Prisma.AccountWhereInput = {};

    if (filters?.type) {
      where.type = filters.type as Prisma.EnumAccountTypeFilter;
    }
    if (filters?.status) {
      where.status = filters.status as Prisma.EnumAccountStatusFilter;
    }

    const [accounts, total] = await Promise.all([
      this.prisma.account.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { [pagination.sortBy || 'createdAt']: pagination.sortOrder },
        include: {
          _count: {
            select: { users: true, campaigns: true, deals: true },
          },
        },
      }),
      this.prisma.account.count({ where }),
    ]);

    return new PaginatedResponseDto(accounts, total, pagination);
  }

  async findOne(id: string) {
    const account = await this.prisma.account.findUnique({
      where: { id },
      include: {
        users: {
          select: { id: true, name: true, email: true, role: true },
        },
        markets: {
          include: {
            market: true,
          },
        },
        _count: {
          select: {
            users: true,
            campaigns: true,
            deals: true,
            segments: true,
            phoneNumbers: true,
          },
        },
      },
    });

    if (!account) {
      throw new NotFoundException(`Account with ID ${id} not found`);
    }

    return account;
  }

  async update(id: string, dto: UpdateAccountDto) {
    await this.findOne(id);

    return this.prisma.account.update({
      where: { id },
      data: {
        name: dto.name,
        type: dto.type,
        status: dto.status,
        settings: dto.settings ? (dto.settings as Prisma.InputJsonValue) : undefined,
      },
      include: {
        _count: {
          select: { users: true, campaigns: true, deals: true },
        },
      },
    });
  }

  async delete(id: string) {
    const account = await this.findOne(id);

    // Check for active campaigns
    const activeCampaigns = await this.prisma.campaign.count({
      where: {
        accountId: id,
        status: { in: [CampaignStatus.ACTIVE, CampaignStatus.SCHEDULED] },
      },
    });

    if (activeCampaigns > 0) {
      throw new ConflictException(
        `Cannot delete account with ${activeCampaigns} active campaigns`,
      );
    }

    return this.prisma.account.delete({ where: { id } });
  }

  async getStats(id: string): Promise<AccountStatsDto> {
    await this.findOne(id);

    const [
      userCount,
      campaignStats,
      dealStats,
      mailStats,
    ] = await Promise.all([
      this.prisma.user.count({ where: { accountId: id } }),

      this.prisma.campaign.aggregate({
        where: { accountId: id },
        _count: true,
        _sum: {
          totalMailed: true,
          totalCalls: true,
          totalContracts: true,
          grossProfit: true,
        },
      }),

      this.prisma.deal.aggregate({
        where: { accountId: id },
        _count: true,
        _sum: { grossProfit: true },
      }),

      this.prisma.campaign.count({
        where: { accountId: id, status: CampaignStatus.ACTIVE },
      }),
    ]);

    const closedDeals = await this.prisma.deal.count({
      where: { accountId: id, status: DealStatus.CLOSED },
    });

    const totalMailed = Number(campaignStats._sum.totalMailed) || 0;
    const totalCalls = Number(campaignStats._sum.totalCalls) || 0;
    const totalContracts = Number(campaignStats._sum.totalContracts) || 0;

    return {
      totalUsers: userCount,
      totalCampaigns: campaignStats._count,
      activeCampaigns: mailStats,
      totalDeals: dealStats._count,
      closedDeals,
      totalGrossProfit: Number(dealStats._sum.grossProfit) || 0,
      totalMailedPieces: totalMailed,
      overallResponseRate: totalMailed > 0 ? totalCalls / totalMailed : 0,
      overallContractRate: totalMailed > 0 ? totalContracts / totalMailed : 0,
    };
  }

  async addMarket(accountId: string, marketId: string, settings?: {
    avmBiasFactor?: number;
    minSpread?: number;
    maxArv?: number;
  }) {
    await this.findOne(accountId);

    return this.prisma.accountMarket.upsert({
      where: {
        accountId_marketId: { accountId, marketId },
      },
      update: {
        ...settings,
        isActive: true,
      },
      create: {
        accountId,
        marketId,
        ...settings,
      },
      include: {
        market: true,
      },
    });
  }

  async removeMarket(accountId: string, marketId: string) {
    await this.prisma.accountMarket.update({
      where: {
        accountId_marketId: { accountId, marketId },
      },
      data: { isActive: false },
    });
  }
}
