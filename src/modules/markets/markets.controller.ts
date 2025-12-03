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
import { MarketsService } from './markets.service';
import {
  CreateMarketDto,
  UpdateMarketDto,
  MarketResponseDto,
  CreateZipCodeDto,
} from './dto/market.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { ApiPaginatedResponse } from '@/common/decorators/api-paginated-response.decorator';
import { PriceBand } from '@prisma/client';

@ApiTags('markets')
@Controller({ path: 'markets', version: '1' })
export class MarketsController {
  constructor(private readonly marketsService: MarketsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new market' })
  @ApiResponse({ status: 201, description: 'Market created', type: MarketResponseDto })
  async create(@Body() dto: CreateMarketDto) {
    return this.marketsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all markets' })
  @ApiPaginatedResponse(MarketResponseDto)
  @ApiQuery({ name: 'state', required: false, description: 'Filter by state' })
  async findAll(
    @Query() pagination: PaginationDto,
    @Query('state') state?: string,
  ) {
    return this.marketsService.findAll(pagination, { state });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get market by ID' })
  @ApiParam({ name: 'id', description: 'Market UUID' })
  @ApiResponse({ status: 200, type: MarketResponseDto })
  @ApiResponse({ status: 404, description: 'Market not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.marketsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update market' })
  @ApiParam({ name: 'id', description: 'Market UUID' })
  @ApiResponse({ status: 200, type: MarketResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMarketDto,
  ) {
    return this.marketsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete market' })
  @ApiParam({ name: 'id', description: 'Market UUID' })
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    await this.marketsService.delete(id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get market statistics' })
  @ApiParam({ name: 'id', description: 'Market UUID' })
  async getStats(@Param('id', ParseUUIDPipe) id: string) {
    return this.marketsService.getMarketStats(id);
  }

  @Post(':id/zip-codes')
  @ApiOperation({ summary: 'Add zip code to market' })
  @ApiParam({ name: 'id', description: 'Market UUID' })
  async addZipCode(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateZipCodeDto,
  ) {
    return this.marketsService.addZipCode(id, dto);
  }

  @Get(':id/zip-codes')
  @ApiOperation({ summary: 'Get zip codes in market' })
  @ApiParam({ name: 'id', description: 'Market UUID' })
  async getZipCodes(@Param('id', ParseUUIDPipe) id: string) {
    return this.marketsService.getZipCodes(id);
  }

  @Get(':id/dispo')
  @ApiOperation({ summary: 'Get disposition data for market' })
  @ApiParam({ name: 'id', description: 'Market UUID' })
  @ApiQuery({ name: 'priceBand', required: false, enum: PriceBand })
  async getDispoData(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('priceBand') priceBand?: PriceBand,
  ) {
    return this.marketsService.getDispoData(id, priceBand);
  }

  @Get(':id/seasonality')
  @ApiOperation({ summary: 'Get seasonality profile' })
  @ApiParam({ name: 'id', description: 'Market UUID' })
  @ApiQuery({ name: 'year', required: false, type: Number })
  async getSeasonality(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('year') year?: number,
  ) {
    return this.marketsService.getSeasonalityProfile(id, year);
  }
}
