import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { HypothesisGeneratorService, Hypothesis } from './hypothesis-generator.service';

export interface DiagnosticSnapshotDto {
  id: string;
  accountId: string;
  periodStart: Date;
  periodEnd: Date;
  metrics: DiagnosticMetrics;
  hypotheses: Hypothesis[];
  createdAt: Date;
}

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
    await this.createSnapshot(accountId, currentStart, currentEnd, currentMetrics, hypotheses);

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
    const [campaigns, deals] = await Promise.all([
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
        _sum: { grossProfit: true },
      }),
    ]);

    const closedDeals = await this.prisma.deal.count({
      where: {
        accountId,
        status: 'CLOSED',
        closeDate: { gte: startDate, lte: endDate },
      },
    });

    const totalMailed = campaigns._sum.totalMailed || 0;
    const totalDelivered = campaigns._sum.totalDelivered || 0;
    const totalCalls = campaigns._sum.totalCalls || 0;
    const qualifiedLeads = campaigns._sum.totalQualifiedLeads || 0;
    const contracts = campaigns._sum.totalContracts || 0;
    const totalSpend = Number(campaigns._sum.spentBudget) || 0;
    const grossProfit = Number(deals._sum.grossProfit) || 0;

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

    // Based on significant changes
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

    // Based on hypotheses
    for (const hypothesis of hypotheses.filter(h => h.confidence >= 0.7)) {
      switch (hypothesis.category) {
        case 'TELEPHONY_ISSUE':
          recommendations.push(`Address telephony issues: ${hypothesis.suggestedAction}`);
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

    return [...new Set(recommendations)]; // Deduplicate
  }

  async createSnapshot(
    accountId: string,
    periodStart: Date,
    periodEnd: Date,
    metrics: DiagnosticMetrics,
    hypotheses: Hypothesis[],
  ): Promise<DiagnosticSnapshotDto> {
    const snapshot = await this.prisma.diagnosticSnapshot.create({
      data: {
        accountId,
        periodStart,
        periodEnd,
        responseRate: metrics.response.responseRate,
        contractRate: metrics.conversion.contractRate,
        closeRate: metrics.conversion.closeRate,
        roi: metrics.financial.roi,
        avgDaysToClose: 0, // Would calculate from deals
        totalSpend: metrics.financial.totalSpend,
        grossProfit: metrics.financial.grossProfit,
        hypotheses: {
          create: hypotheses.map(h => ({
            category: h.category,
            title: h.title,
            description: h.description,
            confidence: h.confidence,
            impact: h.impact,
            suggestedAction: h.suggestedAction,
            evidenceData: h.evidence as object,
          })),
        },
      },
      include: {
        hypotheses: true,
      },
    });

    return {
      id: snapshot.id,
      accountId: snapshot.accountId,
      periodStart: snapshot.periodStart,
      periodEnd: snapshot.periodEnd,
      metrics,
      hypotheses,
      createdAt: snapshot.createdAt,
    };
  }

  async getSnapshots(
    accountId: string,
    limit: number = 10,
  ): Promise<DiagnosticSnapshotDto[]> {
    const snapshots = await this.prisma.diagnosticSnapshot.findMany({
      where: { accountId },
      include: { hypotheses: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return snapshots.map(s => ({
      id: s.id,
      accountId: s.accountId,
      periodStart: s.periodStart,
      periodEnd: s.periodEnd,
      metrics: {
        mail: {
          totalMailed: 0,
          deliveryRate: 0,
          avgCostPerPiece: 0,
        },
        response: {
          totalCalls: 0,
          responseRate: Number(s.responseRate),
          qualifiedRate: 0,
        },
        conversion: {
          contracts: 0,
          contractRate: Number(s.contractRate),
          closeRate: Number(s.closeRate),
        },
        financial: {
          totalSpend: Number(s.totalSpend),
          grossProfit: Number(s.grossProfit),
          roi: Number(s.roi),
          costPerContract: 0,
        },
      },
      hypotheses: s.hypotheses.map(h => ({
        category: h.category as Hypothesis['category'],
        title: h.title,
        description: h.description,
        confidence: h.confidence,
        impact: h.impact as Hypothesis['impact'],
        suggestedAction: h.suggestedAction || '',
        evidence: (h.evidenceData as Record<string, unknown>) || {},
      })),
      createdAt: s.createdAt,
    }));
  }

  async compareMarkets(accountId: string, startDate: Date, endDate: Date) {
    const marketStats = await this.prisma.$queryRaw<Array<{
      market_id: string;
      market_name: string;
      total_mailed: bigint;
      total_calls: bigint;
      contracts: bigint;
      response_rate: number;
      contract_rate: number;
    }>>`
      SELECT
        m.id as market_id,
        m.name as market_name,
        COALESCE(SUM(c."totalMailed"), 0) as total_mailed,
        COALESCE(SUM(c."totalCalls"), 0) as total_calls,
        COALESCE(SUM(c."totalContracts"), 0) as contracts,
        CASE WHEN SUM(c."totalDelivered") > 0
          THEN SUM(c."totalCalls")::float / SUM(c."totalDelivered")
          ELSE 0 END as response_rate,
        CASE WHEN SUM(c."totalDelivered") > 0
          THEN SUM(c."totalContracts")::float / SUM(c."totalDelivered")
          ELSE 0 END as contract_rate
      FROM "Market" m
      LEFT JOIN "Campaign" c ON c."marketId" = m.id
        AND c."createdAt" >= ${startDate}
        AND c."createdAt" <= ${endDate}
      WHERE m."accountId" = ${accountId}
      GROUP BY m.id, m.name
      ORDER BY contract_rate DESC
    `;

    return marketStats.map(m => ({
      marketId: m.market_id,
      marketName: m.market_name,
      totalMailed: Number(m.total_mailed),
      totalCalls: Number(m.total_calls),
      contracts: Number(m.contracts),
      responseRate: m.response_rate,
      contractRate: m.contract_rate,
    }));
  }

  async compareVariants(accountId: string, startDate: Date, endDate: Date) {
    const variantStats = await this.prisma.$queryRaw<Array<{
      variant_id: string;
      variant_name: string;
      campaign_name: string;
      pieces_mailed: number;
      calls: bigint;
      contracts: bigint;
      response_rate: number;
      contract_rate: number;
    }>>`
      SELECT
        v.id as variant_id,
        v.name as variant_name,
        c.name as campaign_name,
        v."piecesMailed" as pieces_mailed,
        COUNT(DISTINCT ce.id) FILTER (WHERE ce."eventType" = 'INBOUND_CALL') as calls,
        COUNT(DISTINCT d.id) as contracts,
        CASE WHEN v."piecesMailed" > 0
          THEN COUNT(DISTINCT ce.id) FILTER (WHERE ce."eventType" = 'INBOUND_CALL')::float / v."piecesMailed"
          ELSE 0 END as response_rate,
        CASE WHEN v."piecesMailed" > 0
          THEN COUNT(DISTINCT d.id)::float / v."piecesMailed"
          ELSE 0 END as contract_rate
      FROM "Variant" v
      JOIN "Campaign" c ON v."campaignId" = c.id
      LEFT JOIN "MailPiece" mp ON mp."variantId" = v.id
      LEFT JOIN "CallEvent" ce ON ce."mailPieceId" = mp.id
      LEFT JOIN "Deal" d ON d."attributedVariantId" = v.id
        AND d."contractDate" >= ${startDate}
        AND d."contractDate" <= ${endDate}
      WHERE c."accountId" = ${accountId}
        AND c."createdAt" >= ${startDate}
        AND c."createdAt" <= ${endDate}
      GROUP BY v.id, v.name, c.name, v."piecesMailed"
      ORDER BY contract_rate DESC
    `;

    return variantStats.map(v => ({
      variantId: v.variant_id,
      variantName: v.variant_name,
      campaignName: v.campaign_name,
      piecesMailed: v.pieces_mailed,
      calls: Number(v.calls),
      contracts: Number(v.contracts),
      responseRate: v.response_rate,
      contractRate: v.contract_rate,
    }));
  }
}
