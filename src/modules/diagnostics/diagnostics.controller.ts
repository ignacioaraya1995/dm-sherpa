import { Controller, Get, Post, Query, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';
import { DiagnosticsService } from './diagnostics.service';

@ApiTags('diagnostics')
@Controller({ path: 'diagnostics', version: '1' })
export class DiagnosticsController {
  constructor(private readonly diagnosticsService: DiagnosticsService) {}

  @Get('what-changed')
  @ApiOperation({ summary: 'Analyze what changed in performance metrics' })
  @ApiQuery({ name: 'accountId', required: true })
  @ApiQuery({ name: 'startDate', required: true, description: 'Start of current period' })
  @ApiQuery({ name: 'endDate', required: true, description: 'End of current period' })
  async whatChanged(
    @Query('accountId') accountId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.diagnosticsService.whatChanged(
      accountId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('snapshots')
  @ApiOperation({ summary: 'Get historical diagnostic snapshots' })
  @ApiQuery({ name: 'accountId', required: true })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getSnapshots(
    @Query('accountId') accountId: string,
    @Query('limit') limit?: number,
  ) {
    return this.diagnosticsService.getSnapshots(accountId, limit);
  }

  @Get('compare/markets')
  @ApiOperation({ summary: 'Compare performance across markets' })
  @ApiQuery({ name: 'accountId', required: true })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  async compareMarkets(
    @Query('accountId') accountId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.diagnosticsService.compareMarkets(
      accountId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('compare/variants')
  @ApiOperation({ summary: 'Compare performance across creative variants' })
  @ApiQuery({ name: 'accountId', required: true })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  async compareVariants(
    @Query('accountId') accountId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.diagnosticsService.compareVariants(
      accountId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Post('snapshot')
  @ApiOperation({ summary: 'Create a diagnostic snapshot manually' })
  @ApiQuery({ name: 'accountId', required: true })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  async createSnapshot(
    @Query('accountId') accountId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const result = await this.diagnosticsService.whatChanged(
      accountId,
      new Date(startDate),
      new Date(endDate),
    );
    return {
      message: 'Snapshot created',
      hypothesesGenerated: result.hypotheses.length,
      recommendations: result.recommendations,
    };
  }
}
