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
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { TriggersService, CreateTriggerRuleDto } from './triggers.service';
import { PaginationDto } from '@/common/dto/pagination.dto';

@ApiTags('triggers')
@Controller({ path: 'triggers', version: '1' })
export class TriggersController {
  constructor(private readonly triggersService: TriggersService) {}

  @Post('rules')
  @ApiOperation({ summary: 'Create a trigger rule' })
  async create(@Body() dto: CreateTriggerRuleDto) {
    return this.triggersService.create(dto);
  }

  @Get('rules')
  @ApiOperation({ summary: 'List trigger rules' })
  @ApiQuery({ name: 'accountId', required: true })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  async findAll(
    @Query('accountId') accountId: string,
    @Query() pagination: PaginationDto,
    @Query('isActive') isActive?: boolean,
  ) {
    return this.triggersService.findAll(accountId, pagination, { isActive });
  }

  @Get('rules/:id')
  @ApiOperation({ summary: 'Get trigger rule' })
  @ApiParam({ name: 'id', description: 'Trigger rule UUID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.triggersService.findOne(id);
  }

  @Put('rules/:id')
  @ApiOperation({ summary: 'Update trigger rule' })
  @ApiParam({ name: 'id', description: 'Trigger rule UUID' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<CreateTriggerRuleDto>,
  ) {
    return this.triggersService.update(id, dto);
  }

  @Post('rules/:id/activate')
  @ApiOperation({ summary: 'Activate trigger rule' })
  @ApiParam({ name: 'id', description: 'Trigger rule UUID' })
  async activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.triggersService.activate(id);
  }

  @Post('rules/:id/deactivate')
  @ApiOperation({ summary: 'Deactivate trigger rule' })
  @ApiParam({ name: 'id', description: 'Trigger rule UUID' })
  async deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.triggersService.deactivate(id);
  }

  @Delete('rules/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete trigger rule' })
  @ApiParam({ name: 'id', description: 'Trigger rule UUID' })
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    await this.triggersService.delete(id);
  }

  @Get('rules/:id/stats')
  @ApiOperation({ summary: 'Get execution statistics' })
  @ApiParam({ name: 'id', description: 'Trigger rule UUID' })
  @ApiQuery({ name: 'periodDays', required: false, type: Number })
  async getStats(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('periodDays') periodDays?: number,
  ) {
    return this.triggersService.getExecutionStats(id, periodDays);
  }

  @Post('evaluate')
  @ApiOperation({ summary: 'Manually evaluate an event against trigger rules' })
  async evaluateEvent(
    @Body() body: { accountId: string; eventType: string; eventData: Record<string, unknown> },
  ) {
    return this.triggersService.evaluateEvent(body.accountId, body.eventType, body.eventData);
  }
}
