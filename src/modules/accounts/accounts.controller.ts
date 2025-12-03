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
import { AccountsService } from './accounts.service';
import {
  CreateAccountDto,
  UpdateAccountDto,
  AccountResponseDto,
  AccountStatsDto,
} from './dto/account.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { ApiPaginatedResponse } from '@/common/decorators/api-paginated-response.decorator';

@ApiTags('accounts')
@Controller({ path: 'accounts', version: '1' })
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new account' })
  @ApiResponse({ status: 201, description: 'Account created', type: AccountResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async create(@Body() dto: CreateAccountDto) {
    return this.accountsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all accounts' })
  @ApiPaginatedResponse(AccountResponseDto)
  @ApiQuery({ name: 'type', required: false, description: 'Filter by account type' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  async findAll(
    @Query() pagination: PaginationDto,
    @Query('type') type?: string,
    @Query('status') status?: string,
  ) {
    return this.accountsService.findAll(pagination, { type, status });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get account by ID' })
  @ApiParam({ name: 'id', description: 'Account UUID' })
  @ApiResponse({ status: 200, description: 'Account found', type: AccountResponseDto })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.accountsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update account' })
  @ApiParam({ name: 'id', description: 'Account UUID' })
  @ApiResponse({ status: 200, description: 'Account updated', type: AccountResponseDto })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAccountDto,
  ) {
    return this.accountsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete account' })
  @ApiParam({ name: 'id', description: 'Account UUID' })
  @ApiResponse({ status: 204, description: 'Account deleted' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  @ApiResponse({ status: 409, description: 'Cannot delete account with active campaigns' })
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    await this.accountsService.delete(id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get account statistics' })
  @ApiParam({ name: 'id', description: 'Account UUID' })
  @ApiResponse({ status: 200, description: 'Account statistics', type: AccountStatsDto })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async getStats(@Param('id', ParseUUIDPipe) id: string) {
    return this.accountsService.getStats(id);
  }

  @Post(':id/markets/:marketId')
  @ApiOperation({ summary: 'Add market to account' })
  @ApiParam({ name: 'id', description: 'Account UUID' })
  @ApiParam({ name: 'marketId', description: 'Market UUID' })
  async addMarket(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('marketId', ParseUUIDPipe) marketId: string,
    @Body() settings?: { avmBiasFactor?: number; minSpread?: number; maxArv?: number },
  ) {
    return this.accountsService.addMarket(id, marketId, settings);
  }

  @Delete(':id/markets/:marketId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove market from account' })
  @ApiParam({ name: 'id', description: 'Account UUID' })
  @ApiParam({ name: 'marketId', description: 'Market UUID' })
  async removeMarket(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('marketId', ParseUUIDPipe) marketId: string,
  ) {
    await this.accountsService.removeMarket(id, marketId);
  }
}
