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
import { UsersService } from './users.service';
import {
  CreateUserDto,
  UpdateUserDto,
  UserResponseDto,
  GenerateApiKeyResponseDto,
} from './dto/user.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { ApiPaginatedResponse } from '@/common/decorators/api-paginated-response.decorator';

@ApiTags('accounts')
@Controller({ path: 'accounts/:accountId/users', version: '1' })
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiParam({ name: 'accountId', description: 'Account UUID' })
  @ApiResponse({ status: 201, description: 'User created', type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async create(
    @Param('accountId', ParseUUIDPipe) accountId: string,
    @Body() dto: CreateUserDto,
  ) {
    return this.usersService.create({ ...dto, accountId });
  }

  @Get()
  @ApiOperation({ summary: 'List users in account' })
  @ApiParam({ name: 'accountId', description: 'Account UUID' })
  @ApiPaginatedResponse(UserResponseDto)
  @ApiQuery({ name: 'role', required: false, description: 'Filter by role' })
  async findAll(
    @Param('accountId', ParseUUIDPipe) accountId: string,
    @Query() pagination: PaginationDto,
    @Query('role') role?: string,
  ) {
    return this.usersService.findAll(accountId, pagination, { role });
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'accountId', description: 'Account UUID' })
  @ApiParam({ name: 'userId', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User found', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.usersService.findOne(userId);
  }

  @Put(':userId')
  @ApiOperation({ summary: 'Update user' })
  @ApiParam({ name: 'accountId', description: 'Account UUID' })
  @ApiParam({ name: 'userId', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User updated', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(userId, dto);
  }

  @Delete(':userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user' })
  @ApiParam({ name: 'accountId', description: 'Account UUID' })
  @ApiParam({ name: 'userId', description: 'User UUID' })
  @ApiResponse({ status: 204, description: 'User deleted' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async delete(@Param('userId', ParseUUIDPipe) userId: string) {
    await this.usersService.delete(userId);
  }

  @Post(':userId/api-key')
  @ApiOperation({ summary: 'Generate new API key for user' })
  @ApiParam({ name: 'accountId', description: 'Account UUID' })
  @ApiParam({ name: 'userId', description: 'User UUID' })
  @ApiResponse({
    status: 200,
    description: 'API key generated - shown only once',
    type: GenerateApiKeyResponseDto,
  })
  async generateApiKey(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.usersService.generateApiKey(userId);
  }

  @Delete(':userId/api-key')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke API key' })
  @ApiParam({ name: 'accountId', description: 'Account UUID' })
  @ApiParam({ name: 'userId', description: 'User UUID' })
  @ApiResponse({ status: 204, description: 'API key revoked' })
  async revokeApiKey(@Param('userId', ParseUUIDPipe) userId: string) {
    await this.usersService.revokeApiKey(userId);
  }
}
