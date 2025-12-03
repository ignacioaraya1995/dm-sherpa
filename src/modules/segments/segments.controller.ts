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
import { SegmentsService } from './segments.service';
import {
  CreateSegmentDto,
  UpdateSegmentDto,
  SegmentResponseDto,
  SegmentPreviewDto,
  RefreshSegmentResultDto,
} from './dto/segment.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { ApiPaginatedResponse } from '@/common/decorators/api-paginated-response.decorator';

@ApiTags('segments')
@Controller({ path: 'segments', version: '1' })
export class SegmentsController {
  constructor(private readonly segmentsService: SegmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new segment' })
  @ApiResponse({ status: 201, type: SegmentResponseDto })
  async create(@Body() dto: CreateSegmentDto) {
    return this.segmentsService.create(dto);
  }

  @Post('preview')
  @ApiOperation({ summary: 'Preview segment before creating' })
  @ApiResponse({ status: 200, type: SegmentPreviewDto })
  async preview(@Body() dto: CreateSegmentDto) {
    return this.segmentsService.preview(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List segments for account' })
  @ApiPaginatedResponse(SegmentResponseDto)
  @ApiQuery({ name: 'accountId', required: true })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  async findAll(
    @Query('accountId') accountId: string,
    @Query() pagination: PaginationDto,
    @Query('isActive') isActive?: boolean,
  ) {
    return this.segmentsService.findAll(accountId, pagination, { isActive });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get segment by ID' })
  @ApiParam({ name: 'id', description: 'Segment UUID' })
  @ApiResponse({ status: 200, type: SegmentResponseDto })
  @ApiResponse({ status: 404, description: 'Segment not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.segmentsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update segment' })
  @ApiParam({ name: 'id', description: 'Segment UUID' })
  @ApiResponse({ status: 200, type: SegmentResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSegmentDto,
  ) {
    return this.segmentsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete segment' })
  @ApiParam({ name: 'id', description: 'Segment UUID' })
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    await this.segmentsService.delete(id);
  }

  @Post(':id/refresh')
  @ApiOperation({ summary: 'Refresh segment members' })
  @ApiParam({ name: 'id', description: 'Segment UUID' })
  @ApiResponse({ status: 200, type: RefreshSegmentResultDto })
  async refresh(@Param('id', ParseUUIDPipe) id: string) {
    return this.segmentsService.refreshMembers(id);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Get segment members' })
  @ApiParam({ name: 'id', description: 'Segment UUID' })
  @ApiQuery({ name: 'activeOnly', required: false, type: Boolean })
  async getMembers(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() pagination: PaginationDto,
    @Query('activeOnly') activeOnly?: boolean,
  ) {
    return this.segmentsService.getMembers(id, pagination, { activeOnly });
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Activate segment' })
  @ApiParam({ name: 'id', description: 'Segment UUID' })
  async activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.segmentsService.activate(id);
  }

  @Post(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate segment' })
  @ApiParam({ name: 'id', description: 'Segment UUID' })
  async deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.segmentsService.deactivate(id);
  }
}
