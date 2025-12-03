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
import { TelephonyService, CreatePhoneNumberDto, AssignPhoneNumberDto } from './telephony.service';
import { PhoneHealthService } from './phone-health.service';
import { CallTrackingService, RecordCallDto } from './call-tracking.service';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { PhoneStatus, PhoneNumberType, CallStatus, CallOutcome } from '@prisma/client';

@ApiTags('telephony')
@Controller({ path: 'telephony', version: '1' })
export class TelephonyController {
  constructor(
    private readonly telephonyService: TelephonyService,
    private readonly phoneHealthService: PhoneHealthService,
    private readonly callTrackingService: CallTrackingService,
  ) {}

  // Phone Numbers
  @Post('phone-numbers')
  @ApiOperation({ summary: 'Add a phone number' })
  async createPhoneNumber(@Body() dto: CreatePhoneNumberDto) {
    return this.telephonyService.createPhoneNumber(dto);
  }

  @Get('phone-numbers')
  @ApiOperation({ summary: 'List phone numbers' })
  @ApiQuery({ name: 'accountId', required: true })
  @ApiQuery({ name: 'status', required: false, enum: PhoneStatus })
  @ApiQuery({ name: 'type', required: false, enum: PhoneNumberType })
  @ApiQuery({ name: 'region', required: false })
  async listPhoneNumbers(
    @Query('accountId') accountId: string,
    @Query() pagination: PaginationDto,
    @Query('status') status?: PhoneStatus,
    @Query('type') type?: PhoneNumberType,
    @Query('region') region?: string,
  ) {
    return this.telephonyService.findAll(accountId, pagination, { status, type, region });
  }

  @Get('phone-numbers/:id')
  @ApiOperation({ summary: 'Get phone number details' })
  @ApiParam({ name: 'id', description: 'Phone number UUID' })
  async getPhoneNumber(@Param('id', ParseUUIDPipe) id: string) {
    return this.telephonyService.findOne(id);
  }

  @Put('phone-numbers/:id/status')
  @ApiOperation({ summary: 'Update phone number status' })
  @ApiParam({ name: 'id', description: 'Phone number UUID' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { status: PhoneStatus },
  ) {
    return this.telephonyService.updateStatus(id, body.status);
  }

  @Post('phone-numbers/:id/assign')
  @ApiOperation({ summary: 'Assign phone number to campaign/route' })
  @ApiParam({ name: 'id', description: 'Phone number UUID' })
  async assignPhoneNumber(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Omit<AssignPhoneNumberDto, 'phoneNumberId'>,
  ) {
    return this.telephonyService.assignToRoute({ ...dto, phoneNumberId: id });
  }

  @Delete('phone-numbers/:id/assign')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unassign phone number' })
  @ApiParam({ name: 'id', description: 'Phone number UUID' })
  async unassignPhoneNumber(@Param('id', ParseUUIDPipe) id: string) {
    await this.telephonyService.unassign(id);
  }

  @Delete('phone-numbers/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete phone number' })
  @ApiParam({ name: 'id', description: 'Phone number UUID' })
  async deletePhoneNumber(@Param('id', ParseUUIDPipe) id: string) {
    await this.telephonyService.delete(id);
  }

  // Health Monitoring
  @Get('health/check/:phoneNumberId')
  @ApiOperation({ summary: 'Check health of specific phone number' })
  @ApiParam({ name: 'phoneNumberId', description: 'Phone number UUID' })
  async checkPhoneHealth(@Param('phoneNumberId', ParseUUIDPipe) phoneNumberId: string) {
    return this.phoneHealthService.checkPhoneHealth(phoneNumberId);
  }

  @Get('health/report')
  @ApiOperation({ summary: 'Generate health report for account' })
  @ApiQuery({ name: 'accountId', required: true })
  async getHealthReport(@Query('accountId') accountId: string) {
    return this.phoneHealthService.generateHealthReport(accountId);
  }

  @Get('health/anomalies')
  @ApiOperation({ summary: 'Detect call drop anomalies' })
  @ApiQuery({ name: 'accountId', required: true })
  @ApiQuery({ name: 'periodDays', required: false, type: Number })
  async detectAnomalies(
    @Query('accountId') accountId: string,
    @Query('periodDays') periodDays?: number,
  ) {
    return this.phoneHealthService.detectCallDropAnomaly(accountId, periodDays);
  }

  // Call Tracking
  @Post('calls')
  @ApiOperation({ summary: 'Record a call event' })
  async recordCall(@Body() dto: RecordCallDto) {
    return this.callTrackingService.recordCall(dto);
  }

  @Get('calls')
  @ApiOperation({ summary: 'List calls' })
  @ApiQuery({ name: 'phoneNumberId', required: false })
  @ApiQuery({ name: 'campaignId', required: false })
  @ApiQuery({ name: 'assigneeId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: CallStatus })
  @ApiQuery({ name: 'outcome', required: false, enum: CallOutcome })
  @ApiQuery({ name: 'isQualified', required: false, type: Boolean })
  async listCalls(
    @Query() pagination: PaginationDto,
    @Query('phoneNumberId') phoneNumberId?: string,
    @Query('campaignId') campaignId?: string,
    @Query('assigneeId') assigneeId?: string,
    @Query('status') status?: CallStatus,
    @Query('outcome') outcome?: CallOutcome,
    @Query('isQualified') isQualified?: boolean,
  ) {
    return this.callTrackingService.findAll(pagination, {
      phoneNumberId,
      campaignId,
      assigneeId,
      status,
      outcome,
      isQualified,
    });
  }

  @Get('calls/:id')
  @ApiOperation({ summary: 'Get call details' })
  @ApiParam({ name: 'id', description: 'Call UUID' })
  async getCall(@Param('id', ParseUUIDPipe) id: string) {
    return this.callTrackingService.findOne(id);
  }

  @Put('calls/:id')
  @ApiOperation({ summary: 'Update call' })
  @ApiParam({ name: 'id', description: 'Call UUID' })
  async updateCall(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updates: Partial<RecordCallDto>,
  ) {
    return this.callTrackingService.updateCall(id, updates);
  }

  @Get('calls/stats')
  @ApiOperation({ summary: 'Get call statistics' })
  @ApiQuery({ name: 'accountId', required: true })
  @ApiQuery({ name: 'periodDays', required: false, type: Number })
  async getCallStats(
    @Query('accountId') accountId: string,
    @Query('periodDays') periodDays?: number,
  ) {
    return this.callTrackingService.getCallStats(accountId, periodDays);
  }
}
