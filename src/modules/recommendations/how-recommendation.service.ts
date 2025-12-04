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
export class HowRecommendationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate HOW recommendations - campaign structure and execution
   */
  async generateRecommendations(
    accountId: string,
    campaignId?: string,
    context?: Record<string, any>,
  ): Promise<RecommendationData[]> {
    const recommendations: RecommendationData[] = [];

    // Analyze campaign structure patterns
    const structureAnalysis = await this.analyzeCampaignStructure(accountId);

    // Analyze timing patterns
    const timingAnalysis = await this.analyzeTimingPatterns(accountId);

    // Analyze budget efficiency
    const budgetAnalysis = await this.analyzeBudgetEfficiency(accountId);

    // Generate multi-touch recommendation
    if (structureAnalysis.optimalTouchCount) {
      recommendations.push(
        this.createMultiTouchRecommendation(structureAnalysis.optimalTouchCount),
      );
    }

    // Generate timing recommendation
    if (timingAnalysis.optimalTiming) {
      recommendations.push(this.createTimingRecommendation(timingAnalysis.optimalTiming));
    }

    // Generate batch size recommendation
    if (structureAnalysis.optimalBatchSize) {
      recommendations.push(
        this.createBatchSizeRecommendation(structureAnalysis.optimalBatchSize),
      );
    }

    // Generate A/B test recommendation
    if (structureAnalysis.abTestOpportunity) {
      recommendations.push(this.createABTestRecommendation(structureAnalysis.abTestOpportunity));
    }

    // Generate budget optimization recommendation
    if (budgetAnalysis.recommendation) {
      recommendations.push(
        this.createBudgetRecommendation(budgetAnalysis.recommendation),
      );
    }

    return recommendations;
  }

  private async analyzeCampaignStructure(accountId: string) {
    const campaigns = await this.prisma.campaign.findMany({
      where: {
        accountId,
        status: { in: ['COMPLETED', 'ACTIVE'] },
        totalMailed: { gt: 100 },
      },
      include: {
        steps: true,
        batches: {
          select: {
            actualQuantity: true,
            totalDelivered: true,
            totalResponses: true,
          },
        },
      },
    });

    // Analyze touch count effectiveness
    const touchPerformance: Record<
      number,
      { campaigns: number; totalRate: number; avgRate: number }
    > = {};

    for (const campaign of campaigns) {
      const touchCount = campaign.touchCount || 1;
      if (!touchPerformance[touchCount]) {
        touchPerformance[touchCount] = { campaigns: 0, totalRate: 0, avgRate: 0 };
      }
      touchPerformance[touchCount].campaigns++;
      touchPerformance[touchCount].totalRate += Number(campaign.responseRate) || 0;
    }

    // Calculate averages and find optimal
    let optimalTouchCount = null;
    let bestRate = 0;
    for (const [count, data] of Object.entries(touchPerformance)) {
      data.avgRate = data.campaigns > 0 ? data.totalRate / data.campaigns : 0;
      if (data.campaigns >= 2 && data.avgRate > bestRate) {
        bestRate = data.avgRate;
        optimalTouchCount = {
          count: parseInt(count),
          avgRate: data.avgRate,
          sampleSize: data.campaigns,
        };
      }
    }

    // Analyze batch sizes
    const batchSizes = campaigns.flatMap((c) =>
      c.batches.map((b) => ({
        size: b.actualQuantity,
        responseRate:
          b.totalDelivered > 0 ? b.totalResponses / b.totalDelivered : 0,
      })),
    );

    // Group by size ranges
    const sizeRanges = [
      { min: 0, max: 500, label: 'Small (1-500)' },
      { min: 500, max: 2000, label: 'Medium (500-2000)' },
      { min: 2000, max: 10000, label: 'Large (2000-10000)' },
      { min: 10000, max: Infinity, label: 'Extra Large (10000+)' },
    ];

    const sizePerformance: Record<string, { count: number; avgRate: number }> = {};
    for (const range of sizeRanges) {
      const batches = batchSizes.filter(
        (b) => b.size >= range.min && b.size < range.max,
      );
      if (batches.length > 0) {
        sizePerformance[range.label] = {
          count: batches.length,
          avgRate:
            batches.reduce((sum, b) => sum + b.responseRate, 0) / batches.length,
        };
      }
    }

    // Find optimal batch size
    let optimalBatchSize = null;
    let bestBatchRate = 0;
    for (const [label, data] of Object.entries(sizePerformance)) {
      if (data.count >= 3 && data.avgRate > bestBatchRate) {
        bestBatchRate = data.avgRate;
        optimalBatchSize = { label, ...data };
      }
    }

    // Check for A/B test opportunities
    const recentCampaigns = campaigns.filter(
      (c) => new Date(c.createdAt).getTime() > Date.now() - 90 * 24 * 60 * 60 * 1000,
    );
    const experimentsRun = recentCampaigns.filter((c) => c.isExperiment).length;
    const abTestOpportunity =
      experimentsRun < recentCampaigns.length * 0.3
        ? {
            currentExperimentRate: recentCampaigns.length > 0 ? experimentsRun / recentCampaigns.length : 0,
            suggestedRate: 0.5,
          }
        : null;

    return {
      optimalTouchCount,
      optimalBatchSize,
      abTestOpportunity,
    };
  }

  private async analyzeTimingPatterns(accountId: string) {
    const steps = await this.prisma.campaignStep.findMany({
      where: {
        campaign: { accountId },
      },
      include: {
        variants: {
          select: {
            piecesMailed: true,
            responses: true,
            responseRate: true,
          },
        },
      },
    });

    // Group by days since previous
    const timingPerformance: Record<
      number,
      { count: number; totalRate: number; avgRate: number }
    > = {};

    for (const step of steps) {
      const days = step.daysSincePrevious;
      const variants = step.variants;

      if (variants.length > 0) {
        if (!timingPerformance[days]) {
          timingPerformance[days] = { count: 0, totalRate: 0, avgRate: 0 };
        }

        for (const variant of variants) {
          if (variant.piecesMailed > 50) {
            timingPerformance[days].count++;
            timingPerformance[days].totalRate += Number(variant.responseRate) || 0;
          }
        }
      }
    }

    // Find optimal timing
    let optimalTiming = null;
    let bestRate = 0;
    for (const [days, data] of Object.entries(timingPerformance)) {
      data.avgRate = data.count > 0 ? data.totalRate / data.count : 0;
      if (data.count >= 3 && data.avgRate > bestRate) {
        bestRate = data.avgRate;
        optimalTiming = {
          daysBetweenTouches: parseInt(days),
          avgRate: data.avgRate,
          sampleSize: data.count,
        };
      }
    }

    return { optimalTiming };
  }

  private async analyzeBudgetEfficiency(accountId: string) {
    const campaigns = await this.prisma.campaign.findMany({
      where: {
        accountId,
        status: { in: ['COMPLETED', 'ACTIVE'] },
        spentBudget: { gt: 0 },
      },
      select: {
        totalBudget: true,
        spentBudget: true,
        totalMailed: true,
        totalResponses: true,
        responseRate: true,
        roi: true,
      },
    });

    if (campaigns.length === 0) {
      return { recommendation: null };
    }

    // Calculate cost per response
    const validCampaigns = campaigns.filter(
      (c) => Number(c.spentBudget) > 0 && c.totalResponses > 0,
    );
    if (validCampaigns.length === 0) {
      return { recommendation: null };
    }

    const avgCostPerResponse =
      validCampaigns.reduce(
        (sum, c) => sum + Number(c.spentBudget) / c.totalResponses,
        0,
      ) / validCampaigns.length;

    const avgROI =
      validCampaigns.reduce((sum, c) => sum + (Number(c.roi) || 0), 0) /
      validCampaigns.length;

    // Calculate optimal budget per 1000 pieces
    const avgCostPer1000 =
      campaigns.reduce(
        (sum, c) =>
          sum +
          (c.totalMailed > 0 ? (Number(c.spentBudget) / c.totalMailed) * 1000 : 0),
        0,
      ) / campaigns.length;

    return {
      recommendation: {
        avgCostPerResponse,
        avgROI,
        avgCostPer1000,
        suggestedBudgetPer1000: avgCostPer1000 * 1.1, // Suggest 10% buffer
      },
    };
  }

  private createMultiTouchRecommendation(data: {
    count: number;
    avgRate: number;
    sampleSize: number;
  }): RecommendationData {
    return {
      type: 'PROACTIVE',
      category: 'HOW',
      title: `Use ${data.count}-Touch Campaign Sequence`,
      description: `Your ${data.count}-touch campaigns achieve ${(data.avgRate * 100).toFixed(2)}% response rate on average. This outperforms other touch counts.`,
      reasoning:
        'Multiple touches increase the likelihood of reaching sellers at the right moment. Each touch reinforces your message and builds recognition.',
      confidence: 0.78,
      priority: 'HIGH',
      data: {
        touchCount: data.count,
        timing: this.generateDefaultTiming(data.count),
        responseCurve: this.generateResponseCurve(data.count),
        batchSize: 1000,
        optimalSendDays: ['Tuesday', 'Wednesday', 'Thursday'],
      },
      expectedImpact: {
        responseRate: data.avgRate,
        vsBaselineImprovement: 0.25,
      },
      expiresAt: this.getExpirationDate(30),
    };
  }

  private createTimingRecommendation(data: {
    daysBetweenTouches: number;
    avgRate: number;
    sampleSize: number;
  }): RecommendationData {
    return {
      type: 'PROACTIVE',
      category: 'HOW',
      title: `Space Touches ${data.daysBetweenTouches} Days Apart`,
      description: `Campaigns with ${data.daysBetweenTouches}-day intervals between touches show ${(data.avgRate * 100).toFixed(2)}% response rate. This timing balances urgency with processing time.`,
      reasoning:
        'Too frequent and you risk appearing desperate; too infrequent and you lose momentum. This interval gives sellers time to consider while keeping you top of mind.',
      confidence: 0.72,
      priority: 'MEDIUM',
      data: {
        touchCount: 3,
        timing: [0, data.daysBetweenTouches, data.daysBetweenTouches * 2],
        optimalSendDays: ['Tuesday', 'Wednesday', 'Thursday'],
        responseCurve: [0.5, 0.3, 0.2],
      },
      expectedImpact: {
        responseRate: data.avgRate,
      },
      expiresAt: this.getExpirationDate(30),
    };
  }

  private createBatchSizeRecommendation(data: {
    label: string;
    count: number;
    avgRate: number;
  }): RecommendationData {
    const sizeMap: Record<string, number> = {
      'Small (1-500)': 300,
      'Medium (500-2000)': 1000,
      'Large (2000-10000)': 5000,
      'Extra Large (10000+)': 15000,
    };

    return {
      type: 'PROACTIVE',
      category: 'HOW',
      title: `Optimize Batch Size to ${data.label}`,
      description: `${data.label} batches show ${(data.avgRate * 100).toFixed(2)}% response rate. This size balances operational efficiency with campaign agility.`,
      reasoning:
        'Batch size affects your ability to respond to market changes and iterate on creative. The optimal size provides enough data for analysis while maintaining flexibility.',
      confidence: 0.68,
      priority: 'LOW',
      data: {
        touchCount: 3,
        timing: [0, 21, 42],
        batchSize: sizeMap[data.label] || 1000,
        budget: (sizeMap[data.label] || 1000) * 0.75,
        optimalSendDays: ['Tuesday', 'Wednesday'],
        responseCurve: [0.5, 0.3, 0.2],
      },
      expectedImpact: {
        responseRate: data.avgRate,
        operationalEfficiency: 'improved',
      },
      expiresAt: this.getExpirationDate(60),
    };
  }

  private createABTestRecommendation(data: {
    currentExperimentRate: number;
    suggestedRate: number;
  }): RecommendationData {
    return {
      type: 'PROACTIVE',
      category: 'HOW',
      title: 'Increase A/B Testing Frequency',
      description: `Only ${(data.currentExperimentRate * 100).toFixed(0)}% of your campaigns include A/B tests. Running more experiments will accelerate learning and improve performance.`,
      reasoning:
        'Continuous testing is essential for optimization. Without experiments, you\'re relying on assumptions rather than data. Each test provides insights that compound over time.',
      confidence: 0.65,
      priority: 'MEDIUM',
      data: {
        touchCount: 3,
        timing: [0, 21, 42],
        abTestConfig: {
          minSamplePerVariant: 500,
          confidenceLevel: 0.95,
          suggestedElements: ['headline', 'offer_percentage', 'mail_format'],
        },
        batchSize: 1000,
        optimalSendDays: ['Tuesday', 'Wednesday', 'Thursday'],
        responseCurve: [0.5, 0.3, 0.2],
      },
      expectedImpact: {
        learningVelocity: 'increased',
        potentialLongTermLift: 0.2,
      },
      expiresAt: this.getExpirationDate(30),
    };
  }

  private createBudgetRecommendation(data: {
    avgCostPerResponse: number;
    avgROI: number;
    avgCostPer1000: number;
    suggestedBudgetPer1000: number;
  }): RecommendationData {
    return {
      type: 'PROACTIVE',
      category: 'BUDGET',
      title: 'Optimize Budget Allocation',
      description: `Your average cost per response is $${data.avgCostPerResponse.toFixed(2)} with ${(data.avgROI * 100).toFixed(0)}% ROI. Budget $${data.suggestedBudgetPer1000.toFixed(0)} per 1,000 pieces for optimal performance.`,
      reasoning:
        'Understanding your unit economics helps plan campaigns effectively. This budget accounts for print, postage, and a small buffer for variations.',
      confidence: 0.75,
      priority: 'MEDIUM',
      data: {
        touchCount: 3,
        timing: [0, 21, 42],
        budget: data.suggestedBudgetPer1000 * 5, // For 5000 pieces
        costPerResponse: data.avgCostPerResponse,
        expectedROI: data.avgROI,
        batchSize: 1000,
        optimalSendDays: ['Tuesday', 'Wednesday'],
        responseCurve: [0.5, 0.3, 0.2],
      },
      expectedImpact: {
        budgetEfficiency: 'optimized',
        expectedROI: data.avgROI,
      },
      estimatedBudget: data.suggestedBudgetPer1000 * 5,
      expiresAt: this.getExpirationDate(30),
    };
  }

  private generateDefaultTiming(touchCount: number): number[] {
    const timing = [0];
    for (let i = 1; i < touchCount; i++) {
      timing.push(i * 21); // 21 days between touches
    }
    return timing;
  }

  private generateResponseCurve(touchCount: number): number[] {
    // Typical response curve - higher response on first touch, decreasing
    const curve: number[] = [];
    let remaining = 1.0;
    for (let i = 0; i < touchCount; i++) {
      const portion = remaining * 0.5;
      curve.push(Number(portion.toFixed(2)));
      remaining -= portion;
    }
    return curve;
  }

  private getExpirationDate(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  }
}
