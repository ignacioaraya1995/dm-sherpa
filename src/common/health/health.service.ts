import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface HealthCheckResult {
  status: 'ok' | 'error';
  timestamp: string;
  version: string;
  checks: {
    database: { status: 'ok' | 'error'; latencyMs?: number; error?: string };
    memory: { status: 'ok' | 'warning' | 'error'; usedMb: number; totalMb: number };
  };
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<HealthCheckResult> {
    const dbCheck = await this.checkDatabase();
    const memoryCheck = this.checkMemory();

    const overallStatus =
      dbCheck.status === 'ok' && memoryCheck.status !== 'error' ? 'ok' : 'error';

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      checks: {
        database: dbCheck,
        memory: memoryCheck,
      },
    };
  }

  async ready(): Promise<{ status: 'ok' | 'error'; details?: string }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok' };
    } catch (error) {
      this.logger.error('Readiness check failed', error);
      return {
        status: 'error',
        details: 'Database connection failed',
      };
    }
  }

  private async checkDatabase(): Promise<{
    status: 'ok' | 'error';
    latencyMs?: number;
    error?: string;
  }> {
    try {
      const start = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      const latencyMs = Date.now() - start;

      return { status: 'ok', latencyMs };
    } catch (error) {
      this.logger.error('Database health check failed', error);
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private checkMemory(): {
    status: 'ok' | 'warning' | 'error';
    usedMb: number;
    totalMb: number;
  } {
    const memUsage = process.memoryUsage();
    const usedMb = Math.round(memUsage.heapUsed / 1024 / 1024);
    const totalMb = Math.round(memUsage.heapTotal / 1024 / 1024);
    const usagePercent = (usedMb / totalMb) * 100;

    let status: 'ok' | 'warning' | 'error' = 'ok';
    if (usagePercent > 90) {
      status = 'error';
    } else if (usagePercent > 75) {
      status = 'warning';
    }

    return { status, usedMb, totalMb };
  }
}
