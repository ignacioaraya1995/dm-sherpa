import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { PriceBand, DistressType } from '@prisma/client';

export interface OfferInput {
  propertyId: string;
  avmValue: number;
  arvValue?: number;
  priceBand: PriceBand;
  distressTypes: DistressType[];
  distressSeverities: string[];
  dispoScore: number;
  marketId: string;
  accountId: string;
  offerStrategyId?: string;
}

export interface OfferResult {
  offerAmount: number;
  offerPercent: number;
  offerRange?: { min: number; max: number };
  breakdown: {
    basePercent: number;
    distressAdjustment: number;
    dispoAdjustment: number;
    marketAdjustment: number;
    finalPercent: number;
  };
  confidence: 'high' | 'medium' | 'low';
  explanation: string[];
}

export interface OfferSimulationInput {
  marketId: string;
  priceBand: PriceBand;
  distressTypes: DistressType[];
  offerPercents: number[];
  historicalData?: boolean;
}

export interface OfferSimulationResult {
  byOfferPercent: Array<{
    offerPercent: number;
    estimatedResponseRate: number;
    estimatedContractRate: number;
    estimatedSpread: number;
    estimatedProfit: number;
    riskLevel: 'low' | 'medium' | 'high';
  }>;
  recommendation: {
    optimalOfferPercent: number;
    reason: string;
  };
}

@Injectable()
export class OfferCalculatorService {
  // Default base offers by price band
  private readonly defaultBaseOffers: Record<PriceBand, number> = {
    [PriceBand.BAND_0_100K]: 0.65,
    [PriceBand.BAND_100_200K]: 0.68,
    [PriceBand.BAND_200_300K]: 0.72,
    [PriceBand.BAND_300_500K]: 0.76,
    [PriceBand.BAND_500K_PLUS]: 0.80,
  };

  // Distress type adjustments (negative = lower offer)
  private readonly distressAdjustments: Partial<Record<DistressType, number>> = {
    [DistressType.PRE_FORECLOSURE]: -0.05,
    [DistressType.FORECLOSURE]: -0.08,
    [DistressType.PROBATE]: -0.03,
    [DistressType.TAX_LIEN]: -0.04,
    [DistressType.DIVORCE]: -0.02,
    [DistressType.BANKRUPTCY]: -0.05,
    [DistressType.CODE_VIOLATION]: -0.06,
    [DistressType.VACANT]: -0.03,
    [DistressType.ABSENTEE]: 0,
    [DistressType.HIGH_EQUITY]: 0.02,
  };

  constructor(private readonly prisma: PrismaService) {}

  async calculateOffer(input: OfferInput): Promise<OfferResult> {
    const explanations: string[] = [];

    // Get offer strategy if specified
    let strategy = null;
    if (input.offerStrategyId) {
      strategy = await this.prisma.offerStrategy.findUnique({
        where: { id: input.offerStrategyId },
      });
    }

    // Get account market settings
    const accountMarket = await this.prisma.accountMarket.findUnique({
      where: {
        accountId_marketId: {
          accountId: input.accountId,
          marketId: input.marketId,
        },
      },
    });

    // 1. Get base offer percent
    let basePercent = this.defaultBaseOffers[input.priceBand];
    if (strategy?.baseOffers) {
      const strategyBase = (strategy.baseOffers as Record<string, number>)[input.priceBand];
      if (strategyBase) basePercent = strategyBase;
    }
    explanations.push(`Base offer for ${input.priceBand}: ${(basePercent * 100).toFixed(1)}%`);

    // 2. Apply distress adjustments
    let distressAdjustment = 0;
    for (const distressType of input.distressTypes) {
      const adj = this.distressAdjustments[distressType] || 0;
      if (strategy?.distressAdjustments) {
        const strategyAdj = (strategy.distressAdjustments as Record<string, number>)[distressType];
        if (strategyAdj !== undefined) {
          distressAdjustment += strategyAdj;
          continue;
        }
      }
      distressAdjustment += adj;
    }
    if (distressAdjustment !== 0) {
      explanations.push(
        `Distress adjustment: ${distressAdjustment > 0 ? '+' : ''}${(distressAdjustment * 100).toFixed(1)}% (${input.distressTypes.join(', ')})`,
      );
    }

    // 3. Apply dispo score adjustment
    let dispoAdjustment = 0;
    if (input.dispoScore < 0.4) {
      dispoAdjustment = -0.05; // Lower offer for hard-to-dispo properties
      explanations.push(`Low dispo score (${input.dispoScore.toFixed(2)}): -5%`);
    } else if (input.dispoScore > 0.7) {
      dispoAdjustment = 0.02; // Slightly higher for easy dispo
      explanations.push(`High dispo score (${input.dispoScore.toFixed(2)}): +2%`);
    }

    // 4. Apply market/county bias adjustment
    let marketAdjustment = 0;
    if (accountMarket?.avmBiasFactor) {
      const bias = Number(accountMarket.avmBiasFactor);
      if (bias !== 1.0) {
        marketAdjustment = (bias - 1) * 0.5; // Convert bias to adjustment
        explanations.push(
          `Market AVM bias (${bias.toFixed(2)}): ${marketAdjustment > 0 ? '+' : ''}${(marketAdjustment * 100).toFixed(1)}%`,
        );
      }
    }

    // 5. Calculate final percent
    let finalPercent = basePercent + distressAdjustment + dispoAdjustment + marketAdjustment;

    // Apply constraints
    const minPercent = Number(strategy?.minOfferPercent) || 0.50;
    const maxPercent = Number(strategy?.maxOfferPercent) || 0.90;
    finalPercent = Math.max(minPercent, Math.min(maxPercent, finalPercent));

    // Calculate offer amount
    const valueBase = input.arvValue || input.avmValue;
    const offerAmount = Math.round(valueBase * finalPercent);

    // Calculate range if strategy uses ranges
    let offerRange: { min: number; max: number } | undefined;
    if (strategy?.useOfferRange) {
      const rangeWidth = Number(strategy.rangeWidth) || 0.03;
      offerRange = {
        min: Math.round(valueBase * (finalPercent - rangeWidth)),
        max: Math.round(valueBase * (finalPercent + rangeWidth)),
      };
    }

    // Determine confidence
    let confidence: 'high' | 'medium' | 'low' = 'medium';
    if (input.arvValue && input.distressTypes.length > 0 && input.dispoScore > 0.5) {
      confidence = 'high';
    } else if (!input.arvValue || input.dispoScore < 0.3) {
      confidence = 'low';
    }

    return {
      offerAmount,
      offerPercent: finalPercent,
      offerRange,
      breakdown: {
        basePercent,
        distressAdjustment,
        dispoAdjustment,
        marketAdjustment,
        finalPercent,
      },
      confidence,
      explanation: explanations,
    };
  }

