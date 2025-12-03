import { Injectable } from '@nestjs/common';
import {
  calculateSampleSize,
  calculatePValue,
  calculateConfidenceInterval,
  calculateLift,
  isStatisticallySignificant,
  isSampleSizeSufficient,
} from '@/common/utils/statistics.util';

export interface SampleSizeInput {
  baselineRate: number;
  minimumDetectableEffect: number; // Relative change (e.g., 0.2 = 20% lift)
  confidenceLevel?: number; // Default 0.95
  power?: number; // Default 0.8
  variantCount?: number; // Number of variants (default 2)
}

export interface SampleSizeResult {
  perVariant: number;
  total: number;
  baselineRate: number;
  targetRate: number;
  minimumDetectableEffect: number;
  confidenceLevel: number;
  power: number;
  notes: string[];
}

export interface ExperimentAnalysisInput {
  control: {
    conversions: number;
    sampleSize: number;
  };
  variants: Array<{
    id: string;
    name: string;
    conversions: number;
    sampleSize: number;
  }>;
  confidenceLevel?: number;
}

export interface ExperimentAnalysisResult {
  control: {
    conversionRate: number;
    confidenceInterval: { lower: number; upper: number };
  };
  variants: Array<{
    id: string;
    name: string;
    conversionRate: number;
    absoluteLift: number;
    relativeLift: number;
    pValue: number;
    isSignificant: boolean;
    confidenceInterval: { lower: number; upper: number };
    recommendation: 'winner' | 'loser' | 'inconclusive';
  }>;
  overallStatus: 'conclusive' | 'inconclusive' | 'need_more_data';
  recommendation?: {
    variantId: string;
    variantName: string;
    reason: string;
  };
  powerAnalysis: {
    isAdequatelySampled: boolean;
    recommendedAdditionalSample: number;
  };
}

@Injectable()
export class SampleSizeCalculator {
  calculateRequiredSampleSize(input: SampleSizeInput): SampleSizeResult {
    const confidenceLevel = input.confidenceLevel ?? 0.95;
    const power = input.power ?? 0.8;
    const alpha = 1 - confidenceLevel;
    const variantCount = input.variantCount ?? 2;

    // Bonferroni correction for multiple variants
    const adjustedAlpha = alpha / (variantCount - 1);

    const perVariant = calculateSampleSize(
      input.baselineRate,
      input.minimumDetectableEffect,
      adjustedAlpha,
      power,
    );

    const notes: string[] = [];

    if (perVariant > 10000) {
      notes.push(
        `Large sample size required. Consider increasing MDE or accepting lower confidence.`,
      );
    }

    if (input.baselineRate < 0.01) {
      notes.push(
        `Very low baseline rate. Results may take longer to become significant.`,
      );
    }

    if (variantCount > 2) {
      notes.push(
        `Multiple comparisons: Using Bonferroni correction (α = ${adjustedAlpha.toFixed(4)}).`,
      );
    }

    const targetRate = input.baselineRate * (1 + input.minimumDetectableEffect);

    return {
      perVariant,
      total: perVariant * variantCount,
      baselineRate: input.baselineRate,
      targetRate,
      minimumDetectableEffect: input.minimumDetectableEffect,
      confidenceLevel,
      power,
      notes,
    };
  }

