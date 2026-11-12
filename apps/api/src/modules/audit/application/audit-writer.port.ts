import type { JsonValue } from '@apnatown/shared';
import type { ScopeRef } from '@apnatown/shared/admin';
import type { TxContext } from '../../../shared/persistence/ports';

export const AUDIT_WRITER = Symbol('AUDIT_WRITER');
export type AuditActorRole =
  | 'customer'
  | 'vendor'
  | 'provider'
  | 'rider'
  | 'admin'
  | 'super_admin'
  | 'system';
export interface AuditActor {
  /** `null` only for the `system` actor. */
  readonly userId: string | null;
  readonly role: AuditActorRole;
  /** Purpose-limited display label; redacted and bounded before storage. */
  readonly label: string;
}
export type AuditSnapshot = Readonly<Record<string, JsonValue>>;
export interface AuditEntry {
  readonly actor: AuditActor;
  /** Dotted key, e.g. `admin.status_changed`. */
  readonly action: string;
  readonly entityType: string;
  readonly entityId?: string | null;
  /** Server-resolved from the owning record, never from request claims. */
  readonly cityId?: string | null;
  readonly areaId?: string | null;
  readonly relatedScopes?: readonly ScopeRef[];
  readonly summary: string;
  readonly before?: AuditSnapshot | null;
  readonly after?: AuditSnapshot | null;
  /** Allow-list of top-level snapshot fields that may appear in the diff. */
  readonly fields: readonly string[];
  readonly correlationId: string;
}
export interface AuditWriter {
  /**
   * Appends one entry inside the caller's transaction; an insert failure
   * propagates so the caller's action rolls back. Stores only changed
   * allow-listed fields, recursively redacted.
   */
  record(tx: TxContext, entry: AuditEntry): Promise<void>;
}
