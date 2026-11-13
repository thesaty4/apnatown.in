import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
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
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  CreateRoleSchema,
  DeleteRoleQuerySchema,
  RoleDeletedSchema,
  RoleListQuerySchema,
  RolePageSchema,
  RoleParamsSchema,
  RoleSchema,
  RoleUpdateResultSchema,
  UpdateRoleSchema,
  type CreateRole,
  type DeleteRoleQuery,
  type RoleParams,
  type UpdateRole,
} from '@apnatown/shared/admin';
import { EmptyRequestSchema, type PageQuery } from '@apnatown/shared/wire';
import { adminContext, Roles, type AuthRequest } from '../../../shared/auth';
import { BrowserMutation, PrivateApi } from '../../../shared/auth/openapi';
import { InputPipe } from '../../../shared/auth/validation';
import { RateLimit } from '../../../shared/rate-limit/rate-limit';
import { RolesService } from '../application/roles.service';
import {
  AdminErrors,
  CreateRoleDto,
  DeleteRoleQueryDto,
  EmptyBodyDto,
  IdempotentAdmin,
  RoleDeletedDto,
  RoleDto,
  RoleListQueryDto,
  RolePageDto,
  RoleUpdateResultDto,
  UpdateRoleDto,
  adminCommand,
} from './admin.dto';
import { MaintenanceAdmission } from '../../../shared/maintenance/admission';

const ROLE_ID = { name: 'id', schema: { type: 'string', format: 'uuid' } };
const WRITE_LIMIT = {
  key: 'super-admin.roles.write',
  maximumHits: 30,
  windowSeconds: 60,
  subject: 'principal',
} as const;

@ApiTags('super-admin')
@PrivateApi()
@Roles('super_admin')
@MaintenanceAdmission('super')
@Controller('super-admin/roles')
export class SuperAdminRolesController {
  constructor(private readonly roles: RolesService) {}

  @Get()
  @ApiOperation({
    summary: 'List roles',
    description:
      'super_admin only. Ordered by name; each role includes adminCount and isSystem. private, no-store.',
  })
  @ApiQuery({ type: RoleListQueryDto })
  @ApiOkResponse({ type: RolePageDto })
  @RateLimit({
    key: 'super-admin.roles.read',
    maximumHits: 120,
    windowSeconds: 60,
    subject: 'principal',
  })
  async list(
    @Req() request: AuthRequest,
    @Query(new InputPipe(RoleListQuerySchema)) query: PageQuery,
  ) {
    return RolePageSchema.parse(
      await this.roles.list(adminContext(request), query),
    );
  }

  @Post()
  @BrowserMutation()
  @IdempotentAdmin()
  @ApiBody({ type: CreateRoleDto })
  @ApiOperation({
    summary: 'Create a role',
    description:
      'Role names are unique case-insensitively. Permissions are normalized (any action implies view). Roles only seed new or reseeded admin permissions; they never grant geography or communication scopes. Audited and emits role.updated.',
  })
  @ApiCreatedResponse({ type: RoleDto })
  @AdminErrors({ 409: 'ROLE_NAME_TAKEN when the name is in use.' })
  @RateLimit(WRITE_LIMIT)
  async create(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Body(new InputPipe(CreateRoleSchema)) input: CreateRole,
  ) {
    return RoleSchema.parse(
      await this.roles.create(adminCommand(request), input),
    );
  }

  @Patch(':id')
  @BrowserMutation()
  @IdempotentAdmin()
  @ApiParam(ROLE_ID)
  @ApiBody({ type: UpdateRoleDto })
  @ApiOperation({
    summary: 'Edit a role',
    description:
      'Supply at least one of name, description, permissions plus expectedVersion. System roles are locked. Existing admins keep their own permissions. Returns the role with a before/after summary. Audited and emits role.updated.',
  })
  @ApiOkResponse({ type: RoleUpdateResultDto })
  @AdminErrors({
    404: 'ROLE_NOT_FOUND.',
    409: 'ROLE_SYSTEM_LOCKED, ROLE_VERSION_CONFLICT or ROLE_NAME_TAKEN.',
  })
  @RateLimit(WRITE_LIMIT)
  async update(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Param(new InputPipe(RoleParamsSchema)) params: RoleParams,
    @Body(new InputPipe(UpdateRoleSchema)) input: UpdateRole,
  ) {
    return RoleUpdateResultSchema.parse(
      await this.roles.update(adminCommand(request), params.id, input),
    );
  }

  @Post(':id/duplicate')
  @BrowserMutation()
  @IdempotentAdmin()
  @ApiParam(ROLE_ID)
  @ApiBody({ type: EmptyBodyDto, required: false })
  @ApiOperation({
    summary: 'Duplicate a role',
    description:
      'Creates a non-system role named "Copy of <name>" (truncated to 40 characters) with the same description and permissions. Audited and emits role.updated.',
  })
  @ApiCreatedResponse({ type: RoleDto })
  @AdminErrors({
    404: 'ROLE_NOT_FOUND.',
    409: 'ROLE_NAME_TAKEN when the copy name is in use; rename the existing copy first.',
  })
  @RateLimit(WRITE_LIMIT)
  async duplicate(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Param(new InputPipe(RoleParamsSchema)) params: RoleParams,
    @Body(new InputPipe(EmptyRequestSchema.default({})))
    _input: Record<string, never>,
  ) {
    return RoleSchema.parse(
      await this.roles.duplicate(adminCommand(request), params.id),
    );
  }

  @Delete(':id')
  @BrowserMutation()
  @IdempotentAdmin()
  @ApiParam(ROLE_ID)
  @ApiQuery({ type: DeleteRoleQueryDto })
  @ApiOperation({
    summary: 'Delete a role',
    description:
      'System roles are locked. A role in use requires reassignTo naming a different existing role; usage is re-checked under lock and reassignment plus deletion are atomic. Each moved admin emits admin.scope_changed; the deletion is audited and emits role.updated.',
  })
  @ApiOkResponse({ type: RoleDeletedDto })
  @AdminErrors({
    404: 'ROLE_NOT_FOUND for the role or reassignTo.',
    409: 'ROLE_SYSTEM_LOCKED, or ROLE_IN_USE when reassignTo is missing or equal to the role.',
  })
  @RateLimit(WRITE_LIMIT)
  async delete(
    @Req() request: AuthRequest,
    @Query(new InputPipe(DeleteRoleQuerySchema)) query: DeleteRoleQuery,
    @Param(new InputPipe(RoleParamsSchema)) params: RoleParams,
  ) {
    return RoleDeletedSchema.parse(
      await this.roles.delete(adminCommand(request), params.id, query),
    );
  }
}
