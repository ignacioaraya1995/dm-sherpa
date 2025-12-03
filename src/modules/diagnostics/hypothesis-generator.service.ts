import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { HypothesisCategory } from '@prisma/client';
import { MetricChange } from './diagnostics.service';

export interface Hypothesis {
  category: HypothesisCategory;
  title: string;
  description: string;
  confidence: number;
  impactScore: number;
  supportingMetrics: unknown[];
  recommendations: string[];
}

@Injectable()
export class HypothesisGeneratorService {
  constructor(private readonly prisma: PrismaService) {}

  async generate(
    accountId: string,
    currentStart: Date,
    currentEnd: Date,
    previousStart: Date,
    previousEnd: Date,
    changes: MetricChange[],
  ): Promise<Hypothesis[]> {
    const hypotheses: Hypothesis[] = [];

    const negativeChanges = changes.filter(
      c => c.direction === 'down' && (c.significance === 'high' || c.significance === 'medium'),
    );

    if (negativeChanges.length === 0) {
      return hypotheses;
    }

    const [
      telephonyHypothesis,
      creativeFatigueHypothesis,
      listShiftHypothesis,
      seasonalHypothesis,
      offerHypothesis,
    ] = await Promise.all([
      this.checkTelephonyIssues(accountId, currentStart, currentEnd),
      this.checkCreativeFatigue(accountId, currentStart, currentEnd),
      this.checkListShift(accountId, currentStart, currentEnd, previousStart, previousEnd),
      this.checkSeasonalPatterns(accountId, currentStart),
      this.checkOfferChanges(accountId, currentStart, currentEnd, previousStart, previousEnd),
    ]);

    if (telephonyHypothesis) hypotheses.push(telephonyHypothesis);
    if (creativeFatigueHypothesis) hypotheses.push(creativeFatigueHypothesis);
    if (listShiftHypothesis) hypotheses.push(listShiftHypothesis);
    if (seasonalHypothesis) hypotheses.push(seasonalHypothesis);
    if (offerHypothesis) hypotheses.push(offerHypothesis);

    return hypotheses.sort((a, b) => b.confidence - a.confidence);
  }

  private async checkTelephonyIssues(
    accountId: string,
    currentStart: Date,
    currentEnd: Date,
  ): Promise<Hypothesis | null> {
    const healthLogs = await this.prisma.phoneHealthLog.findMany({
      where: {
        phoneNumber: { accountId },
        timestamp: { gte: currentStart, lte: currentEnd },
      },
      select: {
        isHealthy: true,
        spamScore: true,
        testCallSuccess: true,
      },
    });

    if (healthLogs.length === 0) return null;

    const unhealthyCount = healthLogs.filter(h => !h.isHealthy).length;
    const unhealthyRate = unhealthyCount / healthLogs.length;
    const avgSpamScore = this.average(healthLogs.map(h => Number(h.spamScore) || 0));
    const failedTestCalls = healthLogs.filter(h => h.testCallSuccess === false).length;

    if (unhealthyRate > 0.1 || avgSpamScore > 0.3 || failedTestCalls > 2) {
      const issues: string[] = [];
      if (unhealthyRate > 0.1) issues.push(`${(unhealthyRate * 100).toFixed(0)}% of health checks failed`);
      if (avgSpamScore > 0.3) issues.push(`avg spam score ${(avgSpamScore * 100).toFixed(0)}%`);
      if (failedTestCalls > 2) issues.push(`${failedTestCalls} failed test calls`);

      return {
        category: 'TELEPHONY_ISSUE',
        title: 'Phone Number Health Degradation',
        description: `Telephony issues detected: ${issues.join(', ')}. This may be causing missed leads.`,
        confidence: Math.min(0.9, 0.5 + unhealthyRate + avgSpamScore),
        impactScore: unhealthyRate > 0.2 ? 0.8 : 0.5,
        supportingMetrics: [
          { metric: 'unhealthyRate', value: unhealthyRate },
          { metric: 'avgSpamScore', value: avgSpamScore },
          { metric: 'failedTestCalls', value: failedTestCalls },
        ],
        recommendations: [
          'Rotate affected phone numbers',
          'Register with carrier reputation services',
          'Review call routing configuration',
        ],
      };
    }

    return null;
  }

