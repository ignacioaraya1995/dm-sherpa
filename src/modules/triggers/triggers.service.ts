import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '@/common/prisma/prisma.service';
import { PaginationDto, PaginatedResponseDto } from '@/common/dto/pagination.dto';
import { TriggerType, TriggerActionType, TriggerExecutionStatus, Prisma } from '@prisma/client';

export interface CreateTriggerRuleDto {
  accountId: string;
  name: string;
  description?: string;
  triggerType: TriggerType;
  conditions: Record<string, unknown>;
  actionType: TriggerActionType;
  actionConfig: Record<string, unknown>;
  maxLatencyHours?: number;
  cooldownDays?: number;
}

@Injectable()
export class TriggersService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('triggers') private readonly triggerQueue: Queue,
  ) {}

  async create(dto: CreateTriggerRuleDto) {
    return this.prisma.triggerRule.create({
      data: {
        accountId: dto.accountId,
        name: dto.name,
        description: dto.description,
        triggerType: dto.triggerType,
        conditions: dto.conditions,
        actionType: dto.actionType,
        actionConfig: dto.actionConfig,
        maxLatencyHours: dto.maxLatencyHours,
        cooldownDays: dto.cooldownDays,
      },
    });
  }

  async findAll(accountId: string, pagination: PaginationDto, filters?: { isActive?: boolean }) {
    const where: Prisma.TriggerRuleWhereInput = { accountId };
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;

    const [rules, total] = await Promise.all([
      this.prisma.triggerRule.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { executions: true } },
        },
      }),
      this.prisma.triggerRule.count({ where }),
    ]);

    return new PaginatedResponseDto(rules, total, pagination);
  }

  async findOne(id: string) {
    const rule = await this.prisma.triggerRule.findUnique({
      where: { id },
      include: {
        executions: {
          orderBy: { executedAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!rule) {
      throw new NotFoundException(`Trigger rule ${id} not found`);
    }

    return rule;
  }

  async update(id: string, updates: Partial<CreateTriggerRuleDto>) {
    await this.findOne(id);
    return this.prisma.triggerRule.update({
      where: { id },
      data: updates,
    });
  }

  async activate(id: string) {
    await this.findOne(id);
    return this.prisma.triggerRule.update({
      where: { id },
      data: { isActive: true },
    });
  }

  async deactivate(id: string) {
    await this.findOne(id);
    return this.prisma.triggerRule.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async delete(id: string) {
    await this.findOne(id);
    return this.prisma.triggerRule.delete({ where: { id } });
  }

  async evaluateEvent(
    accountId: string,
    eventType: string,
    eventData: Record<string, unknown>,
  ) {
    // Find matching active rules
    const rules = await this.prisma.triggerRule.findMany({
      where: {
        accountId,
        isActive: true,
        triggerType: eventType as TriggerType,
      },
    });

    const matchingRules: string[] = [];

    for (const rule of rules) {
      if (this.matchesConditions(rule.conditions as Record<string, unknown>, eventData)) {
        matchingRules.push(rule.id);

        // Queue execution
        await this.triggerQueue.add('execute', {
          ruleId: rule.id,
          eventType,
          eventData,
          eventTimestamp: new Date().toISOString(),
        });
      }
    }

    return { matchedRules: matchingRules.length, ruleIds: matchingRules };
  }

  async recordExecution(
    ruleId: string,
    eventType: string,
    eventData: Record<string, unknown>,
    status: TriggerExecutionStatus,
    result?: { data?: Record<string, unknown>; error?: string },
  ) {
    const eventTimestamp = new Date((eventData.timestamp as string) || Date.now());

    const execution = await this.prisma.triggerExecution.create({
      data: {
        ruleId,
        triggerEventType: eventType,
        triggerEventData: eventData,
        status,
        resultData: result?.data,
        errorMessage: result?.error,
        eventTimestamp,
        latencyMs: Date.now() - eventTimestamp.getTime(),
      },
    });

    // Update rule stats
    await this.prisma.triggerRule.update({
      where: { id: ruleId },
      data: {
        totalTriggered: { increment: 1 },
        lastTriggeredAt: new Date(),
      },
    });

    return execution;
  }

  async getExecutionStats(ruleId: string, periodDays: number = 30) {
    const since = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

    const [total, byStatus, avgLatency] = await Promise.all([
      this.prisma.triggerExecution.count({
        where: { ruleId, executedAt: { gte: since } },
      }),

      this.prisma.triggerExecution.groupBy({
        by: ['status'],
        where: { ruleId, executedAt: { gte: since } },
        _count: true,
      }),

      this.prisma.triggerExecution.aggregate({
        where: { ruleId, executedAt: { gte: since }, latencyMs: { not: null } },
        _avg: { latencyMs: true },
      }),
    ]);

    return {
      totalExecutions: total,
      byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count])),
      avgLatencyMs: avgLatency._avg.latencyMs || 0,
    };
  }

  private matchesConditions(
    conditions: Record<string, unknown>,
    eventData: Record<string, unknown>,
  ): boolean {
    for (const [key, expected] of Object.entries(conditions)) {
      const actual = eventData[key];

      if (Array.isArray(expected)) {
        if (!expected.includes(actual)) return false;
      } else if (typeof expected === 'object' && expected !== null) {
        // Handle comparison operators
        const ops = expected as Record<string, unknown>;
        if (ops.gte !== undefined && (actual as number) < (ops.gte as number)) return false;
        if (ops.lte !== undefined && (actual as number) > (ops.lte as number)) return false;
        if (ops.gt !== undefined && (actual as number) <= (ops.gt as number)) return false;
        if (ops.lt !== undefined && (actual as number) >= (ops.lt as number)) return false;
      } else if (actual !== expected) {
        return false;
      }
    }

    return true;
  }
}
