import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@/common/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PhoneStatus, HealthCheckType } from '@prisma/client';

export interface PhoneHealthStatus {
  phoneNumberId: string;
  number: string;
  overallHealth: 'healthy' | 'warning' | 'critical';
  issues: string[];
  metrics: {
    spamScore: number;
    expectedCallsPerThousand: number;
    actualCallsPerThousand: number;
    callVariance: number; // % deviation from expected
    lastHealthCheck: Date | null;
    daysSinceRegistrationCheck: number;
  };
  recommendations: string[];
}

export interface TelephonyHealthReport {
  accountId: string;
  generatedAt: Date;
  summary: {
    totalNumbers: number;
    healthyCount: number;
    warningCount: number;
    criticalCount: number;
    avgSpamScore: number;
  };
  issues: Array<{
    phoneNumberId: string;
    number: string;
    severity: 'warning' | 'critical';
    issue: string;
    recommendation: string;
  }>;
  anomalies: Array<{
    type: 'call_drop' | 'delivery_stable_calls_down' | 'spam_spike';
    description: string;
    affectedNumbers: string[];
    detectedAt: Date;
  }>;
}

@Injectable()
export class PhoneHealthService {
  private readonly logger = new Logger(PhoneHealthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async runScheduledHealthChecks() {
    this.logger.log('Running scheduled phone health checks');

    // Get all active phone numbers
    const phoneNumbers = await this.prisma.phoneNumber.findMany({
      where: { status: PhoneStatus.ACTIVE },
      select: { id: true },
    });

    for (const phone of phoneNumbers) {
      await this.checkPhoneHealth(phone.id);
    }
  }

  async checkPhoneHealth(phoneNumberId: string): Promise<PhoneHealthStatus> {
    const phone = await this.prisma.phoneNumber.findUnique({
      where: { id: phoneNumberId },
      include: {
        calls: {
          where: {
            startTime: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          },
          select: { id: true },
        },
        mailPieces: {
          where: {
            status: 'DELIVERED',
            createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          },
          select: { id: true },
        },
        healthLogs: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
    });

    if (!phone) {
      throw new Error(`Phone number ${phoneNumberId} not found`);
    }

    const issues: string[] = [];
    const recommendations: string[] = [];

    // Calculate metrics
    const deliveredCount = phone.mailPieces.length;
    const callCount = phone.calls.length;
    const actualCallsPerThousand =
      deliveredCount > 0 ? (callCount / deliveredCount) * 1000 : 0;
    const expectedCallsPerThousand = Number(phone.expectedCallsPerThousand) || 15;
    const callVariance =
      expectedCallsPerThousand > 0
        ? ((actualCallsPerThousand - expectedCallsPerThousand) / expectedCallsPerThousand) * 100
        : 0;
    const spamScore = Number(phone.spamScore) || 0;

    // Check spam score
    if (spamScore > 0.7) {
      issues.push('Critical spam score - number likely blocked');
      recommendations.push('Replace this number immediately');
    } else if (spamScore > 0.4) {
      issues.push('Elevated spam score - deliverability at risk');
      recommendations.push('Monitor closely and consider rotation');
    }

    // Check call variance
    if (callVariance < -50) {
      issues.push('Calls significantly below expected (-50%)');
      recommendations.push('Check routing configuration and spam status');
    } else if (callVariance < -30) {
      issues.push('Calls below expected (-30%)');
      recommendations.push('Monitor for continued decline');
    }

    // Check last health check
    const lastCheck = phone.healthLogs[0]?.timestamp;
    const daysSinceCheck = lastCheck
      ? Math.floor((Date.now() - lastCheck.getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    if (daysSinceCheck > 7) {
      issues.push('No health check in over 7 days');
      recommendations.push('Run manual health check');
    }

    // Determine overall health
    let overallHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (issues.some((i) => i.includes('Critical') || i.includes('blocked'))) {
      overallHealth = 'critical';
    } else if (issues.length > 0) {
      overallHealth = 'warning';
    }

    // Log health check
    await this.prisma.phoneHealthLog.create({
      data: {
        phoneNumberId,
        checkType: HealthCheckType.SPAM_CHECK,
        isHealthy: overallHealth === 'healthy',
        spamScore,
        issues: issues,
      },
    });

    // Update phone spam score
    await this.prisma.phoneNumber.update({
      where: { id: phoneNumberId },
      data: {
        lastHealthCheck: new Date(),
        status:
          overallHealth === 'critical'
            ? PhoneStatus.SPAM_FLAGGED
            : phone.status,
      },
    });

    // Emit event if issues found
    if (overallHealth !== 'healthy') {
      this.eventEmitter.emit('phone.health.issue', {
        phoneNumberId,
        health: overallHealth,
        issues,
      });
    }

    return {
      phoneNumberId,
      number: phone.number,
      overallHealth,
      issues,
      metrics: {
        spamScore,
        expectedCallsPerThousand,
        actualCallsPerThousand,
        callVariance,
        lastHealthCheck: lastCheck || null,
        daysSinceRegistrationCheck: daysSinceCheck,
      },
      recommendations,
    };
  }

  async generateHealthReport(accountId: string): Promise<TelephonyHealthReport> {
    const phoneNumbers = await this.prisma.phoneNumber.findMany({
      where: { accountId },
      include: {
        healthLogs: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
    });

    const healthStatuses = await Promise.all(
      phoneNumbers.map((p) => this.checkPhoneHealth(p.id)),
    );

    const healthyCount = healthStatuses.filter((h) => h.overallHealth === 'healthy').length;
    const warningCount = healthStatuses.filter((h) => h.overallHealth === 'warning').length;
    const criticalCount = healthStatuses.filter((h) => h.overallHealth === 'critical').length;
    const avgSpamScore =
      healthStatuses.reduce((sum, h) => sum + h.metrics.spamScore, 0) / healthStatuses.length;

    const issues = healthStatuses
      .filter((h) => h.issues.length > 0)
      .flatMap((h) =>
        h.issues.map((issue, i) => ({
          phoneNumberId: h.phoneNumberId,
          number: h.number,
          severity: (h.overallHealth === 'critical' ? 'critical' : 'warning') as 'warning' | 'critical',
          issue,
          recommendation: h.recommendations[i] || 'Review manually',
        })),
      );

    // Detect anomalies - look for patterns across numbers
    const anomalies = await this.detectAnomalies(accountId, healthStatuses);

    return {
      accountId,
      generatedAt: new Date(),
      summary: {
        totalNumbers: phoneNumbers.length,
        healthyCount,
        warningCount,
        criticalCount,
        avgSpamScore,
      },
      issues,
      anomalies,
    };
  }

  async detectCallDropAnomaly(
    accountId: string,
    periodDays: number = 7,
  ): Promise<{
    detected: boolean;
    affectedCampaigns: string[];
    callDropPercent: number;
    deliveryStable: boolean;
  }> {
    const cutoff = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);
    const previousCutoff = new Date(cutoff.getTime() - periodDays * 24 * 60 * 60 * 1000);

    // Get current period stats
    const currentStats = await this.prisma.campaign.aggregate({
      where: {
        accountId,
        createdAt: { lt: cutoff },
      },
      _sum: {
        totalDelivered: true,
        totalCalls: true,
      },
    });

    // Get previous period stats
    const previousStats = await this.prisma.campaign.aggregate({
      where: {
        accountId,
        createdAt: { gte: previousCutoff, lt: cutoff },
      },
      _sum: {
        totalDelivered: true,
        totalCalls: true,
      },
    });

    const currentCallRate =
      (currentStats._sum.totalDelivered || 0) > 0
        ? (currentStats._sum.totalCalls || 0) / (currentStats._sum.totalDelivered || 1)
        : 0;
    const previousCallRate =
      (previousStats._sum.totalDelivered || 0) > 0
        ? (previousStats._sum.totalCalls || 0) / (previousStats._sum.totalDelivered || 1)
        : 0;

    const callDropPercent =
      previousCallRate > 0 ? ((previousCallRate - currentCallRate) / previousCallRate) * 100 : 0;

    // Delivery is "stable" if it hasn't dropped significantly
    const currentDeliveryRate = currentStats._sum.totalDelivered || 0;
    const previousDeliveryRate = previousStats._sum.totalDelivered || 0;
    const deliveryStable =
      previousDeliveryRate === 0 ||
      Math.abs(currentDeliveryRate - previousDeliveryRate) / previousDeliveryRate < 0.2;

    return {
      detected: callDropPercent > 30 && deliveryStable,
      affectedCampaigns: [], // Would need more detailed query
      callDropPercent,
      deliveryStable,
    };
  }

  private async detectAnomalies(
    accountId: string,
    healthStatuses: PhoneHealthStatus[],
  ): Promise<TelephonyHealthReport['anomalies']> {
    const anomalies: TelephonyHealthReport['anomalies'] = [];

    // Check for widespread call drops
    const numbersWithCallDrop = healthStatuses.filter(
      (h) => h.metrics.callVariance < -30,
    );
    if (numbersWithCallDrop.length > healthStatuses.length * 0.3) {
      anomalies.push({
        type: 'call_drop',
        description: `${numbersWithCallDrop.length} numbers showing call drops >30%`,
        affectedNumbers: numbersWithCallDrop.map((n) => n.number),
        detectedAt: new Date(),
      });
    }

    // Check for spam score spikes
    const highSpamNumbers = healthStatuses.filter(
      (h) => h.metrics.spamScore > 0.5,
    );
    if (highSpamNumbers.length > 2) {
      anomalies.push({
        type: 'spam_spike',
        description: `${highSpamNumbers.length} numbers with elevated spam scores`,
        affectedNumbers: highSpamNumbers.map((n) => n.number),
        detectedAt: new Date(),
      });
    }

    return anomalies;
  }
}
