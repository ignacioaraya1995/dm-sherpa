import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  PropertyType,
  PriceBand,
  OwnershipType,
  DistressType,
  DistressSeverity,
} from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class CreateOwnerDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Smith' })
  @IsString()
  lastName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mailingStreet?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mailingCity?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mailingState?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mailingZip?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ enum: OwnershipType })
  @IsEnum(OwnershipType)
  ownershipType: OwnershipType;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  ownershipLength?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isAbsentee?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  distanceFromProperty?: number;
}

export class CreatePropertyDto {
  @ApiProperty({ example: '123 Main St' })
  @IsString()
  @MinLength(3)
  streetAddress: string;

  @ApiProperty({ example: 'Baltimore' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'MD' })
  @IsString()
  state: string;

  @ApiProperty({ description: 'Zip code UUID' })
  @IsString()
  zipCodeId: string;

  @ApiProperty({ description: 'Market UUID' })
  @IsString()
  marketId: string;

  @ApiProperty({ enum: PropertyType })
  @IsEnum(PropertyType)
  propertyType: PropertyType;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  beds?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  baths?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sqft?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  yearBuilt?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  avmValue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  arvValue?: number;

  @ApiPropertyOptional({ enum: PriceBand })
  @IsOptional()
  @IsEnum(PriceBand)
  priceBand?: PriceBand;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isVacant?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isAbsenteeOwner?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateOwnerDto)
  owner?: CreateOwnerDto;
}

export class UpdatePropertyDto extends PartialType(CreatePropertyDto) {}

export class PropertyResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  streetAddress: string;

  @ApiProperty()
  city: string;

  @ApiProperty()
  state: string;

  @ApiProperty()
  zipCodeId: string;

  @ApiProperty()
  marketId: string;

  @ApiProperty({ enum: PropertyType })
  propertyType: PropertyType;

  @ApiPropertyOptional()
  beds?: number;

  @ApiPropertyOptional()
  baths?: number;

  @ApiPropertyOptional()
  sqft?: number;

  @ApiPropertyOptional()
  yearBuilt?: number;

  @ApiPropertyOptional()
  avmValue?: number;

  @ApiPropertyOptional()
  arvValue?: number;

  @ApiPropertyOptional({ enum: PriceBand })
  priceBand?: PriceBand;

  @ApiProperty()
  isVacant: boolean;

  @ApiProperty()
  isAbsenteeOwner: boolean;

  @ApiPropertyOptional()
  dispoScore?: number;

  @ApiPropertyOptional()
  motivationScore?: number;

  @ApiProperty()
  isSynthetic: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class CreateDistressFlagDto {
  @ApiProperty({ enum: DistressType })
  @IsEnum(DistressType)
  type: DistressType;

  @ApiProperty({ enum: DistressSeverity })
  @IsEnum(DistressSeverity)
  severity: DistressSeverity;

  @ApiProperty()
  @Type(() => Date)
  startDate: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  endDate?: Date;

  @ApiPropertyOptional({ description: 'Type-specific metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  source?: string;
}

export class PropertySearchDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  marketId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  zipCode?: string;

  @ApiPropertyOptional({ enum: PropertyType })
  @IsOptional()
  @IsEnum(PropertyType)
  propertyType?: PropertyType;

  @ApiPropertyOptional({ enum: PriceBand })
  @IsOptional()
  @IsEnum(PriceBand)
  priceBand?: PriceBand;

  @ApiPropertyOptional({ type: [String], enum: DistressType })
  @IsOptional()
  distressTypes?: DistressType[];

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

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minAvmValue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxAvmValue?: number;
}
