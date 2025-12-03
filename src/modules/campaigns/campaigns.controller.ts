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
import { CampaignsService } from './campaigns.service';
import { VariantsService } from './variants.service';
import { BatchesService, CreateBatchDto } from './batches.service';
import {
  CreateCampaignDto,
  UpdateCampaignDto,
  CampaignResponseDto,
  CampaignStatsDto,
  LaunchCampaignDto,
} from './dto/campaign.dto';
import {
  CreateVariantDto,
  UpdateVariantDto,
  VariantResponseDto,
  VariantComparisonDto,
} from './dto/variant.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { ApiPaginatedResponse } from '@/common/decorators/api-paginated-response.decorator';
import { CampaignStatus } from '@prisma/client';

@ApiTags('campaigns')
@Controller({ path: 'campaigns', version: '1' })
export class CampaignsController {
  constructor(
    private readonly campaignsService: CampaignsService,
    private readonly variantsService: VariantsService,
    private readonly batchesService: BatchesService,
  ) {}

  // Campaign CRUD
  @Post()
  @ApiOperation({ summary: 'Create a new campaign' })
  @ApiResponse({ status: 201, type: CampaignResponseDto })
  async create(@Body() dto: CreateCampaignDto) {
    return this.campaignsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List campaigns' })
  @ApiPaginatedResponse(CampaignResponseDto)
  @ApiQuery({ name: 'accountId', required: true })
  @ApiQuery({ name: 'status', required: false, enum: CampaignStatus })
  @ApiQuery({ name: 'type', required: false })
  async findAll(
    @Query('accountId') accountId: string,
    @Query() pagination: PaginationDto,
    @Query('status') status?: CampaignStatus,
    @Query('type') type?: string,
  ) {
    return this.campaignsService.findAll(accountId, pagination, { status, type });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get campaign by ID' })
  @ApiParam({ name: 'id', description: 'Campaign UUID' })
  @ApiResponse({ status: 200, type: CampaignResponseDto })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.campaignsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update campaign' })
  @ApiParam({ name: 'id', description: 'Campaign UUID' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCampaignDto,
  ) {
    return this.campaignsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete campaign' })
  @ApiParam({ name: 'id', description: 'Campaign UUID' })
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    await this.campaignsService.delete(id);
  }

  // Campaign lifecycle
  @Post(':id/launch')
  @ApiOperation({ summary: 'Launch campaign' })
  @ApiParam({ name: 'id', description: 'Campaign UUID' })
  async launch(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto?: LaunchCampaignDto,
  ) {
    return this.campaignsService.launch(id, dto);
  }

  @Post(':id/pause')
  @ApiOperation({ summary: 'Pause campaign' })
  @ApiParam({ name: 'id', description: 'Campaign UUID' })
  async pause(@Param('id', ParseUUIDPipe) id: string) {
    return this.campaignsService.pause(id);
  }

  @Post(':id/resume')
  @ApiOperation({ summary: 'Resume paused campaign' })
  @ApiParam({ name: 'id', description: 'Campaign UUID' })
  async resume(@Param('id', ParseUUIDPipe) id: string) {
    return this.campaignsService.resume(id);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Mark campaign as completed' })
  @ApiParam({ name: 'id', description: 'Campaign UUID' })
  async complete(@Param('id', ParseUUIDPipe) id: string) {
    return this.campaignsService.complete(id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get campaign statistics' })
  @ApiParam({ name: 'id', description: 'Campaign UUID' })
  @ApiResponse({ status: 200, type: CampaignStatsDto })
  async getStats(@Param('id', ParseUUIDPipe) id: string) {
    return this.campaignsService.getStats(id);
  }

  // Segments
  @Post(':id/segments/:segmentId')
  @ApiOperation({ summary: 'Add segment to campaign' })
  async addSegment(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('segmentId', ParseUUIDPipe) segmentId: string,
  ) {
    return this.campaignsService.addSegment(id, segmentId);
  }

  @Delete(':id/segments/:segmentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove segment from campaign' })
  async removeSegment(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('segmentId', ParseUUIDPipe) segmentId: string,
  ) {
    await this.campaignsService.removeSegment(id, segmentId);
  }

  // Variants
  @Post(':id/variants')
  @ApiOperation({ summary: 'Add variant to campaign' })
  @ApiParam({ name: 'id', description: 'Campaign UUID' })
  @ApiResponse({ status: 201, type: VariantResponseDto })
  async createVariant(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateVariantDto,
  ) {
    return this.variantsService.create({ ...dto, campaignId: id });
  }

  @Get(':id/variants')
  @ApiOperation({ summary: 'List campaign variants' })
  @ApiParam({ name: 'id', description: 'Campaign UUID' })
  async getVariants(@Param('id', ParseUUIDPipe) id: string) {
    return this.variantsService.findAll(id);
  }

  @Get(':id/variants/compare')
  @ApiOperation({ summary: 'Compare variant performance' })
  @ApiParam({ name: 'id', description: 'Campaign UUID' })
  @ApiResponse({ status: 200, type: VariantComparisonDto })
  async compareVariants(@Param('id', ParseUUIDPipe) id: string) {
    return this.variantsService.compareVariants(id);
  }

  @Put('variants/:variantId')
  @ApiOperation({ summary: 'Update variant' })
  @ApiParam({ name: 'variantId', description: 'Variant UUID' })
  async updateVariant(
    @Param('variantId', ParseUUIDPipe) variantId: string,
    @Body() dto: UpdateVariantDto,
  ) {
    return this.variantsService.update(variantId, dto);
  }

  @Delete('variants/:variantId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete variant' })
  @ApiParam({ name: 'variantId', description: 'Variant UUID' })
  async deleteVariant(@Param('variantId', ParseUUIDPipe) variantId: string) {
    await this.variantsService.delete(variantId);
  }

  @Post('variants/:variantId/declare-winner')
  @ApiOperation({ summary: 'Declare variant as winner' })
  @ApiParam({ name: 'variantId', description: 'Variant UUID' })
  async declareWinner(@Param('variantId', ParseUUIDPipe) variantId: string) {
    return this.variantsService.declareWinner(variantId);
  }

  // Batches
  @Post(':id/batches')
  @ApiOperation({ summary: 'Create batch for campaign' })
  @ApiParam({ name: 'id', description: 'Campaign UUID' })
  async createBatch(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Omit<CreateBatchDto, 'campaignId'>,
  ) {
    return this.batchesService.create({ ...dto, campaignId: id });
  }

  @Get(':id/batches')
  @ApiOperation({ summary: 'List campaign batches' })
  @ApiParam({ name: 'id', description: 'Campaign UUID' })
  async getBatches(@Param('id', ParseUUIDPipe) id: string) {
    return this.batchesService.findAll(id);
  }

  @Post('batches/:batchId/send')
  @ApiOperation({ summary: 'Send batch to print' })
  @ApiParam({ name: 'batchId', description: 'Batch UUID' })
  async sendBatch(@Param('batchId', ParseUUIDPipe) batchId: string) {
    return this.batchesService.send(batchId);
  }

  @Post('batches/:batchId/schedule')
  @ApiOperation({ summary: 'Schedule batch for future send' })
  @ApiParam({ name: 'batchId', description: 'Batch UUID' })
  async scheduleBatch(
    @Param('batchId', ParseUUIDPipe) batchId: string,
    @Body() body: { scheduledDate: Date },
  ) {
    return this.batchesService.schedule(batchId, new Date(body.scheduledDate));
  }

  @Delete('batches/:batchId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete batch' })
  @ApiParam({ name: 'batchId', description: 'Batch UUID' })
  async deleteBatch(@Param('batchId', ParseUUIDPipe) batchId: string) {
    await this.batchesService.delete(batchId);
  }
}
