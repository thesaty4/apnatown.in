import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBody,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  RiderCurrentOfferSchema,
  RiderEarningsQuerySchema,
  RiderEarningsSchema,
  RiderHistoryPageSchema,
  RiderHistoryQuerySchema,
  RiderHistorySchema,
  RiderJobParamsSchema,
  RiderJobSchema,
  RiderLocationInputSchema,
  RiderOnlineInputSchema,
  RiderOnlineStateSchema,
  RiderSummarySchema,
  type RiderEarningsQuery,
  type RiderHistoryQuery,
  type RiderLocationInput,
  type RiderOnlineInput,
} from '@apnatown/shared/delivery';
import { EmptyRequestSchema } from '@apnatown/shared/wire';
import { Roles, type AuthRequest } from '../../../shared/auth';
import { BrowserMutation, PrivateApi } from '../../../shared/auth/openapi';
import { InputPipe } from '../../../shared/auth/validation';
import { RateLimit } from '../../../shared/rate-limit/rate-limit';
import { AdminErrors } from '../../admin/presentation/admin.dto';
import { RiderJobsService } from '../application/rider-jobs.service';
import { RiderWorkService } from '../application/rider-work.service';
import {
  NOT_ADMITTED,
  RiderCurrentOfferDto,
  RiderEarningsDto,
  RiderEarningsQueryDto,
  RiderHistoryDto,
  RiderHistoryPageDto,
  RiderHistoryQueryDto,
  RiderJobDto,
  RiderLocationInputDto,
  RiderOnlineInputDto,
  RiderOnlineStateDto,
  RiderSummaryDto,
  riderRequest,
} from './rider.dto';

const READ_LIMIT = {
  key: 'delivery.rider.work.read',
  maximumHits: 120,
  windowSeconds: 60,
  subject: 'principal',
} as const;
const ONLINE_LIMIT = {
  key: 'delivery.rider.online',
  maximumHits: 30,
  windowSeconds: 60,
  subject: 'principal',
} as const;
const LOCATION_LIMIT = {
  key: 'delivery.rider.location',
  maximumHits: 1,
  windowSeconds: 5,
  subject: 'principal',
} as const;
const RIDER = 'COMMON_FORBIDDEN without the live rider role; RIDER_NOT_APPROVED without a rider application row.';
const NO_JOBS = 'Jobs need Orders/Payments, which have not shipped: no job can exist yet.';

/** Approved-rider work surface (F-RD-002..006); roles/approval read live. */
@ApiTags('delivery')
@PrivateApi()
@Roles('rider')
@Controller('delivery/riders/me')
export class RiderWorkController {
  constructor(
    private readonly work: RiderWorkService,
    private readonly jobs: RiderJobsService,
  ) {}

  @Post('online')
  @HttpCode(200)
  @BrowserMutation()
  @ApiBody({ type: RiderOnlineInputDto })
  @ApiOperation({
    operationId: 'riderOnline',
    summary: 'Go online/offline',
    description:
      '{online}. Approved riders only (BR-06), idempotent by state under the rider row lock; going offline clears the latest location and is refused during an active job. private, no-store.',
  })
  @ApiOkResponse({ type: RiderOnlineStateDto })
  @AdminErrors({
    403: `RIDER_NOT_APPROVED when not currently approved. ${RIDER}`,
    409: 'RIDER_HAS_ACTIVE_JOB when going offline with an active job.',
    429: 'COMMON_RATE_LIMITED with Retry-After.',
    503: NOT_ADMITTED,
  })
  @RateLimit(ONLINE_LIMIT)
  async online(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Body(new InputPipe(RiderOnlineInputSchema)) input: RiderOnlineInput,
  ) {
    return RiderOnlineStateSchema.parse(
      await this.work.setOnline(riderRequest(request), input),
    );
  }

  @Post('location')
  @HttpCode(204)
  @BrowserMutation()
  @ApiBody({ type: RiderLocationInputDto })
  @ApiOperation({
    operationId: 'riderLocation',
    summary: 'Report the latest location',
    description:
      '{lat,lng} WGS84. Approved online riders; stores the latest point only (no trail), never logged. Rate limited to 1 per 5 s. private, no-store.',
  })
  @ApiNoContentResponse({ description: 'Latest location stored.' })
  @AdminErrors({
    400: 'VALIDATION_ERROR for out-of-range or non-numeric coordinates.',
    403: `RIDER_NOT_APPROVED. ${RIDER}`,
    409: 'RIDER_NOT_ONLINE when the rider is offline.',
    429: 'COMMON_RATE_LIMITED with Retry-After.',
    503: NOT_ADMITTED,
  })
  @RateLimit(LOCATION_LIMIT)
  async location(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Body(new InputPipe(RiderLocationInputSchema)) input: RiderLocationInput,
  ): Promise<void> {
    await this.work.recordLocation(riderRequest(request), input);
  }

