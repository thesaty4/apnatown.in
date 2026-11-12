import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  AdminCardSchema,
  AdminImpactSchema,
  AdminListQuerySchema,
  AdminPageSchema,
  AdminParamsSchema,
  CreateAdminSchema,
  SetAdminAreasSchema,
  SetAdminPermissionsSchema,
  SetAdminRoleSchema,
  SetAdminStatusSchema,
  type AdminListQuery,
  type AdminParams,
  type CreateAdmin,
  type SetAdminAreas,
  type SetAdminPermissions,
  type SetAdminRole,
  type SetAdminStatus,
} from '@apnatown/shared/admin';
import { EmptyRequestSchema } from '@apnatown/shared/wire';
import { adminContext, Roles, type AuthRequest } from '../../../shared/auth';
import { BrowserMutation, PrivateApi } from '../../../shared/auth/openapi';
import { InputPipe } from '../../../shared/auth/validation';
import { RateLimit } from '../../../shared/rate-limit/rate-limit';
import { AdminAccountsService } from '../application/admin-accounts.service';
import {
  AdminCardDto,
  AdminErrors,
  AdminImpactDto,
  AdminListQueryDto,
  AdminPageDto,
  CreateAdminDto,
  IdempotentAdmin,
  SetAdminAreasDto,
  SetAdminPermissionsDto,
  SetAdminRoleDto,
  SetAdminStatusDto,
  adminCommand,
} from './admin.dto';

const ADMIN_ID = { name: 'id', schema: { type: 'string', format: 'uuid' } };
const WRITE_LIMIT = {
  key: 'super-admin.admins.write',
  maximumHits: 30,
  windowSeconds: 60,
  subject: 'principal',
} as const;

@ApiTags('super-admin')
@PrivateApi()
@Roles('super_admin')
@Controller('super-admin/admins')
export class SuperAdminAdminsController {
  constructor(private readonly accounts: AdminAccountsService) {}

  @Get()
  @ApiOperation({
    summary: 'List admin accounts',
    description:
      'super_admin only. q matches display name or an exact verified phone (email is encrypted and not searchable). areaId matches an exact area grant or a whole-city grant of its city; zoneId is mutually exclusive with areaId and is COMMON_UNAVAILABLE until Geo exposes a zone→area mapping. Cards include full contact fields for the management purpose; zones are reported in `unavailable`. Ordered newest first; total counts the filtered set. private, no-store.',
  })
  @ApiQuery({ type: AdminListQueryDto })
  @ApiOkResponse({ type: AdminPageDto })
  @AdminErrors({
    404: 'AREA_NOT_FOUND for an unknown areaId.',
    503: 'COMMON_UNAVAILABLE for zoneId until Geo exposes a zone→area mapping.',
  })
  @RateLimit({
    key: 'super-admin.admins.read',
    maximumHits: 120,
    windowSeconds: 60,
    subject: 'principal',
  })
  async list(
    @Req() request: AuthRequest,
    @Query(new InputPipe(AdminListQuerySchema)) query: AdminListQuery,
  ) {
    return AdminPageSchema.parse(
      await this.accounts.list(adminContext(request), query),
    );
  }

  @Post()
  @BrowserMutation()
  @IdempotentAdmin()
  @ApiBody({ type: CreateAdminDto })
  @ApiOperation({
    summary: 'Create an admin account',
    description:
      'Resolves (or creates) the user by verified phone, stores the email encrypted, seeds module permissions from the role, grants the listed areas and assigns the admin role. Whole-city grants and communication scopes are never granted here. Audited and emits admin.scope_changed.',
  })
  @ApiCreatedResponse({ type: AdminCardDto })
  @AdminErrors({
    404: 'ROLE_NOT_FOUND, AREA_NOT_FOUND, or USER_NOT_FOUND when the phone has no usable verified account.',
    409: 'ADMIN_EXISTS when the user already has an admin account or is super_admin.',
  })
  @RateLimit(WRITE_LIMIT)
  async create(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Body(new InputPipe(CreateAdminSchema)) input: CreateAdmin,
  ) {
    return AdminCardSchema.parse(
      await this.accounts.create(adminCommand(request), input),
    );
  }

