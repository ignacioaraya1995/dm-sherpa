import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { SampleSizeCalculator } from './sample-size-calculator.service';
import { CampaignStatus, ExperimentType } from '@prisma/client';

export interface SetupExperimentDto {
  campaignId: string;
  experimentType: ExperimentType;
  baselineResponseRate: number;
  minDetectableEffect: number;
  confidenceLevel?: number;
}

export interface ExperimentResultsDto {
  campaignId: string;
  experimentType: ExperimentType;
  status: 'running' | 'conclusive' | 'inconclusive' | 'needs_more_data';
  progress: {
    totalSampleRequired: number;
    currentSample: number;
    percentComplete: number;
    estimatedDaysRemaining?: number;
  };
  control?: {
    variantId: string;
    name: string;
    mailed: number;
    delivered: number;
    calls: number;
    responseRate: number;
    contracts: number;
    contractRate: number;
  };
  variants: Array<{
    variantId: string;
    name: string;
    mailed: number;
    delivered: number;
    calls: number;
    responseRate: number;
    contracts: number;
    contractRate: number;
    vsControl: {
      responseLift: number;
      contractLift: number;
      pValue: number;
      isSignificant: boolean;
    };
    recommendation: 'winner' | 'loser' | 'inconclusive';
  }>;
  winner?: {
    variantId: string;
    name: string;
    reason: string;
  };
}

