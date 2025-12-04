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
export class WhatRecommendationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate WHAT recommendations - creative and offer suggestions
   */
  async generateRecommendations(
    accountId: string,
    context?: Record<string, any>,
  ): Promise<RecommendationData[]> {
    const recommendations: RecommendationData[] = [];

    // Analyze existing templates and their performance
    const templateAnalysis = await this.analyzeTemplates(accountId);

    // Analyze offer strategies
    const offerAnalysis = await this.analyzeOfferStrategies(accountId);

    // Analyze variant performance
    const variantAnalysis = await this.analyzeVariantPerformance(accountId);

    // Generate mail format recommendation
    if (templateAnalysis.bestFormat) {
      recommendations.push(this.createFormatRecommendation(templateAnalysis.bestFormat));
    }

    // Generate offer strategy recommendation
    if (offerAnalysis.optimalStrategy) {
      recommendations.push(this.createOfferRecommendation(offerAnalysis.optimalStrategy));
    }

    // Generate creative element recommendations
    if (variantAnalysis.winningElements.length > 0) {
      recommendations.push(
        this.createCreativeElementsRecommendation(variantAnalysis.winningElements),
      );
    }

    // Generate new template recommendation if limited variety
    if (templateAnalysis.templateCount < 3) {
      recommendations.push(this.createNewTemplateRecommendation(templateAnalysis));
    }

    return recommendations;
  }

  private async analyzeTemplates(accountId: string) {
    const templates = await this.prisma.designTemplate.findMany({
      where: { accountId, isActive: true },
      include: {
        versions: {
          include: {
            mailPieces: {
              select: {
                hasResponded: true,
              },
            },
          },
        },
      },
    });

    // Calculate performance by format
    const formatPerformance: Record<
      string,
      { mailed: number; responded: number; rate: number }
    > = {};

    for (const template of templates) {
      const format = template.format;
      if (!formatPerformance[format]) {
        formatPerformance[format] = { mailed: 0, responded: 0, rate: 0 };
      }

      for (const version of template.versions) {
        const mailed = version.mailPieces.length;
        const responded = version.mailPieces.filter((mp) => mp.hasResponded).length;
        formatPerformance[format].mailed += mailed;
        formatPerformance[format].responded += responded;
      }
    }

    // Calculate rates
    for (const format of Object.keys(formatPerformance)) {
      const fp = formatPerformance[format];
      fp.rate = fp.mailed > 0 ? fp.responded / fp.mailed : 0;
    }

    // Find best format
    let bestFormat = null;
    let bestRate = 0;
    for (const [format, data] of Object.entries(formatPerformance)) {
      if (data.mailed >= 100 && data.rate > bestRate) {
        bestRate = data.rate;
        bestFormat = { format, ...data };
      }
    }

    return {
      templateCount: templates.length,
      formatPerformance,
      bestFormat,
    };
  }

  private async analyzeOfferStrategies(accountId: string) {
    const strategies = await this.prisma.offerStrategy.findMany({
      where: { accountId, isActive: true },
      include: {
        mailPieces: {
          where: { status: 'DELIVERED' },
          select: {
            hasResponded: true,
            offerPercent: true,
          },
        },
      },
    });

    // Analyze performance by offer percentage ranges
    const offerRanges = [
      { min: 0.5, max: 0.6, label: '50-60%' },
      { min: 0.6, max: 0.7, label: '60-70%' },
      { min: 0.7, max: 0.8, label: '70-80%' },
      { min: 0.8, max: 0.9, label: '80-90%' },
    ];

    const rangePerformance: Record<
      string,
      { mailed: number; responded: number; rate: number }
    > = {};

    for (const strategy of strategies) {
      for (const piece of strategy.mailPieces) {
        const percent = Number(piece.offerPercent) || 0.7;
        for (const range of offerRanges) {
          if (percent >= range.min && percent < range.max) {
            if (!rangePerformance[range.label]) {
              rangePerformance[range.label] = { mailed: 0, responded: 0, rate: 0 };
            }
            rangePerformance[range.label].mailed++;
            if (piece.hasResponded) {
              rangePerformance[range.label].responded++;
            }
            break;
          }
        }
      }
    }

    // Calculate rates and find optimal
    let optimalRange = null;
    let bestRate = 0;
    for (const [label, data] of Object.entries(rangePerformance)) {
      data.rate = data.mailed > 0 ? data.responded / data.mailed : 0;
      if (data.mailed >= 50 && data.rate > bestRate) {
        bestRate = data.rate;
        optimalRange = { label, ...data };
      }
    }

    return {
      strategies: strategies.length,
      rangePerformance,
      optimalStrategy: optimalRange,
    };
  }

  private async analyzeVariantPerformance(accountId: string) {
    const variants = await this.prisma.variant.findMany({
      where: {
        campaign: { accountId },
        piecesMailed: { gt: 100 },
      },
      include: {
        designVersion: {
          select: {
            headline: true,
            callToAction: true,
            testElements: true,
          },
        },
      },
      orderBy: { responseRate: 'desc' },
      take: 10,
    });

    // Extract winning elements
    const winningElements: Array<{
      element: string;
      value: string;
      avgLift: number;
      confidence: number;
    }> = [];

    // Analyze headlines
    const headlines: Record<string, { count: number; totalRate: number }> = {};
    for (const variant of variants) {
      const headline = variant.designVersion?.headline;
      if (headline) {
        if (!headlines[headline]) {
          headlines[headline] = { count: 0, totalRate: 0 };
        }
        headlines[headline].count++;
        headlines[headline].totalRate += Number(variant.responseRate) || 0;
      }
    }

    // Find best headline pattern
    for (const [headline, data] of Object.entries(headlines)) {
      if (data.count >= 2) {
        const avgRate = data.totalRate / data.count;
        if (avgRate > 0.02) {
          winningElements.push({
            element: 'headline',
            value: headline,
            avgLift: (avgRate - 0.02) / 0.02,
            confidence: Math.min(0.9, 0.5 + data.count * 0.1),
          });
        }
      }
    }

    // Analyze CTAs
    const ctas: Record<string, { count: number; totalRate: number }> = {};
    for (const variant of variants) {
      const cta = variant.designVersion?.callToAction;
      if (cta) {
        if (!ctas[cta]) {
          ctas[cta] = { count: 0, totalRate: 0 };
        }
        ctas[cta].count++;
        ctas[cta].totalRate += Number(variant.responseRate) || 0;
      }
    }

    for (const [cta, data] of Object.entries(ctas)) {
      if (data.count >= 2) {
        const avgRate = data.totalRate / data.count;
        if (avgRate > 0.02) {
          winningElements.push({
            element: 'callToAction',
            value: cta,
            avgLift: (avgRate - 0.02) / 0.02,
            confidence: Math.min(0.9, 0.5 + data.count * 0.1),
          });
        }
      }
    }

    return { winningElements };
  }

  private createFormatRecommendation(bestFormat: {
    format: string;
    mailed: number;
    responded: number;
    rate: number;
  }): RecommendationData {
    const formatLabels: Record<string, string> = {
      CHECK_LETTER: 'Check Letter',
      YELLOW_LETTER: 'Yellow Letter',
      STANDARD_POSTCARD: 'Standard Postcard',
      OVERSIZED_POSTCARD: 'Oversized Postcard',
      HANDWRITTEN_POSTCARD: 'Handwritten Postcard',
    };

    return {
      type: 'PROACTIVE',
      category: 'WHAT',
      title: `Use ${formatLabels[bestFormat.format] || bestFormat.format} Format`,
      description: `Your ${formatLabels[bestFormat.format] || bestFormat.format} format has a ${(bestFormat.rate * 100).toFixed(2)}% response rate based on ${bestFormat.mailed.toLocaleString()} pieces. This outperforms other formats.`,
      reasoning:
        'Historical performance data shows this format resonates best with your target audience. Consistent use of proven formats improves campaign predictability.',
      confidence: 0.82,
      priority: 'HIGH',
      data: {
        mailFormat: bestFormat.format,
        historicalRate: bestFormat.rate,
        sampleSize: bestFormat.mailed,
        topPerformingElements: {},
      },
      expectedImpact: {
        responseRate: bestFormat.rate,
        vsAverageImprovement: 0.15,
      },
      expiresAt: this.getExpirationDate(30),
    };
  }

  private createOfferRecommendation(optimalStrategy: {
    label: string;
    mailed: number;
    responded: number;
    rate: number;
  }): RecommendationData {
    return {
      type: 'PROACTIVE',
      category: 'WHAT',
      title: `Optimize Offers to ${optimalStrategy.label} of AVM`,
      description: `Offers in the ${optimalStrategy.label} range show ${(optimalStrategy.rate * 100).toFixed(2)}% response rate. Consider adjusting your offer strategy to target this range.`,
      reasoning:
        'Offer percentage significantly impacts response rates. Too low and sellers ignore you; too high and you leave money on the table. This range balances response rate with profitability.',
      confidence: 0.75,
      priority: 'MEDIUM',
      data: {
        offerStrategy: {
          targetRange: optimalStrategy.label,
          historicalRate: optimalStrategy.rate,
        },
        expectedLift: 0.12,
        topPerformingElements: {},
      },
      expectedImpact: {
        responseRate: optimalStrategy.rate,
        estimatedROI: 2.3,
      },
      expiresAt: this.getExpirationDate(21),
    };
  }

  private createCreativeElementsRecommendation(
    winningElements: Array<{
      element: string;
      value: string;
      avgLift: number;
      confidence: number;
    }>,
  ): RecommendationData {
    const topElements = winningElements.slice(0, 3);

    return {
      type: 'PROACTIVE',
      category: 'WHAT',
      title: 'Apply Winning Creative Elements',
      description: `Analysis of your top-performing variants reveals key elements that drive higher response rates. Apply these to new campaigns.`,
      reasoning:
        'A/B test data shows these specific creative elements consistently outperform alternatives. Incorporating proven elements reduces testing time and improves baseline performance.',
      confidence: Math.max(...topElements.map((e) => e.confidence)),
      priority: 'MEDIUM',
      data: {
        headlineVariations: topElements
          .filter((e) => e.element === 'headline')
          .map((e) => e.value),
        topPerformingElements: topElements.reduce(
          (acc, e) => {
            acc[e.element] = { value: e.value, lift: e.avgLift };
            return acc;
          },
          {} as Record<string, any>,
        ),
        expectedLift: Math.max(...topElements.map((e) => e.avgLift)),
      },
      expectedImpact: {
        responseRateLift: Math.max(...topElements.map((e) => e.avgLift)),
      },
      expiresAt: this.getExpirationDate(30),
    };
  }

  private createNewTemplateRecommendation(analysis: {
    templateCount: number;
    formatPerformance: Record<string, any>;
  }): RecommendationData {
    // Find formats not being used
    const allFormats = [
      'CHECK_LETTER',
      'YELLOW_LETTER',
      'STANDARD_POSTCARD',
      'OVERSIZED_POSTCARD',
      'HANDWRITTEN_POSTCARD',
    ];
    const usedFormats = Object.keys(analysis.formatPerformance);
    const unusedFormats = allFormats.filter((f) => !usedFormats.includes(f));

    return {
      type: 'PROACTIVE',
      category: 'WHAT',
      title: 'Expand Template Variety',
      description: `You only have ${analysis.templateCount} active template(s). Consider adding ${unusedFormats[0] || 'new formats'} to test different approaches and avoid creative fatigue.`,
      reasoning:
        'Limited template variety can lead to creative fatigue in your target markets. Testing different formats helps identify new opportunities and keeps your messaging fresh.',
      confidence: 0.65,
      priority: 'LOW',
      data: {
        currentTemplateCount: analysis.templateCount,
        suggestedFormats: unusedFormats.slice(0, 2),
        templateId: undefined,
        mailFormat: unusedFormats[0] || 'YELLOW_LETTER',
        offerStrategy: {},
        headlineVariations: [],
        expectedLift: 0.1,
        topPerformingElements: {},
      },
      expectedImpact: {
        creativeFatigueMitigation: true,
        potentialLift: 0.1,
      },
      expiresAt: this.getExpirationDate(60),
    };
  }

  private getExpirationDate(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  }
}
