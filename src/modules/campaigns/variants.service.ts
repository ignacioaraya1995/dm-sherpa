import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CreateVariantDto, UpdateVariantDto, VariantComparisonDto } from './dto/variant.dto';
import {
  calculatePValue,
  calculateConfidenceInterval,
  calculateLift,
  isStatisticallySignificant,
} from '@/common/utils/statistics.util';
import { CampaignStatus } from '@prisma/client';

@Injectable()
export class VariantsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateVariantDto) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: dto.campaignId },
    });

    if (!campaign) {
      throw new NotFoundException(`Campaign ${dto.campaignId} not found`);
    }

    if (campaign.status !== CampaignStatus.DRAFT) {
      throw new BadRequestException('Can only add variants to draft campaigns');
    }

    // If this is marked as control, unset any existing control
    if (dto.isControl) {
      await this.prisma.variant.updateMany({
        where: { campaignId: dto.campaignId, isControl: true },
        data: { isControl: false },
      });
    }

    return this.prisma.variant.create({
      data: {
        name: dto.name,
        description: dto.description,
        campaignId: dto.campaignId,
        stepId: dto.stepId,
        designVersionId: dto.designVersionId,
        offerStrategyId: dto.offerStrategyId,
        allocationPercent: dto.allocationPercent ?? 50,
        isControl: dto.isControl ?? false,
      },
      include: {
        designVersion: { select: { id: true, template: { select: { name: true, format: true } } } },
        offerStrategy: { select: { id: true, name: true } },
      },
    });
  }

  async findAll(campaignId: string) {
    return this.prisma.variant.findMany({
      where: { campaignId },
      include: {
        designVersion: { select: { id: true, template: { select: { name: true, format: true } } } },
        offerStrategy: { select: { id: true, name: true } },
        step: { select: { id: true, stepNumber: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const variant = await this.prisma.variant.findUnique({
      where: { id },
      include: {
        campaign: { select: { id: true, name: true, status: true } },
        designVersion: {
          include: {
            template: { select: { id: true, name: true, format: true } },
          },
        },
        offerStrategy: true,
        step: true,
        batches: {
          include: { batch: true },
        },
      },
    });

    if (!variant) {
      throw new NotFoundException(`Variant with ID ${id} not found`);
    }

    return variant;
  }

  async update(id: string, dto: UpdateVariantDto) {
    const variant = await this.findOne(id);

    if (
      variant.campaign.status !== CampaignStatus.DRAFT &&
      variant.campaign.status !== CampaignStatus.PAUSED
    ) {
      throw new BadRequestException('Cannot modify variant of active campaign');
    }

    // Handle control flag change
    if (dto.isControl) {
      await this.prisma.variant.updateMany({
        where: { campaignId: variant.campaignId, isControl: true },
        data: { isControl: false },
      });
    }

    return this.prisma.variant.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string) {
    const variant = await this.findOne(id);

    if (variant.campaign.status !== CampaignStatus.DRAFT) {
      throw new BadRequestException('Cannot delete variant from non-draft campaign');
    }

    return this.prisma.variant.delete({ where: { id } });
  }

  async updateMetrics(id: string) {
    const variant = await this.findOne(id);

    // Calculate rates
    const responseRate =
      variant.piecesDelivered > 0 ? variant.calls / variant.piecesDelivered : null;
    const contractRate =
      variant.piecesDelivered > 0 ? variant.contracts / variant.piecesDelivered : null;
    const profitPerPiece =
      variant.piecesMailed > 0 ? Number(variant.grossProfit) / variant.piecesMailed : null;

    await this.prisma.variant.update({
      where: { id },
      data: {
        responseRate,
        contractRate,
        profitPerPiece,
      },
    });
  }

  async compareVariants(campaignId: string): Promise<VariantComparisonDto> {
    const variants = await this.prisma.variant.findMany({
      where: { campaignId, isActive: true },
      orderBy: { createdAt: 'asc' },
    });

    if (variants.length < 2) {
      throw new BadRequestException('Need at least 2 variants to compare');
    }

    // Find control (or use first variant as pseudo-control)
    const control = variants.find((v) => v.isControl) || variants[0];
    const testVariants = variants.filter((v) => v.id !== control.id);

    const controlResponseRate =
      control.piecesDelivered > 0 ? control.calls / control.piecesDelivered : 0;
    const controlContractRate =
      control.piecesDelivered > 0 ? control.contracts / control.piecesDelivered : 0;
    const controlProfitPerPiece =
      control.piecesMailed > 0 ? Number(control.grossProfit) / control.piecesMailed : 0;

    const variantResults = testVariants.map((v) => {
      const responseRate = v.piecesDelivered > 0 ? v.calls / v.piecesDelivered : 0;
      const contractRate = v.piecesDelivered > 0 ? v.contracts / v.piecesDelivered : 0;
      const profitPerPiece = v.piecesMailed > 0 ? Number(v.grossProfit) / v.piecesMailed : 0;

      // Calculate p-value for response rate
      const pValue = calculatePValue(
        control.calls,
        control.piecesDelivered,
        v.calls,
        v.piecesDelivered,
      );

      const { relativeChange } = calculateLift(controlResponseRate, responseRate);
      const ci = calculateConfidenceInterval(v.calls, v.piecesDelivered, 0.95);

      return {
        id: v.id,
        name: v.name,
        responseRate,
        contractRate,
        profitPerPiece,
        liftVsControl: relativeChange,
        pValue,
        isSignificant: isStatisticallySignificant(pValue, 0.05),
        confidenceInterval: ci,
      };
    });

    // Find recommended winner based on profit per piece
    const significantWinners = variantResults
      .filter((v) => v.isSignificant && v.liftVsControl > 0)
      .sort((a, b) => b.profitPerPiece - a.profitPerPiece);

    let recommendedWinner: { id: string; name: string; reason: string } | undefined;
    if (significantWinners.length > 0) {
      const winner = significantWinners[0];
      recommendedWinner = {
        id: winner.id,
        name: winner.name,
        reason: `${(winner.liftVsControl * 100).toFixed(1)}% lift vs control with p-value ${winner.pValue.toFixed(4)}`,
      };
    }

    return {
      control: {
        id: control.id,
        name: control.name,
        responseRate: controlResponseRate,
        contractRate: controlContractRate,
        profitPerPiece: controlProfitPerPiece,
      },
      variants: variantResults,
      recommendedWinner,
    };
  }

  async declareWinner(id: string) {
    const variant = await this.findOne(id);

    // Mark this as winner, others as not winner
    await this.prisma.$transaction([
      this.prisma.variant.updateMany({
        where: { campaignId: variant.campaignId, isWinner: true },
        data: { isWinner: false },
      }),
      this.prisma.variant.update({
        where: { id },
        data: { isWinner: true },
      }),
    ]);

    return this.findOne(id);
  }

  async adjustAllocation(campaignId: string, allocations: Array<{ variantId: string; percent: number }>) {
    // Validate total is 100%
    const total = allocations.reduce((sum, a) => sum + a.percent, 0);
    if (Math.abs(total - 100) > 0.01) {
      throw new BadRequestException('Allocations must sum to 100%');
    }

    // Update each variant
    for (const allocation of allocations) {
      await this.prisma.variant.update({
        where: { id: allocation.variantId },
        data: { allocationPercent: allocation.percent },
      });
    }

    return this.findAll(campaignId);
  }
}
