import {
  Controller,
  Get,
  Param,
  Query,
  Req,
  StreamableFile,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Readable } from 'node:stream';
import {
  ActivityExportQuerySchema,
  ActivityListQuerySchema,
  AuditEntryDetailSchema,
  AuditPageSchema,
  AuditParamsSchema,
  type ActivityExportQuery,
  type ActivityListQuery,
  type AuditParams,
} from '@apnatown/shared/admin';
import { EmptyRequestSchema } from '@apnatown/shared/wire';
import { adminContext, Roles, type AuthRequest } from '../../../shared/auth';
import { PrivateApi } from '../../../shared/auth/openapi';
import { InputPipe } from '../../../shared/auth/validation';
import { RateLimit } from '../../../shared/rate-limit/rate-limit';
import { AuditReadService } from '../application/audit-read.service';
import {
  AUDIT_ID_PARAM,
  AUDIT_READ_LIMIT,
  ActivityExportQueryDto,
  ActivityListQueryDto,
  AuditEntryDetailDto,
  AuditErrors,
  AuditPageDto,
  FILTER_NOTES,
  requireCorrelationId,
} from './audit.dto';

const SUPER_ONLY =
  'super_admin only; platform-wide including global/unscoped rows. actorRole narrows by the recorded actor role; actorId is the exact Admin-card shortcut.';

@ApiTags('super-admin')
@PrivateApi()
@Roles('super_admin')
@Controller('super-admin/activity')
export class SuperAdminActivityController {
  constructor(private readonly audit: AuditReadService) {}

  @Get()
  @ApiOperation({
    summary: 'Platform activity monitor',
    description: `${SUPER_ONLY} ${FILTER_NOTES}`,
  })
  @ApiQuery({ type: ActivityListQueryDto })
  @ApiOkResponse({ type: AuditPageDto })
  @AuditErrors({
    400: 'VALIDATION_ERROR for an unknown/invalid filter, from after to, limit above 50, or a cursor issued for other filters or actor.',
    403: 'COMMON_FORBIDDEN for any non-super_admin, including admins.',
  })
  @RateLimit({ key: 'super-admin.activity.read', ...AUDIT_READ_LIMIT })
  async list(
    @Req() request: AuthRequest,
    @Query(new InputPipe(ActivityListQuerySchema)) query: ActivityListQuery,
  ) {
    return AuditPageSchema.parse(
      await this.audit.list(
        adminContext(request),
        'super-admin.activity',
        query,
      ),
    );
  }

  // Declared before `:id` so the literal path is never treated as an ID.
  @Get('export.csv')
  @ApiProduces('text/csv')
  @ApiOperation({
    summary: 'Export platform activity as CSV',
    description: `${SUPER_ONLY} Same filters as the activity list (no cursor/limit), applied identically. Matching rows are counted first; more than 100000 is REPORT_TOO_LARGE. The export is itself audited (audit.exported, with the server-resolved filters and row count) before streaming. Columns: Time (IST), Actor, Role, Action, Entity, Summary, Before, After (redacted JSON). Cells starting with = + - @, tab or CR are prefixed with an apostrophe. Rows are limited to those recorded before the export started. private, no-store.`,
  })
  @ApiQuery({ type: ActivityExportQueryDto })
  @ApiOkResponse({
    description: 'UTF-8 CSV attachment streamed in occurredAt DESC order.',
    content: { 'text/csv': { schema: { type: 'string' } } },
    headers: {
      'Content-Disposition': {
        schema: { type: 'string' },
        description:
          'attachment; filename="apnatown-activity-<YYYY-MM-DD>.csv"',
      },
    },
  })
  @AuditErrors({
    400: 'VALIDATION_ERROR for an unknown/invalid filter or from after to.',
    403: 'COMMON_FORBIDDEN for any non-super_admin, including admins.',
    413: 'REPORT_TOO_LARGE when more than 100000 rows match; narrow the filters.',
  })
  @RateLimit({
    key: 'super-admin.activity.export',
    maximumHits: 10,
    windowSeconds: 3600,
    subject: 'principal',
  })
  async export(
    @Req() request: AuthRequest,
    @Query(new InputPipe(ActivityExportQuerySchema))
    query: ActivityExportQuery,
  ) {
    const file = await this.audit.exportCsv(
      adminContext(request),
      query,
      requireCorrelationId(),
    );
    return new StreamableFile(Readable.from(file.body), {
      type: 'text/csv; charset=utf-8',
      disposition: `attachment; filename="${file.fileName}"`,
    });
  }

  @Get(':id')
  @ApiParam(AUDIT_ID_PARAM)
  @ApiOperation({
    summary: 'Read one activity entry with its diff',
    description: `${SUPER_ONLY} before/after contain only changed allow-listed fields, recursively redacted at write time. private, no-store.`,
  })
  @ApiOkResponse({ type: AuditEntryDetailDto })
  @AuditErrors({
    403: 'COMMON_FORBIDDEN for any non-super_admin, including admins.',
    404: 'AUDIT_NOT_FOUND for a missing entry.',
  })
  @RateLimit({ key: 'super-admin.activity.read', ...AUDIT_READ_LIMIT })
  async detail(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Param(new InputPipe(AuditParamsSchema)) params: AuditParams,
  ) {
    return AuditEntryDetailSchema.parse(
      await this.audit.detail(
        adminContext(request),
        'super-admin.activity',
        params.id,
      ),
    );
  }
}
