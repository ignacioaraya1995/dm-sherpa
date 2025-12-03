import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { IsBoolean, IsEmail, IsEnum, IsObject, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'John Smith' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ enum: UserRole, example: UserRole.AE })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({ description: 'Account ID the user belongs to' })
  @IsString()
  accountId: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isAiAgent?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  settings?: Record<string, unknown>;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {}

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: UserRole })
  role: UserRole;

  @ApiProperty()
  accountId: string;

  @ApiProperty()
  isAiAgent: boolean;

  @ApiPropertyOptional()
  apiKey?: string;

  @ApiProperty()
  settings: Record<string, unknown>;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  lastLoginAt?: Date;
}

export class GenerateApiKeyResponseDto {
  @ApiProperty({ description: 'New API key - shown only once' })
  apiKey: string;
}