  private async checkCreativeFatigue(
    accountId: string,
    currentStart: Date,
    currentEnd: Date,
  ): Promise<Hypothesis | null> {
    const variants = await this.prisma.variant.findMany({
      where: {
        campaign: { accountId },
        piecesMailed: { gt: 1000 },
        createdAt: { lt: currentStart },
      },
      select: {
        id: true,
        name: true,
        piecesMailed: true,
        createdAt: true,
      },
    });

    const oldVariants = variants.filter(v => {
      const daysSinceCreation = (currentEnd.getTime() - v.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceCreation > 60 && v.piecesMailed > 5000;
    });

    if (oldVariants.length > 0) {
      return {
        category: 'CREATIVE_FATIGUE',
        title: 'Creative Fatigue Detected',
        description: `${oldVariants.length} variant(s) have been in use for over 60 days with high volume. Response rates typically decline after extended use.`,
        confidence: Math.min(0.85, 0.5 + oldVariants.length * 0.1),
        impactScore: oldVariants.length > 2 ? 0.7 : 0.5,
        supportingMetrics: oldVariants.map(v => ({
          variantName: v.name,
          piecesMailed: v.piecesMailed,
        })),
        recommendations: [
          'Create new creative variants',
          'Phase out fatigued designs',
          'Test new messaging approaches',
        ],
      };
    }

    return null;
  }

  private async checkListShift(
    accountId: string,
    currentStart: Date,
    currentEnd: Date,
    previousStart: Date,
    previousEnd: Date,
  ): Promise<Hypothesis | null> {
    const [currentProps, previousProps] = await Promise.all([
      this.prisma.property.findMany({
        where: {
          mailPieces: {
            some: {
              batch: { campaign: { accountId } },
              createdAt: { gte: currentStart, lte: currentEnd },
            },
          },
        },
        include: {
          distressFlags: { where: { isActive: true } },
        },
        take: 500,
      }),
      this.prisma.property.findMany({
        where: {
          mailPieces: {
            some: {
              batch: { campaign: { accountId } },
              createdAt: { gte: previousStart, lte: previousEnd },
            },
          },
        },
        include: {
          distressFlags: { where: { isActive: true } },
        },
        take: 500,
      }),
    ]);

    if (currentProps.length < 50 || previousProps.length < 50) return null;

    const currentDistressCounts = this.countDistressTypes(currentProps);
    const previousDistressCounts = this.countDistressTypes(previousProps);

    let totalShift = 0;
    const shifts: Array<{ type: string; change: number }> = [];

    for (const [type, currentPct] of Object.entries(currentDistressCounts)) {
      const previousPct = previousDistressCounts[type] || 0;
      const change = currentPct - previousPct;
      totalShift += Math.abs(change);
      if (Math.abs(change) > 0.05) {
        shifts.push({ type, change });
      }
    }

    if (totalShift > 0.15) {
      return {
        category: 'LIST_SHIFT',
        title: 'List Composition Change Detected',
        description: `Significant shift in distress type distribution (${(totalShift * 100).toFixed(0)}% change). Different lead types may have different response patterns.`,
        confidence: Math.min(0.8, 0.4 + totalShift),
        impactScore: totalShift > 0.3 ? 0.7 : 0.5,
        supportingMetrics: shifts.map(s => ({
          distressType: s.type,
          changePercent: (s.change * 100).toFixed(1),
        })),
        recommendations: [
          'Review segment criteria',
          'Ensure targeting aligns with best-performing distress types',
          'Audit data source quality',
        ],
      };
    }

    return null;
  }

  private countDistressTypes(properties: Array<{ distressFlags: Array<{ type: string }> }>): Record<string, number> {
    const counts: Record<string, number> = {};
    let total = 0;

    for (const prop of properties) {
      for (const flag of prop.distressFlags) {
        counts[flag.type] = (counts[flag.type] || 0) + 1;
        total++;
      }
    }

    const percentages: Record<string, number> = {};
    for (const [type, count] of Object.entries(counts)) {
      percentages[type] = total > 0 ? count / total : 0;
    }

    return percentages;
  }

  private async checkSeasonalPatterns(
    accountId: string,
    currentStart: Date,
  ): Promise<Hypothesis | null> {
    const currentMonth = currentStart.getMonth() + 1;
    const currentYear = currentStart.getFullYear();

    const accountMarkets = await this.prisma.accountMarket.findMany({
      where: { accountId, isActive: true },
      select: { marketId: true },
    });

    if (accountMarkets.length === 0) return null;

    const profiles = await this.prisma.seasonalityProfile.findMany({
      where: {
        marketId: { in: accountMarkets.map(m => m.marketId) },
        year: currentYear,
      },
    });

    if (profiles.length === 0) return null;

    const avgIndex = this.average(
      profiles.map(p => {
        const indices = p.monthlyIndices as Record<string, number>;
        return indices[String(currentMonth)] || 1.0;
      }),
    );

    if (avgIndex < 0.85) {
      return {
        category: 'SEASONAL_PATTERN',
        title: 'Seasonal Slowdown Period',
        description: `Current month has historically lower activity (index: ${avgIndex.toFixed(2)}). This is expected and temporary.`,
        confidence: 0.75,
        impactScore: avgIndex < 0.7 ? 0.7 : 0.4,
        supportingMetrics: [{ seasonalIndex: avgIndex, month: currentMonth }],
        recommendations: [
          'Adjust expectations for this period',
          'Consider reducing mail volume during slow periods',
          'Focus budget on high-quality leads',
        ],
      };
    }

    return null;
  }

  private async checkOfferChanges(
    accountId: string,
    currentStart: Date,
    currentEnd: Date,
    previousStart: Date,
    previousEnd: Date,
  ): Promise<Hypothesis | null> {
    const [currentStrategies, previousStrategies] = await Promise.all([
      this.prisma.offerStrategy.findMany({
        where: { accountId, isActive: true },
      }),
      this.prisma.offerStrategy.findMany({
        where: {
          accountId,
          createdAt: { lte: previousEnd },
        },
      }),
    ]);

    if (currentStrategies.length === 0) return null;

    const currentIds = new Set(currentStrategies.map(o => o.id));
    const previousIds = new Set(previousStrategies.map(o => o.id));

    const newStrategies = currentStrategies.filter(o => !previousIds.has(o.id) && o.createdAt >= previousEnd);

    if (newStrategies.length > 0) {
      return {
        category: 'OFFER_CHANGE',
        title: 'Offer Strategy Modified',
        description: `${newStrategies.length} new offer strategy(ies) added during this period. Changes in offer amounts can impact response rates.`,
        confidence: 0.7,
        impactScore: 0.5,
        supportingMetrics: newStrategies.map(s => ({ strategyName: s.name })),
        recommendations: [
          'Monitor conversion rates closely after offer changes',
          'Consider A/B testing offer bands',
          'Track seller feedback on offer amounts',
        ],
      };
    }

    return null;
  }

  private average(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }
}
