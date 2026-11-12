import { applyDecorators } from '@nestjs/common';
import { ApiHeader, ApiResponse } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import {
  AdminCardSchema,
  AdminImpactSchema,
  AdminListQuerySchema,
  AdminMeSchema,
  AdminPageSchema,
  CreateAdminSchema,
  CreateRoleSchema,
  DeleteRoleQuerySchema,
  RoleDeletedSchema,
  RoleListQuerySchema,
  RolePageSchema,
  RoleSchema,
  RoleUpdateResultSchema,
  SetAdminAreasSchema,
  SetAdminPermissionsSchema,
  SetAdminRoleSchema,
  SetAdminStatusSchema,
  UpdateRoleSchema,
} from '@apnatown/shared/admin';
import { EmptyRequestSchema } from '@apnatown/shared/wire';
import { AuthErrorDto } from '../../../shared/auth/openapi';
import { DomainError } from '../../../shared/errors/errors';
import { currentCorrelationId } from '../../../shared/logger/context';
import { sessionBinding, type AuthRequest } from '../../../shared/auth';
import type { AdminCommand } from '../application/admin-command';

export class AdminMeDto extends createZodDto(AdminMeSchema) {}
export class AdminCardDto extends createZodDto(AdminCardSchema) {}
export class AdminPageDto extends createZodDto(AdminPageSchema) {}
export class AdminListQueryDto extends createZodDto(AdminListQuerySchema) {}
export class CreateAdminDto extends createZodDto(CreateAdminSchema) {}
export class AdminImpactDto extends createZodDto(AdminImpactSchema) {}
export class SetAdminStatusDto extends createZodDto(SetAdminStatusSchema) {}
export class SetAdminAreasDto extends createZodDto(SetAdminAreasSchema) {}
export class SetAdminPermissionsDto extends createZodDto(
  SetAdminPermissionsSchema,
) {}
export class SetAdminRoleDto extends createZodDto(SetAdminRoleSchema) {}
export class RoleDto extends createZodDto(RoleSchema) {}
export class RolePageDto extends createZodDto(RolePageSchema) {}
export class RoleListQueryDto extends createZodDto(RoleListQuerySchema) {}
export class CreateRoleDto extends createZodDto(CreateRoleSchema) {}
export class UpdateRoleDto extends createZodDto(UpdateRoleSchema) {}
export class RoleUpdateResultDto extends createZodDto(RoleUpdateResultSchema) {}
export class DeleteRoleQueryDto extends createZodDto(DeleteRoleQuerySchema) {}
export class RoleDeletedDto extends createZodDto(RoleDeletedSchema) {}
export class EmptyBodyDto extends createZodDto(EmptyRequestSchema) {}

/** Documents the flat error envelope for statuses PrivateApi does not list. */
export function AdminErrors(responses: Readonly<Record<number, string>>) {
  return applyDecorators(
    ...Object.entries(responses).map(([status, description]) =>
      ApiResponse({ status: Number(status), type: AuthErrorDto, description }),
    ),
  );
}

export function IdempotentAdmin() {
  return ApiHeader({
    name: 'Idempotency-Key',
    required: true,
    description:
      'Case-sensitive command key. Retry the identical command within 24 hours; replay rechecks current super_admin access and returns the current state.',
    schema: {
      type: 'string',
      minLength: 1,
      maxLength: 128,
      pattern: '^[A-Za-z0-9._:-]+$',
    },
  });
}

export function adminCommand(request: AuthRequest): AdminCommand {
  const correlationId = currentCorrelationId();
  if (!request.principal) throw new DomainError('SESSION_EXPIRED');
  if (!correlationId) throw new Error('MISSING_CORRELATION_CONTEXT');
  return {
    session: sessionBinding(request),
    actorId: request.principal.userId,
    correlationId,
    key: request.headers['idempotency-key'],
  };
}
