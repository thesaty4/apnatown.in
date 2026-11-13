import type { JsonValue } from '@apnatown/shared';
import type { ScopeRef } from '@apnatown/shared/admin';
import type { TxContext } from '../../../shared/persistence/ports';
import type { AuditActorRole } from '../application/audit-writer.port';

export const AUDIT_LOG_REPOSITORY = Symbol('AUDIT_LOG_REPOSITORY');
export interface AuditLogRow {
  id: string;
  occurredAt: Date;
  actorUserId: string | null;
  actorRole: AuditActorRole;
  actorLabel: string;
  action: string;
  entityType: string;
  entityId: string | null;
  cityId: string | null;
  areaId: string | null;
  relatedScopes: readonly ScopeRef[];
  summary: string;
  before: Record<string, JsonValue> | null;
  after: Record<string, JsonValue> | null;
  correlationId: string;
}
/** Append-only: no update/delete methods exist by design. */
export interface AuditLogRepository {
  insert(tx: TxContext, row: AuditLogRow): Promise<void>;
}
