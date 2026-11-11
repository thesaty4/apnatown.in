import { Controller, Get, Query, SetMetadata } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { createZodDto, ZodValidationPipe } from 'nestjs-zod';
import {
  EmptyRequestSchema,
  ErrorResponseSchema,
  HealthResponseSchema,
} from '@apnatown/shared/wire';
import { ReadinessService } from './readiness';

export const PROBE_ROUTE = 'apnatown:probe';
export class HealthDto extends createZodDto(HealthResponseSchema) {}
export class ErrorDto extends createZodDto(ErrorResponseSchema) {}

@Controller('health')
@ApiTags('health')
@ApiResponse({
  status: 400,
  type: ErrorDto,
  description: 'Invalid probe input',
})
@ApiResponse({ status: 403, type: ErrorDto, description: 'Untrusted Origin' })
@ApiResponse({
  status: 429,
  type: ErrorDto,
  description: 'Probe request limit exceeded',
})
@ApiResponse({ status: 500, type: ErrorDto, description: 'Unexpected failure' })
export class HealthController {
  constructor(private readonly health: ReadinessService) {}

  @Get('live')
  @SetMetadata(PROBE_ROUTE, true)
  @ApiOperation({ operationId: 'healthLive', summary: 'Process liveness' })
  @ApiResponse({ status: 200, type: HealthDto })
  live(
    @Query(new ZodValidationPipe(EmptyRequestSchema)) _query: unknown,
  ): HealthDto {
    return this.health.live();
  }

  @Get('ready')
  @SetMetadata(PROBE_ROUTE, true)
  @ApiOperation({
    operationId: 'healthReady',
    summary: 'Runtime prerequisites readiness',
  })
  @ApiResponse({ status: 200, type: HealthDto })
  @ApiResponse({
    status: 503,
    type: ErrorDto,
    description: 'Prerequisites unavailable or shutting down',
  })
  ready(
    @Query(new ZodValidationPipe(EmptyRequestSchema)) _query: unknown,
  ): Promise<HealthDto> {
    return this.health.ready();
  }
}
