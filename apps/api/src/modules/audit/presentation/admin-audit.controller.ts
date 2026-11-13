import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  AuditEntryDetailSchema,
  AuditListQuerySchema,
  AuditPageSchema,
  AuditParamsSchema,
  type AuditListQuery,
  type AuditParams,
} from '@apnatown/shared/admin';
import { EmptyRequestSchema } from '@apnatown/shared/wire';
import {
  adminContext,
  Permission,
  Roles,
  type AuthRequest,
} from '../../../shared/auth';
import { PrivateApi } from '../../../shared/auth/openapi';
import { InputPipe } from '../../../shared/auth/validation';
import { RateLimit } from '../../../shared/rate-limit/rate-limit';
import { AuditReadService } from '../application/audit-read.service';
import {
  AUDIT_ID_PARAM,
  AUDIT_READ_LIMIT,
  AuditEntryDetailDto,
  AuditErrors,
  AuditListQueryDto,
  AuditPageDto,
  FILTER_NOTES,
} from './audit.dto';

const SCOPE_NOTES =
  'Requires an active admin with reports:view (super_admin sees everything). A row is visible only when its own scope and every related scope pass: an exact area grant admits only that area, a city-only row needs an explicit whole-city grant, and global/unscoped rows are super_admin only.';

@ApiTags('admin')
@PrivateApi()
@Roles('admin', 'super_admin')
@Permission('reports', 'view')
@Controller('admin/audit')
export class AdminAuditController {
  constructor(private readonly audit: AuditReadService) {}

  @Get()
  @ApiOperation({
    summary: 'Search the scoped audit trail',
    description: `${SCOPE_NOTES} Scope filtering runs before search, ordering and pagination; cityId/areaId only narrow within that scope. ${FILTER_NOTES}`,
  })
  @ApiQuery({ type: AuditListQueryDto })
  @ApiOkResponse({ type: AuditPageDto })
  @AuditErrors({
    400: 'VALIDATION_ERROR for an unknown/invalid filter, from after to, limit above 50, or a cursor issued for other filters, actor or grants.',
    403: 'COMMON_FORBIDDEN without reports:view (even for the caller’s own actions); ADMIN_INACTIVE for a deactivated admin.',
  })
  @RateLimit({ key: 'admin.audit.read', ...AUDIT_READ_LIMIT })
  async list(
    @Req() request: AuthRequest,
    @Query(new InputPipe(AuditListQuerySchema)) query: AuditListQuery,
  ) {
    return AuditPageSchema.parse(
      await this.audit.list(adminContext(request), 'admin.audit', query),
    );
  }

  @Get(':id')
  @ApiParam(AUDIT_ID_PARAM)
  @ApiOperation({
    summary: 'Read one scoped audit entry with its diff',
    description: `${SCOPE_NOTES} before/after contain only changed allow-listed fields, recursively redacted at write time. private, no-store.`,
  })
  @ApiOkResponse({ type: AuditEntryDetailDto })
  @AuditErrors({
    403: 'COMMON_FORBIDDEN without reports:view; ADMIN_INACTIVE for a deactivated admin.',
    404: 'AUDIT_NOT_FOUND for a missing entry or one outside the caller’s scope (indistinguishable).',
  })
  @RateLimit({ key: 'admin.audit.read', ...AUDIT_READ_LIMIT })
  async detail(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Param(new InputPipe(AuditParamsSchema)) params: AuditParams,
  ) {
    return AuditEntryDetailSchema.parse(
      await this.audit.detail(adminContext(request), 'admin.audit', params.id),
    );
  }
}
