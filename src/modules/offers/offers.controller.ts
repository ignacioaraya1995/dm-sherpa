import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { OffersService, CreateOfferStrategyDto } from './offers.service';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { PriceBand, DistressType } from '@prisma/client';

@ApiTags('offers')
@Controller({ path: 'offers', version: '1' })
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  // Offer Strategies
  @Post('strategies')
  @ApiOperation({ summary: 'Create an offer strategy' })
  async createStrategy(@Body() dto: CreateOfferStrategyDto) {
    return this.offersService.createStrategy(dto);
  }

  @Get('strategies')
  @ApiOperation({ summary: 'List offer strategies' })
  @ApiQuery({ name: 'accountId', required: true })
  async listStrategies(
    @Query('accountId') accountId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.offersService.findAllStrategies(accountId, pagination);
  }

  @Get('strategies/:id')
  @ApiOperation({ summary: 'Get offer strategy' })
  @ApiParam({ name: 'id', description: 'Strategy UUID' })
  async getStrategy(@Param('id', ParseUUIDPipe) id: string) {
    return this.offersService.findOneStrategy(id);
  }

  @Put('strategies/:id')
  @ApiOperation({ summary: 'Update offer strategy' })
  @ApiParam({ name: 'id', description: 'Strategy UUID' })
  async updateStrategy(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<CreateOfferStrategyDto>,
  ) {
    return this.offersService.updateStrategy(id, dto);
  }

  @Delete('strategies/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete offer strategy' })
  @ApiParam({ name: 'id', description: 'Strategy UUID' })
  async deleteStrategy(@Param('id', ParseUUIDPipe) id: string) {
    await this.offersService.deleteStrategy(id);
  }

  @Get('strategies/:id/performance')
  @ApiOperation({ summary: 'Get strategy performance metrics' })
  @ApiParam({ name: 'id', description: 'Strategy UUID' })
  async getStrategyPerformance(@Param('id', ParseUUIDPipe) id: string) {
    return this.offersService.getStrategyPerformance(id);
  }

  // Offer Calculation
  @Get('calculate/property/:propertyId')
  @ApiOperation({ summary: 'Calculate offer for a property' })
  @ApiParam({ name: 'propertyId', description: 'Property UUID' })
  @ApiQuery({ name: 'accountId', required: true })
  @ApiQuery({ name: 'strategyId', required: false })
  async calculateForProperty(
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
    @Query('accountId') accountId: string,
    @Query('strategyId') strategyId?: string,
  ) {
    return this.offersService.calculateOfferForProperty(propertyId, accountId, strategyId);
  }

  @Get('calculate/segment/:segmentId')
  @ApiOperation({ summary: 'Calculate offers for segment members' })
  @ApiParam({ name: 'segmentId', description: 'Segment UUID' })
  @ApiQuery({ name: 'accountId', required: true })
  @ApiQuery({ name: 'strategyId', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async calculateForSegment(
    @Param('segmentId', ParseUUIDPipe) segmentId: string,
    @Query('accountId') accountId: string,
    @Query('strategyId') strategyId?: string,
    @Query('limit') limit?: number,
  ) {
    return this.offersService.calculateOffersForSegment(
      segmentId,
      accountId,
      strategyId,
      limit,
    );
  }

  // Simulation
  @Post('simulate')
  @ApiOperation({ summary: 'Simulate offer performance at different percentages' })
  async simulateOffers(
    @Body()
    body: {
      marketId: string;
      priceBand: PriceBand;
      distressTypes: DistressType[];
      offerPercents: number[];
    },
  ) {
    return this.offersService.simulateOfferStrategy(
      body.marketId,
      body.priceBand,
      body.distressTypes,
      body.offerPercents,
    );
  }
}
