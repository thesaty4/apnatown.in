import { Body, Controller, Get, HttpCode, Post, Put, Query, Req } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  RiderDisputeInputSchema,
  RiderDisputeResultSchema,
  RiderDraftWriteSchema,
  RiderProfileSchema,
  type RiderDisputeInput,
  type RiderDraftWrite,
} from '@apnatown/shared/delivery';
import { EmptyRequestSchema } from '@apnatown/shared/wire';
import { OwnAccount, type AuthRequest } from '../../../shared/auth';
import { BrowserMutation, PrivateApi } from '../../../shared/auth/openapi';
import { InputPipe } from '../../../shared/auth/validation';
import { RateLimit } from '../../../shared/rate-limit/rate-limit';
import { AdminErrors, adminCommand } from '../../admin/presentation/admin.dto';
import { IdempotencyKey } from '../../businesses/presentation/business.dto';
import { RiderDisputeService } from '../application/rider-dispute.service';
import { RiderProfileService } from '../application/rider-profile.service';
import {
  KEY,
  NOT_ADMITTED,
  RiderDisputeInputDto,
  RiderDisputeResultDto,
  RiderDraftWriteDto,
  RiderProfileDto,
  riderRequest,
} from './rider.dto';

const READ_LIMIT = {
  key: 'delivery.rider.me.read',
  maximumHits: 60,
  windowSeconds: 60,
  subject: 'principal',
} as const;
const WRITE_LIMIT = {
  key: 'delivery.rider.me.write',
  maximumHits: 30,
  windowSeconds: 60,
  subject: 'principal',
} as const;
const DISPUTE_LIMIT = {
  key: 'delivery.rider.dispute',
  maximumHits: 10,
  windowSeconds: 3600,
  subject: 'principal',
} as const;

/** Own rider application and support (F-RD-001, F-RD-008); no rider role needed. */
@ApiTags('delivery')
@PrivateApi()
@OwnAccount()
@Controller('delivery/riders/me')
export class RiderMeController {
  constructor(
    private readonly profiles: RiderProfileService,
    private readonly disputes: RiderDisputeService,
  ) {}

  @Get()
  @ApiOperation({
    operationId: 'riderMe',
    summary: "The caller's rider application/profile",
    description:
      'RiderProfileDTO for the session user in any status. A user with no application receives the empty first draft (version 0, status draft, canEdit). Payout is server-masked only; documents are typed private references. requirements.availability is unavailable until the typed KYC policy (Q-05) and Media private documents ship. private, no-store.',
  })
  @ApiOkResponse({ type: RiderProfileDto })
  @AdminErrors({ 503: NOT_ADMITTED })
  @RateLimit(READ_LIMIT)
  async me(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
  ) {
    return RiderProfileSchema.parse(
      await this.profiles.me(riderRequest(request)),
    );
  }

  @Put()
  @BrowserMutation()
  @IdempotencyKey(KEY)
  @ApiBody({ type: RiderDraftWriteDto })
  @ApiOperation({
    operationId: 'riderSave',
    summary: 'Save the rider application draft / submit',
    description:
      '{expectedVersion (0 for the first draft), step, profile?, vehicle?, payout?, documents?, submit?}. Draft validates supplied steps only; profile.areaId is validated by Geo and implies its city. Editable in draft, rejected and changes_requested. submit=true checks every required field, verified identity and the typed document policy, then moves to pending and emits rider.application_submitted. No role/status/online field is accepted. A rejected submit commits nothing. private, no-store.',
  })
  @ApiOkResponse({ type: RiderProfileDto })
  @AdminErrors({
    400: 'COMMON_VALIDATION_FAILED for invalid/unexpected fields, a city/area mismatch, missing submit fields (details.fields) or a missing/invalid Idempotency-Key.',
    403: 'COMMON_FORBIDDEN without a verified phone at submit.',
    404: 'AREA_NOT_FOUND / CITY_NOT_FOUND for an unknown Geo reference.',
    409: 'DELIVERY_VERSION_CONFLICT for a stale expectedVersion; RIDER_STATE_CONFLICT when pending, approved, suspended or inactive; idempotency conflicts.',
    429: 'COMMON_RATE_LIMITED with Retry-After.',
    503: `RIDER_REQUIREMENTS_UNAVAILABLE (details.field=documents) when documents are attached or submit needs the unconfigured typed KYC policy. ${NOT_ADMITTED}`,
  })
  @RateLimit(WRITE_LIMIT)
  async save(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Body(new InputPipe(RiderDraftWriteSchema)) input: RiderDraftWrite,
  ) {
    return RiderProfileSchema.parse(
      await this.profiles.save(adminCommand(request), input),
    );
  }

  @Post('disputes')
  @HttpCode(200)
  @BrowserMutation()
  @IdempotencyKey(
    'Case-sensitive key; a retry with the same key returns the same support message.',
  )
  @ApiBody({ type: RiderDisputeInputDto })
  @ApiOperation({
    operationId: 'riderDisputeCreate',
    summary: 'Report a rider dispute',
    description:
      '{jobId?, reasonKey, details}. Without jobId the report is delegated to Settings support intake (source rider) and returns the persisted supportMessageId. A jobId must name the caller\'s own assigned/completed job; jobs need Orders, so a supplied jobId is DELIVERY_JOB_NOT_FOUND. details is plain text and never logged. private, no-store.',
  })
  @ApiOkResponse({ type: RiderDisputeResultDto })
  @AdminErrors({
    400: 'COMMON_VALIDATION_FAILED / VALIDATION_ERROR for invalid fields or a missing/invalid Idempotency-Key.',
    404: 'DELIVERY_JOB_NOT_FOUND for a supplied jobId.',
    429: 'COMMON_RATE_LIMITED (also the shared support intake 5/hour limit).',
    503: NOT_ADMITTED,
  })
  @RateLimit(DISPUTE_LIMIT)
  async dispute(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Body(new InputPipe(RiderDisputeInputSchema)) input: RiderDisputeInput,
  ) {
    return RiderDisputeResultSchema.parse(
      await this.disputes.open(adminCommand(request), input),
    );
  }
}
