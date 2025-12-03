import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  CampaignType,
  CampaignGoal,
  CampaignStatus,
  ExperimentType,
} from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class CreateCampaignStepDto {
  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  stepNumber: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ default: 21 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  daysSincePrevious?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  designTemplateId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  offerStrategyId?: string;
}

export class CreateCampaignDto {
  @ApiProperty({ example: 'Baltimore Pre-foreclosure Q1 2024' })
  @IsString()
  @MinLength(3)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Account UUID' })
  @IsString()
  accountId: string;

  @ApiProperty({ description: 'Creator User UUID' })
  @IsString()
  createdById: string;

  @ApiProperty({ enum: CampaignType })
  @IsEnum(CampaignType)
  type: CampaignType;

  @ApiProperty({ enum: CampaignGoal })
  @IsEnum(CampaignGoal)
  goal: CampaignGoal;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  totalBudget?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isMultiTouch?: boolean;

  @ApiPropertyOptional({ default: 3 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(10)
  touchCount?: number;

  @ApiPropertyOptional({ type: [String], description: 'Segment UUIDs' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  segmentIds?: string[];

  @ApiPropertyOptional({ type: [CreateCampaignStepDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCampaignStepDto)
  steps?: CreateCampaignStepDto[];
}

export class UpdateCampaignDto extends PartialType(CreateCampaignDto) {
  @ApiPropertyOptional({ enum: CampaignStatus })
  @IsOptional()
  @IsEnum(CampaignStatus)
  status?: CampaignStatus;
}

export class CampaignResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  accountId: string;

  @ApiProperty()
  createdById: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty({ enum: CampaignType })
  type: CampaignType;

  @ApiProperty({ enum: CampaignGoal })
  goal: CampaignGoal;

  @ApiProperty({ enum: CampaignStatus })
  status: CampaignStatus;

  @ApiPropertyOptional()
  totalBudget?: number;

  @ApiProperty()
  spentBudget: number;

  @ApiPropertyOptional()
  startDate?: Date;

  @ApiPropertyOptional()
  endDate?: Date;

  @ApiProperty()
  isMultiTouch: boolean;

  @ApiProperty()
  touchCount: number;

  @ApiProperty()
  isExperiment: boolean;

  @ApiPropertyOptional({ enum: ExperimentType })
  experimentType?: ExperimentType;

  @ApiProperty()
  totalMailed: number;

  @ApiProperty()
  totalDelivered: number;

  @ApiProperty()
  totalCalls: number;

  @ApiProperty()
  totalQualifiedLeads: number;

  @ApiProperty()
  totalContracts: number;

  @ApiPropertyOptional()
  responseRate?: number;

  @ApiPropertyOptional()
  contractRate?: number;

  @ApiProperty()
  grossProfit: number;

  @ApiPropertyOptional()
  roi?: number;

  @ApiProperty()
  isSynthetic: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  launchedAt?: Date;

  @ApiPropertyOptional()
  completedAt?: Date;
}

export class CampaignStatsDto {
  @ApiProperty()
  totalMailed: number;

  @ApiProperty()
  totalDelivered: number;

  @ApiProperty()
  deliveryRate: number;

  @ApiProperty()
  totalCalls: number;

  @ApiProperty()
  responseRate: number;

  @ApiProperty()
  qualifiedLeads: number;

  @ApiProperty()
  qualificationRate: number;

  @ApiProperty()
  contracts: number;

  @ApiProperty()
  contractRate: number;

  @ApiProperty()
  grossProfit: number;

  @ApiProperty()
  costPerLead: number;

  @ApiProperty()
  costPerContract: number;

  @ApiProperty()
  roi: number;

  @ApiProperty()
  byStep: Array<{
    stepNumber: number;
    mailed: number;
    delivered: number;
    calls: number;
    contracts: number;
  }>;

  @ApiProperty()
  byVariant: Array<{
    variantId: string;
    variantName: string;
    mailed: number;
    responseRate: number;
    contractRate: number;
    profitPerPiece: number;
  }>;
}

export class LaunchCampaignDto {
  @ApiPropertyOptional({ description: 'Override scheduled start date' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @ApiPropertyOptional({ default: false, description: 'Send immediately without delay' })
  @IsOptional()
  @IsBoolean()
  immediate?: boolean;
}
