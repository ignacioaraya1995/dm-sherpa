import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { WhoRecommendationService } from './who-recommendation.service';
import { WhatRecommendationService } from './what-recommendation.service';
import { HowRecommendationService } from './how-recommendation.service';
import {
  GenerateRecommendationsDto,
  UpdateRecommendationStatusDto,
  CreateRecommendationFeedbackDto,
  RecommendationCategory,
  RecommendationStatus,
} from './dto/recommendation.dto';

@Injectable()
export class RecommendationsService {
  constructor(
    private prisma: PrismaService,
    private whoService: WhoRecommendationService,
    private whatService: WhatRecommendationService,
    private howService: HowRecommendationService,
  ) {}

  /**
   * Generate recommendations for an account
   */
  async generateRecommendations(dto: GenerateRecommendationsDto) {
    const { accountId, category, campaignId, context } = dto;

    // Verify account exists
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
    });
    if (!account) {
      throw new NotFoundException(`Account ${accountId} not found`);
    }

    const recommendations = [];

    // Generate recommendations based on category or all categories
    if (!category || category === RecommendationCategory.WHO) {
      const whoRecs = await this.whoService.generateRecommendations(
        accountId,
        context,
      );
      recommendations.push(...whoRecs);
    }

    if (!category || category === RecommendationCategory.WHAT) {
      const whatRecs = await this.whatService.generateRecommendations(
        accountId,
        context,
      );
      recommendations.push(...whatRecs);
    }

    if (!category || category === RecommendationCategory.HOW) {
      const howRecs = await this.howService.generateRecommendations(
        accountId,
        campaignId,
        context,
      );
      recommendations.push(...howRecs);
    }

    // Save recommendations to database
    const savedRecommendations = await Promise.all(
      recommendations.map((rec) =>
        this.prisma.recommendation.create({
          data: {
            accountId,
            type: rec.type,
            category: rec.category,
            title: rec.title,
            description: rec.description,
            reasoning: rec.reasoning,
            confidence: rec.confidence,
            priority: rec.priority,
            data: rec.data,
            expectedImpact: rec.expectedImpact,
            estimatedBudget: rec.estimatedBudget,
            estimatedResponses: rec.estimatedResponses,
            estimatedRevenue: rec.estimatedRevenue,
            expiresAt: rec.expiresAt,
          },
        }),
      ),
    );

    return savedRecommendations;
  }

  /**
   * Get all recommendations for an account
   */
  async getRecommendations(
    accountId: string,
    options?: {
      category?: RecommendationCategory;
      status?: RecommendationStatus;
      limit?: number;
      offset?: number;
    },
  ) {
    const { category, status, limit = 20, offset = 0 } = options || {};

    const where: any = { accountId };
    if (category) where.category = category;
    if (status) where.status = status;

    const [recommendations, total] = await Promise.all([
      this.prisma.recommendation.findMany({
        where,
        orderBy: [{ priority: 'desc' }, { confidence: 'desc' }, { createdAt: 'desc' }],
        take: limit,
        skip: offset,
        include: {
          feedback: true,
        },
      }),
      this.prisma.recommendation.count({ where }),
    ]);

    return {
      data: recommendations,
      total,
      limit,
      offset,
    };
  }

  /**
   * Get a single recommendation by ID
   */
  async getRecommendation(id: string) {
    const recommendation = await this.prisma.recommendation.findUnique({
      where: { id },
      include: {
        feedback: true,
        account: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    if (!recommendation) {
      throw new NotFoundException(`Recommendation ${id} not found`);
    }

    return recommendation;
  }

  /**
   * Update recommendation status
   */
  async updateStatus(id: string, dto: UpdateRecommendationStatusDto) {
    const recommendation = await this.prisma.recommendation.findUnique({
      where: { id },
    });

    if (!recommendation) {
      throw new NotFoundException(`Recommendation ${id} not found`);
    }

    return this.prisma.recommendation.update({
      where: { id },
      data: {
        status: dto.status,
        actionTaken: dto.status === RecommendationStatus.APPLIED ? 'APPLIED' :
                     dto.status === RecommendationStatus.DISMISSED ? 'DISMISSED' : undefined,
        actionTakenAt: [RecommendationStatus.APPLIED, RecommendationStatus.DISMISSED].includes(dto.status as any)
          ? new Date()
          : undefined,
        actionNotes: dto.actionNotes,
        appliedCampaignId: dto.appliedCampaignId,
      },
    });
  }

  /**
   * Add feedback for a recommendation
   */
  async addFeedback(id: string, dto: CreateRecommendationFeedbackDto) {
    const recommendation = await this.prisma.recommendation.findUnique({
      where: { id },
    });

    if (!recommendation) {
      throw new NotFoundException(`Recommendation ${id} not found`);
    }

    return this.prisma.recommendationFeedback.create({
      data: {
        recommendationId: id,
        feedbackType: dto.feedbackType,
        rating: dto.rating,
        actualResponseRate: dto.actualResponseRate,
        actualROI: dto.actualROI,
        actualRevenue: dto.actualRevenue,
        comments: dto.comments,
      },
    });
  }

  /**
   * Get recommendation summary for an account
   */
  async getSummary(accountId: string) {
    const recommendations = await this.prisma.recommendation.findMany({
      where: { accountId },
      select: {
        category: true,
        priority: true,
        status: true,
        confidence: true,
      },
    });

    const byCategory: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    let pendingCount = 0;
    let appliedCount = 0;
    let dismissedCount = 0;
    let totalConfidence = 0;

    for (const rec of recommendations) {
      // Category counts
      byCategory[rec.category] = (byCategory[rec.category] || 0) + 1;

      // Priority counts
      byPriority[rec.priority] = (byPriority[rec.priority] || 0) + 1;

      // Status counts
      if (rec.status === 'PENDING' || rec.status === 'VIEWED') pendingCount++;
      if (rec.status === 'APPLIED') appliedCount++;
      if (rec.status === 'DISMISSED') dismissedCount++;

      // Confidence sum
      totalConfidence += Number(rec.confidence);
    }

    return {
      totalRecommendations: recommendations.length,
      pendingCount,
      appliedCount,
      dismissedCount,
      byCategory,
      byPriority,
      averageConfidence:
        recommendations.length > 0 ? totalConfidence / recommendations.length : 0,
    };
  }

  /**
   * Delete expired recommendations
   */
  async cleanupExpired() {
    const result = await this.prisma.recommendation.updateMany({
      where: {
        expiresAt: { lt: new Date() },
        status: { in: ['PENDING', 'VIEWED'] },
      },
      data: {
        status: 'EXPIRED',
      },
    });

    return { expiredCount: result.count };
  }

  /**
   * Apply a recommendation to create a campaign
   */
  async applyRecommendation(id: string, userId: string) {
    const recommendation = await this.getRecommendation(id);

    // Based on the recommendation category, create appropriate resources
    // This is a placeholder - actual implementation would depend on your campaign creation logic

    // Mark as applied
    await this.updateStatus(id, {
      status: RecommendationStatus.APPLIED,
      actionNotes: 'Applied via quick action',
    });

    return {
      recommendation,
      message: 'Recommendation applied. Campaign creation would happen here.',
    };
  }
}
