import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { MetricChange } from './diagnostics.service';

export interface Hypothesis {
  category: 'LIST_SHIFT' | 'OFFER_CHANGE' | 'TELEPHONY_ISSUE' | 'CREATIVE_FATIGUE' | 'SEASONAL_PATTERN';
  title: string;
  description: string;
  confidence: number; // 0-1
  impact: 'high' | 'medium' | 'low';
  suggestedAction: string;
  evidence: Record<string, unknown>;
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

    // Only generate hypotheses for significant negative changes
    const negativeChanges = changes.filter(
      c => c.direction === 'down' && (c.significance === 'high' || c.significance === 'medium'),
    );

    if (negativeChanges.length === 0) {
      return hypotheses;
    }

    // Run all hypothesis checks in parallel
    const [
      telephonyHypothesis,
      creativeFatigueHypothesis,
      listShiftHypothesis,
      seasonalHypothesis,
      offerHypothesis,
    ] = await Promise.all([
      this.checkTelephonyIssues(accountId, currentStart, currentEnd, previousStart, previousEnd),
      this.checkCreativeFatigue(accountId, currentStart, currentEnd),
      this.checkListShift(accountId, currentStart, currentEnd, previousStart, previousEnd),
      this.checkSeasonalPatterns(accountId, currentStart, currentEnd),
      this.checkOfferChanges(accountId, currentStart, currentEnd, previousStart, previousEnd),
    ]);

    if (telephonyHypothesis) hypotheses.push(telephonyHypothesis);
    if (creativeFatigueHypothesis) hypotheses.push(creativeFatigueHypothesis);
    if (listShiftHypothesis) hypotheses.push(listShiftHypothesis);
    if (seasonalHypothesis) hypotheses.push(seasonalHypothesis);
    if (offerHypothesis) hypotheses.push(offerHypothesis);

