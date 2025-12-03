import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { Prisma } from '@prisma/client';
import { PaginationDto, PaginatedResponseDto } from '@/common/dto/pagination.dto';
import { v4 as uuidv4 } from 'uuid';
type JsonValue = Prisma.InputJsonValue;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    // Check for existing email
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException(`User with email ${dto.email} already exists`);
    }

    // Verify account exists
    const account = await this.prisma.account.findUnique({
      where: { id: dto.accountId },
    });

    if (!account) {
      throw new NotFoundException(`Account with ID ${dto.accountId} not found`);
    }

    return this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        role: dto.role,
        accountId: dto.accountId,
        isAiAgent: dto.isAiAgent || false,
        settings: (dto.settings || {}) as JsonValue,
      },
      include: {
        account: {
          select: { id: true, name: true, type: true },
        },
      },
    });
  }

  async findAll(
    accountId: string,
    pagination: PaginationDto,
    filters?: { role?: string },
  ) {
    const where: Prisma.UserWhereInput = { accountId };

    if (filters?.role) {
      where.role = filters.role as Prisma.EnumUserRoleFilter;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { [pagination.sortBy || 'createdAt']: pagination.sortOrder },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          accountId: true,
          isAiAgent: true,
          settings: true,
          createdAt: true,
          updatedAt: true,
          lastLoginAt: true,
          // Don't include apiKey in list
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return new PaginatedResponseDto(users, total, pagination);
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        account: {
          select: { id: true, name: true, type: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Don't expose the full API key
    return {
      ...user,
      apiKey: user.apiKey ? '****' + user.apiKey.slice(-4) : null,
    };
  }

  async findByApiKey(apiKey: string) {
    const user = await this.prisma.user.findUnique({
      where: { apiKey },
      include: {
        account: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Invalid API key');
    }

    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);

    if (dto.email) {
      const existing = await this.prisma.user.findFirst({
        where: {
          email: dto.email,
          NOT: { id },
        },
      });

      if (existing) {
        throw new ConflictException(`Email ${dto.email} is already in use`);
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        email: dto.email,
        name: dto.name,
        role: dto.role,
        isAiAgent: dto.isAiAgent,
        settings: dto.settings ? (dto.settings as JsonValue) : undefined,
      },
    });
  }

  async delete(id: string) {
    await this.findOne(id);
    return this.prisma.user.delete({ where: { id } });
  }

  async generateApiKey(id: string) {
    await this.findOne(id);

    const apiKey = `dmsh_${uuidv4().replace(/-/g, '')}`;

    await this.prisma.user.update({
      where: { id },
      data: { apiKey },
    });

    // Return the key only once
    return { apiKey };
  }

  async revokeApiKey(id: string) {
    await this.findOne(id);

    await this.prisma.user.update({
      where: { id },
      data: { apiKey: null },
    });
  }

  async updateLastLogin(id: string) {
    await this.prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }
}
