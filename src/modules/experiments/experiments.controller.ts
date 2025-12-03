import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ExperimentsService, SetupExperimentDto } from './experiments.service';

@ApiTags('experiments')
@Controller({ path: 'experiments', version: '1' })
export class ExperimentsController {
  constructor(private readonly experimentsService: ExperimentsService) {}

  @Post('setup')
  @ApiOperation({ summary: 'Configure campaign as an A/B experiment' })
  async setupExperiment(@Body() dto: SetupExperimentDto) {
    return this.experimentsService.setupExperiment(dto);
  }

  @Get('campaigns/:campaignId/results')
  @ApiOperation({ summary: 'Get experiment results for campaign' })
  @ApiParam({ name: 'campaignId', description: 'Campaign UUID' })
  async getResults(@Param('campaignId', ParseUUIDPipe) campaignId: string) {
    return this.experimentsService.getExperimentResults(campaignId);
  }

  @Post('calculate-sample-size')
  @ApiOperation({ summary: 'Calculate required sample size for experiment' })
  async calculateSampleSize(
    @Body()
    input: {
      baselineRate: number;
      mde: number;
      confidence?: number;
      power?: number;
      variants?: number;
    },
  ) {
    return this.experimentsService.calculateSampleSize(input);
  }

  @Get('campaigns/:campaignId/batch-strategy')
  @ApiOperation({ summary: 'Get recommended batch strategy for campaign' })
  @ApiParam({ name: 'campaignId', description: 'Campaign UUID' })
  async getBatchStrategy(@Param('campaignId', ParseUUIDPipe) campaignId: string) {
    return this.experimentsService.recommendBatchStrategy(campaignId);
  }
}
