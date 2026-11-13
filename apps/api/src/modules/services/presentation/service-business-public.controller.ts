import { Controller, Get, Header, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import {
  BusinessPublicServicesQuerySchema,
  BusinessPublicServicesResponseSchema,
  PublicListingParamsSchema,
  type BusinessPublicServicesQuery,
} from '@apnatown/shared';
import { PublicRoute } from '../../../shared/auth';
import { InputPipe } from '../../../shared/auth/validation';
import { ErrorDto } from '../../../shared/health/health.controller';
import { RateLimit } from '../../../shared/rate-limit/rate-limit';
import { ServiceBusinessPublicService } from '../application/service-business-public.service';

export class BusinessPublicServicesQueryDto extends createZodDto(BusinessPublicServicesQuerySchema) {}
export class BusinessPublicServicesResponseDto extends createZodDto(BusinessPublicServicesResponseSchema) {}

/** Services tab of /shop/[slug] and /provider/[slug]; owned by Services. */
@ApiTags('services')
@PublicRoute()
@Controller('businesses/public')
export class ServiceBusinessPublicController {
  constructor(private readonly services: ServiceBusinessPublicService) {}

  @Get(':slug/services')
  // Live offer flags and approval revocation: never shared-cached.
  @Header('Cache-Control', 'private, no-store')
  @RateLimit({ key: 'services.business-public-read', subject: 'ip', maximumHits: 120, windowSeconds: 60 })
  @ApiOperation({
    operationId: 'getPublicBusinessServices',
    summary: 'Public active services of an approved business with counted category/subcategory pills',
    description: 'Active services as Explore cards (featured, name, id keyset; limit default 20, max 50), filtered by optional category and subcategory slugs. Category counts ignore filters; subcategory counts respect only the category filter. Labels are returned in both locales. Unknown slugs yield an empty page.',
  })
  @ApiParam({ name: 'slug', schema: { type: 'string', pattern: '^[a-z0-9]+(-[a-z0-9]+)*$', maxLength: 80 } })
  @ApiQuery({ type: BusinessPublicServicesQueryDto })
  @ApiOkResponse({ type: BusinessPublicServicesResponseDto })
  @ApiResponse({ status: 400, type: ErrorDto, description: 'VALIDATION_ERROR for invalid slug/query; COMMON_VALIDATION_FAILED for a malformed or foreign cursor.' })
  @ApiResponse({ status: 404, type: ErrorDto, description: 'COMMON_NOT_FOUND unless the slug is an approved public business.' })
  @ApiResponse({ status: 429, type: ErrorDto, description: 'COMMON_RATE_LIMITED' })
  list(
    @Param(new InputPipe(PublicListingParamsSchema)) params: { slug: string },
    @Query(new InputPipe(BusinessPublicServicesQuerySchema)) query: BusinessPublicServicesQuery,
  ) {
    return this.services.list(params.slug, query);
  }
}
