import { Body, Controller, Get, Header, HttpCode, Param, Post, Query, Req } from '@nestjs/common';
import {
  ApiAcceptedResponse,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import {
  BusinessGalleryPageSchema,
  BusinessGalleryQuerySchema,
  BusinessVideosQuerySchema,
  CreatePhotoReportSchema,
  LinkedVideosQuerySchema,
  MediaPhotoParamsSchema,
  PublicListingParamsSchema,
  PublicVideoCardPageSchema,
  VideoReportAcceptedSchema,
  type BusinessGalleryQuery,
  type BusinessVideosQuery,
  type CreatePhotoReport,
  type LinkedVideosQuery,
  type MediaPhotoParams,
} from '@apnatown/shared';
import { EmptyRequestSchema } from '@apnatown/shared/wire';
import { createZodDto } from 'nestjs-zod';
import { PublicRoute, SessionRoute, type AuthRequest } from '../../../shared/auth';
import { InputPipe } from '../../../shared/auth/validation';
import { RateLimit } from '../../../shared/rate-limit/rate-limit';
import { AdminErrors } from '../../admin/presentation/admin.dto';
import { PhotoReportService } from '../application/photo-report.service';
import { PublicMediaService } from '../application/public-media.service';
import { IdempotentMutation } from './media-owner.decorators';
import { reportRequest } from './video.controller';

class BusinessGalleryQueryDto extends createZodDto(BusinessGalleryQuerySchema) {}
class BusinessGalleryPageDto extends createZodDto(BusinessGalleryPageSchema) {}
class BusinessVideosQueryDto extends createZodDto(BusinessVideosQuerySchema) {}
class LinkedVideosQueryDto extends createZodDto(LinkedVideosQuerySchema) {}
class PublicVideoCardPageDto extends createZodDto(PublicVideoCardPageSchema) {}
class CreatePhotoReportDto extends createZodDto(CreatePhotoReportSchema) {}
class PhotoReportAcceptedDto extends createZodDto(VideoReportAcceptedSchema) {}

const PUBLIC_READ_LIMIT = { key: 'media.public.read', subject: 'ip', maximumHits: 120, windowSeconds: 60 } as const;
const SLUG_PARAM = { name: 'slug', schema: { type: 'string', pattern: '^[a-z0-9]+(-[a-z0-9]+)*$', maxLength: 80 } } as const;
const PUBLIC_ERRORS = {
  400: 'VALIDATION_ERROR for invalid query/slug or a malformed/foreign cursor.',
  429: 'COMMON_RATE_LIMITED with Retry-After.',
} as const;

/** Gallery and Videos tabs of /shop/[slug] and /provider/[slug]; owned by Media. */
@ApiTags('media')
@PublicRoute()
@Controller('businesses/public')
export class PublicBusinessMediaController {
  constructor(private readonly media: PublicMediaService) {}

  @Get(':slug/gallery')
  @Header('Cache-Control', 'private, no-store')
  @RateLimit(PUBLIC_READ_LIMIT)
  @ApiParam(SLUG_PARAM)
  @ApiQuery({ type: BusinessGalleryQueryDto })
  @ApiOperation({
    operationId: 'mediaPublicBusinessGallery',
    summary: 'Public Gallery tab of an approved business',
    description: 'Gallery-only photos, consented product/service images and approved gallery-consented videos (keyset; owner gallery order, then videos, then listing images). filter=photos is gallery-only photos; product/service are listing images. Images use the same-origin authorized media gateway only.',
  })
  @ApiOkResponse({ type: BusinessGalleryPageDto })
  @AdminErrors({ ...PUBLIC_ERRORS, 404: 'BUSINESS_NOT_PUBLIC unless the slug is an approved public business.' })
  async gallery(
    @Param(new InputPipe(PublicListingParamsSchema)) params: { slug: string },
    @Query(new InputPipe(BusinessGalleryQuerySchema)) query: BusinessGalleryQuery,
  ) {
    return BusinessGalleryPageSchema.parse(await this.media.gallery(params.slug, query));
  }

  @Get(':slug/videos')
  @Header('Cache-Control', 'private, no-store')
  @RateLimit(PUBLIC_READ_LIMIT)
  @ApiParam(SLUG_PARAM)
  @ApiQuery({ type: BusinessVideosQueryDto })
  @ApiOperation({
    operationId: 'mediaPublicBusinessVideos',
    summary: 'Public Videos tab of an approved business',
    description: 'Approved, Reels-consented videos in owner order with thumbnail and view count.',
  })
  @ApiOkResponse({ type: PublicVideoCardPageDto })
  @AdminErrors({ ...PUBLIC_ERRORS, 404: 'BUSINESS_NOT_PUBLIC unless the slug is an approved public business.' })
  async videos(
    @Param(new InputPipe(PublicListingParamsSchema)) params: { slug: string },
    @Query(new InputPipe(BusinessVideosQuerySchema)) query: BusinessVideosQuery,
  ) {
    return PublicVideoCardPageSchema.parse(await this.media.businessVideos(params.slug, query));
  }
}

/** Product/service "Videos & Reels" section. */
@ApiTags('media')
@PublicRoute()
@Controller('videos')
export class LinkedVideoController {
  constructor(private readonly media: PublicMediaService) {}

  @Get()
  @Header('Cache-Control', 'private, no-store')
  @RateLimit(PUBLIC_READ_LIMIT)
  @ApiQuery({ type: LinkedVideosQueryDto })
  @ApiOperation({
    operationId: 'mediaLinkedVideos',
    summary: 'Approved videos linked to a public product or service',
    description: 'Newest first. Only approved, consented videos of the same approved business whose linked item is currently public; an unknown or hidden item yields an empty page.',
  })
  @ApiOkResponse({ type: PublicVideoCardPageDto })
  @AdminErrors(PUBLIC_ERRORS)
  async linked(@Query(new InputPipe(LinkedVideosQuerySchema)) query: LinkedVideosQuery) {
    return PublicVideoCardPageSchema.parse(await this.media.linkedVideos(query));
  }
}

/** Public report of a photo at a specific public placement. */
@ApiTags('media')
@Controller('media/photos')
export class PhotoReportController {
  constructor(private readonly reports: PhotoReportService) {}

  @Post(':assetId/reports')
  @HttpCode(202)
  @SessionRoute()
  @IdempotentMutation()
  @ApiSecurity('sessionCookie')
  @ApiParam({ name: 'assetId', schema: { type: 'string', format: 'uuid' } })
  @ApiBody({ type: CreatePhotoReportDto })
  @ApiOperation({
    operationId: 'mediaPhotoReport',
    summary: 'Report a currently public photo',
    description: 'Guest or signed-in session. The photo must be public at the given placement (gallery photo, product image or service image). A duplicate open report from the same session is acknowledged with the existing report ID. Reporting does not change visibility.',
  })
  @ApiAcceptedResponse({ type: PhotoReportAcceptedDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for invalid fields or idempotency key.',
    403: 'CSRF_INVALID for a missing or untrusted browser session.',
    404: 'MEDIA_NOT_FOUND when the photo is not public at the given placement.',
    409: 'COMMON_CONFLICT when the key is reused with a different payload.',
    429: 'COMMON_RATE_LIMITED with Retry-After.',
  })
  @RateLimit(
    { key: 'media.photo.report', maximumHits: 5, windowSeconds: 3600, subject: 'session' },
    { key: 'media.photo.report.ip', maximumHits: 5, windowSeconds: 3600, subject: 'ip' },
  )
  async report(
    @Req() request: AuthRequest,
    @Param(new InputPipe(MediaPhotoParamsSchema)) params: MediaPhotoParams,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Body(new InputPipe(CreatePhotoReportSchema)) input: CreatePhotoReport,
  ) {
    return VideoReportAcceptedSchema.parse(await this.reports.report(reportRequest(request), params.assetId, input));
  }
}