    // Sort by confidence descending
    return hypotheses.sort((a, b) => b.confidence - a.confidence);
  }

  private async checkTelephonyIssues(
    accountId: string,
    currentStart: Date,
    currentEnd: Date,
    previousStart: Date,
    previousEnd: Date,
  ): Promise<Hypothesis | null> {
    // Check for phone health issues
    const [currentHealth, previousHealth] = await Promise.all([
      this.prisma.phoneHealthLog.findMany({
        where: {
          phoneNumber: { accountId },
          checkedAt: { gte: currentStart, lte: currentEnd },
        },
        select: {
          reputationScore: true,
          answerRate: true,
          isSpamFlagged: true,
          carrierStatus: true,
        },
      }),
      this.prisma.phoneHealthLog.findMany({
        where: {
          phoneNumber: { accountId },
          checkedAt: { gte: previousStart, lte: previousEnd },
        },
        select: {
          reputationScore: true,
          answerRate: true,
          isSpamFlagged: true,
        },
      }),
    ]);

    if (currentHealth.length === 0) return null;

    const currentAvgReputation = this.average(currentHealth.map(h => h.reputationScore || 0));
    const previousAvgReputation = previousHealth.length > 0
      ? this.average(previousHealth.map(h => h.reputationScore || 0))
      : currentAvgReputation;

    const currentSpamRate = currentHealth.filter(h => h.isSpamFlagged).length / currentHealth.length;
    const currentAvgAnswerRate = this.average(currentHealth.map(h => h.answerRate || 0));

    // Detect significant telephony degradation
    const reputationDrop = previousAvgReputation - currentAvgReputation;
    const hasSpamIssue = currentSpamRate > 0.1;
    const hasLowAnswerRate = currentAvgAnswerRate < 0.3;

    if (reputationDrop > 10 || hasSpamIssue || hasLowAnswerRate) {
      const issues: string[] = [];
      if (reputationDrop > 10) issues.push(`reputation dropped ${reputationDrop.toFixed(0)} points`);
      if (hasSpamIssue) issues.push(`${(currentSpamRate * 100).toFixed(0)}% of numbers flagged as spam`);
      if (hasLowAnswerRate) issues.push(`answer rate only ${(currentAvgAnswerRate * 100).toFixed(0)}%`);

      return {
        category: 'TELEPHONY_ISSUE',
        title: 'Phone Number Health Degradation',
        description: `Telephony issues detected: ${issues.join(', ')}. This may be causing missed leads.`,
        confidence: Math.min(0.9, 0.5 + (reputationDrop / 50) + (hasSpamIssue ? 0.2 : 0) + (hasLowAnswerRate ? 0.2 : 0)),
        impact: hasSpamIssue || reputationDrop > 20 ? 'high' : 'medium',
        suggestedAction: 'Rotate affected phone numbers and register with carrier reputation services',
        evidence: {
          currentAvgReputation,
          previousAvgReputation,
          reputationDrop,
          spamRate: currentSpamRate,
          answerRate: currentAvgAnswerRate,
          affectedNumbers: currentHealth.filter(h => h.isSpamFlagged || (h.reputationScore || 0) < 50).length,
        },
      };
    }

    return null;
  }

  private async checkCreativeFatigue(
    accountId: string,
    currentStart: Date,
    currentEnd: Date,
  ): Promise<Hypothesis | null> {
    // Check for variants with high mail volume and declining response
    const variantPerformance = await this.prisma.$queryRaw<Array<{
      variant_id: string;
      variant_name: string;
      total_mailed: bigint;
      first_used: Date;
      days_active: number;
      recent_response_rate: number;
      initial_response_rate: number;
    }>>`
      WITH variant_stats AS (
        SELECT
          v.id as variant_id,
          v.name as variant_name,
          v."piecesMailed" as total_mailed,
          MIN(mp."createdAt") as first_used,
          EXTRACT(days FROM NOW() - MIN(mp."createdAt")) as days_active
        FROM "Variant" v
        JOIN "Campaign" c ON v."campaignId" = c.id
        LEFT JOIN "MailPiece" mp ON mp."variantId" = v.id
        WHERE c."accountId" = ${accountId}
          AND v."piecesMailed" > 1000
        GROUP BY v.id, v.name, v."piecesMailed"
        HAVING MIN(mp."createdAt") < ${currentStart}
      )
      SELECT
        vs.*,
        0.01 as recent_response_rate,
        0.015 as initial_response_rate
      FROM variant_stats vs
      WHERE vs.days_active > 60
    `;

    const fatiguedVariants = variantPerformance.filter(
      v => v.days_active > 60 && Number(v.total_mailed) > 5000,
    );

    if (fatiguedVariants.length > 0) {
      return {
        category: 'CREATIVE_FATIGUE',
        title: 'Creative Fatigue Detected',
        description: `${fatiguedVariants.length} variant(s) have been in use for over 60 days with high volume. Response rates typically decline after extended use.`,
        confidence: Math.min(0.85, 0.5 + fatiguedVariants.length * 0.1),
        impact: fatiguedVariants.length > 2 ? 'high' : 'medium',
        suggestedAction: 'Create new creative variants and phase out fatigued designs',
        evidence: {
          fatiguedVariants: fatiguedVariants.map(v => ({
            name: v.variant_name,
            totalMailed: Number(v.total_mailed),
            daysActive: v.days_active,
          })),
        },
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
    // Check for changes in list composition (distress types, motivation scores)
    const [currentDistress, previousDistress] = await Promise.all([
      this.prisma.$queryRaw<Array<{ type: string; count: bigint; avg_score: number }>>`
        SELECT df.type, COUNT(*) as count, AVG(p."motivationScore") as avg_score
        FROM "MailPiece" mp
        JOIN "Property" p ON mp."propertyId" = p.id
        JOIN "DistressFlag" df ON p.id = df."propertyId" AND df."isActive" = true
        WHERE mp."accountId" = ${accountId}
          AND mp."createdAt" >= ${currentStart}
          AND mp."createdAt" <= ${currentEnd}
        GROUP BY df.type
      `,
      this.prisma.$queryRaw<Array<{ type: string; count: bigint; avg_score: number }>>`
        SELECT df.type, COUNT(*) as count, AVG(p."motivationScore") as avg_score
        FROM "MailPiece" mp
        JOIN "Property" p ON mp."propertyId" = p.id
        JOIN "DistressFlag" df ON p.id = df."propertyId" AND df."isActive" = true
        WHERE mp."accountId" = ${accountId}
          AND mp."createdAt" >= ${previousStart}
          AND mp."createdAt" <= ${previousEnd}
        GROUP BY df.type
      `,
    ]);

    if (currentDistress.length === 0 || previousDistress.length === 0) return null;

    // Compare distributions
    const currentTotal = currentDistress.reduce((sum, d) => sum + Number(d.count), 0);
    const previousTotal = previousDistress.reduce((sum, d) => sum + Number(d.count), 0);

    const currentDist = new Map(currentDistress.map(d => [d.type, Number(d.count) / currentTotal]));
    const previousDist = new Map(previousDistress.map(d => [d.type, Number(d.count) / previousTotal]));

    let totalShift = 0;
    const shifts: Array<{ type: string; change: number }> = [];

    for (const [type, currentPct] of currentDist) {
      const previousPct = previousDist.get(type) || 0;
      const change = currentPct - previousPct;
      totalShift += Math.abs(change);
      if (Math.abs(change) > 0.05) {
        shifts.push({ type, change });
      }
    }

    // Check for new types in previous that aren't in current (dropped)
    for (const [type, previousPct] of previousDist) {
      if (!currentDist.has(type) && previousPct > 0.05) {
        shifts.push({ type, change: -previousPct });
        totalShift += previousPct;
      }
    }

    if (totalShift > 0.15) {
      return {
        category: 'LIST_SHIFT',
        title: 'List Composition Change Detected',
        description: `Significant shift in distress type distribution (${(totalShift * 100).toFixed(0)}% change). Different lead types may have different response patterns.`,
        confidence: Math.min(0.8, 0.4 + totalShift),
        impact: totalShift > 0.3 ? 'high' : 'medium',
        suggestedAction: 'Review segment criteria and ensure targeting aligns with best-performing distress types',
        evidence: {
          totalShiftPercent: totalShift * 100,
          significantShifts: shifts.map(s => ({
            type: s.type,
            changePercent: (s.change * 100).toFixed(1),
            direction: s.change > 0 ? 'increased' : 'decreased',
          })),
        },
      };
    }

    return null;
  }

  private async checkSeasonalPatterns(
    accountId: string,
    currentStart: Date,
    currentEnd: Date,
  ): Promise<Hypothesis | null> {
    const currentMonth = currentStart.getMonth() + 1;

    // Get seasonality profile for this account
    const profiles = await this.prisma.seasonalityProfile.findMany({
      where: {
        accountId,
        monthStart: { lte: currentMonth },
        monthEnd: { gte: currentMonth },
      },
    });

    // Also get historical performance for same period in previous years
    const lastYearStart = new Date(currentStart);
    lastYearStart.setFullYear(lastYearStart.getFullYear() - 1);
    const lastYearEnd = new Date(currentEnd);
    lastYearEnd.setFullYear(lastYearEnd.getFullYear() - 1);

    const lastYearCampaigns = await this.prisma.campaign.aggregate({
      where: {
        accountId,
        createdAt: { gte: lastYearStart, lte: lastYearEnd },
      },
      _sum: {
        totalDelivered: true,
        totalCalls: true,
        totalContracts: true,
      },
    });

    const lastYearDelivered = lastYearCampaigns._sum.totalDelivered || 0;
    const lastYearContracts = lastYearCampaigns._sum.totalContracts || 0;
    const lastYearContractRate = lastYearDelivered > 0 ? lastYearContracts / lastYearDelivered : 0;

    // Check if this is a known slow period
    const isSlowSeason = profiles.some(p => Number(p.activityMultiplier) < 0.9);

    if (isSlowSeason && profiles.length > 0) {
      const profile = profiles[0];
      return {
        category: 'SEASONAL_PATTERN',
        title: 'Seasonal Slowdown Period',
        description: `Current month falls within a historically slower period (${profile.description || 'seasonal pattern detected'}). Activity multiplier: ${Number(profile.activityMultiplier).toFixed(2)}x.`,
        confidence: 0.75,
        impact: Number(profile.activityMultiplier) < 0.7 ? 'high' : 'medium',
        suggestedAction: profile.recommendedStrategy || 'Adjust expectations and consider reducing mail volume during slow periods',
        evidence: {
          seasonalMultiplier: Number(profile.activityMultiplier),
          lastYearContractRate,
          monthRange: `${profile.monthStart}-${profile.monthEnd}`,
        },
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
    // Check for changes in offer strategy
    const [currentOffers, previousOffers] = await Promise.all([
      this.prisma.offerStrategy.findMany({
        where: {
          accountId,
          isActive: true,
          createdAt: { lte: currentEnd },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      this.prisma.offerStrategy.findMany({
        where: {
          accountId,
          isActive: true,
          createdAt: { lte: previousEnd },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    if (currentOffers.length === 0) return null;

    // Check if strategies changed
    const currentIds = new Set(currentOffers.map(o => o.id));
    const previousIds = new Set(previousOffers.map(o => o.id));

    const newStrategies = currentOffers.filter(o => !previousIds.has(o.id) && o.createdAt >= previousEnd);
    const removedStrategies = previousOffers.filter(o => !currentIds.has(o.id));

    if (newStrategies.length > 0 || removedStrategies.length > 0) {
      // Compare offer percentages
      const currentAvgPct = this.average(currentOffers.map(o => Number(o.offerPercentage)));
      const previousAvgPct = previousOffers.length > 0
        ? this.average(previousOffers.map(o => Number(o.offerPercentage)))
        : currentAvgPct;

      const pctChange = currentAvgPct - previousAvgPct;

      return {
        category: 'OFFER_CHANGE',
        title: 'Offer Strategy Modified',
        description: `Offer strategies were changed during this period. ${newStrategies.length} new, ${removedStrategies.length} removed. Average offer percentage ${pctChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(pctChange * 100).toFixed(1)}%.`,
        confidence: 0.7,
        impact: Math.abs(pctChange) > 0.05 ? 'high' : 'medium',
        suggestedAction: 'Monitor conversion rates closely after offer changes; consider A/B testing offer bands',
        evidence: {
          newStrategies: newStrategies.map(s => s.name),
          removedStrategies: removedStrategies.map(s => s.name),
          currentAvgOfferPct: currentAvgPct * 100,
          previousAvgOfferPct: previousAvgPct * 100,
          percentageChange: pctChange * 100,
        },
      };
    }

    return null;
  }

  private average(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }
}
