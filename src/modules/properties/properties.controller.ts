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
import { PropertiesService } from './properties.service';
import { DistressService } from './distress.service';
import {
  CreatePropertyDto,
  UpdatePropertyDto,
  PropertyResponseDto,
  PropertySearchDto,
  CreateDistressFlagDto,
} from './dto/property.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { ApiPaginatedResponse } from '@/common/decorators/api-paginated-response.decorator';

@ApiTags('properties')
@Controller({ path: 'properties', version: '1' })
export class PropertiesController {
  constructor(
    private readonly propertiesService: PropertiesService,
    private readonly distressService: DistressService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new property' })
  @ApiResponse({ status: 201, type: PropertyResponseDto })
  async create(@Body() dto: CreatePropertyDto) {
    return this.propertiesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Search properties' })
  @ApiPaginatedResponse(PropertyResponseDto)
  async findAll(
    @Query() pagination: PaginationDto,
    @Query() search: PropertySearchDto,
  ) {
    return this.propertiesService.findAll(pagination, search);
  }

  @Get('distress/summary')
  @ApiOperation({ summary: 'Get distress summary statistics' })
  @ApiQuery({ name: 'marketId', required: false })
  async getDistressSummary(@Query('marketId') marketId?: string) {
    return this.distressService.getDistressSummary(marketId);
  }

  @Get('distress/recent')
  @ApiOperation({ summary: 'Get recent distress activity' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getRecentDistress(
    @Query('days') days?: number,
    @Query('limit') limit?: number,
  ) {
    return this.distressService.getRecentDistressActivity(days, limit);
  }

  @Get('distress/stacked')
  @ApiOperation({ summary: 'Get properties with multiple distress flags' })
  @ApiQuery({ name: 'minStackCount', required: false, type: Number })
  @ApiQuery({ name: 'marketId', required: false })
  async getStackedDistress(
    @Query('minStackCount') minStackCount?: number,
    @Query('marketId') marketId?: string,
  ) {
    return this.distressService.getStackedDistressProperties(
      minStackCount || 2,
      marketId,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get property by ID' })
  @ApiParam({ name: 'id', description: 'Property UUID' })
  @ApiResponse({ status: 200, type: PropertyResponseDto })
  @ApiResponse({ status: 404, description: 'Property not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.propertiesService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update property' })
  @ApiParam({ name: 'id', description: 'Property UUID' })
  @ApiResponse({ status: 200, type: PropertyResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePropertyDto,
  ) {
    return this.propertiesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete property' })
  @ApiParam({ name: 'id', description: 'Property UUID' })
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    await this.propertiesService.delete(id);
  }

  @Post(':id/distress')
  @ApiOperation({ summary: 'Add distress flag to property' })
  @ApiParam({ name: 'id', description: 'Property UUID' })
  async addDistressFlag(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateDistressFlagDto,
  ) {
    return this.propertiesService.addDistressFlag(id, dto);
  }

  @Get(':id/distress')
  @ApiOperation({ summary: 'Get distress flags for property' })
  @ApiParam({ name: 'id', description: 'Property UUID' })
  @ApiQuery({ name: 'activeOnly', required: false, type: Boolean })
  async getDistressFlags(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('activeOnly') activeOnly?: boolean,
  ) {
    return this.propertiesService.getDistressFlags(id, activeOnly !== false);
  }

  @Delete('distress/:flagId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deactivate distress flag' })
  @ApiParam({ name: 'flagId', description: 'Distress flag UUID' })
  async deactivateDistressFlag(@Param('flagId', ParseUUIDPipe) flagId: string) {
    await this.propertiesService.deactivateDistressFlag(flagId);
  }

  @Post(':id/recalculate-scores')
  @ApiOperation({ summary: 'Recalculate property scores' })
  @ApiParam({ name: 'id', description: 'Property UUID' })
  async recalculateScores(@Param('id', ParseUUIDPipe) id: string) {
    await this.propertiesService.updatePropertyScores(id);
    return { success: true };
  }
}
