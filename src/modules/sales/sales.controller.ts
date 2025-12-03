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
import { TalkTracksService, CreateTalkTrackDto } from './talk-tracks.service';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { TalkTrackType } from '@prisma/client';

@ApiTags('sales')
@Controller({ path: 'sales', version: '1' })
export class SalesController {
  constructor(private readonly talkTracksService: TalkTracksService) {}

  @Post('talk-tracks')
  @ApiOperation({ summary: 'Create a talk track' })
  async createTalkTrack(@Body() dto: CreateTalkTrackDto) {
    return this.talkTracksService.create(dto);
  }

  @Get('talk-tracks')
  @ApiOperation({ summary: 'List talk tracks' })
  @ApiQuery({ name: 'accountId', required: true })
  @ApiQuery({ name: 'type', required: false, enum: TalkTrackType })
  async listTalkTracks(
    @Query('accountId') accountId: string,
    @Query() pagination: PaginationDto,
    @Query('type') type?: TalkTrackType,
  ) {
    return this.talkTracksService.findAll(accountId, pagination, { type });
  }

  @Get('talk-tracks/:id')
  @ApiOperation({ summary: 'Get talk track' })
  @ApiParam({ name: 'id', description: 'Talk track UUID' })
  async getTalkTrack(@Param('id', ParseUUIDPipe) id: string) {
    return this.talkTracksService.findOne(id);
  }

  @Put('talk-tracks/:id')
  @ApiOperation({ summary: 'Update talk track' })
  @ApiParam({ name: 'id', description: 'Talk track UUID' })
  async updateTalkTrack(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<CreateTalkTrackDto>,
  ) {
    return this.talkTracksService.update(id, dto);
  }

  @Delete('talk-tracks/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete talk track' })
  @ApiParam({ name: 'id', description: 'Talk track UUID' })
  async deleteTalkTrack(@Param('id', ParseUUIDPipe) id: string) {
    await this.talkTracksService.delete(id);
  }

  @Get('lead-view/:mailPieceId')
  @ApiOperation({ summary: 'Get lead view for sales rep' })
  @ApiParam({ name: 'mailPieceId', description: 'Mail piece UUID' })
  async getLeadView(@Param('mailPieceId', ParseUUIDPipe) mailPieceId: string) {
    return this.talkTracksService.getLeadView(mailPieceId);
  }
}
