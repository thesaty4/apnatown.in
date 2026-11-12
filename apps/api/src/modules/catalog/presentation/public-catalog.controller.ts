import { Controller, Get, Header, Param, Query } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  CategoryDetailSchema,
  CategoryListQuerySchema,
  CategoryListSchema,
  CategorySlugParamsSchema,
  SubcategoryDetailSchema,
  SubcategorySlugParamsSchema,
  type CategoryListQuery,
  type CategorySlugParams,
  type SubcategorySlugParams,
} from '@apnatown/shared/catalog';
import { EmptyRequestSchema } from '@apnatown/shared/wire';
import { PublicRoute } from '../../../shared/auth';
import { InputPipe } from '../../../shared/auth/validation';
import { ErrorDto } from '../../../shared/health/health.controller';
import { RateLimit } from '../../../shared/rate-limit/rate-limit';
import { CatalogTaxonomyService } from '../application/catalog-taxonomy.service';
import {
  CategoryDetailDto,
  CategoryListDto,
  CategoryListQueryDto,
  SubcategoryDetailDto,
} from './catalog.dto';

const readLimit = {
  key: 'catalog.public-read',
  subject: 'ip',
  maximumHits: 120,
  windowSeconds: 60,
} as const;
// Short shared cache; catalog.taxonomy.changed invalidates web cache tags.
// TODO(verify): approved public TTL for taxonomy reads.
const PUBLIC_CACHE = 'public, max-age=60, stale-while-revalidate=300';
const SLUG = { type: 'string', pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$' };

/** Public active taxonomy; blocked with the rest of public browsing in maintenance. */
@ApiTags('catalog')
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
@Controller('catalog/categories')
export class PublicCatalogController {
  constructor(private readonly taxonomy: CatalogTaxonomyService) {}

  @Get()
  @RateLimit(readLimit)
  @Header('Cache-Control', PUBLIC_CACHE)
  @ApiOperation({
    operationId: 'catalogCategories',
    summary: 'List active categories',
    description:
      'Active categories ordered by sortOrder then English name, optionally filtered by the allow-listed kind (products|services). Localized EN/HI names, icon fallback and public Media image descriptors only (no admin/audit fields). Publicly cacheable; taxonomy changes invalidate via catalog.taxonomy.changed.',
  })
  @ApiQuery({ type: CategoryListQueryDto })
  @ApiResponse({ status: 200, type: CategoryListDto })
  async categories(
    @Query(new InputPipe(CategoryListQuerySchema)) query: CategoryListQuery,
  ) {
    return CategoryListSchema.parse(
      await this.taxonomy.listCategories(query.kind),
    );
  }

  @Get(':slug')
  @RateLimit(readLimit)
  @Header('Cache-Control', PUBLIC_CACHE)
  @ApiOperation({
    operationId: 'catalogCategory',
    summary: 'Read an active category with its active subcategories',
    description:
      'Immutable slug lookup. Inactive or unknown categories are indistinguishable (CATEGORY_NOT_FOUND). Search owns paged listing results. Publicly cacheable.',
  })
  @ApiParam({ name: 'slug', schema: SLUG })
  @ApiResponse({ status: 200, type: CategoryDetailDto })
  @ApiResponse({
    status: 404,
    type: ErrorDto,
    description: 'CATEGORY_NOT_FOUND',
  })
  async category(
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Param(new InputPipe(CategorySlugParamsSchema)) params: CategorySlugParams,
  ) {
    return CategoryDetailSchema.parse(
      await this.taxonomy.category(params.slug),
    );
  }

  @Get(':slug/subcategories/:subcategorySlug')
  @RateLimit(readLimit)
  @Header('Cache-Control', PUBLIC_CACHE)
  @ApiOperation({
    operationId: 'catalogSubcategory',
    summary: 'Read an active subcategory under its exact active parent',
    description:
      'Both rows must be active and the subcategory must belong to the named category. Returns the localized parent/child DTOs, image descriptors and canonical path; Search owns paged results. Publicly cacheable.',
  })
  @ApiParam({ name: 'slug', schema: SLUG })
  @ApiParam({ name: 'subcategorySlug', schema: SLUG })
  @ApiResponse({ status: 200, type: SubcategoryDetailDto })
  @ApiResponse({
    status: 404,
    type: ErrorDto,
    description: 'SUBCATEGORY_NOT_FOUND',
  })
  async subcategory(
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Param(new InputPipe(SubcategorySlugParamsSchema))
    params: SubcategorySlugParams,
  ) {
    return SubcategoryDetailSchema.parse(
      await this.taxonomy.subcategory(params.slug, params.subcategorySlug),
    );
  }
}