  @Get('summary')
  @ApiOperation({
    operationId: 'riderSummary',
    summary: 'Rider home summary',
    description: `Rolling 24 h [asOf-24h, asOf) completed count and earned total (paise), online and approval status, active job when assigned; timeZone Asia/Kolkata is display-only. ${NO_JOBS} private, no-store.`,
  })
  @ApiOkResponse({ type: RiderSummaryDto })
  @AdminErrors({ 403: RIDER, 503: NOT_ADMITTED })
  @RateLimit(READ_LIMIT)
  async summary(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
  ) {
    return RiderSummarySchema.parse(
      await this.work.summary(riderRequest(request)),
    );
  }

  @Get('offers/current')
  @ApiOperation({
    operationId: 'riderCurrentOffer',
    summary: 'Current delivery request',
    description: `{offer} for an approved online rider; {offer:null} is the explicit no-offer state. ${NO_JOBS} The SSE stream is not implemented. private, no-store.`,
  })
  @ApiOkResponse({ type: RiderCurrentOfferDto })
  @AdminErrors({ 403: RIDER, 503: NOT_ADMITTED })
  @RateLimit(READ_LIMIT)
  async currentOffer(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
  ) {
    return RiderCurrentOfferSchema.parse(
      await this.jobs.currentOffer(riderRequest(request)),
    );
  }

  @Get('active')
  @ApiOperation({
    operationId: 'riderActiveJob',
    summary: 'Currently assigned job',
    description: `RiderJobDTO of the approved rider's assigned job. ${NO_JOBS} private, no-store.`,
  })
  @ApiOkResponse({ type: RiderJobDto })
  @AdminErrors({
    403: `RIDER_NOT_APPROVED. ${RIDER}`,
    404: 'DELIVERY_JOB_NOT_FOUND when no job is assigned.',
    503: NOT_ADMITTED,
  })
  @RateLimit(READ_LIMIT)
  async active(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
  ) {
    return RiderJobSchema.parse(await this.jobs.active(riderRequest(request)));
  }

  @Get('history')
  @ApiQuery({ type: RiderHistoryQueryDto })
  @ApiOperation({
    operationId: 'riderHistory',
    summary: 'Own terminal job history',
    description: `range=all|today|week (rolling 24 h / 7x24 h), keyset cursor pinned to asOf, limit <= 50. ${NO_JOBS} private, no-store.`,
  })
  @ApiOkResponse({ type: RiderHistoryPageDto })
  @AdminErrors({
    400: 'COMMON_VALIDATION_FAILED / VALIDATION_ERROR for an unknown range, invalid limit or foreign cursor.',
    403: RIDER,
    503: NOT_ADMITTED,
  })
  @RateLimit(READ_LIMIT)
  async history(
    @Req() request: AuthRequest,
    @Query(new InputPipe(RiderHistoryQuerySchema)) query: RiderHistoryQuery,
  ) {
    return RiderHistoryPageSchema.parse(
      await this.jobs.history(riderRequest(request), query),
    );
  }

  @Get('history/:jobId')
  @ApiParam({ name: 'jobId', schema: { type: 'string', format: 'uuid' } })
  @ApiOperation({
    operationId: 'riderHistoryDetail',
    summary: 'Own terminal job detail',
    description: `Persisted estimate/earned breakdown of the caller's own job. ${NO_JOBS} private, no-store.`,
  })
  @ApiOkResponse({ type: RiderHistoryDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for an invalid jobId.',
    403: RIDER,
    404: 'DELIVERY_JOB_NOT_FOUND for a missing or foreign job.',
    503: NOT_ADMITTED,
  })
  @RateLimit(READ_LIMIT)
  async historyDetail(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Param(new InputPipe(RiderJobParamsSchema)) params: { jobId: string },
  ) {
    return RiderHistorySchema.parse(
      await this.jobs.historyDetail(riderRequest(request), params.jobId),
    );
  }

  @Get('earnings')
  @ApiQuery({ type: RiderEarningsQueryDto })
  @ApiOperation({
    operationId: 'riderEarnings',
    summary: 'Own earnings for a rolling period',
    description: `range=day|week (rolling [asOf-24h|7x24h, asOf)). Totals use persisted earned snapshots; payout availability is unavailable with pendingPaise null until a settlement owner is approved (never zero/paid). ${NO_JOBS} private, no-store.`,
  })
  @ApiOkResponse({ type: RiderEarningsDto })
  @AdminErrors({
    400: 'COMMON_VALIDATION_FAILED / VALIDATION_ERROR for an unknown range.',
    403: RIDER,
    503: NOT_ADMITTED,
  })
  @RateLimit(READ_LIMIT)
  async earnings(
    @Req() request: AuthRequest,
    @Query(new InputPipe(RiderEarningsQuerySchema)) query: RiderEarningsQuery,
  ) {
    return RiderEarningsSchema.parse(
      await this.jobs.earnings(riderRequest(request), query),
    );
  }
}
