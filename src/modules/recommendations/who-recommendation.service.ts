import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

interface RecommendationData {
  type: string;
  category: string;
  title: string;
  description: string;
  reasoning: string;
  confidence: number;
  priority: string;
  data: Record<string, any>;
  expectedImpact: Record<string, any>;
  estimatedBudget?: number;
  estimatedResponses?: number;
  estimatedRevenue?: number;
  expiresAt?: Date;
}

@Injectable()
export class WhoRecommendationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate WHO recommendations - target audience suggestions
   */
  async generateRecommendations(
    accountId: string,
    context?: Record<string, any>,
  ): Promise<RecommendationData[]> {
    const recommendations: RecommendationData[] = [];

    // Analyze property data to find high-opportunity segments
    const propertyAnalysis = await this.analyzePropertyData(accountId);

    // Analyze past campaign performance
    const campaignPerformance = await this.analyzeCampaignPerformance(accountId);

    // Generate high-equity absentee owner recommendation
    if (propertyAnalysis.highEquityAbsentee.count > 100) {
      recommendations.push(
        this.createHighEquityAbsenteeRecommendation(propertyAnalysis.highEquityAbsentee),
      );
    }

    // Generate distress-based recommendations
    for (const distressType of propertyAnalysis.topDistressTypes) {
      if (distressType.count > 50) {
        recommendations.push(
          this.createDistressRecommendation(distressType, campaignPerformance),
        );
      }
    }

    // Generate market-specific recommendations
    for (const market of propertyAnalysis.hotMarkets) {
      recommendations.push(this.createMarketRecommendation(market));
    }

    // Generate underserved segment recommendation
    if (propertyAnalysis.underservedSegment) {
      recommendations.push(
        this.createUnderservedSegmentRecommendation(propertyAnalysis.underservedSegment),
      );
    }

    return recommendations;
  }

  private async analyzePropertyData(accountId: string) {
    // Get account's markets
    const accountMarkets = await this.prisma.accountMarket.findMany({
      where: { accountId, isActive: true },
      select: { marketId: true },
    });
    const marketIds = accountMarkets.map((am) => am.marketId);

    // Count high-equity absentee owners
    const highEquityAbsentee = await this.prisma.property.count({
      where: {
        marketId: { in: marketIds },
        equityPercent: { gte: 40 },
        primaryOwner: { isAbsentee: true },
      },
    });

    // Get top distress types
    const distressFlags = await this.prisma.propertyFlag.groupBy({
      by: ['distressType'],
      where: {
        category: 'DISTRESS',
        isActive: true,
        property: { marketId: { in: marketIds } },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });

    // Get hot markets (high motivation scores)
    const hotMarkets = await this.prisma.property.groupBy({
      by: ['marketId'],
      where: {
        marketId: { in: marketIds },
        motivationScore: { gte: 0.7 },
      },
      _count: { id: true },
      _avg: { motivationScore: true, dispoScore: true },
      orderBy: { _count: { id: 'desc' } },
      take: 3,
    });

    // Find underserved segments (properties with high scores but no recent mail)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentlyMailed = await this.prisma.mailPiece.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { propertyId: true },
    });
    const recentlyMailedIds = new Set(recentlyMailed.map((mp) => mp.propertyId));

    const highScoreUnmailed = await this.prisma.property.count({
      where: {
        marketId: { in: marketIds },
        motivationScore: { gte: 0.6 },
        dispoScore: { gte: 0.5 },
        id: { notIn: Array.from(recentlyMailedIds) },
      },
    });

    return {
      highEquityAbsentee: {
        count: highEquityAbsentee,
        avgEquityPercent: 55, // Would compute from actual data
      },
      topDistressTypes: distressFlags.map((d) => ({
        type: d.distressType,
        count: d._count.id,
      })),
      hotMarkets: hotMarkets.map((m) => ({
        marketId: m.marketId,
        count: m._count.id,
        avgMotivation: Number(m._avg.motivationScore) || 0,
        avgDispo: Number(m._avg.dispoScore) || 0,
      })),
      underservedSegment: highScoreUnmailed > 100 ? { count: highScoreUnmailed } : null,
    };
  }

  private async analyzeCampaignPerformance(accountId: string) {
    const campaigns = await this.prisma.campaign.findMany({
      where: {
        accountId,
        status: { in: ['COMPLETED', 'ACTIVE'] },
        totalMailed: { gt: 0 },
      },
      select: {
        id: true,
        type: true,
        responseRate: true,
        roi: true,
        segments: {
          include: {
            segment: {
              select: {
                filters: true,
                avgMotivation: true,
                avgDispoScore: true,
              },
            },
          },
        },
      },
      orderBy: { responseRate: 'desc' },
      take: 10,
    });

    return {
      topPerformingCampaigns: campaigns,
      avgResponseRate:
        campaigns.length > 0
          ? campaigns.reduce((sum, c) => sum + (Number(c.responseRate) || 0), 0) /
            campaigns.length
          : 0.02,
    };
  }

  private createHighEquityAbsenteeRecommendation(data: {
    count: number;
    avgEquityPercent: number;
  }): RecommendationData {
    return {
      type: 'PROACTIVE',
      category: 'WHO',
      title: 'Target High-Equity Absentee Owners',
      description: `Found ${data.count.toLocaleString()} properties with 40%+ equity owned by absentee owners. These owners often have strong motivation to sell.`,
      reasoning:
        'Absentee owners with high equity are typically more motivated sellers. They may be dealing with property management fatigue, inheritance situations, or simply ready to cash out their investment.',
      confidence: 0.85,
      priority: 'HIGH',
      data: {
        segmentFilters: {
          equityPercent: { gte: 40 },
          ownerType: 'ABSENTEE',
        },
        estimatedSize: data.count,
        avgEquityPercent: data.avgEquityPercent,
        distressMix: {},
        topMarkets: [],
        priceBandDistribution: {},
      },
      expectedImpact: {
        responseRate: 0.028,
        estimatedROI: 2.8,
      },
      estimatedBudget: Math.round(data.count * 0.75), // ~$0.75 per piece
      estimatedResponses: Math.round(data.count * 0.028),
      estimatedRevenue: Math.round(data.count * 0.028 * 8000), // Avg deal value
      expiresAt: this.getExpirationDate(14),
    };
  }

  private createDistressRecommendation(
    distressData: { type: string | null; count: number },
    performance: { avgResponseRate: number },
  ): RecommendationData {
    const distressLabels: Record<string, string> = {
      PRE_FORECLOSURE: 'Pre-Foreclosure',
      FORECLOSURE: 'Foreclosure',
      PROBATE: 'Probate',
      TAX_LIEN: 'Tax Lien',
      TAX_DELINQUENT: 'Tax Delinquent',
      DIVORCE: 'Divorce',
      CODE_VIOLATION: 'Code Violation',
    };

    const label = distressLabels[distressData.type || ''] || distressData.type;
    const expectedLift = this.getDistressLift(distressData.type);

    return {
      type: 'PROACTIVE',
      category: 'WHO',
      title: `Target ${label} Properties`,
      description: `${distressData.count.toLocaleString()} ${label?.toLowerCase()} properties identified in your markets. These typically have ${Math.round(expectedLift * 100)}% higher response rates.`,
      reasoning: `${label} situations create urgency and motivation to sell. Historical data shows these properties respond at higher rates than general mailings.`,
      confidence: 0.78,
      priority: distressData.count > 200 ? 'HIGH' : 'MEDIUM',
      data: {
        segmentFilters: {
          distressType: distressData.type,
          isActive: true,
        },
        estimatedSize: distressData.count,
        avgMotivation: 0.75,
        avgDispoScore: 0.6,
        distressMix: { [distressData.type || 'UNKNOWN']: 1.0 },
        topMarkets: [],
        priceBandDistribution: {},
      },
      expectedImpact: {
        responseRate: performance.avgResponseRate * (1 + expectedLift),
        estimatedROI: 2.5,
      },
      estimatedBudget: Math.round(distressData.count * 0.85),
      estimatedResponses: Math.round(
        distressData.count * performance.avgResponseRate * (1 + expectedLift),
      ),
      expiresAt: this.getExpirationDate(7), // Distress data can change quickly
    };
  }

  private createMarketRecommendation(market: {
    marketId: string;
    count: number;
    avgMotivation: number;
    avgDispo: number;
  }): RecommendationData {
    return {
      type: 'PROACTIVE',
      category: 'WHO',
      title: 'Focus on High-Motivation Market',
      description: `Market has ${market.count.toLocaleString()} properties with avg motivation score of ${(market.avgMotivation * 100).toFixed(0)}%. Strong buyer activity supports quick dispositions.`,
      reasoning:
        'Concentrating efforts in markets with high motivation and disposition scores typically yields better ROI than spreading across all markets.',
      confidence: 0.72,
      priority: 'MEDIUM',
      data: {
        segmentFilters: {
          marketId: market.marketId,
          motivationScore: { gte: 0.7 },
        },
        estimatedSize: market.count,
        avgMotivation: market.avgMotivation,
        avgDispoScore: market.avgDispo,
        distressMix: {},
        topMarkets: [market.marketId],
        priceBandDistribution: {},
      },
      expectedImpact: {
        responseRate: 0.025,
        estimatedROI: 2.2,
      },
      estimatedBudget: Math.round(market.count * 0.75),
      estimatedResponses: Math.round(market.count * 0.025),
      expiresAt: this.getExpirationDate(21),
    };
  }

  private createUnderservedSegmentRecommendation(data: {
    count: number;
  }): RecommendationData {
    return {
      type: 'PROACTIVE',
      category: 'WHO',
      title: 'Untapped High-Score Properties',
      description: `${data.count.toLocaleString()} properties with high motivation/dispo scores haven't received mail in 30+ days. Fresh opportunities await.`,
      reasoning:
        'Properties with strong scores that haven\'t been recently contacted represent fresh opportunities. Lack of recent contact may mean less competition.',
      confidence: 0.68,
      priority: 'MEDIUM',
      data: {
        segmentFilters: {
          motivationScore: { gte: 0.6 },
          dispoScore: { gte: 0.5 },
          lastMailedDaysAgo: { gte: 30 },
        },
        estimatedSize: data.count,
        avgMotivation: 0.65,
        avgDispoScore: 0.55,
        distressMix: {},
        topMarkets: [],
        priceBandDistribution: {},
      },
      expectedImpact: {
        responseRate: 0.022,
        estimatedROI: 2.0,
      },
      estimatedBudget: Math.round(data.count * 0.75),
      estimatedResponses: Math.round(data.count * 0.022),
      expiresAt: this.getExpirationDate(14),
    };
  }

  private getDistressLift(distressType: string | null): number {
    const lifts: Record<string, number> = {
      PRE_FORECLOSURE: 0.45,
      FORECLOSURE: 0.35,
      PROBATE: 0.40,
      TAX_LIEN: 0.30,
      TAX_DELINQUENT: 0.25,
      DIVORCE: 0.35,
      CODE_VIOLATION: 0.20,
    };
    return lifts[distressType || ''] || 0.15;
  }

  private getExpirationDate(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  }
}
