import type { JsonValue } from '@apnatown/shared';
import type { AuditActorRole } from '@apnatown/shared/admin';
import type { TxContext } from '../../../shared/persistence/ports';

export const AUDIT_READ_REPOSITORY = Symbol('AUDIT_READ_REPOSITORY');

/** Server-derived read authority (from AdminReadContext, never the request). */
export interface AuditReadScope {
  readonly platformWide: boolean;
  readonly cityWideIds: readonly string[];
  readonly areaIds: readonly string[];
}
/** Allow-listed filters; dates are resolved UTC instants (`to` exclusive). */
export interface AuditFilters {
  readonly q?: string | undefined;
  readonly action?: string | undefined;
  readonly entityType?: string | undefined;
  readonly actorId?: string | undefined;
  readonly actorRole?: AuditActorRole | undefined;
  readonly cityId?: string | undefined;
  readonly areaId?: string | undefined;
  readonly from?: Date | undefined;
  readonly to?: Date | undefined;
}
export interface AuditPosition {
  /** Microsecond-precision UTC ISO timestamp. */
  readonly occurredAt: string;
  readonly id: string;
}
export interface AuditSummaryRow {
  id: string;
  occurredAt: string;
  actorUserId: string | null;
  actorLabel: string;
  actorRole: AuditActorRole;
  action: string;
  summary: string;
  entityType: string;
  entityId: string | null;
  hasDiff: boolean;
}
export interface AuditDetailRow extends AuditSummaryRow {
  cityId: string | null;
  areaId: string | null;
  before: Record<string, JsonValue> | null;
  after: Record<string, JsonValue> | null;
}
/**
 * Read side of the append-only trail. Every query applies the area-aware
 * scope predicate (row scope and every related scope) before ordering,
 * search, keyset pagination and counts.
 */
export interface AuditReadRepository {
  /** Up to `limit` rows ordered `occurred_at DESC, id DESC`. */
  page(
    tx: TxContext,
    scope: AuditReadScope,
    filters: AuditFilters,
    limit: number,
    after?: AuditPosition,
  ): Promise<AuditSummaryRow[]>;
  /** Same ordering with redacted diffs, for export batches. */
  pageDetailed(
    tx: TxContext,
    scope: AuditReadScope,
    filters: AuditFilters,
    limit: number,
    after?: AuditPosition,
  ): Promise<AuditDetailRow[]>;
  /** `null` when missing or outside the scope (no existence leak). */
  find(
    tx: TxContext,
    scope: AuditReadScope,
    id: string,
  ): Promise<AuditDetailRow | null>;
  /** Counts at most `cap + 1` matching rows. */
  countUpTo(
    tx: TxContext,
    scope: AuditReadScope,
    filters: AuditFilters,
    cap: number,
  ): Promise<number>;
}
