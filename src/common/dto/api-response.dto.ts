import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApiResponseDto<T = unknown> {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiPropertyOptional()
  data?: T;

  @ApiPropertyOptional()
  message?: string;

  @ApiPropertyOptional()
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  timestamp: string;

  constructor(partial: Partial<ApiResponseDto<T>>) {
    Object.assign(this, partial);
    this.timestamp = new Date().toISOString();
  }

  static success<T>(data: T, message?: string): ApiResponseDto<T> {
    return new ApiResponseDto<T>({
      success: true,
      data,
      message,
    });
  }

  static error(code: string, message: string, details?: Record<string, unknown>): ApiResponseDto {
    return new ApiResponseDto({
      success: false,
      error: { code, message, details },
    });
  }
}
