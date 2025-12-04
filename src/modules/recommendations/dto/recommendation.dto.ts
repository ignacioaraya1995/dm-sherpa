import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsObject,
  Min,
  Max,
} from 'class-validator';

export enum RecommendationType {
  PROACTIVE = 'PROACTIVE',
  ON_DEMAND = 'ON_DEMAND',
  OPTIMIZATION = 'OPTIMIZATION',
}

export enum RecommendationCategory {
  WHO = 'WHO',
  WHAT = 'WHAT',
  HOW = 'HOW',
  TIMING = 'TIMING',
  BUDGET = 'BUDGET',
}

export enum RecommendationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum RecommendationStatus {
  PENDING = 'PENDING',
  VIEWED = 'VIEWED',
  APPLIED = 'APPLIED',
  DISMISSED = 'DISMISSED',
  EXPIRED = 'EXPIRED',
}

export enum FeedbackType {
  HELPFUL = 'HELPFUL',
  NOT_HELPFUL = 'NOT_HELPFUL',
  INACCURATE = 'INACCURATE',
  APPLIED_SUCCESS = 'APPLIED_SUCCESS',
  APPLIED_FAILURE = 'APPLIED_FAILURE',
}

// Request DTOs
export class GenerateRecommendationsDto {
  @ApiProperty({ description: 'Account ID to generate recommendations for' })
  @IsString()
  accountId: string;

  @ApiPropertyOptional({
    enum: RecommendationCategory,
    description: 'Specific category to generate recommendations for',
  })
  @IsOptional()
  @IsEnum(RecommendationCategory)
  category?: RecommendationCategory;

  @ApiPropertyOptional({ description: 'Campaign ID for optimization recommendations' })
  @IsOptional()
  @IsString()
  campaignId?: string;

  @ApiPropertyOptional({ description: 'Additional context for recommendation generation' })
  @IsOptional()
  @IsObject()
  context?: Record<string, any>;
}

export class UpdateRecommendationStatusDto {
  @ApiProperty({ enum: RecommendationStatus })
  @IsEnum(RecommendationStatus)
  status: RecommendationStatus;

  @ApiPropertyOptional({ description: 'Notes about the action taken' })
  @IsOptional()
  @IsString()
  actionNotes?: string;

  @ApiPropertyOptional({ description: 'Campaign ID if recommendation was applied' })
  @IsOptional()
  @IsString()
  appliedCampaignId?: string;
}

export class CreateRecommendationFeedbackDto {
  @ApiProperty({ enum: FeedbackType })
  @IsEnum(FeedbackType)
  feedbackType: FeedbackType;

  @ApiPropertyOptional({ description: 'Rating from 1-5' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ description: 'Actual response rate achieved' })
  @IsOptional()
  @IsNumber()
  actualResponseRate?: number;

  @ApiPropertyOptional({ description: 'Actual ROI achieved' })
  @IsOptional()
  @IsNumber()
  actualROI?: number;

  @ApiPropertyOptional({ description: 'Actual revenue achieved' })
  @IsOptional()
  @IsNumber()
  actualRevenue?: number;

  @ApiPropertyOptional({ description: 'User comments' })
  @IsOptional()
  @IsString()
  comments?: string;
}

// Response DTOs
export class RecommendationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  accountId: string;

  @ApiProperty({ enum: RecommendationType })
  type: RecommendationType;

  @ApiProperty({ enum: RecommendationCategory })
  category: RecommendationCategory;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  reasoning: string;

  @ApiProperty()
  confidence: number;

  @ApiProperty({ enum: RecommendationPriority })
  priority: RecommendationPriority;

  @ApiProperty()
  data: Record<string, any>;

  @ApiProperty()
  expectedImpact: Record<string, any>;

  @ApiPropertyOptional()
  estimatedBudget?: number;

  @ApiPropertyOptional()
  estimatedResponses?: number;

  @ApiPropertyOptional()
  estimatedRevenue?: number;

  @ApiProperty({ enum: RecommendationStatus })
  status: RecommendationStatus;

  @ApiPropertyOptional()
  actionTaken?: string;

  @ApiPropertyOptional()
  actionTakenAt?: Date;

  @ApiPropertyOptional()
  appliedCampaignId?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  expiresAt?: Date;
}

export class RecommendationSummaryDto {
  @ApiProperty()
  totalRecommendations: number;

  @ApiProperty()
  pendingCount: number;

  @ApiProperty()
  appliedCount: number;

  @ApiProperty()
  dismissedCount: number;

  @ApiProperty()
  byCategory: Record<string, number>;

  @ApiProperty()
  byPriority: Record<string, number>;

  @ApiProperty()
  averageConfidence: number;
}

// WHO Recommendation specific DTOs
export class WhoRecommendationDataDto {
  @ApiProperty({ description: 'Suggested segment filters' })
  segmentFilters: Record<string, any>;

  @ApiProperty({ description: 'Estimated segment size' })
  estimatedSize: number;

  @ApiProperty({ description: 'Average motivation score of segment' })
  avgMotivation: number;

  @ApiProperty({ description: 'Average dispo score of segment' })
  avgDispoScore: number;

  @ApiProperty({ description: 'Distress type breakdown' })
  distressMix: Record<string, number>;

  @ApiProperty({ description: 'Top markets in segment' })
  topMarkets: string[];

  @ApiProperty({ description: 'Price band distribution' })
  priceBandDistribution: Record<string, number>;
}

// WHAT Recommendation specific DTOs
export class WhatRecommendationDataDto {
  @ApiProperty({ description: 'Recommended template ID' })
  templateId?: string;

  @ApiProperty({ description: 'Recommended mail format' })
  mailFormat: string;

  @ApiProperty({ description: 'Recommended offer strategy' })
  offerStrategy: Record<string, any>;

  @ApiProperty({ description: 'Suggested headline variations' })
  headlineVariations: string[];

  @ApiProperty({ description: 'Expected lift vs baseline' })
  expectedLift: number;

  @ApiProperty({ description: 'Best performing elements from historical data' })
  topPerformingElements: Record<string, any>;
}

// HOW Recommendation specific DTOs
export class HowRecommendationDataDto {
  @ApiProperty({ description: 'Recommended number of touches' })
  touchCount: number;

  @ApiProperty({ description: 'Recommended timing between touches (days)' })
  timing: number[];

  @ApiProperty({ description: 'Recommended total budget' })
  budget: number;

  @ApiProperty({ description: 'Recommended batch size' })
  batchSize: number;

  @ApiProperty({ description: 'Recommended A/B test configuration' })
  abTestConfig?: Record<string, any>;

  @ApiProperty({ description: 'Optimal send days of week' })
  optimalSendDays: string[];

  @ApiProperty({ description: 'Expected response curve by touch' })
  responseCurve: number[];
}
