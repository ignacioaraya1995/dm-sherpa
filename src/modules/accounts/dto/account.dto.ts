import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { AccountType, AccountStatus } from '@prisma/client';
import { IsEnum, IsObject, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateAccountDto {
  @ApiProperty({ example: 'Acme Real Estate Investments' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ enum: AccountType, example: AccountType.WHOLESALER })
  @IsEnum(AccountType)
  type: AccountType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  settings?: Record<string, unknown>;
}

export class UpdateAccountDto extends PartialType(CreateAccountDto) {
  @ApiPropertyOptional({ enum: AccountStatus })
  @IsOptional()
  @IsEnum(AccountStatus)
  status?: AccountStatus;
}

export class AccountResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: AccountType })
  type: AccountType;

  @ApiProperty({ enum: AccountStatus })
  status: AccountStatus;

  @ApiProperty()
  settings: Record<string, unknown>;

  @ApiProperty()
  isSynthetic: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  _count?: {
    users: number;
    campaigns: number;
    deals: number;
  };
}

export class AccountStatsDto {
  @ApiProperty()
  totalUsers: number;

  @ApiProperty()
  totalCampaigns: number;

  @ApiProperty()
  activeCampaigns: number;

  @ApiProperty()
  totalDeals: number;

  @ApiProperty()
  closedDeals: number;

  @ApiProperty()
  totalGrossProfit: number;

  @ApiProperty()
  totalMailedPieces: number;

  @ApiProperty()
  overallResponseRate: number;

  @ApiProperty()
  overallContractRate: number;
}
