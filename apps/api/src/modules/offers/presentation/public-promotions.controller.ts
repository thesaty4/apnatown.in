import { Controller, Get, Query, Res } from '@nestjs/common';
import {
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { createZodDto } from 'nestjs-zod';
import {
  OfferPublicPageSchema,
  OfferPublicQuerySchema,
  PlacementPublicPageSchema,
  PlacementPublicQuerySchema,
  type OfferPublicQuery,
  type PlacementPublicQuery,
} from '@apnatown/shared/offers';
import { PublicRoute } from '../../../shared/auth';
import { InputPipe } from '../../../shared/auth/validation';
import { ErrorDto } from '../../../shared/health/health.controller';
import { RateLimit } from '../../../shared/rate-limit/rate-limit';
import { PublicPromotionsService } from '../application/public-promotions.service';

class OfferPublicQueryDto extends createZodDto(OfferPublicQuerySchema) {}
class OfferPublicPageDto extends createZodDto(OfferPublicPageSchema) {}
class PlacementPublicQueryDto extends createZodDto(PlacementPublicQuerySchema) {}
class PlacementPublicPageDto extends createZodDto(PlacementPublicPageSchema) {}

const readLimit = {
  key: 'promotions.public-read',
  subject: 'ip',
  maximumHits: 120,
  windowSeconds: 60,
} as const;
const PUBLIC_CACHE = 'public, max-age=60, stale-while-revalidate=300';
const PRIVATE_CACHE = 'private, no-store';

/** S-CUST-20 public offers list. Approved, in-window offers only. */
@ApiTags('offers')
@PublicRoute()
@Controller('offers')
export class PublicOffersController {
  constructor(private readonly promotions: PublicPromotionsService) {}

  @Get()
  @RateLimit(readLimit)
  @ApiOperation({
    operationId: 'listPublicOffers',
    summary: 'Public active offers by business and featured flag',
    description:
      'Approved, in-window offers of approved public businesses, newest expiry first, keyset page ≤50. Expired/ended/paused drafts are never returned.',
  })
  @ApiQuery({ type: OfferPublicQueryDto })
  @ApiResponse({ status: 200, type: OfferPublicPageDto })
  @ApiResponse({ status: 400, type: ErrorDto, description: 'VALIDATION_ERROR' })
  @ApiResponse({ status: 429, type: ErrorDto, description: 'COMMON_RATE_LIMITED' })
  @ApiResponse({ status: 503, type: ErrorDto, description: 'MAINTENANCE or COMMON_UNAVAILABLE' })
  async list(
    @Query(new InputPipe(OfferPublicQuerySchema)) query: OfferPublicQuery,
    @Res({ passthrough: true }) response: Response,
  ) {
    response.setHeader('Cache-Control', PUBLIC_CACHE);
    return OfferPublicPageSchema.parse(await this.promotions.offers(query));
  }
}

/** S-CUST-01 hero banners / featured placements from Offers. */
@ApiTags('offers')
@PublicRoute()
@Controller('promotions')
export class PublicPlacementsController {
  constructor(private readonly promotions: PublicPromotionsService) {}

  @Get('placements')
  @RateLimit(readLimit)
  @ApiOperation({
    operationId: 'listPublicPlacements',
    summary: 'Live homepage banners and promotion placements',
    description:
      'Active, in-window placements in the caller-provided city/area scope (platform-only without context). Internal destinations are resolved server-side; unavailable targets are omitted. Any location context makes the response private/no-store.',
  })
  @ApiQuery({ type: PlacementPublicQueryDto })
  @ApiResponse({ status: 200, type: PlacementPublicPageDto })
  @ApiResponse({ status: 400, type: ErrorDto, description: 'VALIDATION_ERROR' })
  @ApiResponse({ status: 429, type: ErrorDto, description: 'COMMON_RATE_LIMITED' })
  @ApiResponse({ status: 503, type: ErrorDto, description: 'MAINTENANCE or COMMON_UNAVAILABLE' })
  async placements(
    @Query(new InputPipe(PlacementPublicQuerySchema)) query: PlacementPublicQuery,
    @Res({ passthrough: true }) response: Response,
  ) {
    response.setHeader('Vary', 'X-Discovery-Latitude, X-Discovery-Longitude');
    response.setHeader(
      'Cache-Control',
      query.cityId || query.areaId ? PRIVATE_CACHE : PUBLIC_CACHE,
    );
    return PlacementPublicPageSchema.parse(
      await this.promotions.placements(query),
    );
  }
}
