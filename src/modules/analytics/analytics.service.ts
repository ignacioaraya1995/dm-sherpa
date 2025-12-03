import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { DealStatus, CampaignStatus } from '@prisma/client';

export interface PerformanceDashboardDto {
  period: { start: Date; end: Date };
  mailMetrics: {
    totalMailed: number;
    totalDelivered: number;
    deliveryRate: number;
    avgCostPerPiece: number;
  };
  responseMetrics: {
    totalCalls: number;
    responseRate: number;
    qualifiedLeads: number;
    qualificationRate: number;
  };
  conversionMetrics: {
    contracts: number;
    contractRate: number;
    closedDeals: number;
    closeRate: number;
  };
  financialMetrics: {
    totalSpend: number;
    grossProfit: number;
    netProfit: number;
    roi: number;
    costPerLead: number;
    costPerContract: number;
  };
  trendsVsPreviousPeriod: {
    responseRateChange: number;
    contractRateChange: number;
    roiChange: number;
  };
}

export interface AttributionReportDto {
  period: { start: Date; end: Date };
  byCampaign: Array<{
    campaignId: string;
    campaignName: string;
    deals: number;
    revenue: number;
    profit: number;
    roi: number;
  }>;
  byVariant: Array<{
    variantId: string;
    variantName: string;
    campaignName: string;
    deals: number;
    avgSpread: number;
    profitPerPiece: number;
  }>;
  byDistressType: Array<{
    distressType: string;
    deals: number;
    avgSpread: number;
    avgDaysToClose: number;
  }>;
  longTailAttribution: {
    q4MailQ1Deals: number;
    avgAttributionWindowDays: number;
  };
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPerformanceDashboard(
    accountId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<PerformanceDashboardDto> {
    // Current period metrics
    const [campaigns, deals, mailStats] = await Promise.all([
      this.prisma.campaign.aggregate({
        where: {
          accountId,
          createdAt: { gte: startDate, lte: endDate },
        },
        _sum: {
          totalMailed: true,
          totalDelivered: true,
          totalCalls: true,
          totalQualifiedLeads: true,
          totalContracts: true,
          spentBudget: true,
          grossProfit: true,
        },
      }),

      this.prisma.deal.aggregate({
        where: {
          accountId,
          contractDate: { gte: startDate, lte: endDate },
        },
        _count: true,
        _sum: { grossProfit: true, netProfit: true },
      }),

      this.prisma.deal.count({
        where: {
          accountId,
          status: DealStatus.CLOSED,
          closeDate: { gte: startDate, lte: endDate },
        },
      }),
    ]);

    // Previous period for comparison
    const periodLength = endDate.getTime() - startDate.getTime();
    const prevStart = new Date(startDate.getTime() - periodLength);
    const prevEnd = startDate;

    const prevCampaigns = await this.prisma.campaign.aggregate({
      where: {
        accountId,
        createdAt: { gte: prevStart, lte: prevEnd },
      },
      _sum: {
        totalMailed: true,
        totalDelivered: true,
        totalCalls: true,
        totalContracts: true,
        spentBudget: true,
        grossProfit: true,
      },
    });

    const totalMailed = campaigns._sum.totalMailed || 0;
    const totalDelivered = campaigns._sum.totalDelivered || 0;
    const totalCalls = campaigns._sum.totalCalls || 0;
    const qualifiedLeads = campaigns._sum.totalQualifiedLeads || 0;
    const contracts = campaigns._sum.totalContracts || 0;
    const totalSpend = Number(campaigns._sum.spentBudget) || 0;
    const grossProfit = Number(deals._sum.grossProfit) || 0;
    const netProfit = Number(deals._sum.netProfit) || 0;

    const responseRate = totalDelivered > 0 ? totalCalls / totalDelivered : 0;
    const contractRate = totalDelivered > 0 ? contracts / totalDelivered : 0;
    const roi = totalSpend > 0 ? (grossProfit - totalSpend) / totalSpend : 0;

    // Previous period rates
    const prevDelivered = prevCampaigns._sum.totalDelivered || 0;
    const prevCalls = prevCampaigns._sum.totalCalls || 0;
    const prevContracts = prevCampaigns._sum.totalContracts || 0;
    const prevSpend = Number(prevCampaigns._sum.spentBudget) || 0;
    const prevProfit = Number(prevCampaigns._sum.grossProfit) || 0;

    const prevResponseRate = prevDelivered > 0 ? prevCalls / prevDelivered : 0;
    const prevContractRate = prevDelivered > 0 ? prevContracts / prevDelivered : 0;
    const prevRoi = prevSpend > 0 ? (prevProfit - prevSpend) / prevSpend : 0;

    return {
      period: { start: startDate, end: endDate },
      mailMetrics: {
        totalMailed,
        totalDelivered,
        deliveryRate: totalMailed > 0 ? totalDelivered / totalMailed : 0,
        avgCostPerPiece: totalMailed > 0 ? totalSpend / totalMailed : 0,
      },
      responseMetrics: {
        totalCalls,
        responseRate,
        qualifiedLeads,
        qualificationRate: totalCalls > 0 ? qualifiedLeads / totalCalls : 0,
      },
      conversionMetrics: {
        contracts,
        contractRate,
        closedDeals: mailStats,
        closeRate: contracts > 0 ? mailStats / contracts : 0,
      },
      financialMetrics: {
        totalSpend,
        grossProfit,
        netProfit,
        roi,
        costPerLead: totalCalls > 0 ? totalSpend / totalCalls : 0,
        costPerContract: contracts > 0 ? totalSpend / contracts : 0,
      },
      trendsVsPreviousPeriod: {
        responseRateChange: prevResponseRate > 0 ? (responseRate - prevResponseRate) / prevResponseRate : 0,
        contractRateChange: prevContractRate > 0 ? (contractRate - prevContractRate) / prevContractRate : 0,
        roiChange: prevRoi !== 0 ? (roi - prevRoi) / Math.abs(prevRoi) : 0,
      },
    };
  }

  async getAttributionReport(
    accountId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<AttributionReportDto> {
    const [byCampaign, byVariant, byDistress] = await Promise.all([
      // By campaign
      this.prisma.deal.groupBy({
        by: ['attributedCampaignId'],
        where: {
          accountId,
          contractDate: { gte: startDate, lte: endDate },
          attributedCampaignId: { not: null },
        },
        _count: true,
        _sum: { grossProfit: true, contractPrice: true },
      }),

      // By variant
      this.prisma.deal.groupBy({
        by: ['attributedVariantId'],
        where: {
          accountId,
          contractDate: { gte: startDate, lte: endDate },
          attributedVariantId: { not: null },
        },
        _count: true,
        _sum: { grossProfit: true },
        _avg: { grossProfit: true },
      }),

      // By distress type (requires join)
      this.prisma.$queryRaw<Array<{ type: string; count: bigint; avg_spread: number; avg_days: number }>>`
        SELECT df.type, COUNT(d.id) as count, AVG(d."grossProfit") as avg_spread, AVG(d."daysToClose") as avg_days
        FROM "Deal" d
        JOIN "Property" p ON d."propertyId" = p.id
        JOIN "DistressFlag" df ON p.id = df."propertyId"
        WHERE d."accountId" = ${accountId}
          AND d."contractDate" >= ${startDate}
          AND d."contractDate" <= ${endDate}
          AND df."isActive" = true
        GROUP BY df.type
      `,
    ]);

    // Get campaign and variant names
    const campaignIds = byCampaign
      .map((c) => c.attributedCampaignId)
      .filter((id): id is string => id !== null);
    const variantIds = byVariant
      .map((v) => v.attributedVariantId)
      .filter((id): id is string => id !== null);

    const [campaigns, variants] = await Promise.all([
      this.prisma.campaign.findMany({
        where: { id: { in: campaignIds } },
        select: { id: true, name: true, spentBudget: true },
      }),
      this.prisma.variant.findMany({
        where: { id: { in: variantIds } },
        select: { id: true, name: true, piecesMailed: true, campaign: { select: { name: true } } },
      }),
    ]);

    const campaignMap = new Map(campaigns.map((c) => [c.id, c]));
    const variantMap = new Map(variants.map((v) => [v.id, v]));

    // Long-tail attribution: Q4 mail leading to Q1 deals
    const q4Start = new Date(endDate.getFullYear() - 1, 9, 1); // Oct 1 of previous year
    const q4End = new Date(endDate.getFullYear() - 1, 11, 31); // Dec 31
    const q1Start = new Date(endDate.getFullYear(), 0, 1); // Jan 1
    const q1End = new Date(endDate.getFullYear(), 2, 31); // Mar 31

    const longTailDeals = await this.prisma.deal.count({
      where: {
        accountId,
        contractDate: { gte: q1Start, lte: q1End },
        property: {
          mailPieces: {
            some: {
              createdAt: { gte: q4Start, lte: q4End },
            },
          },
        },
      },
    });

    return {
      period: { start: startDate, end: endDate },
      byCampaign: byCampaign.map((c) => {
        const campaign = campaignMap.get(c.attributedCampaignId!);
        const spend = Number(campaign?.spentBudget) || 1;
        const profit = Number(c._sum.grossProfit) || 0;
        return {
          campaignId: c.attributedCampaignId!,
          campaignName: campaign?.name || 'Unknown',
          deals: c._count,
          revenue: Number(c._sum.contractPrice) || 0,
          profit,
          roi: (profit - spend) / spend,
        };
      }),
      byVariant: byVariant.map((v) => {
        const variant = variantMap.get(v.attributedVariantId!);
        const mailed = variant?.piecesMailed || 1;
        return {
          variantId: v.attributedVariantId!,
          variantName: variant?.name || 'Unknown',
          campaignName: variant?.campaign?.name || 'Unknown',
          deals: v._count,
          avgSpread: Number(v._avg.grossProfit) || 0,
          profitPerPiece: Number(v._sum.grossProfit) / mailed || 0,
        };
      }),
      byDistressType: byDistress.map((d) => ({
        distressType: d.type,
        deals: Number(d.count),
        avgSpread: d.avg_spread || 0,
        avgDaysToClose: d.avg_days || 0,
      })),
      longTailAttribution: {
        q4MailQ1Deals: longTailDeals,
        avgAttributionWindowDays: 45, // Would calculate from actual data
      },
    };
  }

  async getMarketComparison(accountId: string) {
    const markets = await this.prisma.campaign.groupBy({
      by: ['accountId'],
      where: { accountId },
      _sum: {
        totalMailed: true,
        totalCalls: true,
        totalContracts: true,
        grossProfit: true,
      },
    });

    // Would join with market data for comparison
    return markets;
  }
}
