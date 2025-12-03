import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { DistressType, PriceBand } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class SegmentFiltersDto {
  @ApiPropertyOptional({ type: [String], description: 'Market UUIDs' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  markets?: string[];

  @ApiPropertyOptional({ type: [String], description: 'Zip codes' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  zipCodes?: string[];

  @ApiPropertyOptional({ type: [String], enum: DistressType })
  @IsOptional()
  @IsArray()
  distressTypes?: DistressType[];

  @ApiPropertyOptional({ type: [String], enum: PriceBand })
  @IsOptional()
  @IsArray()
  priceBands?: PriceBand[];

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minAvmValue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxAvmValue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  minEquityPercent?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isAbsentee?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isVacant?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  minDispoScore?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  minMotivationScore?: number;

  @ApiPropertyOptional({ description: 'Min years of ownership' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minOwnershipLength?: number;

  @ApiPropertyOptional({ description: 'Max days since last mail to this property' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minDaysSinceLastMail?: number;

  @ApiPropertyOptional({ description: 'Max total mails to property' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxTotalMails?: number;
}

export class CreateSegmentDto {
  @ApiProperty({ example: 'Baltimore Pre-foreclosure Absentee High Equity' })
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

  @ApiProperty({ type: SegmentFiltersDto })
  @ValidateNested()
  @Type(() => SegmentFiltersDto)
  filters: SegmentFiltersDto;

  @ApiPropertyOptional({ default: 6 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxMailsPerProperty?: number;

  @ApiPropertyOptional({ default: 21 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minDaysBetweenMails?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  excludeRecentDeals?: boolean;
}

export class UpdateSegmentDto extends PartialType(CreateSegmentDto) {}

export class SegmentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  accountId: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  filters: SegmentFiltersDto;

  @ApiProperty()
  memberCount: number;

  @ApiPropertyOptional()
  avgFreshnessDays?: number;

  @ApiPropertyOptional()
  avgDispoScore?: number;

  @ApiPropertyOptional()
  avgMotivation?: number;

  @ApiProperty()
  distressMix: Record<string, number>;

  @ApiProperty()
  maxMailsPerProperty: number;

  @ApiProperty()
  minDaysBetweenMails: number;

  @ApiProperty()
  excludeRecentDeals: boolean;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  isSynthetic: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  lastRefreshedAt?: Date;
}

export class SegmentPreviewDto {
  @ApiProperty()
  totalMatching: number;

  @ApiProperty()
  avgDispoScore: number;

  @ApiProperty()
  avgMotivationScore: number;

  @ApiProperty()
  priceBandDistribution: Record<string, number>;

  @ApiProperty()
  distressTypeDistribution: Record<string, number>;

  @ApiProperty()
  marketDistribution: Record<string, number>;

  @ApiProperty()
  sampleProperties: Array<{
    id: string;
    streetAddress: string;
    city: string;
    avmValue: number;
    dispoScore: number;
    motivationScore: number;
    distressFlags: string[];
  }>;
}

export class RefreshSegmentResultDto {
  @ApiProperty()
  previousCount: number;

  @ApiProperty()
  newCount: number;

  @ApiProperty()
  added: number;

  @ApiProperty()
  removed: number;

  @ApiProperty()
  refreshedAt: Date;
}
