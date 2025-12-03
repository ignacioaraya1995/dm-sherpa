import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { DealStatus, DealType } from '@prisma/client';

export interface CashCycleProjectionDto {
  period: { start: Date; end: Date };
  weekly: Array<{
    weekStart: Date;
    projectedSpend: number;
    projectedLeads: number;
    projectedContracts: number;
    projectedCashIn: number;
    netCashFlow: number;
    cumulativeCashPosition: number;
  }>;
  summary: {
    totalProjectedSpend: number;
    totalProjectedRevenue: number;
    breakEvenWeek: number | null;
    peakCashOutlay: number;
  };
}

export interface CashCycleAnalysisDto {
  accountId: string;
  byDealType: Array<{
    dealType: DealType;
    avgSpendToLead: number;
    avgLeadToContract: number;
    avgContractToClose: number;
    avgCloseToCase: number;
    totalCycleDays: number;
    sampleSize: number;
  }>;
  overall: {
    avgTotalCycleDays: number;
    stdDevCycleDays: number;
    p50CycleDays: number;
    p90CycleDays: number;
  };
}

@Injectable()
export class CashCycleService {
  constructor(private readonly prisma: PrismaService) {}

  async analyzeCashCycle(
    accountId: string,
    periodDays: number = 365,
  ): Promise<CashCycleAnalysisDto> {
    const since = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

    // Get closed deals with timing data
    const deals = await this.prisma.deal.findMany({
      where: {
        accountId,
        status: DealStatus.CLOSED,
        closeDate: { gte: since, not: null },
        contractDate: { not: null },
      },
      select: {
        type: true,
        contractDate: true,
        closeDate: true,
        cashReceivedDate: true,
        daysToClose: true,
        attributedVariantId: true,
      },
    });

    // Get mail piece dates for spend-to-lead calculation
    const dealCycles: Array<{
      type: DealType;
      spendToLead: number;
      leadToContract: number;
      contractToClose: number;
      closeToCash: number;
    }> = [];

    for (const deal of deals) {
      if (!deal.contractDate || !deal.closeDate) continue;

      // Try to find the attributed mail piece for spend date
      let spendDate = deal.contractDate;
      if (deal.attributedVariantId) {
        const mailPiece = await this.prisma.mailPiece.findFirst({
          where: {
            variantId: deal.attributedVariantId,
          },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        });
        if (mailPiece) {
          spendDate = mailPiece.createdAt;
        }
      }

      // Calculate cycle components
      const spendToLead = Math.ceil(
        (deal.contractDate.getTime() - spendDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      const leadToContract = 7; // Estimate: typically a week from first call to contract
      const contractToClose = deal.daysToClose || Math.ceil(
        (deal.closeDate.getTime() - deal.contractDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      const closeToCash = deal.cashReceivedDate
        ? Math.ceil(
            (deal.cashReceivedDate.getTime() - deal.closeDate.getTime()) / (1000 * 60 * 60 * 24),
          )
        : 3; // Default 3 days

      dealCycles.push({
        type: deal.type,
        spendToLead: Math.max(0, spendToLead),
        leadToContract,
        contractToClose,
        closeToCash,
      });
    }

    // Group by deal type
    const byType = new Map<DealType, typeof dealCycles>();
    for (const cycle of dealCycles) {
      const existing = byType.get(cycle.type) || [];
      existing.push(cycle);
      byType.set(cycle.type, existing);
    }

    const byDealType = Array.from(byType.entries()).map(([type, cycles]) => ({
      dealType: type,
      avgSpendToLead: this.average(cycles.map((c) => c.spendToLead)),
      avgLeadToContract: this.average(cycles.map((c) => c.leadToContract)),
      avgContractToClose: this.average(cycles.map((c) => c.contractToClose)),
      avgCloseToCase: this.average(cycles.map((c) => c.closeToCash)),
      totalCycleDays: this.average(
        cycles.map((c) => c.spendToLead + c.leadToContract + c.contractToClose + c.closeToCash),
      ),
      sampleSize: cycles.length,
    }));

    // Overall stats
    const allCycles = dealCycles.map(
      (c) => c.spendToLead + c.leadToContract + c.contractToClose + c.closeToCash,
    );
    const sortedCycles = [...allCycles].sort((a, b) => a - b);

    return {
      accountId,
      byDealType,
      overall: {
        avgTotalCycleDays: this.average(allCycles),
        stdDevCycleDays: this.stdDev(allCycles),
        p50CycleDays: this.percentile(sortedCycles, 50),
        p90CycleDays: this.percentile(sortedCycles, 90),
      },
    };
  }

  async projectCashFlow(
    accountId: string,
    weeksAhead: number = 12,
  ): Promise<CashCycleProjectionDto> {
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + weeksAhead * 7 * 24 * 60 * 60 * 1000);

    // Get historical averages
    const analysis = await this.analyzeCashCycle(accountId);
    const avgCycleDays = analysis.overall.avgTotalCycleDays || 60;

    // Get active campaigns with budgets
    const activeCampaigns = await this.prisma.campaign.findMany({
      where: {
        accountId,
        status: { in: ['ACTIVE', 'SCHEDULED'] },
      },
      select: {
        totalBudget: true,
        spentBudget: true,
        startDate: true,
        endDate: true,
        totalMailed: true,
        grossProfit: true,
      },
    });

    // Get pipeline deals
    const pipelineDeals = await this.prisma.deal.findMany({
      where: {
        accountId,
        status: { in: [DealStatus.PENDING, DealStatus.UNDER_CONTRACT, DealStatus.DUE_DILIGENCE] },
      },
      select: {
        contractPrice: true,
        grossProfit: true,
        contractDate: true,
        daysToClose: true,
      },
    });

    const weekly: CashCycleProjectionDto['weekly'] = [];
    let cumulativeCashPosition = 0;
    let peakCashOutlay = 0;
    let breakEvenWeek: number | null = null;
    let totalSpend = 0;
    let totalRevenue = 0;

    for (let week = 0; week < weeksAhead; week++) {
      const weekStart = new Date(startDate.getTime() + week * 7 * 24 * 60 * 60 * 1000);

      // Estimate weekly spend from active campaigns
      const weeklySpend = activeCampaigns.reduce((sum, c) => {
        const remaining = Number(c.totalBudget) - Number(c.spentBudget);
        const weeksRemaining = c.endDate
          ? Math.ceil((c.endDate.getTime() - weekStart.getTime()) / (7 * 24 * 60 * 60 * 1000))
          : 8;
        return sum + (remaining > 0 ? remaining / weeksRemaining : 0);
      }, 0);

      // Estimate leads and contracts based on historical rates
      const projectedLeads = weeklySpend * 0.01; // 1% response rate
      const projectedContracts = projectedLeads * 0.25; // 25% contract rate

      // Project cash in from pipeline deals likely to close this week
      let projectedCashIn = 0;
      for (const deal of pipelineDeals) {
        if (!deal.contractDate) continue;
        const expectedCloseWeek = Math.ceil(
          (deal.contractDate.getTime() - startDate.getTime() + (deal.daysToClose || avgCycleDays) * 24 * 60 * 60 * 1000) /
            (7 * 24 * 60 * 60 * 1000),
        );
        if (expectedCloseWeek === week) {
          projectedCashIn += Number(deal.grossProfit) || 0;
        }
      }

      const netCashFlow = projectedCashIn - weeklySpend;
      cumulativeCashPosition += netCashFlow;
      totalSpend += weeklySpend;
      totalRevenue += projectedCashIn;

      if (cumulativeCashPosition < peakCashOutlay) {
        peakCashOutlay = cumulativeCashPosition;
      }

      if (cumulativeCashPosition >= 0 && breakEvenWeek === null && week > 0) {
        breakEvenWeek = week;
      }

      weekly.push({
        weekStart,
        projectedSpend: weeklySpend,
        projectedLeads,
        projectedContracts,
        projectedCashIn,
        netCashFlow,
        cumulativeCashPosition,
      });
    }

    return {
      period: { start: startDate, end: endDate },
      weekly,
      summary: {
        totalProjectedSpend: totalSpend,
        totalProjectedRevenue: totalRevenue,
        breakEvenWeek,
        peakCashOutlay: Math.abs(peakCashOutlay),
      },
    };
  }

  async updateCashCycleProfile(accountId: string, dealType: DealType) {
    const analysis = await this.analyzeCashCycle(accountId);
    const typeData = analysis.byDealType.find((t) => t.dealType === dealType);

    if (!typeData || typeData.sampleSize < 5) return null;

    const now = new Date();
    const periodStart = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    return this.prisma.cashCycleProfile.upsert({
      where: {
        accountId_dealType_periodStart: {
          accountId,
          dealType,
          periodStart,
        },
      },
      update: {
        avgSpendToLead: Math.round(typeData.avgSpendToLead),
        avgLeadToContract: Math.round(typeData.avgLeadToContract),
        avgContractToClose: Math.round(typeData.avgContractToClose),
        avgCloseToCase: Math.round(typeData.avgCloseToCase),
        avgTotalCycleDays: Math.round(typeData.totalCycleDays),
        dealsAnalyzed: typeData.sampleSize,
        periodEnd: now,
      },
      create: {
        accountId,
        dealType,
        avgSpendToLead: Math.round(typeData.avgSpendToLead),
        avgLeadToContract: Math.round(typeData.avgLeadToContract),
        avgContractToClose: Math.round(typeData.avgContractToClose),
        avgCloseToCase: Math.round(typeData.avgCloseToCase),
        avgTotalCycleDays: Math.round(typeData.totalCycleDays),
        dealsAnalyzed: typeData.sampleSize,
        periodStart,
        periodEnd: now,
      },
    });
  }

  private average(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private stdDev(values: number[]): number {
    if (values.length < 2) return 0;
    const avg = this.average(values);
    const squareDiffs = values.map((v) => Math.pow(v - avg, 2));
    return Math.sqrt(this.average(squareDiffs));
  }

  private percentile(sortedValues: number[], p: number): number {
    if (sortedValues.length === 0) return 0;
    const index = Math.ceil((p / 100) * sortedValues.length) - 1;
    return sortedValues[Math.max(0, index)];
  }
}
