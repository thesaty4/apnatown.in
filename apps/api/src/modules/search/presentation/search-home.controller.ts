import { Controller, Get, Query, Req, Res } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import {
  SearchHomeQuerySchema,
  SearchHomeSchema,
  type SearchHomeQuery,
} from '@apnatown/shared/search';
import { PublicRoute, type AuthRequest } from '../../../shared/auth';
import { InputPipe } from '../../../shared/auth/validation';
import { ErrorDto } from '../../../shared/health/health.controller';
import { RateLimit } from '../../../shared/rate-limit/rate-limit';
import { SearchHomeService } from '../application/search-home.service';
import { SearchHomeDto, SearchHomeQueryDto } from './search.dto';
import { discoveryLocation } from './discovery-location';

const readLimit = {
  key: 'search.home-read',
  subject: 'ip',
  maximumHits: 120,
  windowSeconds: 60,
} as const;
// Location-free responses only, so a short shared cache is safe (ISR-friendly).
// TODO(verify): approved public TTL for Home discovery reads, including how
// long a shared cache may keep an expired featured entitlement.
const PUBLIC_CACHE = 'public, max-age=60, stale-while-revalidate=300';
// Any city/area/coordinate context makes the response location-specific.
const PRIVATE_CACHE = 'private, no-store';
// Shared caches must never answer a located request with a public response.
const VARY = 'X-Discovery-Latitude, X-Discovery-Longitude';

@ApiTags('search')
@PublicRoute()
@ApiResponse({ status: 400, type: ErrorDto, description: 'VALIDATION_ERROR' })
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
@Controller('search')
@ApiHeader({ name: 'X-Discovery-Latitude', required: false, description: 'Optional ephemeral latitude; send together with longitude. Makes the response private/no-store.' })
@ApiHeader({ name: 'X-Discovery-Longitude', required: false, description: 'Optional ephemeral longitude; never put precise location in URLs.' })
export class SearchHomeController {
  constructor(private readonly home: SearchHomeService) {}

  @Get('home')
  @RateLimit(readLimit)
  @ApiOperation({
    operationId: 'searchHome',
    summary: 'Compose the public Home discovery sections',
    description:
      'S-CUST-01 composition. Returns Catalog-owned Home category sections (position order) and bounded owner listing sections `{items,nextCursor?,state}` using the Explore card projection: nearbyShops (8, distance; `location_required` without coordinates/area), featuredBusinesses (10), featuredProducts (8). popularBusinesses/popularProviders are `unavailable` (Q-57: no approved ranking source). Offers banners/offers/promotions are omitted until Offers ships. Optional cityId/areaId/location headers scope listings like Explore; any location context makes the response private/no-store, otherwise it is publicly cacheable for 60s.',
  })
  @ApiQuery({ type: SearchHomeQueryDto })
  @ApiResponse({ status: 200, type: SearchHomeDto })
  @ApiResponse({ status: 400, type: ErrorDto, description: 'VALIDATION_ERROR; SEARCH_FILTER_INVALID for an unknown/disabled cityId or areaId, or an area outside cityId' })
  async read(
    @Query(new InputPipe(SearchHomeQuerySchema)) query: SearchHomeQuery,
    @Req() request: AuthRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    const location = discoveryLocation(request);
    const located = location !== null || query.cityId !== undefined || query.areaId !== undefined;
    response.setHeader('Vary', VARY);
    response.setHeader('Cache-Control', located ? PRIVATE_CACHE : PUBLIC_CACHE);
    return SearchHomeSchema.parse(await this.home.home(query, location));
  }
}
