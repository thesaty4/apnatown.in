import { Controller, Get, Header, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  ExploreQuerySchema,
  ExploreResponseSchema,
  type ExploreQuery,
} from '@apnatown/shared/search';
import { PublicRoute } from '../../../shared/auth';
import { InputPipe } from '../../../shared/auth/validation';
import { ErrorDto } from '../../../shared/health/health.controller';
import { RateLimit } from '../../../shared/rate-limit/rate-limit';
import { ExploreService } from '../application/explore.service';
import { ExploreQueryDto, ExploreResponseDto } from './search.dto';

const readLimit = {
  key: 'search.explore-read',
  subject: 'ip',
  maximumHits: 120,
  windowSeconds: 60,
} as const;
// Location-free public listings only. TODO(verify): approved Explore TTL.
const PUBLIC_CACHE = 'public, max-age=30, stale-while-revalidate=120';

@ApiTags('search')
@PublicRoute()
@ApiResponse({
  status: 400,
  type: ErrorDto,
  description:
    'VALIDATION_ERROR; SEARCH_FILTER_INVALID for an unknown category',
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
export class ExploreController {
  constructor(private readonly explore: ExploreService) {}

  @Get()
  @RateLimit(readLimit)
  @Header('Cache-Control', PUBLIC_CACHE)
  @ApiOperation({
    operationId: 'explore',
    summary: 'Browse public shops and service providers',
    description:
      'S-CUST-02 businesses-only subset. Shops/Services list approved, non-deleted businesses with an active, non-deleted owner in an enabled city. Category filters use existing product-kind business memberships; service-listing taxonomy is not available yet. Relevance orders by creation time then ID; newest reverses that order (Shops only). Pagination uses a signed keyset cursor. Products is empty until its module exists.',
  })
  @ApiQuery({ type: ExploreQueryDto })
  @ApiResponse({ status: 200, type: ExploreResponseDto })
  async read(@Query(new InputPipe(ExploreQuerySchema)) query: ExploreQuery) {
    return ExploreResponseSchema.parse(await this.explore.explore(query));
  }
}
