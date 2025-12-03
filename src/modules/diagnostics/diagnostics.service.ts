import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { HypothesisGeneratorService, Hypothesis } from './hypothesis-generator.service';
import type { Prisma } from '@prisma/client';

export interface DiagnosticMetrics {
  mail: {
    totalMailed: number;
    deliveryRate: number;
    avgCostPerPiece: number;
  };
  response: {
    totalCalls: number;
    responseRate: number;
    qualifiedRate: number;
  };
  conversion: {
    contracts: number;
    contractRate: number;
    closeRate: number;
  };
  financial: {
    totalSpend: number;
    grossProfit: number;
    roi: number;
    costPerContract: number;
  };
}

export interface WhatChangedDto {
  currentPeriod: { start: Date; end: Date };
  previousPeriod: { start: Date; end: Date };
  currentMetrics: DiagnosticMetrics;
  previousMetrics: DiagnosticMetrics;
  changes: MetricChange[];
  hypotheses: Hypothesis[];
  recommendations: string[];
}

export interface MetricChange {
  metric: string;
  previousValue: number;
  currentValue: number;
  absoluteChange: number;
  percentChange: number;
  direction: 'up' | 'down' | 'stable';
  significance: 'high' | 'medium' | 'low';
}

@Injectable()
export class DiagnosticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly hypothesisGenerator: HypothesisGeneratorService,
  ) {}

  async whatChanged(
    accountId: string,
    currentStart: Date,
    currentEnd: Date,
  ): Promise<WhatChangedDto> {
    const periodLength = currentEnd.getTime() - currentStart.getTime();
    const previousStart = new Date(currentStart.getTime() - periodLength);
    const previousEnd = currentStart;

    const [currentMetrics, previousMetrics] = await Promise.all([
      this.calculateMetrics(accountId, currentStart, currentEnd),
      this.calculateMetrics(accountId, previousStart, previousEnd),
    ]);

    const changes = this.calculateChanges(previousMetrics, currentMetrics);

    const hypotheses = await this.hypothesisGenerator.generate(
      accountId,
      currentStart,
      currentEnd,
      previousStart,
      previousEnd,
      changes,
    );

    const recommendations = this.generateRecommendations(changes, hypotheses);

    // Save snapshot
    const user = await this.prisma.user.findFirst({ where: { account: { id: accountId } } });
    if (user) {
      await this.createSnapshot(accountId, user.id, currentStart, currentEnd, currentMetrics, hypotheses);
    }

    return {
      currentPeriod: { start: currentStart, end: currentEnd },
      previousPeriod: { start: previousStart, end: previousEnd },
      currentMetrics,
      previousMetrics,
      changes,
      hypotheses,
      recommendations,
    };
  }

  async calculateMetrics(
    accountId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<DiagnosticMetrics> {
    const campaigns = await this.prisma.campaign.aggregate({
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
    });

    const closedDeals = await this.prisma.deal.count({
      where: {
        accountId,
        status: 'CLOSED',
        closeDate: { gte: startDate, lte: endDate },
      },
    });

    const dealsGrossProfit = await this.prisma.deal.aggregate({
      where: {
        accountId,
        closeDate: { gte: startDate, lte: endDate },
      },
      _sum: { grossProfit: true },
    });

    const totalMailed = campaigns._sum.totalMailed || 0;
    const totalDelivered = campaigns._sum.totalDelivered || 0;
    const totalCalls = campaigns._sum.totalCalls || 0;
    const qualifiedLeads = campaigns._sum.totalQualifiedLeads || 0;
    const contracts = campaigns._sum.totalContracts || 0;
    const totalSpend = Number(campaigns._sum.spentBudget) || 0;
    const grossProfit = Number(dealsGrossProfit._sum.grossProfit) || 0;

    return {
      mail: {
        totalMailed,
        deliveryRate: totalMailed > 0 ? totalDelivered / totalMailed : 0,
        avgCostPerPiece: totalMailed > 0 ? totalSpend / totalMailed : 0,
      },
      response: {
        totalCalls,
        responseRate: totalDelivered > 0 ? totalCalls / totalDelivered : 0,
        qualifiedRate: totalCalls > 0 ? qualifiedLeads / totalCalls : 0,
      },
      conversion: {
        contracts,
        contractRate: totalDelivered > 0 ? contracts / totalDelivered : 0,
        closeRate: contracts > 0 ? closedDeals / contracts : 0,
      },
      financial: {
        totalSpend,
        grossProfit,
        roi: totalSpend > 0 ? (grossProfit - totalSpend) / totalSpend : 0,
        costPerContract: contracts > 0 ? totalSpend / contracts : 0,
      },
    };
  }

  private calculateChanges(
    previous: DiagnosticMetrics,
    current: DiagnosticMetrics,
  ): MetricChange[] {
    const changes: MetricChange[] = [];

    const metrics: Array<{ name: string; prev: number; curr: number; thresholds: [number, number] }> = [
      { name: 'Response Rate', prev: previous.response.responseRate, curr: current.response.responseRate, thresholds: [0.1, 0.25] },
      { name: 'Contract Rate', prev: previous.conversion.contractRate, curr: current.conversion.contractRate, thresholds: [0.1, 0.25] },
      { name: 'Close Rate', prev: previous.conversion.closeRate, curr: current.conversion.closeRate, thresholds: [0.1, 0.2] },
      { name: 'ROI', prev: previous.financial.roi, curr: current.financial.roi, thresholds: [0.15, 0.3] },
      { name: 'Cost Per Contract', prev: previous.financial.costPerContract, curr: current.financial.costPerContract, thresholds: [0.1, 0.2] },
      { name: 'Delivery Rate', prev: previous.mail.deliveryRate, curr: current.mail.deliveryRate, thresholds: [0.05, 0.1] },
      { name: 'Qualified Rate', prev: previous.response.qualifiedRate, curr: current.response.qualifiedRate, thresholds: [0.1, 0.2] },
    ];

    for (const m of metrics) {
      const absoluteChange = m.curr - m.prev;
      const percentChange = m.prev !== 0 ? absoluteChange / Math.abs(m.prev) : m.curr !== 0 ? 1 : 0;
      const absPercent = Math.abs(percentChange);

      let direction: 'up' | 'down' | 'stable' = 'stable';
      if (absoluteChange > 0.001) direction = 'up';
      else if (absoluteChange < -0.001) direction = 'down';

      let significance: 'high' | 'medium' | 'low' = 'low';
      if (absPercent >= m.thresholds[1]) significance = 'high';
      else if (absPercent >= m.thresholds[0]) significance = 'medium';

      changes.push({
        metric: m.name,
        previousValue: m.prev,
        currentValue: m.curr,
        absoluteChange,
        percentChange,
        direction,
        significance,
      });
    }

    return changes;
  }

  private generateRecommendations(changes: MetricChange[], hypotheses: Hypothesis[]): string[] {
    const recommendations: string[] = [];

    const significantChanges = changes.filter(c => c.significance === 'high');

    for (const change of significantChanges) {
      if (change.metric === 'Response Rate' && change.direction === 'down') {
        recommendations.push('Consider refreshing creative designs - low response often indicates list or creative fatigue');
      }
      if (change.metric === 'Contract Rate' && change.direction === 'down') {
        recommendations.push('Review talk tracks and offer strategies - conversion drop may indicate market mismatch');
      }
      if (change.metric === 'ROI' && change.direction === 'down') {
        recommendations.push('Audit cost structure and focus on highest-performing segments');
      }
    }

    for (const hypothesis of hypotheses.filter(h => h.confidence >= 0.7)) {
      switch (hypothesis.category) {
        case 'TELEPHONY_ISSUE':
          recommendations.push(`Address telephony issues: ${hypothesis.recommendations[0] || 'Review phone health'}`);
          break;
        case 'CREATIVE_FATIGUE':
          recommendations.push('Rotate creative variants - current designs may be fatigued');
          break;
        case 'LIST_SHIFT':
          recommendations.push('Review segment criteria and data source quality');
          break;
        case 'SEASONAL_PATTERN':
          recommendations.push('Adjust campaign timing based on seasonal patterns in your market');
          break;
        case 'OFFER_CHANGE':
          recommendations.push('Review offer strategy against current market conditions');
          break;
      }
    }

    return [...new Set(recommendations)];
  }

  async createSnapshot(
    accountId: string,
    createdById: string,
    periodStart: Date,
    periodEnd: Date,
    metrics: DiagnosticMetrics,
    hypotheses: Hypothesis[],
  ) {
    const snapshot = await this.prisma.diagnosticSnapshot.create({
      data: {
        accountId,
        createdById,
        snapshotType: 'RESPONSE_CHANGE',
        periodStart,
        periodEnd,
        metrics: metrics as unknown as Prisma.InputJsonValue,
        dimensionBreakdowns: {},
        status: 'COMPLETED',
        completedAt: new Date(),
        hypotheses: {
          create: hypotheses.map((h, index) => ({
            category: h.category,
            title: h.title,
            description: h.description,
            confidence: h.confidence,
            impactScore: h.impactScore,
            supportingMetrics: h.supportingMetrics as Prisma.InputJsonValue,
            recommendations: h.recommendations,
            rank: index + 1,
          })),
        },
      },
      include: {
        hypotheses: true,
      },
    });

    return snapshot;
  }

  async getSnapshots(accountId: string, limit: number = 10) {
    const snapshots = await this.prisma.diagnosticSnapshot.findMany({
      where: { accountId },
      include: { hypotheses: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return snapshots;
  }

  async compareMarkets(accountId: string, startDate: Date, endDate: Date) {
    const accountMarkets = await this.prisma.accountMarket.findMany({
      where: { accountId, isActive: true },
      include: { market: true },
    });

    const results = await Promise.all(
      accountMarkets.map(async (am) => {
        const campaigns = await this.prisma.campaign.aggregate({
          where: {
            accountId,
            createdAt: { gte: startDate, lte: endDate },
          },
          _sum: {
            totalMailed: true,
            totalCalls: true,
            totalContracts: true,
            totalDelivered: true,
          },
        });

        const totalMailed = campaigns._sum.totalMailed || 0;
        const totalDelivered = campaigns._sum.totalDelivered || 0;
        const totalCalls = campaigns._sum.totalCalls || 0;
        const contracts = campaigns._sum.totalContracts || 0;

        return {
          marketId: am.market.id,
          marketName: am.market.name,
          totalMailed,
          totalCalls,
          contracts,
          responseRate: totalDelivered > 0 ? totalCalls / totalDelivered : 0,
          contractRate: totalDelivered > 0 ? contracts / totalDelivered : 0,
        };
      }),
    );

    return results.sort((a, b) => b.contractRate - a.contractRate);
  }

  async compareVariants(accountId: string, startDate: Date, endDate: Date) {
    const variants = await this.prisma.variant.findMany({
      where: {
        campaign: {
          accountId,
          createdAt: { gte: startDate, lte: endDate },
        },
      },
      include: { campaign: true },
    });

    return variants.map((v) => ({
      variantId: v.id,
      variantName: v.name,
      campaignName: v.campaign.name,
      piecesMailed: v.piecesMailed,
      calls: v.calls,
      contracts: v.contracts,
      responseRate: v.piecesDelivered > 0 ? v.calls / v.piecesDelivered : 0,
      contractRate: v.piecesDelivered > 0 ? v.contracts / v.piecesDelivered : 0,
    })).sort((a, b) => b.contractRate - a.contractRate);
  }
}