@Injectable()
export class ExperimentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sampleSizeCalculator: SampleSizeCalculator,
  ) {}

  async setupExperiment(dto: SetupExperimentDto) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: dto.campaignId },
      include: { variants: true },
    });

    if (!campaign) {
      throw new NotFoundException(`Campaign ${dto.campaignId} not found`);
    }

    if (campaign.status !== CampaignStatus.DRAFT) {
      throw new BadRequestException('Can only setup experiment for draft campaigns');
    }

    if (campaign.variants.length < 2) {
      throw new BadRequestException('Need at least 2 variants for an experiment');
    }

    // Calculate required sample
    const sampleCalc = this.sampleSizeCalculator.calculateRequiredSampleSize({
      baselineRate: dto.baselineResponseRate,
      minimumDetectableEffect: dto.minDetectableEffect,
      confidenceLevel: dto.confidenceLevel,
      variantCount: campaign.variants.length,
    });

    // Update campaign with experiment settings
    await this.prisma.campaign.update({
      where: { id: dto.campaignId },
      data: {
        isExperiment: true,
        experimentType: dto.experimentType,
        baselineResponse: dto.baselineResponseRate,
        minDetectableEffect: dto.minDetectableEffect,
        confidenceLevel: dto.confidenceLevel || 0.95,
      },
    });

    // Ensure one variant is marked as control
    const hasControl = campaign.variants.some((v) => v.isControl);
    if (!hasControl) {
      await this.prisma.variant.update({
        where: { id: campaign.variants[0].id },
        data: { isControl: true },
      });
    }

    return {
      campaignId: dto.campaignId,
      experimentType: dto.experimentType,
      sampleSizeRequired: sampleCalc,
      variants: campaign.variants.map((v) => ({
        id: v.id,
        name: v.name,
        isControl: v.isControl,
        allocationPercent: Number(v.allocationPercent),
      })),
    };
  }

  async getExperimentResults(campaignId: string): Promise<ExperimentResultsDto> {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        variants: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!campaign) {
      throw new NotFoundException(`Campaign ${campaignId} not found`);
    }

    if (!campaign.isExperiment) {
      throw new BadRequestException('Campaign is not configured as an experiment');
    }

    const controlVariant = campaign.variants.find((v) => v.isControl);
    const testVariants = campaign.variants.filter((v) => !v.isControl);

    if (!controlVariant) {
      throw new BadRequestException('No control variant found');
    }

    // Calculate required sample
    const sampleRequired = this.sampleSizeCalculator.calculateRequiredSampleSize({
      baselineRate: Number(campaign.baselineResponse) || 0.02,
      minimumDetectableEffect: Number(campaign.minDetectableEffect) || 0.2,
      confidenceLevel: Number(campaign.confidenceLevel) || 0.95,
      variantCount: campaign.variants.length,
    });

    const currentSample = campaign.variants.reduce(
      (sum, v) => sum + v.piecesDelivered,
      0,
    );
    const percentComplete = Math.min(
      100,
      (currentSample / sampleRequired.total) * 100,
    );

    // Analyze experiment
    const analysis = this.sampleSizeCalculator.analyzeExperiment({
      control: {
        conversions: controlVariant.calls,
        sampleSize: controlVariant.piecesDelivered,
      },
      variants: testVariants.map((v) => ({
        id: v.id,
        name: v.name,
        conversions: v.calls,
        sampleSize: v.piecesDelivered,
      })),
      confidenceLevel: Number(campaign.confidenceLevel) || 0.95,
    });

    // Map status
    let status: ExperimentResultsDto['status'];
    if (campaign.status === CampaignStatus.ACTIVE) {
      status =
        analysis.overallStatus === 'conclusive'
          ? 'conclusive'
          : analysis.overallStatus === 'need_more_data'
            ? 'needs_more_data'
            : 'running';
    } else {
      status = analysis.overallStatus === 'conclusive' ? 'conclusive' : 'inconclusive';
    }

    // Build response
    const controlResponseRate =
      controlVariant.piecesDelivered > 0
        ? controlVariant.calls / controlVariant.piecesDelivered
        : 0;
    const controlContractRate =
      controlVariant.piecesDelivered > 0
        ? controlVariant.contracts / controlVariant.piecesDelivered
        : 0;

    return {
      campaignId,
      experimentType: campaign.experimentType!,
      status,
      progress: {
        totalSampleRequired: sampleRequired.total,
        currentSample,
        percentComplete,
        estimatedDaysRemaining:
          percentComplete < 100
            ? this.estimateDaysRemaining(campaign.launchedAt, currentSample, sampleRequired.total)
            : undefined,
      },
      control: {
        variantId: controlVariant.id,
        name: controlVariant.name,
        mailed: controlVariant.piecesMailed,
        delivered: controlVariant.piecesDelivered,
        calls: controlVariant.calls,
        responseRate: controlResponseRate,
        contracts: controlVariant.contracts,
        contractRate: controlContractRate,
      },
      variants: testVariants.map((v, i) => {
        const variantAnalysis = analysis.variants[i];
        const variantResponseRate =
          v.piecesDelivered > 0 ? v.calls / v.piecesDelivered : 0;
        const variantContractRate =
          v.piecesDelivered > 0 ? v.contracts / v.piecesDelivered : 0;

        return {
          variantId: v.id,
          name: v.name,
          mailed: v.piecesMailed,
          delivered: v.piecesDelivered,
          calls: v.calls,
          responseRate: variantResponseRate,
          contracts: v.contracts,
          contractRate: variantContractRate,
          vsControl: {
            responseLift: variantAnalysis.relativeLift,
            contractLift:
              controlContractRate > 0
                ? (variantContractRate - controlContractRate) / controlContractRate
                : 0,
            pValue: variantAnalysis.pValue,
            isSignificant: variantAnalysis.isSignificant,
          },
          recommendation: variantAnalysis.recommendation,
        };
      }),
      winner: analysis.recommendation
        ? {
            variantId: analysis.recommendation.variantId,
            name: analysis.recommendation.variantName,
            reason: analysis.recommendation.reason,
          }
        : undefined,
    };
  }

  async calculateSampleSize(input: {
    baselineRate: number;
    mde: number;
    confidence?: number;
    power?: number;
    variants?: number;
  }) {
    return this.sampleSizeCalculator.calculateRequiredSampleSize({
      baselineRate: input.baselineRate,
      minimumDetectableEffect: input.mde,
      confidenceLevel: input.confidence,
      power: input.power,
      variantCount: input.variants,
    });
  }

  async recommendBatchStrategy(campaignId: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        variants: true,
        segments: {
          include: { segment: true },
        },
      },
    });

    if (!campaign) {
      throw new NotFoundException(`Campaign ${campaignId} not found`);
    }

    const totalPotentialRecipients = campaign.segments.reduce(
      (sum, cs) => sum + cs.segment.memberCount,
      0,
    );
    const estimatedCostPerPiece = 1.5; // Default estimate
    const baselineRate = Number(campaign.baselineResponse) || 0.015;

    const recommendation = this.sampleSizeCalculator.recommendBatchSplit(
      Number(campaign.totalBudget) || totalPotentialRecipients * estimatedCostPerPiece,
      estimatedCostPerPiece,
      baselineRate,
      campaign.variants.length,
    );

    return {
      campaignId,
      totalPotentialRecipients,
      variantCount: campaign.variants.length,
      baselineRate,
      recommendation: {
        ...recommendation,
        testBatchSize: Math.floor(
          (totalPotentialRecipients * recommendation.testBatchPercent) / 100,
        ),
        scaleBatchSize: Math.floor(
          (totalPotentialRecipients * recommendation.scaleBatchPercent) / 100,
        ),
      },
      notes: [
        `Test batch: ${recommendation.testBatchPercent}% of volume (${recommendation.piecesPerVariant} per variant)`,
        `Scale batch: Remaining ${recommendation.scaleBatchPercent}% to winner`,
        `Expected confidence: ${(recommendation.expectedSignificanceConfidence * 100).toFixed(0)}%`,
      ],
    };
  }

  private estimateDaysRemaining(
    launchedAt: Date | null,
    currentSample: number,
    requiredSample: number,
  ): number {
    if (!launchedAt || currentSample === 0) return 999;

    const daysSinceLaunch = Math.max(
      1,
      Math.ceil((Date.now() - launchedAt.getTime()) / (1000 * 60 * 60 * 24)),
    );
    const samplePerDay = currentSample / daysSinceLaunch;

    if (samplePerDay === 0) return 999;

    return Math.ceil((requiredSample - currentSample) / samplePerDay);
  }
}
