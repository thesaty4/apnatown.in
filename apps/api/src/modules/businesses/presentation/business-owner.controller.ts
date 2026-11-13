import {
  Body,
  Controller,
  Get,
  HttpCode,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  BusinessAnalyticsQuerySchema,
  BusinessAnalyticsSchema,
  BusinessOverviewSchema,
  BusinessOwnerSchema,
  BusinessProfilePatchSchema,
  BusinessVersionCommandSchema,
  CreateBusinessApplicationSchema,
  type BusinessProfilePatch,
  type BusinessVersionCommand,
  type CreateBusinessApplication,
} from '@apnatown/shared/businesses';
import { EmptyRequestSchema } from '@apnatown/shared/wire';
import { OwnAccount, type AuthRequest } from '../../../shared/auth';
import { BrowserMutation, PrivateApi } from '../../../shared/auth/openapi';
import { InputPipe } from '../../../shared/auth/validation';
import { currentCorrelationId } from '../../../shared/logger/context';
import { RateLimit } from '../../../shared/rate-limit/rate-limit';
import { AdminErrors, adminCommand } from '../../admin/presentation/admin.dto';
import { BusinessOwnerService } from '../application/business-owner.service';
import {
  BusinessAnalyticsDto,
  BusinessAnalyticsQueryDto,
  BusinessOverviewDto,
  BusinessOwnerDto,
  BusinessProfilePatchDto,
  BusinessKindHeader,
  BusinessVersionCommandDto,
  CreateBusinessApplicationDto,
  IdempotencyKey,
  businessKind,
  owner,
} from './business.dto';

const READ_LIMIT = {
  key: 'business.owner.read',
  maximumHits: 60,
  windowSeconds: 60,
  subject: 'principal',
} as const;
const WRITE_LIMIT = {
  key: 'business.owner.write',
  maximumHits: 30,
  windowSeconds: 60,
  subject: 'principal',
} as const;
const CREATE_LIMIT = {
  key: 'business.application.create',
  maximumHits: 10,
  windowSeconds: 3600,
  subject: 'principal',
} as const;
const OWNER =
  'Authenticated owner; the business is resolved server-side from the session (X-Business-Kind selects which own business when the caller owns both kinds). Status, owner, slug and storage URLs are never accepted from the client. private, no-store.';
const NOT_OWNED =
  'BUSINESS_NOT_OWNED when the caller owns no business of the named X-Business-Kind; COMMON_FORBIDDEN for a deleted/inactive account.';
const CONTEXT_REQUIRED =
  'BUSINESS_CONTEXT_REQUIRED when the caller owns both kinds and X-Business-Kind is omitted.';
const NOT_ADMITTED =
  'MAINTENANCE while maintenance mode is on; COMMON_UNAVAILABLE when the store is unavailable.';
const KEY =
  'Case-sensitive key; retry the identical command within 24 hours to replay the stored result.';

/** Owner onboarding and profile (F-VD-001..003, F-PV-001/002/006). */
@ApiTags('businesses')
@PrivateApi()
@OwnAccount()
@Controller('businesses')
export class BusinessOwnerController {
  constructor(private readonly owners: BusinessOwnerService) {}

  @Post('applications')
  @BrowserMutation()
  @IdempotencyKey(KEY)
  @ApiBody({ type: CreateBusinessApplicationDto })
  @ApiOperation({
    operationId: 'businessApplicationCreate',
    summary: 'Start a business application',
    description:
      '{kind} creates a draft owned by the session user with their verified phone. No user account or QR record is created. One business per owner and kind. Authenticated OTP session. private, no-store.',
  })
  @ApiCreatedResponse({ type: BusinessOwnerDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for an unknown kind or unexpected keys; COMMON_VALIDATION_FAILED for a missing/invalid Idempotency-Key.',
    403: 'COMMON_FORBIDDEN without a verified phone.',
    409: 'BUSINESS_ALREADY_EXISTS when the caller already owns a business of this kind; idempotency conflicts.',
    429: 'COMMON_RATE_LIMITED with Retry-After.',
    503: NOT_ADMITTED,
  })
  @RateLimit(CREATE_LIMIT)
  async create(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Body(new InputPipe(CreateBusinessApplicationSchema))
    input: CreateBusinessApplication,
  ) {
    return BusinessOwnerSchema.parse(
      await this.owners.create(adminCommand(request), input),
    );
  }

  @Get('me')
  @BusinessKindHeader()
  @ApiOperation({
    operationId: 'businessMe',
    summary: "The caller's own application/profile",
    description: `Owner DTO including status, review reason, version and capabilities. ${OWNER}`,
  })
  @ApiOkResponse({ type: BusinessOwnerDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for an invalid X-Business-Kind.',
    403: NOT_OWNED,
    404: 'BUSINESS_NOT_FOUND when the caller owns no business.',
    422: CONTEXT_REQUIRED,
    503: NOT_ADMITTED,
  })
  @RateLimit(READ_LIMIT)
  async me(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
  ) {
    return BusinessOwnerSchema.parse(await this.owners.me(owner(request)));
  }

