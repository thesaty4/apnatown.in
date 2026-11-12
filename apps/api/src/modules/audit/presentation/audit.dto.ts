import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import {
  ActivityExportQuerySchema,
  ActivityListQuerySchema,
  AuditEntryDetailSchema,
  AuditListQuerySchema,
  AuditPageSchema,
} from '@apnatown/shared/admin';
import { AuthErrorDto } from '../../../shared/auth/openapi';
import { currentCorrelationId } from '../../../shared/logger/context';

export class AuditListQueryDto extends createZodDto(AuditListQuerySchema) {}
export class ActivityListQueryDto extends createZodDto(
  ActivityListQuerySchema,
) {}
export class ActivityExportQueryDto extends createZodDto(
  ActivityExportQuerySchema,
) {}
export class AuditPageDto extends createZodDto(AuditPageSchema) {}
export class AuditEntryDetailDto extends createZodDto(AuditEntryDetailSchema) {}

/** Documents the flat error envelope for statuses PrivateApi does not list. */
export function AuditErrors(responses: Readonly<Record<number, string>>) {
  return applyDecorators(
    ...Object.entries(responses).map(([status, description]) =>
      ApiResponse({ status: Number(status), type: AuthErrorDto, description }),
    ),
  );
}

export const AUDIT_ID_PARAM = {
  name: 'id',
  schema: { type: 'string', format: 'uuid' },
} as const;
export const AUDIT_READ_LIMIT = {
  maximumHits: 120,
  windowSeconds: 60,
  subject: 'principal',
} as const;
export const FILTER_NOTES =
  'Filters are allow-listed and only narrow results: q is full-text over actor label, action and the redacted summary (plain words); action/entityType are exact keys; actorId is the exact actor user ID (labels never change identity filtering); from/to are inclusive IST calendar dates (YYYY-MM-DD) converted to UTC instants. Ordered occurredAt DESC, id DESC; the opaque cursor is bound to the filters, actor and scope revision. private, no-store.';

export function requireCorrelationId(): string {
  const correlationId = currentCorrelationId();
  if (!correlationId) throw new Error('MISSING_CORRELATION_CONTEXT');
  return correlationId;
}
