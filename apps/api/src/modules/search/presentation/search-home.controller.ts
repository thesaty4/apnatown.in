import { Controller, Get, Header, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  SearchHomeQuerySchema,
  SearchHomeSchema,
  type SearchHomeQuery,
} from '@apnatown/shared/search';
import { PublicRoute } from '../../../shared/auth';
import { InputPipe } from '../../../shared/auth/validation';
import { ErrorDto } from '../../../shared/health/health.controller';
import { RateLimit } from '../../../shared/rate-limit/rate-limit';
import { SearchHomeService } from '../application/search-home.service';
import { SearchHomeDto, SearchHomeQueryDto } from './search.dto';

const readLimit = {
  key: 'search.home-read',
  subject: 'ip',
  maximumHits: 120,
  windowSeconds: 60,
} as const;
// Location-free sections only, so a short shared cache is safe.
// TODO(verify): approved public TTL for Home discovery reads.
const PUBLIC_CACHE = 'public, max-age=60, stale-while-revalidate=300';

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
export class SearchHomeController {
  constructor(private readonly home: SearchHomeService) {}

  @Get('home')
  @RateLimit(readLimit)
  @Header('Cache-Control', PUBLIC_CACHE)
  @ApiOperation({
    operationId: 'searchHome',
    summary: 'Compose the public Home discovery sections',
    description:
      'S-CUST-01 location-free composition. Returns the Catalog-owned active Home category sections (dedicated and curated) localized for the requested locale, in position order; ineligible sections are omitted. Sections owned by modules that do not exist yet are not returned. Publicly cacheable.',
  })
  @ApiQuery({ type: SearchHomeQueryDto })
  @ApiResponse({ status: 200, type: SearchHomeDto })
  async read(
    @Query(new InputPipe(SearchHomeQuerySchema)) query: SearchHomeQuery,
  ) {
    return SearchHomeSchema.parse(await this.home.home(query.locale));
  }
}