  @Get(':id/impact')
  @ApiParam(ADMIN_ID)
  @ApiOperation({
    summary: 'Deactivation impact preview',
    description:
      'Areas of this admin that would be left without another active admin. openCasesInScope is null and listed in `unavailable` until the owning case modules expose a count port.',
  })
  @ApiOkResponse({ type: AdminImpactDto })
  @RateLimit({
    key: 'super-admin.admins.read',
    maximumHits: 120,
    windowSeconds: 60,
    subject: 'principal',
  })
  async impact(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema))
    _query: Record<string, never>,
    @Param(new InputPipe(AdminParamsSchema)) params: AdminParams,
  ) {
    return AdminImpactSchema.parse(
      await this.accounts.impact(adminContext(request), params.id),
    );
  }

  @Post(':id/status')
  @BrowserMutation()
  @IdempotentAdmin()
  @ApiParam(ADMIN_ID)
  @ApiBody({ type: SetAdminStatusDto })
  @ApiOperation({
    summary: 'Activate or deactivate an admin',
    description:
      'expectedVersion is required. Deactivation revokes all of the admin’s sessions in the same transaction and takes effect immediately. A super_admin cannot change their own status. Audited and emits admin.account_status_changed.',
  })
  @ApiOkResponse({ type: AdminCardDto })
  @AdminErrors({
    409: 'ADMIN_VERSION_CONFLICT when expectedVersion is stale.',
    422: 'ADMIN_SELF_ACTION when targeting the caller.',
  })
  @RateLimit(WRITE_LIMIT)
  async setStatus(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Param(new InputPipe(AdminParamsSchema)) params: AdminParams,
    @Body(new InputPipe(SetAdminStatusSchema)) input: SetAdminStatus,
  ) {
    return AdminCardSchema.parse(
      await this.accounts.setStatus(adminCommand(request), params.id, input),
    );
  }

  @Put(':id/areas')
  @BrowserMutation()
  @IdempotentAdmin()
  @ApiParam(ADMIN_ID)
  @ApiBody({ type: SetAdminAreasDto })
  @ApiOperation({
    summary: 'Replace an admin’s area grants',
    description:
      'Replaces exact area grants only; explicit whole-city grants are untouched. Audited and emits admin.scope_changed.',
  })
  @ApiOkResponse({ type: AdminCardDto })
  @AdminErrors({
    404: 'COMMON_NOT_FOUND for an unknown admin; AREA_NOT_FOUND for an unknown area.',
    409: 'ADMIN_VERSION_CONFLICT when expectedVersion is stale.',
  })
  @RateLimit(WRITE_LIMIT)
  async setAreas(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Param(new InputPipe(AdminParamsSchema)) params: AdminParams,
    @Body(new InputPipe(SetAdminAreasSchema)) input: SetAdminAreas,
  ) {
    return AdminCardSchema.parse(
      await this.accounts.setAreas(adminCommand(request), params.id, input),
    );
  }

  @Put(':id/permissions')
  @BrowserMutation()
  @IdempotentAdmin()
  @ApiParam(ADMIN_ID)
  @ApiBody({ type: SetAdminPermissionsDto })
  @ApiOperation({
    summary: 'Replace an admin’s module permissions',
    description:
      'Normalized server-side: any action implies view; removing view clears the module. Audited and emits admin.scope_changed.',
  })
  @ApiOkResponse({ type: AdminCardDto })
  @AdminErrors({
    409: 'ADMIN_VERSION_CONFLICT when expectedVersion is stale.',
  })
  @RateLimit(WRITE_LIMIT)
  async setPermissions(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Param(new InputPipe(AdminParamsSchema)) params: AdminParams,
    @Body(new InputPipe(SetAdminPermissionsSchema))
    input: SetAdminPermissions,
  ) {
    return AdminCardSchema.parse(
      await this.accounts.setPermissions(
        adminCommand(request),
        params.id,
        input,
      ),
    );
  }

  @Put(':id/role')
  @BrowserMutation()
  @IdempotentAdmin()
  @ApiParam(ADMIN_ID)
  @ApiBody({ type: SetAdminRoleDto })
  @ApiOperation({
    summary: 'Assign a role to an admin',
    description:
      'reseedPermissions copies the role’s module permissions only; geography and communication scopes are never expanded. Audited and emits admin.scope_changed.',
  })
  @ApiOkResponse({ type: AdminCardDto })
  @AdminErrors({
    404: 'COMMON_NOT_FOUND for an unknown admin; ROLE_NOT_FOUND for an unknown role.',
    409: 'ADMIN_VERSION_CONFLICT when expectedVersion is stale.',
  })
  @RateLimit(WRITE_LIMIT)
  async setRole(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Param(new InputPipe(AdminParamsSchema)) params: AdminParams,
    @Body(new InputPipe(SetAdminRoleSchema)) input: SetAdminRole,
  ) {
    return AdminCardSchema.parse(
      await this.accounts.setRole(adminCommand(request), params.id, input),
    );
  }
}
