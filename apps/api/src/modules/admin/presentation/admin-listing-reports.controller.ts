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
  ApiAcceptedResponse,
  ApiBody,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import {
  AdminListingReportParamsSchema,
  AdminListingReportQuerySchema,
  AdminListingReportResolutionSchema,
  ListingReportAcceptedSchema,
  ListingReportCreateSchema,
  type AdminListingReportQuery,
  type AdminListingReportResolution,
  type ListingReportCreate,
} from '@apnatown/shared/admin';
import { EmptyRequestSchema } from '@apnatown/shared/wire';
import {
  adminContext,
  Permission,
  Roles,
  SessionRoute,
  sessionBinding,
  type AuthRequest,
} from '../../../shared/auth';
import { BrowserMutation, PrivateApi } from '../../../shared/auth/openapi';
import { InputPipe } from '../../../shared/auth/validation';
import { currentCorrelationId } from '../../../shared/logger/context';
import { RateLimit } from '../../../shared/rate-limit/rate-limit';
import { AdminListingReportsService } from '../application/admin-listing-reports.service';
import {
  LISTING_REPORT_LIMIT,
  ListingReportIntakeService,
} from '../application/listing-report-intake.service';
import { AdminErrors, adminCommand } from './admin.dto';
import {
  AdminListingReportDto,
  AdminListingReportPageDto,
  AdminListingReportQueryDto,
  AdminListingReportResolutionDto,
  CATALOG_READ_FORBIDDEN,
  listingCommandKey,
  ListingReportAcceptedDto,
  ListingReportCreateDto,
  NOT_ADMITTED,
  READ_LIMIT,
  WRITE_LIMIT,
} from './admin-listings.dto';

const ID_PARAM = {
  name: 'id',
  schema: { type: 'string', format: 'uuid' },
} as const;

/** Public listing report intake (F-PF-007); guest or signed-in. */
@ApiTags('listing-reports')
@Controller('listing-reports')
export class ListingReportsController {
  constructor(private readonly intake: ListingReportIntakeService) {}

  @Post()
  @HttpCode(202)
  @SessionRoute()
  @BrowserMutation()
  @ApiSecurity('sessionCookie')
  @ApiHeader({
    name: 'Idempotency-Key',
    required: true,
    description:
      'Case-sensitive key; retry the identical report within 24 hours to replay the accepted result.',
    schema: {
      type: 'string',
      minLength: 1,
      maxLength: 128,
      pattern: '^[A-Za-z0-9._:-]+$',
    },
  })
  @ApiBody({ type: ListingReportCreateDto })
  @ApiOperation({
    operationId: 'listingReportCreate',
    summary: 'Report a listing',
    description:
      'Guest (anonymous browser session) or signed-in user reports a live, publicly visible business/provider listing. The reporter subject is derived server-side (keyed hash), never from the body; details are stored as inert plain text. One open report per reporter and listing: a repeat returns the same reportId. Limited to 5 per hour per user/anonymous session and per network address. Blocked with MAINTENANCE while maintenance mode is on.',
  })
  @ApiAcceptedResponse({ type: ListingReportAcceptedDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for an unknown target type/reason, oversized or control-character details or unexpected fields; COMMON_VALIDATION_FAILED for a missing/invalid Idempotency-Key.',
    403: 'CSRF_INVALID for a missing session, Origin or CSRF token.',
    404: 'COMMON_NOT_FOUND for a missing, hidden or non-public listing.',
    409: 'Idempotency-Key reused with a different report, or the original request is still in progress; COMMON_CONFLICT on a concurrent duplicate (retry).',
    429: 'COMMON_RATE_LIMITED with Retry-After.',
    503: 'MAINTENANCE with Retry-After while maintenance mode is on; COMMON_UNAVAILABLE when the store is unavailable.',
  })
  @RateLimit(
    { ...LISTING_REPORT_LIMIT, subject: 'session' },
    {
      ...LISTING_REPORT_LIMIT,
      key: 'listing-reports.intake.ip',
      subject: 'ip',
    },
  )
  async create(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Body(new InputPipe(ListingReportCreateSchema)) input: ListingReportCreate,
  ) {
    const correlationId = currentCorrelationId();
    if (!correlationId) throw new Error('MISSING_CORRELATION_CONTEXT');
    return ListingReportAcceptedSchema.parse(
      await this.intake.submit(
        {
          session: sessionBinding(request),
          principalId: request.principal?.userId ?? null,
          correlationId,
          key: request.headers['idempotency-key'],
        },
        input,
      ),
    );
  }
}

