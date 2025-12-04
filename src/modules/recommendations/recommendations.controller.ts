import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { RecommendationsService } from './recommendations.service';
import {
  GenerateRecommendationsDto,
  UpdateRecommendationStatusDto,
  CreateRecommendationFeedbackDto,
  RecommendationResponseDto,
  RecommendationSummaryDto,
  RecommendationCategory,
  RecommendationStatus,
} from './dto/recommendation.dto';

@ApiTags('Recommendations')
@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Post('generate')
  @ApiOperation({
    summary: 'Generate recommendations',
    description: 'Generate AI-powered recommendations for campaigns (WHO, WHAT, HOW)',
  })
  @ApiResponse({
    status: 201,
    description: 'Recommendations generated successfully',
    type: [RecommendationResponseDto],
  })
  async generateRecommendations(@Body() dto: GenerateRecommendationsDto) {
    return this.recommendationsService.generateRecommendations(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get recommendations',
    description: 'Get all recommendations for an account with optional filters',
  })
  @ApiQuery({ name: 'accountId', required: true })
  @ApiQuery({ name: 'category', enum: RecommendationCategory, required: false })
  @ApiQuery({ name: 'status', enum: RecommendationStatus, required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Recommendations retrieved successfully',
  })
  async getRecommendations(
    @Query('accountId') accountId: string,
    @Query('category') category?: RecommendationCategory,
    @Query('status') status?: RecommendationStatus,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.recommendationsService.getRecommendations(accountId, {
      category,
      status,
      limit: limit ? parseInt(String(limit), 10) : undefined,
      offset: offset ? parseInt(String(offset), 10) : undefined,
    });
  }

  @Get('summary/:accountId')
  @ApiOperation({
    summary: 'Get recommendation summary',
    description: 'Get aggregated summary of recommendations for an account',
  })
  @ApiResponse({
    status: 200,
    description: 'Summary retrieved successfully',
    type: RecommendationSummaryDto,
  })
  async getSummary(@Param('accountId') accountId: string) {
    return this.recommendationsService.getSummary(accountId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get recommendation details',
    description: 'Get a single recommendation by ID with full details',
  })
  @ApiResponse({
    status: 200,
    description: 'Recommendation retrieved successfully',
    type: RecommendationResponseDto,
  })
  async getRecommendation(@Param('id') id: string) {
    return this.recommendationsService.getRecommendation(id);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update recommendation status',
    description: 'Update the status of a recommendation (viewed, applied, dismissed)',
  })
  @ApiResponse({
    status: 200,
    description: 'Status updated successfully',
    type: RecommendationResponseDto,
  })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateRecommendationStatusDto,
  ) {
    return this.recommendationsService.updateStatus(id, dto);
  }

  @Post(':id/feedback')
  @ApiOperation({
    summary: 'Add feedback',
    description: 'Add feedback for a recommendation to improve future suggestions',
  })
  @ApiResponse({
    status: 201,
    description: 'Feedback added successfully',
  })
  async addFeedback(
    @Param('id') id: string,
    @Body() dto: CreateRecommendationFeedbackDto,
  ) {
    return this.recommendationsService.addFeedback(id, dto);
  }

  @Post(':id/apply')
  @ApiOperation({
    summary: 'Apply recommendation',
    description: 'Quick action to apply a recommendation and create resources',
  })
  @ApiResponse({
    status: 200,
    description: 'Recommendation applied successfully',
  })
  async applyRecommendation(
    @Param('id') id: string,
    @Body('userId') userId: string,
  ) {
    return this.recommendationsService.applyRecommendation(id, userId);
  }

  @Post('cleanup')
  @ApiOperation({
    summary: 'Cleanup expired recommendations',
    description: 'Mark expired recommendations as expired',
  })
  @ApiResponse({
    status: 200,
    description: 'Cleanup completed',
  })
  async cleanupExpired() {
    return this.recommendationsService.cleanupExpired();
  }
}
