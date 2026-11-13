import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  AdminApprovalDetailSchema,
  AdminApprovalPageSchema,
  AdminApprovalParamsSchema,
  AdminApprovalQuerySchema,
  type AdminApprovalParams,
  type AdminApprovalQuery,
} from '@apnatown/shared/admin';
import { PageQuerySchema, type PageQuery } from '@apnatown/shared/wire';
import {
  adminContext,
  Permission,
  Roles,
  Scoped,
  type AuthRequest,
} from '../../../shared/auth';
import { PrivateApi } from '../../../shared/auth/openapi';
import { InputPipe } from '../../../shared/auth/validation';
import { RateLimit } from '../../../shared/rate-limit/rate-limit';
import { AdminApprovalsService } from '../application/admin-approvals.service';
import {
  AdminApprovalDetailDto,
  AdminApprovalPageDto,
  AdminApprovalQueryDto,
  AdminErrors,
  ApprovalHistoryQueryDto,
} from './admin.dto';

const READ_LIMIT = {
  key: 'admin.approvals.read',
  maximumHits: 120,
  windowSeconds: 60,
  subject: 'principal',
} as const;
const NOT_ADMITTED =
  'MAINTENANCE while maintenance mode is on (admins are not admitted); COMMON_UNAVAILABLE when the store is unavailable.';
const READ_FORBIDDEN =
  'COMMON_FORBIDDEN without approvals:view or without an active assigned scope; ADMIN_INACTIVE for a deactivated admin.';

/** S-ADMN-02 approvals queue/detail; decisions go to the owning module. */
@ApiTags('admin')
@PrivateApi()
@Roles('admin', 'super_admin')
@Controller('admin/approvals')
export class AdminApprovalsController {
  constructor(private readonly approvals: AdminApprovalsService) {}

  @Get()
  @Permission('approvals', 'view')
  @ApiQuery({ type: AdminApprovalQueryDto })
  @ApiOperation({
    operationId: 'adminApprovals',
    summary: 'Scoped approvals queue',
    description:
      "type=business (shops) | provider (service providers) | rider (default business) and status=pending|changes_requested|approved|rejected (default pending): applications inside the caller's assigned city/area scope (super_admin: all), oldest first with a caller/filter/scope-bound keyset cursor; limit <= 50. type=rider lists Delivery rider applications (id = rider user ID, nameEn = full name). Decide businesses via POST /businesses/admin/applications/{id}/decision and riders via POST /delivery/admin/riders/{userId}/decision. private, no-store.",
  })
  @ApiOkResponse({ type: AdminApprovalPageDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for an unknown type/status, invalid limit or a cursor bound to another caller/filter/scope revision.',
    403: READ_FORBIDDEN,
    503: NOT_ADMITTED,
  })
  @RateLimit(READ_LIMIT)
  async list(
    @Req() request: AuthRequest,
    @Query(new InputPipe(AdminApprovalQuerySchema)) query: AdminApprovalQuery,
  ) {
    return AdminApprovalPageSchema.parse(
      await this.approvals.list(adminContext(request), query),
    );
  }

  @Get(':type/:id')
  @Permission('approvals', 'view')
  @Scoped('business.application')
  @ApiParam({ name: 'type', schema: { type: 'string', enum: ['business', 'provider'] } })
  @ApiParam({ name: 'id', schema: { type: 'string', format: 'uuid' } })
  @ApiQuery({ type: ApprovalHistoryQueryDto })
  @ApiOperation({
    operationId: 'adminApprovalDetail',
    summary: 'Approval detail with history',
    description:
      'The owning application detail (review fields, version, allowedActions, private document references — asset IDs only, never storage keys, URLs or contents) after approvals:view and the stored-area scope (rechecked in the transaction), plus its approval audit history newest first (cursor/limit page the history). private, no-store.',
  })
  @ApiOkResponse({ type: AdminApprovalDetailDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for an unsupported type, invalid id, limit or history cursor.',
    403: `${READ_FORBIDDEN} ADMIN_SCOPE_FORBIDDEN (route guard) or BUSINESS_SCOPE_DENIED (transaction recheck) outside the assigned scope.`,
    404: 'BUSINESS_NOT_FOUND for a missing, deleted or unsubmitted application, or one whose kind does not match type.',
    503: NOT_ADMITTED,
  })
  @RateLimit(READ_LIMIT)
  async detail(
    @Req() request: AuthRequest,
    @Param(new InputPipe(AdminApprovalParamsSchema)) params: AdminApprovalParams,
    @Query(new InputPipe(PageQuerySchema)) query: PageQuery,
  ) {
    return AdminApprovalDetailSchema.parse(
      await this.approvals.detail(adminContext(request), params, query),
    );
  }
}
