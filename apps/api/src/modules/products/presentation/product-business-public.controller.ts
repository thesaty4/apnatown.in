import { Controller, Get, Header, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import {
  BusinessPublicProductsQuerySchema,
  BusinessPublicProductsResponseSchema,
  PublicListingParamsSchema,
  type BusinessPublicProductsQuery,
} from '@apnatown/shared';
import { PublicRoute } from '../../../shared/auth';
import { InputPipe } from '../../../shared/auth/validation';
import { ErrorDto } from '../../../shared/health/health.controller';
import { RateLimit } from '../../../shared/rate-limit/rate-limit';
import { ProductBusinessPublicService } from '../application/product-business-public.service';

export class BusinessPublicProductsQueryDto extends createZodDto(BusinessPublicProductsQuerySchema) {}
export class BusinessPublicProductsResponseDto extends createZodDto(BusinessPublicProductsResponseSchema) {}

/** Products tab of /shop/[slug] and /provider/[slug]; owned by Products. */
@ApiTags('products')
@PublicRoute()
@Controller('businesses/public')
export class ProductBusinessPublicController {
  constructor(private readonly products: ProductBusinessPublicService) {}

  @Get(':slug/products')
  // Live offer prices/stock and approval revocation: never shared-cached.
  @Header('Cache-Control', 'private, no-store')
  @RateLimit({ key: 'products.business-public-read', subject: 'ip', maximumHits: 120, windowSeconds: 60 })
  @ApiOperation({
    operationId: 'getPublicBusinessProducts',
    summary: 'Public products of an approved business with counted subcategory pills',
    description: 'Published, non-deleted products as Explore cards (featured, name, id keyset; limit default 20, max 50). Pills: subcategories with ≥1 public product counted before the `subcategory` filter, in owner pill order (hidden omitted, label overrides applied) then Catalog order; a selected subcategory without products is returned with count 0. An unknown subcategory slug yields an empty page.',
  })
  @ApiParam({ name: 'slug', schema: { type: 'string', pattern: '^[a-z0-9]+(-[a-z0-9]+)*$', maxLength: 80 } })
  @ApiQuery({ type: BusinessPublicProductsQueryDto })
  @ApiOkResponse({ type: BusinessPublicProductsResponseDto })
  @ApiResponse({ status: 400, type: ErrorDto, description: 'VALIDATION_ERROR for invalid slug/query; COMMON_VALIDATION_FAILED for a malformed or foreign cursor.' })
  @ApiResponse({ status: 404, type: ErrorDto, description: 'PRODUCT_NOT_FOUND unless the slug is an approved public business.' })
  @ApiResponse({ status: 429, type: ErrorDto, description: 'COMMON_RATE_LIMITED' })
  list(
    @Param(new InputPipe(PublicListingParamsSchema)) params: { slug: string },
    @Query(new InputPipe(BusinessPublicProductsQuerySchema)) query: BusinessPublicProductsQuery,
  ) {
    return this.products.list(params.slug, query);
  }
}
