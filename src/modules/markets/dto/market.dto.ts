import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class CreateMarketDto {
  @ApiProperty({ example: 'Baltimore Metro' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'MD' })
  @IsString()
  @MinLength(2)
  state: string;

  @ApiProperty({ example: 'Baltimore City' })
  @IsString()
  @MinLength(2)
  county: string;

  @ApiPropertyOptional({ example: 'Baltimore' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 225000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  medianPrice?: number;

  @ApiPropertyOptional({ example: 45 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  avgDom?: number;

  @ApiPropertyOptional({ example: 0.72 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  buyerDensityScore?: number;
}

export class UpdateMarketDto extends PartialType(CreateMarketDto) {}

export class MarketResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  state: string;

  @ApiProperty()
  county: string;

  @ApiPropertyOptional()
  city?: string;

  @ApiPropertyOptional()
  medianPrice?: number;

  @ApiPropertyOptional()
  avgDom?: number;

  @ApiPropertyOptional()
  priceAppreciation?: number;

  @ApiPropertyOptional()
  buyerDensityScore?: number;

  @ApiProperty()
  spreadHistory: unknown[];

  @ApiProperty()
  isSynthetic: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  _count?: {
    zipCodes: number;
    properties: number;
  };
}

export class CreateZipCodeDto {
  @ApiProperty({ example: '21201' })
  @IsString()
  @MinLength(5)
  code: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  avgDom?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  medianPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  buyerDensityScore?: number;
}

export class MarketDispoDataDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  marketId: string;

  @ApiProperty()
  priceBand: string;

  @ApiProperty()
  avgDom: number;

  @ApiProperty()
  medianDom: number;

  @ApiProperty()
  listToSaleRatio: number;

  @ApiProperty()
  avgSpread: number;

  @ApiProperty()
  buyerDensity: number;

  @ApiProperty()
  dispoScore: number;

  @ApiProperty()
  periodStart: Date;

  @ApiProperty()
  periodEnd: Date;
}