/** Scoped listing report queue (F-PF-007, S-ADMN-03); reporter masked. */
@ApiTags('admin')
@PrivateApi()
@Roles('admin', 'super_admin')
@Controller('admin/listing-reports')
export class AdminListingReportsController {
  constructor(private readonly reports: AdminListingReportsService) {}

  @Get()
  @Permission('catalog', 'view')
  @ApiQuery({ type: AdminListingReportQueryDto })
  @ApiOperation({
    operationId: 'adminListingReports',
    summary: 'Listing reports (admin)',
    description:
      'Reports inside the caller catalog:view scope (super_admin platform-wide), newest first (keyset); status defaults to open; optional targetId. Reporter is masked (account|guest); the subject hash is never returned. private, no-store.',
  })
  @ApiOkResponse({ type: AdminListingReportPageDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for a bad status/targetId/limit, a tampered or foreign cursor, or unexpected fields.',
    403: CATALOG_READ_FORBIDDEN,
    429: 'COMMON_RATE_LIMITED with Retry-After.',
    503: NOT_ADMITTED,
  })
  @RateLimit(READ_LIMIT)
  async list(
    @Req() request: AuthRequest,
    @Query(new InputPipe(AdminListingReportQuerySchema))
    query: AdminListingReportQuery,
  ) {
    return this.reports.list(adminContext(request), {
      status: query.status,
      ...(query.targetId ? { targetId: query.targetId } : {}),
      ...(query.cursor ? { cursor: query.cursor } : {}),
      limit: query.limit,
    });
  }

  @Get(':id')
  @Permission('catalog', 'view')
  @ApiParam(ID_PARAM)
  @ApiOperation({
    operationId: 'adminListingReportDetail',
    summary: 'Listing report detail (admin)',
    description:
      'One report after catalog:view over its stored listing area (checked in the transaction). Reporter masked; details returned as inert text. private, no-store.',
  })
  @ApiOkResponse({ type: AdminListingReportDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for a bad id or unexpected query fields.',
    403: CATALOG_READ_FORBIDDEN,
    404: 'COMMON_NOT_FOUND for a missing report or one outside the caller scope.',
    429: 'COMMON_RATE_LIMITED with Retry-After.',
    503: NOT_ADMITTED,
  })
  @RateLimit(READ_LIMIT)
  async detail(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Param(new InputPipe(AdminListingReportParamsSchema))
    params: { id: string },
  ) {
    return this.reports.detail(adminContext(request), params.id);
  }

  @Post(':id/resolution')
  @HttpCode(200)
  @Permission('catalog', 'edit')
  @BrowserMutation()
  @listingCommandKey()
  @ApiParam(ID_PARAM)
  @ApiBody({ type: AdminListingReportResolutionDto })
  @ApiOperation({
    operationId: 'adminListingReportResolve',
    summary: 'Resolve a listing report (admin)',
    description:
      '{resolution, note?, expectedVersion} on an open report. catalog:edit over the stored listing area rechecked in the transaction; never on a report about a listing the caller owns. Resolution and audit before/after commit atomically. Listing changes are separate listing commands. private, no-store.',
  })
  @ApiOkResponse({ type: AdminListingReportDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for a bad body or unexpected fields; COMMON_VALIDATION_FAILED for a missing/invalid Idempotency-Key.',
    403: 'COMMON_FORBIDDEN without catalog:edit; ADMIN_INACTIVE for a deactivated admin.',
    404: 'COMMON_NOT_FOUND for a missing report or one outside the caller scope.',
    409: 'ADMIN_VERSION_CONFLICT for a stale expectedVersion or an already resolved report; idempotency conflicts.',
    422: 'ADMIN_SELF_ACTION when the caller owns the reported listing.',
    429: 'COMMON_RATE_LIMITED with Retry-After.',
    503: NOT_ADMITTED,
  })
  @RateLimit(WRITE_LIMIT)
  async resolve(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Param(new InputPipe(AdminListingReportParamsSchema))
    params: { id: string },
    @Body(new InputPipe(AdminListingReportResolutionSchema))
    input: AdminListingReportResolution,
  ) {
    return this.reports.resolve(adminCommand(request), params.id, input);
  }
}