  @Patch('me')
  @BusinessKindHeader()
  @BrowserMutation()
  @ApiBody({ type: BusinessProfilePatchDto })
  @ApiOperation({
    operationId: 'businessMePatch',
    summary: 'Update the own application/profile',
    description: `Explicit allow-listed profile patch guarded by expectedVersion; partial draft fields are allowed (submit validates completeness). Kind is draft-only; status/slug/owner are never accepted. Logo/cover attachment needs a ready own asset from Media. ${OWNER}`,
  })
  @ApiOkResponse({ type: BusinessOwnerDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for invalid or unexpected fields.',
    403: NOT_OWNED,
    404: 'BUSINESS_NOT_FOUND when the caller owns no business.',
    409: 'BUSINESS_VERSION_CONFLICT for a stale expectedVersion; BUSINESS_STATE_CONFLICT when the status forbids editing; BUSINESS_ALREADY_EXISTS for a kind change clash.',
    422: `${CONTEXT_REQUIRED} BUSINESS_MEDIA_INVALID for a logo/cover asset that is not a ready own image.`,
    429: 'COMMON_RATE_LIMITED with Retry-After.',
    503: NOT_ADMITTED,
  })
  @RateLimit(WRITE_LIMIT)
  async patch(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Body(new InputPipe(BusinessProfilePatchSchema))
    input: BusinessProfilePatch,
  ) {
    const correlationId = currentCorrelationId();
    if (!correlationId) throw new Error('MISSING_CORRELATION_CONTEXT');
    return BusinessOwnerSchema.parse(
      await this.owners.patch({ ...owner(request), correlationId }, input),
    );
  }

  @Post('me/submit')
  @HttpCode(200)
  @BusinessKindHeader()
  @BrowserMutation()
  @IdempotencyKey(KEY)
  @ApiBody({ type: BusinessVersionCommandDto })
  @ApiOperation({
    operationId: 'businessMeSubmit',
    summary: 'Submit the application for review',
    description: `{expectedVersion}: validates name, categories with one primary, area and address, assigns the immutable slug and enters pending (draft, rejected or changes_requested only). ${OWNER}`,
  })
  @ApiOkResponse({ type: BusinessOwnerDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for an incomplete application or unexpected keys; COMMON_VALIDATION_FAILED for a missing/invalid Idempotency-Key.',
    403: NOT_OWNED,
    404: 'BUSINESS_NOT_FOUND when the caller owns no business.',
    409: 'BUSINESS_STATE_CONFLICT when the status cannot submit; BUSINESS_VERSION_CONFLICT for a stale expectedVersion; idempotency conflicts.',
    422: CONTEXT_REQUIRED,
    429: 'COMMON_RATE_LIMITED with Retry-After.',
    503: NOT_ADMITTED,
  })
  @RateLimit(WRITE_LIMIT)
  async submit(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Body(new InputPipe(BusinessVersionCommandSchema))
    input: BusinessVersionCommand,
  ) {
    return BusinessOwnerSchema.parse(
      await this.owners.submit(
        { ...adminCommand(request), ...businessKind(request) },
        input,
      ),
    );
  }

  @Post('me/reactivate')
  @HttpCode(200)
  @BusinessKindHeader()
  @BrowserMutation()
  @IdempotencyKey(KEY)
  @ApiBody({ type: BusinessVersionCommandDto })
  @ApiOperation({
    operationId: 'businessMeReactivate',
    summary: 'Reactivate an inactive business',
    description: `{expectedVersion}: inactive -> approved per ST-approval; audited. ${OWNER}`,
  })
  @ApiOkResponse({ type: BusinessOwnerDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for unexpected keys; COMMON_VALIDATION_FAILED for a missing/invalid Idempotency-Key.',
    403: NOT_OWNED,
    404: 'BUSINESS_NOT_FOUND when the caller owns no business.',
    409: 'BUSINESS_STATE_CONFLICT unless inactive; BUSINESS_VERSION_CONFLICT for a stale expectedVersion; idempotency conflicts.',
    422: CONTEXT_REQUIRED,
    429: 'COMMON_RATE_LIMITED with Retry-After.',
    503: NOT_ADMITTED,
  })
  @RateLimit(WRITE_LIMIT)
  async reactivate(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Body(new InputPipe(BusinessVersionCommandSchema))
    input: BusinessVersionCommand,
  ) {
    return BusinessOwnerSchema.parse(
      await this.owners.reactivate(
        { ...adminCommand(request), ...businessKind(request) },
        input,
      ),
    );
  }

  @Get('me/overview')
  @BusinessKindHeader()
  @ApiOperation({
    operationId: 'businessMeOverview',
    summary: 'Owner dashboard summary',
    description: `Status, capabilities and per-section summaries; sections whose source module has not shipped are explicitly unavailable, never zero. ${OWNER}`,
  })
  @ApiOkResponse({ type: BusinessOverviewDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for an invalid X-Business-Kind.',
    403: NOT_OWNED,
    404: 'BUSINESS_NOT_FOUND when the caller owns no business.',
    422: CONTEXT_REQUIRED,
    503: NOT_ADMITTED,
  })
  @RateLimit(READ_LIMIT)
  async overview(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
  ) {
    return BusinessOverviewSchema.parse(
      await this.owners.overview(owner(request)),
    );
  }

  @Get('me/analytics')
  @BusinessKindHeader()
  @ApiOperation({
    operationId: 'businessMeAnalytics',
    summary: 'Provider analytics (S-PROV-14)',
    description: `reporting-v1, 30 IST days: window-deduplicated profile views (null before coverage), Services enquiry-created cohort by day and current status, converted/cohort-size conversion (null for an empty cohort). Approved providers only. ${OWNER}`,
  })
  @ApiOkResponse({ type: BusinessAnalyticsDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for an invalid period or X-Business-Kind.',
    403: NOT_OWNED,
    404: 'BUSINESS_NOT_FOUND when the caller owns no business.',
    409: 'BUSINESS_STATE_CONFLICT unless the business is an approved provider.',
    422: CONTEXT_REQUIRED,
    503: NOT_ADMITTED,
  })
  @RateLimit(READ_LIMIT)
  async analytics(
    @Req() request: AuthRequest,
    @Query(new InputPipe(BusinessAnalyticsQuerySchema))
    _query: BusinessAnalyticsQueryDto,
  ) {
    return BusinessAnalyticsSchema.parse(
      await this.owners.analytics(owner(request)),
    );
  }
}
