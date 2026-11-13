import { Controller, Get, Header, Query, Req } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { EmptyRequestSchema } from '@apnatown/shared/wire';
import {
  SearchPopularSchema,
  SearchQuerySchema,
  SearchResponseSchema,
  SearchSuggestionsQuerySchema,
  SearchSuggestionsSchema,
  type SearchQuery,
  type SearchSuggestionsQuery,
} from '@apnatown/shared/search';
import { PublicRoute, type AuthRequest } from '../../../shared/auth';
import { InputPipe } from '../../../shared/auth/validation';
import { ErrorDto } from '../../../shared/health/health.controller';
import { RateLimit } from '../../../shared/rate-limit/rate-limit';
import { SearchService } from '../application/search.service';
import { discoveryLocation } from './discovery-location';
import {
  SearchPopularDto,
  SearchQueryDto,
  SearchResponseDto,
  SearchSuggestionsDto,
  SearchSuggestionsQueryDto,
} from './search.dto';

const limit = (key: string) => ({ key, subject: 'ip', maximumHits: 120, windowSeconds: 60 }) as const;
// Live eligibility/prices and optional precise location: never shared-cached.
const NO_STORE = 'private, no-store';
// A constant curated list with no personal or location data.
// TODO(verify): approved public TTL for curated popular terms (Q-56).
const PUBLIC_CACHE = 'public, max-age=60, stale-while-revalidate=300';

@ApiTags('search')
@PublicRoute()
@ApiResponse({
  status: 400,
  type: ErrorDto,
  description:
    'VALIDATION_ERROR; COMMON_VALIDATION_FAILED for malformed location headers or cursors; SEARCH_FILTER_INVALID for unknown taxonomy, ambiguous bare subcategories, parent mismatches or duplicate resolved identities',
})
@ApiResponse({ status: 403, type: ErrorDto, description: 'Untrusted Origin' })
@ApiResponse({ status: 429, type: ErrorDto, description: 'COMMON_RATE_LIMITED: read limit exceeded' })
@ApiResponse({ status: 500, type: ErrorDto, description: 'Unexpected failure' })
@ApiResponse({
  status: 503,
  type: ErrorDto,
  description: 'MAINTENANCE while maintenance mode is on; COMMON_UNAVAILABLE when the store is unavailable',
})
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @RateLimit(limit('search.search-read'))
  @Header('Cache-Control', NO_STORE)
  @ApiOperation({
    operationId: 'search',
    summary: 'Search public products, shops, services and approved videos',
    description:
      'SR1–SR10. All returns per-kind counts and up to four items per nonempty group with a same-origin See all target (no cursor). Products/Shops/Services use the Explore predicates, facets and signed keyset pages; Videos returns approved Reels-eligible videos in relevance order only. Empty q returns empty groups and zero counts. Catalog keyword mappings resolve text and supply mappingExplanation. No query history is stored.',
  })
  @ApiHeader({ name: 'X-Discovery-Latitude', required: false, description: 'Optional ephemeral latitude; send together with longitude.' })
  @ApiHeader({ name: 'X-Discovery-Longitude', required: false, description: 'Optional ephemeral longitude; never put precise location in URLs.' })
  @ApiQuery({ type: SearchQueryDto })
  @ApiResponse({ status: 200, type: SearchResponseDto })
  @ApiResponse({ status: 422, type: ErrorDto, description: 'SEARCH_LOCATION_REQUIRED' })
  async search(
    @Query(new InputPipe(SearchQuerySchema)) query: SearchQuery,
    @Req() request: AuthRequest,
  ) {
    return SearchResponseSchema.parse(await this.searchService.search(query, discoveryLocation(request)));
  }

  @Get('suggestions')
  @RateLimit(limit('search.suggestions-read'))
  @Header('Cache-Control', NO_STORE)
  @ApiOperation({
    operationId: 'searchSuggestions',
    summary: 'Grouped autocomplete suggestions for a non-empty query',
    description:
      'SR2–SR4. Up to three products, shops, services, categories and subcategories plus two Catalog-mapped related searches; each target is a same-origin /search URL. Each group is empty when nothing matches.',
  })
  @ApiQuery({ type: SearchSuggestionsQueryDto })
  @ApiResponse({ status: 200, type: SearchSuggestionsDto })
  async suggestions(
    @Query(new InputPipe(SearchSuggestionsQuerySchema)) query: SearchSuggestionsQuery,
  ) {
    return SearchSuggestionsSchema.parse(await this.searchService.suggestions(query));
  }

  @Get('popular')
  @RateLimit(limit('search.popular-read'))
  @Header('Cache-Control', PUBLIC_CACHE)
  @ApiOperation({
    operationId: 'searchPopular',
    summary: 'Curated global popular search terms',
    description:
      'SR5/SR9. The curated prototype list pending Q-56; never derived from customer queries. Publicly cacheable.',
  })
  @ApiResponse({ status: 200, type: SearchPopularDto })
  popular(@Query(new InputPipe(EmptyRequestSchema)) _query: unknown) {
    return SearchPopularSchema.parse(this.searchService.popular());
  }
}
