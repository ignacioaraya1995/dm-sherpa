import { Controller, Get, Post, Query, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { CashCycleService } from './cash-cycle.service';
import { DealType } from '@prisma/client';

@ApiTags('analytics')
@Controller({ path: 'analytics', version: '1' })
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly cashCycleService: CashCycleService,
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get performance dashboard' })
  @ApiQuery({ name: 'accountId', required: true })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  async getDashboard(
    @Query('accountId') accountId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.analyticsService.getPerformanceDashboard(
      accountId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('attribution')
  @ApiOperation({ summary: 'Get attribution report' })
  @ApiQuery({ name: 'accountId', required: true })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  async getAttributionReport(
    @Query('accountId') accountId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.analyticsService.getAttributionReport(
      accountId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('cash-cycle')
  @ApiOperation({ summary: 'Analyze cash cycle' })
  @ApiQuery({ name: 'accountId', required: true })
  @ApiQuery({ name: 'periodDays', required: false, type: Number })
  async analyzeCashCycle(
    @Query('accountId') accountId: string,
    @Query('periodDays') periodDays?: number,
  ) {
    return this.cashCycleService.analyzeCashCycle(accountId, periodDays);
  }

  @Get('cash-flow-projection')
  @ApiOperation({ summary: 'Project cash flow' })
  @ApiQuery({ name: 'accountId', required: true })
  @ApiQuery({ name: 'weeksAhead', required: false, type: Number })
  async projectCashFlow(
    @Query('accountId') accountId: string,
    @Query('weeksAhead') weeksAhead?: number,
  ) {
    return this.cashCycleService.projectCashFlow(accountId, weeksAhead);
  }

  @Post('cash-cycle/:accountId/update')
  @ApiOperation({ summary: 'Update cash cycle profile' })
  @ApiParam({ name: 'accountId', description: 'Account UUID' })
  @ApiQuery({ name: 'dealType', required: true, enum: DealType })
  async updateCashCycleProfile(
    @Param('accountId', ParseUUIDPipe) accountId: string,
    @Query('dealType') dealType: DealType,
  ) {
    return this.cashCycleService.updateCashCycleProfile(accountId, dealType);
  }
}
