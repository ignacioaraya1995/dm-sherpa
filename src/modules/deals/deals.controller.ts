import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { DealsService, CreateDealDto, DealAttributionDto } from './deals.service';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { DealStatus, DealType, DispoType } from '@prisma/client';

@ApiTags('deals')
@Controller({ path: 'deals', version: '1' })
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a deal' })
  async create(@Body() dto: CreateDealDto) {
    return this.dealsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List deals' })
  @ApiQuery({ name: 'accountId', required: true })
  @ApiQuery({ name: 'status', required: false, enum: DealStatus })
  @ApiQuery({ name: 'type', required: false, enum: DealType })
  async findAll(
    @Query('accountId') accountId: string,
    @Query() pagination: PaginationDto,
    @Query('status') status?: DealStatus,
    @Query('type') type?: DealType,
  ) {
    return this.dealsService.findAll(accountId, pagination, { status, type });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get deal statistics' })
  @ApiQuery({ name: 'accountId', required: true })
  @ApiQuery({ name: 'periodDays', required: false, type: Number })
  async getStats(
    @Query('accountId') accountId: string,
    @Query('periodDays') periodDays?: number,
  ) {
    return this.dealsService.getDealStats(accountId, periodDays);
  }

  @Get('pipeline')
  @ApiOperation({ summary: 'Get pipeline value' })
  @ApiQuery({ name: 'accountId', required: true })
  async getPipeline(@Query('accountId') accountId: string) {
    return this.dealsService.getPipelineValue(accountId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get deal by ID' })
  @ApiParam({ name: 'id', description: 'Deal UUID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.dealsService.findOne(id);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update deal status' })
  @ApiParam({ name: 'id', description: 'Deal UUID' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: {
      status: DealStatus;
      salePrice?: number;
      closeDate?: Date;
      dispoType?: DispoType;
    },
  ) {
    return this.dealsService.updateStatus(id, body.status, body);
  }

  @Post(':id/attribute')
  @ApiOperation({ summary: 'Attribute deal to campaign/variant' })
  @ApiParam({ name: 'id', description: 'Deal UUID' })
  async attributeDeal(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Omit<DealAttributionDto, 'dealId'>,
  ) {
    return this.dealsService.attributeDeal({ ...dto, dealId: id });
  }
}
