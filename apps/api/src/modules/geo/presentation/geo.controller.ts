import { Controller, Get, Param, Query, UseInterceptors } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { IdSchema } from '@apnatown/shared/wire';
import type { AreaListQuery } from '@apnatown/shared/geo';
import {
  ZodSerializerDto,
  ZodSerializerInterceptor,
  ZodValidationPipe,
} from 'nestjs-zod';
import { PublicRoute } from '../../../shared/auth';
import { ErrorDto } from '../../../shared/health/health.controller';
import { RateLimit } from '../../../shared/rate-limit/rate-limit';
import { GeoReadService } from '../application/geo-read.service';
import {
  GeoAreaPageDto,
  GeoAreaQueryDto,
  GeoAreaQueryPipe,
  GeoCityPageDto,
  GeoCityQueryDto,
} from './geo.dto';

const readLimit = {
  key: 'geo.public-read',
  subject: 'ip',
  maximumHits: 60,
  windowSeconds: 60,
} as const;

@Controller('geo')
@ApiTags('geo')
@PublicRoute()
@UseInterceptors(ZodSerializerInterceptor)
@ApiResponse({
  status: 400,
  type: ErrorDto,
  description: 'Invalid query or cursor',
})
@ApiResponse({ status: 403, type: ErrorDto, description: 'Untrusted Origin' })
@ApiResponse({
  status: 429,
  type: ErrorDto,
  description: 'Read limit exceeded',
})
@ApiResponse({ status: 500, type: ErrorDto, description: 'Unexpected failure' })
@ApiResponse({
  status: 503,
  type: ErrorDto,
  description: 'Read service unavailable',
})
export class GeoController {
  constructor(private readonly geo: GeoReadService) {}

  @Get('cities')
  @RateLimit(readLimit)
  @ApiOperation({ operationId: 'geoCities', summary: 'List selectable cities' })
  @ApiResponse({ status: 200, type: GeoCityPageDto })
  @ZodSerializerDto(GeoCityPageDto)
  cities(@Query() query: GeoCityQueryDto): Promise<GeoCityPageDto> {
    return this.geo.cities(query);
  }

  @Get('cities/:cityId/areas')
  @RateLimit(readLimit)
  @ApiOperation({
    operationId: 'geoCityAreas',
    summary: 'Find areas within a city',
  })
  @ApiParam({ name: 'cityId', format: 'uuid' })
  @ApiQuery({ type: GeoAreaQueryDto })
  @ApiResponse({ status: 200, type: GeoAreaPageDto })
  @ApiResponse({ status: 404, type: ErrorDto, description: 'City not found' })
  @ApiResponse({ status: 422, type: ErrorDto, description: 'Invalid PIN code' })
  @ZodSerializerDto(GeoAreaPageDto)
  areas(
    @Param('cityId', new ZodValidationPipe(IdSchema)) cityId: string,
    @Query(new GeoAreaQueryPipe()) query: AreaListQuery,
  ): Promise<GeoAreaPageDto> {
    return this.geo.areas(cityId, query);
  }
}
