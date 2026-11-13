import { Controller, Get, Header, Req, Query } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  ExploreQuerySchema,
  ExploreResponseSchema,
  type ExploreQuery,
} from '@apnatown/shared/search';
import { PublicRoute, type AuthRequest } from '../../../shared/auth';
import { InputPipe } from '../../../shared/auth/validation';
import { ErrorDto } from '../../../shared/health/health.controller';
import { RateLimit } from '../../../shared/rate-limit/rate-limit';
import { ExploreService } from '../application/explore.service';
import { ExploreQueryDto, ExploreResponseDto } from './search.dto';
import { discoveryLocation } from './discovery-location';

const readLimit = {
  key: 'search.explore-read',
  subject: 'ip',
  maximumHits: 120,
  windowSeconds: 60,
} as const;
@ApiTags('search')
@PublicRoute()
@ApiResponse({
  status: 400,
  type: ErrorDto,
  description:
    'VALIDATION_ERROR; SEARCH_FILTER_INVALID for unknown taxonomy, ambiguous bare subcategories, parent mismatches or duplicate resolved identities',
})
@ApiResponse({ status: 403, type: ErrorDto, description: 'Untrusted Origin' })
@ApiResponse({
  status: 429,
  type: ErrorDto,
  description: 'COMMON_RATE_LIMITED: read limit exceeded',
})
@ApiResponse({ status: 500, type: ErrorDto, description: 'Unexpected failure' })
@ApiResponse({
  status: 503,
  type: ErrorDto,
  description:
    'MAINTENANCE while maintenance mode is on; COMMON_UNAVAILABLE when the store is unavailable',
})
@Controller('explore')
@ApiHeader({ name: 'X-Discovery-Latitude', required: false, description: 'Optional ephemeral latitude; send together with longitude.' })
@ApiHeader({ name: 'X-Discovery-Longitude', required: false, description: 'Optional ephemeral longitude; never put precise location in URLs.' })
export class ExploreController {
  constructor(private readonly explore: ExploreService) {}

  @Get()
  @RateLimit(readLimit)
  // Eligibility, prices and hours are live. No cache may preserve expired
  // Premium/promotions, or share a caller's precise location.
  @Header('Cache-Control', 'private, no-store')
  @ApiOperation({
    operationId: 'explore',
    summary: 'Browse public products, shops and individual services',
    description:
      'EX1–EX12: SQL filters/facets/counts and keyset pages in one repeatable-read snapshot. Service listing taxonomy is SERVICE kind; business memberships are PRODUCT kind. Optional location headers enable server distances/delivery. Radius, distance and delivery filters require usable location. Search q resolves Catalog mappings; this is not Search autocomplete.',
  })
  @ApiQuery({ type: ExploreQueryDto })
  @ApiResponse({ status: 200, type: ExploreResponseDto })
  @ApiResponse({ status: 422, type: ErrorDto, description: 'SEARCH_LOCATION_REQUIRED' })
  async read(
    @Query(new InputPipe(ExploreQuerySchema)) query: ExploreQuery,
    @Req() request: AuthRequest,
  ) {
    return ExploreResponseSchema.parse(await this.explore.explore(query, discoveryLocation(request)));
  }
}
