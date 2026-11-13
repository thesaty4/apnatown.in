import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiAcceptedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  OwnerReviewCardSchema,
  OwnerReviewPageSchema,
  OwnerReviewQuerySchema,
  OwnerReviewReplySchema,
  ReviewReportResultSchema,
  ReviewReportSchema,
  type OwnerReviewQuery,
} from '@apnatown/shared/reviews';
import { EmptyRequestSchema, IdSchema } from '@apnatown/shared/wire';
import { createZodDto } from 'nestjs-zod';
import { OwnAccount, type AuthRequest } from '../../../shared/auth';
import { BrowserMutation, PrivateApi } from '../../../shared/auth/openapi';
import { InputPipe } from '../../../shared/auth/validation';
import { RateLimit } from '../../../shared/rate-limit/rate-limit';
import { AdminErrors } from '../../admin/presentation/admin.dto';
import {
  BusinessKindHeader,
  owner,
} from '../../businesses/presentation/business.dto';
import { ReviewsOwnerService } from '../application/reviews-owner.service';

class OwnerReviewQueryDto extends createZodDto(OwnerReviewQuerySchema) {}
class OwnerReviewPageDto extends createZodDto(OwnerReviewPageSchema) {}
class OwnerReviewCardDto extends createZodDto(OwnerReviewCardSchema) {}
class OwnerReviewReplyDto extends createZodDto(OwnerReviewReplySchema) {}
class ReviewReportDto extends createZodDto(ReviewReportSchema) {}
class ReviewReportResultDto extends createZodDto(ReviewReportResultSchema) {}

const READ_LIMIT = { key: 'reviews.owner.read', maximumHits: 60, windowSeconds: 60, subject: 'principal' } as const;
const WRITE_LIMIT = { key: 'reviews.owner.write', maximumHits: 30, windowSeconds: 60, subject: 'principal' } as const;
const REPORT_LIMIT = { key: 'reviews.report', maximumHits: 5, windowSeconds: 3600, subject: 'principal' } as const;
const OWNER =
  "Owner of an APPROVED vendor/provider business with its live seller role, resolved server-side (X-Business-Kind selects between the caller's own businesses). Covers the business/profile and its product/service reviews that are published or reported. private, no-store.";
const ERRORS = {
  401: 'SESSION_EXPIRED without a signed-in session.',
  403: 'COMMON_FORBIDDEN when the caller has no approved selling business.',
  422: 'BUSINESS_CONTEXT_REQUIRED when the caller owns both kinds and sent no X-Business-Kind.',
  429: 'COMMON_RATE_LIMITED with Retry-After.',
} as const;
const reviewParam = { name: 'reviewId', schema: { type: 'string', format: 'uuid' } } as const;

/** S-VEND-09 / S-PROV-10 owner reviews (F-VD-010, F-RV-007). */
@ApiTags('reviews')
@PrivateApi()
@OwnAccount()
@Controller()
export class ReviewsOwnerController {
  constructor(private readonly reviews: ReviewsOwnerService) {}

  @Get('businesses/me/reviews')
  @Header('Cache-Control', 'private, no-store')
  @BusinessKindHeader()
  @ApiQuery({ type: OwnerReviewQueryDto })
  @ApiOperation({
    operationId: 'businessMeReviews',
    summary: "Owner's reviews with All / Needs reply / Reported filters",
    description: `Summary (average, count, 1★..5★) and filter counts over the whole visible set; items newest first with an opaque cursor bound to filter+rating. Reported = status reported (open reports). ${OWNER}`,
  })
  @ApiOkResponse({ type: OwnerReviewPageDto })
  @AdminErrors({ 400: 'VALIDATION_ERROR for an invalid filter/rating/cursor or X-Business-Kind.', ...ERRORS })
  @RateLimit(READ_LIMIT)
  list(
    @Req() request: AuthRequest,
    @Query(new InputPipe(OwnerReviewQuerySchema)) query: OwnerReviewQuery,
  ) {
    return this.reviews.page(owner(request), query);
  }

  @Put('businesses/me/reviews/:reviewId/reply')
  @BrowserMutation()
  @BusinessKindHeader()
  @ApiParam(reviewParam)
  @ApiOperation({
    operationId: 'businessMeReviewReply',
    summary: 'Add or overwrite the owner reply (plain text ≤1000)',
    description: `Idempotent: the same text yields the same reply. ${OWNER}`,
  })
  @ApiOkResponse({ type: OwnerReviewCardDto })
  @AdminErrors({ 400: 'VALIDATION_ERROR for empty/too long text.', 404: 'REVIEW_NOT_FOUND for a foreign or non-visible review.', ...ERRORS })
  @RateLimit(WRITE_LIMIT)
  reply(
    @Req() request: AuthRequest,
    @Param('reviewId', new InputPipe(IdSchema)) reviewId: string,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Body(new InputPipe(OwnerReviewReplySchema)) body: OwnerReviewReplyDto,
  ) {
    return this.reviews.reply(owner(request), reviewId, body.text);
  }

  @Delete('businesses/me/reviews/:reviewId/reply')
  @BrowserMutation()
  @BusinessKindHeader()
  @ApiParam(reviewParam)
  @ApiOperation({ operationId: 'businessMeReviewReplyDelete', summary: 'Remove the owner reply', description: OWNER })
  @ApiOkResponse({ type: OwnerReviewCardDto })
  @AdminErrors({ 404: 'REVIEW_NOT_FOUND for a foreign or non-visible review.', ...ERRORS })
  @RateLimit(WRITE_LIMIT)
  removeReply(
    @Req() request: AuthRequest,
    @Param('reviewId', new InputPipe(IdSchema)) reviewId: string,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Body(new InputPipe(EmptyRequestSchema.default({}))) _body: Record<string, never>,
  ) {
    return this.reviews.reply(owner(request), reviewId, null);
  }

  @Post('reviews/:reviewId/reports')
  @HttpCode(202)
  @BrowserMutation()
  @ApiParam(reviewParam)
  @ApiOperation({
    operationId: 'reviewReport',
    summary: 'Report a review (owning vendor/provider)',
    description:
      'The review stays public and counted; it moves to Reported and the admin queue. A replay by the same reporter is acknowledged once. Public (customer/guest) reporting is not enabled yet. private, no-store.',
  })
  @ApiAcceptedResponse({ type: ReviewReportResultDto })
  @AdminErrors({ 400: 'VALIDATION_ERROR for an invalid reason/details.', 404: 'REVIEW_NOT_FOUND unless the caller owns the approved business of this visible review.', ...ERRORS })
  @RateLimit(REPORT_LIMIT)
  report(
    @Req() request: AuthRequest,
    @Param('reviewId', new InputPipe(IdSchema)) reviewId: string,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Body(new InputPipe(ReviewReportSchema)) body: ReviewReportDto,
  ) {
    return this.reviews.report(owner(request), reviewId, body);
  }
}
