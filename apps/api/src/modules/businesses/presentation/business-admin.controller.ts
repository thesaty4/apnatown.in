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
  BusinessApplicationPageSchema,
  BusinessApplicationQuerySchema,
  BusinessDecisionResultSchema,
  BusinessDecisionSchema,
  BusinessDocumentListSchema,
  BusinessIdParamsSchema,
  type BusinessApplicationQuery,
  type BusinessDecision,
} from '@apnatown/shared/businesses';
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
import { BusinessAdminReadService } from '../application/business-admin-read.service';
import { BusinessDecisionService } from '../application/business-decision.service';
import {
  BusinessApplicationPageDto,
  BusinessApplicationQueryDto,
  BusinessDecisionDto,
  BusinessDecisionResultDto,
  BusinessDocumentListDto,
  IdempotencyKey,
} from './business.dto';

const READ_LIMIT = {
  key: 'admin.businesses.read',
  maximumHits: 120,
  windowSeconds: 60,
  subject: 'principal',
} as const;
const DECISION_LIMIT = {
  key: 'admin.businesses.decision',
  maximumHits: 60,
  windowSeconds: 60,
  subject: 'principal',
} as const;
const NOT_ADMITTED =
  'MAINTENANCE while maintenance mode is on (admins are not admitted); COMMON_UNAVAILABLE when the store is unavailable.';
const READ_FORBIDDEN =
  'COMMON_FORBIDDEN without approvals:view or without an active assigned scope; ADMIN_INACTIVE for a deactivated admin.';
const SCOPE_DENIED =
  'ADMIN_SCOPE_FORBIDDEN (route guard) or BUSINESS_SCOPE_DENIED (transaction recheck) when the business area is outside the assigned scope (an unresolved area needs super_admin).';

/** Scoped business application review (F-VD-001, F-PV-001, BR-12). */
@ApiTags('admin')
@PrivateApi()
@Roles('admin', 'super_admin')
@Controller('businesses/admin/applications')
export class BusinessAdminController {
  constructor(
    private readonly reads: BusinessAdminReadService,
    private readonly decisions: BusinessDecisionService,
  ) {}

  @Get()
  @Permission('approvals', 'view')
  @ApiQuery({ type: BusinessApplicationQueryDto })
  @ApiOperation({
    operationId: 'adminBusinessApplications',
    summary: 'Scoped business application queue',
    description:
      "Applications whose stored area is inside the caller's assigned city/area scope (super_admin: all), filtered by the allow-listed status (default pending) and optional kind, oldest first with a caller/filter/scope-bound keyset cursor; limit <= 50. Cards carry version and the ST-approval allowedActions; no owner contact or documents. private, no-store.",
  })
  @ApiOkResponse({ type: BusinessApplicationPageDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for an unknown status/kind, invalid limit or a cursor bound to another caller/filter/scope revision.',
    403: READ_FORBIDDEN,
    503: NOT_ADMITTED,
  })
  @RateLimit(READ_LIMIT)
  async list(
    @Req() request: AuthRequest,
    @Query(new InputPipe(BusinessApplicationQuerySchema))
    query: BusinessApplicationQuery,
  ) {
    return BusinessApplicationPageSchema.parse(
      await this.reads.list(adminContext(request), {
        view: 'applications',
        status: query.status,
        ...(query.kind ? { kind: query.kind } : {}),
        ...(query.cursor ? { cursor: query.cursor } : {}),
        limit: query.limit,
      }),
    );
  }

  @Get(':id/documents')
  @Permission('approvals', 'view')
  @Scoped('business.application')
  @ApiParam({ name: 'id', schema: { type: 'string', format: 'uuid' } })
  @ApiOperation({
    operationId: 'adminBusinessApplicationDocuments',
    summary: 'Application document metadata',
    description:
      'Private document metadata (kind, asset ID, upload time) of a submitted application after approvals:view and owning-area scope (rechecked in the transaction). The private view capability is unavailable until Media ships private document storage; never a public URL, storage key or document contents. private, no-store.',
  })
  @ApiOkResponse({ type: BusinessDocumentListDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for an invalid id.',
    403: `${READ_FORBIDDEN} ${SCOPE_DENIED}`,
    404: 'BUSINESS_NOT_FOUND for a missing, deleted or unsubmitted business.',
    503: NOT_ADMITTED,
  })
  @RateLimit(READ_LIMIT)
  async documents(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Param(new InputPipe(BusinessIdParamsSchema)) params: { id: string },
  ) {
    return BusinessDocumentListSchema.parse(
      await this.reads.documents(adminContext(request), params.id),
    );
  }

  @Post(':id/decision')
  @HttpCode(200)
  @Permission('approvals', 'edit')
  @Scoped('business.application')
  @BrowserMutation()
  @IdempotencyKey(
    'Case-sensitive command key. Retry the identical decision within 24 hours to replay the stored result; replay rechecks current admin access.',
  )
  @ApiParam({ name: 'id', schema: { type: 'string', format: 'uuid' } })
  @ApiBody({ type: BusinessDecisionDto })
  @ApiOperation({
    operationId: 'adminBusinessApplicationDecision',
    summary: 'Decide on a business application (ST-approval)',
    description:
      '{action,reason?,expectedVersion}: approve|reject|request_changes from pending; suspend|deactivate from approved; restore from suspended. reject/request_changes require a reason. Requires approvals:edit over the stored area (rechecked in the transaction; super_admin platform-wide); the business owner can never decide on their own business. The status change, the matching vendor/provider role grant (into approved), one audit entry with before/after and the outbox events commit atomically. private, no-store.',
  })
  @ApiOkResponse({ type: BusinessDecisionResultDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for an unknown action, a missing reason or unexpected fields; COMMON_VALIDATION_FAILED for a missing/invalid Idempotency-Key.',
    403: `COMMON_FORBIDDEN without approvals:edit; ADMIN_INACTIVE for a deactivated admin. ${SCOPE_DENIED}`,
    404: 'BUSINESS_NOT_FOUND.',
    409: 'BUSINESS_STATE_CONFLICT when ST-approval does not allow the action from the current status; BUSINESS_VERSION_CONFLICT for a stale expectedVersion; idempotency conflicts.',
    422: 'ADMIN_SELF_ACTION when the caller owns the business.',
    429: 'COMMON_RATE_LIMITED with Retry-After.',
    503: NOT_ADMITTED,
  })
  @RateLimit(DECISION_LIMIT)
  async decide(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Param(new InputPipe(BusinessIdParamsSchema)) params: { id: string },
    @Body(new InputPipe(BusinessDecisionSchema)) input: BusinessDecision,
  ) {
    return BusinessDecisionResultSchema.parse(
      await this.decisions.decide(adminCommand(request), params.id, input),
    );
  }
}
