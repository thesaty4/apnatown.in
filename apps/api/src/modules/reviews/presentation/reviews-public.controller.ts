import { Controller, Get, Header, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import {
  REVIEW_PUBLIC_TARGET_TYPES,
  REVIEW_SORTS,
  ReviewListQuerySchema,
  ReviewPageSchema,
  type ReviewListQuery,
} from '@apnatown/shared/reviews';
import { PublicRoute } from '../../../shared/auth';
import { InputPipe } from '../../../shared/auth/validation';
import { ErrorDto } from '../../../shared/health/health.controller';
import { RateLimit } from '../../../shared/rate-limit/rate-limit';
import { ReviewsPublicService } from '../application/reviews-public.service';

class ReviewPageDto extends createZodDto(ReviewPageSchema) {}

@ApiTags('reviews')
@PublicRoute()
@ApiResponse({
  status: 400,
  type: ErrorDto,
  description: 'VALIDATION_ERROR; COMMON_VALIDATION_FAILED for a cursor from another target/sort',
})
@ApiResponse({ status: 404, type: ErrorDto, description: 'COMMON_NOT_FOUND: target is not publicly visible' })
@ApiResponse({ status: 429, type: ErrorDto, description: 'COMMON_RATE_LIMITED: read limit exceeded' })
@ApiResponse({ status: 500, type: ErrorDto, description: 'Unexpected failure' })
@ApiResponse({ status: 503, type: ErrorDto, description: 'MAINTENANCE or COMMON_UNAVAILABLE' })
@Controller('reviews')
export class ReviewsPublicController {
  constructor(private readonly reviews: ReviewsPublicService) {}

  @Get()
  @Header('Cache-Control', 'private, no-store')
  @RateLimit({ key: 'reviews.public-read', subject: 'ip', maximumHits: 120, windowSeconds: 60 })
  // Explicit params so the enums survive into the typed client.
  @ApiQuery({ name: 'targetType', required: true, schema: { type: 'string', enum: [...REVIEW_PUBLIC_TARGET_TYPES] } })
  @ApiQuery({ name: 'targetId', required: true, schema: { type: 'string', format: 'uuid' } })
  @ApiQuery({ name: 'sort', required: false, schema: { type: 'string', enum: [...REVIEW_SORTS], default: 'recent' } })
  @ApiQuery({ name: 'cursor', required: false, schema: { type: 'string', minLength: 1, maxLength: 2048, pattern: '^[A-Za-z0-9_-]+$' } })
  @ApiQuery({ name: 'limit', required: false, schema: { type: 'integer', minimum: 1, maximum: 20, default: 10 } })
  @ApiOperation({
    operationId: 'reviewsList',
    summary: 'Public reviews, rating summary and star breakdown for a product, service or business',
    description:
      'Only published/reported reviews of a publicly visible target. Authors are shown as first name + last initial. ' +
      'Keyset cursor is bound to the target and sort. Rider reviews have no public listing (RV-Q3).',
  })
  @ApiResponse({ status: 200, type: ReviewPageDto })
  async list(@Query(new InputPipe(ReviewListQuerySchema)) query: ReviewListQuery) {
    return ReviewPageSchema.parse(await this.reviews.page(query));
  }
}