  analyzeExperiment(input: ExperimentAnalysisInput): ExperimentAnalysisResult {
    const confidenceLevel = input.confidenceLevel ?? 0.95;
    const alpha = 1 - confidenceLevel;

    const controlRate = input.control.conversions / input.control.sampleSize;
    const controlCI = calculateConfidenceInterval(
      input.control.conversions,
      input.control.sampleSize,
      confidenceLevel,
    );

    // Calculate required sample for 20% MDE at baseline
    const requiredSample = calculateSampleSize(controlRate, 0.2, alpha, 0.8);
    const isAdequatelySampled = isSampleSizeSufficient(
      input.control.sampleSize,
      requiredSample,
    );

    const variantResults = input.variants.map((v) => {
      const variantRate = v.conversions / v.sampleSize;
      const pValue = calculatePValue(
        input.control.conversions,
        input.control.sampleSize,
        v.conversions,
        v.sampleSize,
      );
      const { lift, relativeChange } = calculateLift(controlRate, variantRate);
      const isSignificant = isStatisticallySignificant(pValue, alpha);
      const ci = calculateConfidenceInterval(v.conversions, v.sampleSize, confidenceLevel);

      let recommendation: 'winner' | 'loser' | 'inconclusive' = 'inconclusive';
      if (isSignificant) {
        recommendation = relativeChange > 0 ? 'winner' : 'loser';
      }

      return {
        id: v.id,
        name: v.name,
        conversionRate: variantRate,
        absoluteLift: lift,
        relativeLift: relativeChange,
        pValue,
        isSignificant,
        confidenceInterval: ci,
        recommendation,
      };
    });

    // Determine overall status
    const significantWinners = variantResults.filter(
      (v) => v.recommendation === 'winner',
    );
    const significantLosers = variantResults.filter(
      (v) => v.recommendation === 'loser',
    );

    let overallStatus: 'conclusive' | 'inconclusive' | 'need_more_data';
    if (significantWinners.length > 0 || significantLosers.length > 0) {
      overallStatus = 'conclusive';
    } else if (!isAdequatelySampled) {
      overallStatus = 'need_more_data';
    } else {
      overallStatus = 'inconclusive';
    }

    // Generate recommendation
    let recommendation: ExperimentAnalysisResult['recommendation'];
    if (significantWinners.length > 0) {
      // Pick the winner with highest lift
      const best = significantWinners.sort(
        (a, b) => b.relativeLift - a.relativeLift,
      )[0];
      recommendation = {
        variantId: best.id,
        variantName: best.name,
        reason: `${(best.relativeLift * 100).toFixed(1)}% lift vs control (p=${best.pValue.toFixed(4)})`,
      };
    }

    // Calculate additional sample needed
    const recommendedAdditionalSample = isAdequatelySampled
      ? 0
      : Math.max(0, requiredSample - input.control.sampleSize);

    return {
      control: {
        conversionRate: controlRate,
        confidenceInterval: controlCI,
      },
      variants: variantResults,
      overallStatus,
      recommendation,
      powerAnalysis: {
        isAdequatelySampled,
        recommendedAdditionalSample,
      },
    };
  }

  estimateTimeToSignificance(
    currentSamplePerDay: number,
    requiredSample: number,
    currentSample: number = 0,
  ): { daysRemaining: number; estimatedDate: Date } {
    const remaining = requiredSample - currentSample;
    const daysRemaining = Math.ceil(remaining / currentSamplePerDay);
    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + daysRemaining);

    return { daysRemaining, estimatedDate };
  }

  recommendBatchSplit(
    totalBudget: number,
    costPerPiece: number,
    baselineRate: number,
    variantCount: number = 2,
  ): {
    testBatchPercent: number;
    scaleBatchPercent: number;
    piecesPerVariant: number;
    expectedSignificanceConfidence: number;
  } {
    const totalPieces = Math.floor(totalBudget / costPerPiece);

    // Calculate sample needed for 95% confidence, 20% MDE
    const requiredPerVariant = calculateSampleSize(baselineRate, 0.2, 0.05, 0.8);
    const requiredTotal = requiredPerVariant * variantCount;

    let testBatchPercent: number;
    let expectedSignificanceConfidence: number;

    if (totalPieces >= requiredTotal * 2) {
      // Plenty of budget - 30% test, 70% scale
      testBatchPercent = 30;
      expectedSignificanceConfidence = 0.95;
    } else if (totalPieces >= requiredTotal) {
      // Moderate budget - 50% test, 50% scale
      testBatchPercent = 50;
      expectedSignificanceConfidence = 0.95;
    } else {
      // Limited budget - use most for testing
      testBatchPercent = 70;
      // Lower expected confidence due to smaller sample
      const actualSamplePerVariant = (totalPieces * 0.7) / variantCount;
      expectedSignificanceConfidence =
        actualSamplePerVariant >= requiredPerVariant * 0.5 ? 0.8 : 0.6;
    }

    const testPieces = Math.floor((totalPieces * testBatchPercent) / 100);
    const piecesPerVariant = Math.floor(testPieces / variantCount);

    return {
      testBatchPercent,
      scaleBatchPercent: 100 - testBatchPercent,
      piecesPerVariant,
      expectedSignificanceConfidence,
    };
  }
}
