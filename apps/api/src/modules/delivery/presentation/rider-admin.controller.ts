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
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  RiderApplicationPageSchema,
  RiderApplicationQuerySchema,
  RiderDecisionResultSchema,
  RiderDecisionSchema,
  RiderUserParamsSchema,
  type RiderApplicationQuery,
  type RiderDecision,
} from '@apnatown/shared/delivery';
import { EmptyRequestSchema } from '@apnatown/shared/wire';
import {
  adminContext,
  Permission,
  Roles,
  Scoped,
  type AuthRequest,
} from '../../../shared/auth';
import { BrowserMutation, PrivateApi } from '../../../shared/auth/openapi';
import { InputPipe } from '../../../shared/auth/validation';
import { RateLimit } from '../../../shared/rate-limit/rate-limit';
import { AdminErrors, adminCommand } from '../../admin/presentation/admin.dto';
import { IdempotencyKey } from '../../businesses/presentation/business.dto';
import {
  RIDER_APPLICATION_SCOPE,
  RiderAdminReadService,
} from '../application/rider-admin-read.service';
import { RiderDecisionService } from '../application/rider-decision.service';
import {
  RiderApplicationPageDto,
  RiderApplicationQueryDto,
  RiderDecisionDto,
  RiderDecisionResultDto,
} from './rider.dto';

const READ_LIMIT = {
  key: 'admin.riders.read',
  maximumHits: 120,
  windowSeconds: 60,
  subject: 'principal',
} as const;
const DECISION_LIMIT = {
  key: 'admin.riders.decision',
  maximumHits: 60,
  windowSeconds: 60,
  subject: 'principal',
} as const;
const NOT_ADMITTED =
  'MAINTENANCE while maintenance mode is on (admins are not admitted); COMMON_UNAVAILABLE when the store is unavailable.';
const READ_FORBIDDEN =
  'COMMON_FORBIDDEN without approvals:view or without an active assigned scope; ADMIN_INACTIVE for a deactivated admin.';

/** Scoped rider application review (F-AD-002, S-ADMN-02, BR-12). */
@ApiTags('admin')
@PrivateApi()
@Roles('admin', 'super_admin')
@Controller('delivery/admin/riders')
export class RiderAdminController {
  constructor(
    private readonly reads: RiderAdminReadService,
    private readonly decisions: RiderDecisionService,
  ) {}

  @Get('applications')
  @Permission('approvals', 'view')
  @ApiQuery({ type: RiderApplicationQueryDto })
  @ApiOperation({
    operationId: 'adminRiderApplications',
    summary: 'Scoped rider application queue',
    description:
      "Submitted rider applications whose validated city/area is inside the caller's assigned scope (super_admin: all), filtered by the allow-listed status (default pending), oldest first with a caller/filter/scope-bound keyset cursor; limit <= 50. Cards carry version and ST-approval allowedActions; never phone, KYC or payout. private, no-store.",
  })
  @ApiOkResponse({ type: RiderApplicationPageDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for an unknown status, invalid limit or a cursor bound to another caller/filter/scope revision.',
    403: READ_FORBIDDEN,
    503: NOT_ADMITTED,
  })
  @RateLimit(READ_LIMIT)
  async list(
    @Req() request: AuthRequest,
    @Query(new InputPipe(RiderApplicationQuerySchema))
    query: RiderApplicationQuery,
  ) {
    return RiderApplicationPageSchema.parse(
      await this.reads.list(adminContext(request), query),
    );
  }

  @Post(':userId/decision')
  @HttpCode(200)
  @Permission('approvals', 'edit')
  @Scoped(RIDER_APPLICATION_SCOPE, 'userId')
  @BrowserMutation()
  @IdempotencyKey(
    'Case-sensitive command key. Retry the identical decision within 24 hours to replay the stored result; replay rechecks current admin access.',
  )
  @ApiParam({ name: 'userId', schema: { type: 'string', format: 'uuid' } })
  @ApiBody({ type: RiderDecisionDto })
  @ApiOperation({
    operationId: 'adminRiderDecision',
    summary: 'Decide on a rider application (ST-approval)',
    description:
      '{action,reason?,expectedVersion}: approve|reject|request_changes from pending; suspend from approved (forces offline); restore from suspended. reject/request_changes require a reason. Requires approvals:edit over the application city/area (rechecked in the transaction; super_admin platform-wide); an admin never decides their own application. Status, the Users rider role grant (into approved), one audit entry and rider.application_decided commit atomically. private, no-store.',
  })
  @ApiOkResponse({ type: RiderDecisionResultDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for an unknown action, a missing reason or unexpected fields; COMMON_VALIDATION_FAILED for a missing/invalid Idempotency-Key.',
    403: 'COMMON_FORBIDDEN without approvals:edit; ADMIN_INACTIVE for a deactivated admin; ADMIN_SCOPE_FORBIDDEN outside the application city/area.',
    404: 'COMMON_NOT_FOUND for a missing or draft application.',
    409: 'RIDER_STATE_CONFLICT when ST-approval does not allow the action; DELIVERY_VERSION_CONFLICT for a stale expectedVersion; idempotency conflicts.',
    422: 'ADMIN_SELF_ACTION when the caller is the applicant.',
    429: 'COMMON_RATE_LIMITED with Retry-After.',
    503: NOT_ADMITTED,
  })
  @RateLimit(DECISION_LIMIT)
  async decide(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Param(new InputPipe(RiderUserParamsSchema)) params: { userId: string },
    @Body(new InputPipe(RiderDecisionSchema)) input: RiderDecision,
  ) {
    return RiderDecisionResultSchema.parse(
      await this.decisions.decide(adminCommand(request), params.userId, input),
    );
  }
}
