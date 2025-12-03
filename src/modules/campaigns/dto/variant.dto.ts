import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class CreateVariantDto {
  @ApiProperty({ example: 'Check Letter - 70% Offer' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Campaign UUID' })
  @IsString()
  campaignId: string;

  @ApiPropertyOptional({ description: 'Campaign Step UUID' })
  @IsOptional()
  @IsString()
  stepId?: string;

  @ApiPropertyOptional({ description: 'Design Version UUID' })
  @IsOptional()
  @IsString()
  designVersionId?: string;

  @ApiPropertyOptional({ description: 'Offer Strategy UUID' })
  @IsOptional()
  @IsString()
  offerStrategyId?: string;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  allocationPercent?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isControl?: boolean;
}

export class UpdateVariantDto extends PartialType(CreateVariantDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class VariantResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  campaignId: string;

  @ApiPropertyOptional()
  stepId?: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  designVersionId?: string;

  @ApiPropertyOptional()
  offerStrategyId?: string;

  @ApiProperty()
  allocationPercent: number;

  @ApiProperty()
  piecesMailed: number;

  @ApiProperty()
  piecesDelivered: number;

  @ApiProperty()
  calls: number;

  @ApiProperty()
  qualifiedCalls: number;

  @ApiProperty()
  contracts: number;

  @ApiProperty()
  grossProfit: number;

  @ApiPropertyOptional()
  responseRate?: number;

  @ApiPropertyOptional()
  contractRate?: number;

  @ApiPropertyOptional()
  profitPerPiece?: number;

  @ApiProperty()
  isControl: boolean;

  @ApiPropertyOptional()
  isWinner?: boolean;

  @ApiPropertyOptional()
  pValue?: number;

  @ApiPropertyOptional()
  liftVsControl?: number;

  @ApiPropertyOptional()
  confidenceInterval?: { lower: number; upper: number };

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  isSynthetic: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class VariantComparisonDto {
  @ApiProperty()
  control: {
    id: string;
    name: string;
    responseRate: number;
    contractRate: number;
    profitPerPiece: number;
  };

  @ApiProperty()
  variants: Array<{
    id: string;
    name: string;
    responseRate: number;
    contractRate: number;
    profitPerPiece: number;
    liftVsControl: number;
    pValue: number;
    isSignificant: boolean;
    confidenceInterval: { lower: number; upper: number };
  }>;

  @ApiPropertyOptional()
  recommendedWinner?: {
    id: string;
    name: string;
    reason: string;
  };
}