  async simulateOffers(input: OfferSimulationInput): Promise<OfferSimulationResult> {
    // Get historical performance data for this market/price band
    const historicalDeals = await this.prisma.deal.findMany({
      where: {
        property: {
          marketId: input.marketId,
          priceBand: input.priceBand,
        },
        status: 'CLOSED',
      },
      select: {
        mailedOffer: true,
        contractPrice: true,
        salePrice: true,
        grossProfit: true,
        property: {
          select: { avmValue: true },
        },
      },
      take: 100,
      orderBy: { closeDate: 'desc' },
    });

    const results = input.offerPercents.map((offerPercent) => {
      // Model based on historical data or defaults
      let estimatedResponseRate: number;
      let estimatedContractRate: number;
      let estimatedSpread: number;

      if (historicalDeals.length >= 10) {
        // Use historical data to model
        const relevantDeals = historicalDeals.filter((d) => {
          const offerPct = Number(d.mailedOffer) / Number(d.property.avmValue);
          return Math.abs(offerPct - offerPercent) < 0.05;
        });

        if (relevantDeals.length > 0) {
          estimatedResponseRate = 0.015 * (1 + (offerPercent - 0.7) * 2); // Higher offer = more response
          estimatedContractRate = estimatedResponseRate * 0.3;
          estimatedSpread =
            relevantDeals.reduce((sum, d) => sum + Number(d.grossProfit), 0) / relevantDeals.length;
        } else {
          // Default model
          estimatedResponseRate = this.modelResponseRate(offerPercent);
          estimatedContractRate = this.modelContractRate(offerPercent, estimatedResponseRate);
          estimatedSpread = this.modelSpread(offerPercent, input.priceBand);
        }
      } else {
        // Default model
        estimatedResponseRate = this.modelResponseRate(offerPercent);
        estimatedContractRate = this.modelContractRate(offerPercent, estimatedResponseRate);
        estimatedSpread = this.modelSpread(offerPercent, input.priceBand);
      }

      const estimatedProfit = estimatedContractRate * estimatedSpread;

      return {
        offerPercent,
        estimatedResponseRate,
        estimatedContractRate,
        estimatedSpread,
        estimatedProfit,
        riskLevel: this.assessRiskLevel(offerPercent, estimatedSpread),
      };
    });

    // Find optimal offer
    const sortedByProfit = [...results].sort((a, b) => b.estimatedProfit - a.estimatedProfit);
    const optimal = sortedByProfit[0];

    return {
      byOfferPercent: results,
      recommendation: {
        optimalOfferPercent: optimal.offerPercent,
        reason: `Maximizes expected profit at $${optimal.estimatedProfit.toFixed(0)} per piece with ${optimal.riskLevel} risk`,
      },
    };
  }

  private modelResponseRate(offerPercent: number): number {
    // Higher offers generally get more responses
    // Base: 1.5% at 70% offer
    const baseRate = 0.015;
    const adjustment = (offerPercent - 0.70) * 0.02;
    return Math.max(0.005, Math.min(0.05, baseRate + adjustment));
  }

  private modelContractRate(offerPercent: number, responseRate: number): number {
    // Contract rate is a fraction of response rate
    // Higher offers have higher conversion from call to contract
    const conversionMultiplier = 0.25 + (offerPercent - 0.65) * 0.5;
    return responseRate * Math.max(0.15, Math.min(0.50, conversionMultiplier));
  }

  private modelSpread(offerPercent: number, priceBand: PriceBand): number {
    // Lower offer = higher spread
    const baseValues: Record<PriceBand, number> = {
      [PriceBand.BAND_0_100K]: 50000,
      [PriceBand.BAND_100_200K]: 150000,
      [PriceBand.BAND_200_300K]: 250000,
      [PriceBand.BAND_300_500K]: 400000,
      [PriceBand.BAND_500K_PLUS]: 600000,
    };

    const baseValue = baseValues[priceBand];
    const spreadPercent = Math.max(0.05, 0.25 - (offerPercent - 0.65) * 0.5);
    return baseValue * spreadPercent;
  }

  private assessRiskLevel(offerPercent: number, spread: number): 'low' | 'medium' | 'high' {
    if (offerPercent > 0.80 || spread < 10000) {
      return 'high';
    } else if (offerPercent > 0.72 || spread < 25000) {
      return 'medium';
    }
    return 'low';
  }
}
