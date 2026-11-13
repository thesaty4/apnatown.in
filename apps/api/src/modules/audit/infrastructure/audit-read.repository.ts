import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../shared/persistence/generated/client';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import type { TxContext } from '../../../shared/persistence/ports';
import type {
  AuditDetailRow,
  AuditFilters,
  AuditPosition,
  AuditReadRepository,
  AuditReadScope,
  AuditSummaryRow,
} from '../domain/audit-read';

const summaryColumns = Prisma.sql`
  l.id, to_char(l.occurred_at AT TIME ZONE 'UTC',
    'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS "occurredAt",
  l.actor_user_id AS "actorUserId", l.actor_label AS "actorLabel",
  l.actor_role AS "actorRole", l.action, l.summary,
  l.entity_type AS "entityType", l.entity_id AS "entityId",
  (l.before IS NOT NULL OR l.after IS NOT NULL) AS "hasDiff"`;
const detailColumns = Prisma.sql`${summaryColumns},
  l.city_id AS "cityId", l.area_id AS "areaId", l.before, l.after`;

/**
 * Area-aware read predicate (audit spec rule 4): the row scope and EVERY
 * related scope must pass. An exact area grant admits only that area; a
 * city-only scope needs an explicit whole-city grant; global/unknown scope
 * (or malformed related scope) needs super_admin. Parent cities of granted
 * areas are never whole-city authority.
 */
function scopeClause(scope: AuditReadScope): Prisma.Sql {
  if (scope.platformWide) return Prisma.sql`TRUE`;
  if (!scope.cityWideIds.length && !scope.areaIds.length)
    return Prisma.sql`FALSE`;
  const cities = [...scope.cityWideIds];
  const areas = [...scope.areaIds];
  return Prisma.sql`(l.city_id IS NOT NULL
    AND (l.city_id = ANY(${cities}::uuid[])
      OR COALESCE(l.area_id = ANY(${areas}::uuid[]), FALSE))
    AND NOT EXISTS (
      SELECT 1 FROM jsonb_array_elements(l.related_scopes) AS r(scope)
      WHERE NOT (
        COALESCE(r.scope->>'cityId', '') = ANY(${cities}::text[])
        OR COALESCE(r.scope->>'areaId', '') = ANY(${areas}::text[]))))`;
}

function filterClauses(filters: AuditFilters): Prisma.Sql[] {
  const clauses: Prisma.Sql[] = [];
  // Matches the audit_logs_search_idx expression; plainto_tsquery treats the
  // input as plain words, never query syntax.
  if (filters.q)
    clauses.push(Prisma.sql`to_tsvector('simple'::regconfig,
        l.actor_label || ' ' || l.action || ' ' || l.summary)
      @@ plainto_tsquery('simple'::regconfig, ${filters.q})`);
  if (filters.action) clauses.push(Prisma.sql`l.action = ${filters.action}`);
  if (filters.entityType)
    clauses.push(Prisma.sql`l.entity_type = ${filters.entityType}`);
  if (filters.entityId)
    clauses.push(Prisma.sql`l.entity_id = ${filters.entityId}::uuid`);
  if (filters.actorId)
    clauses.push(Prisma.sql`l.actor_user_id = ${filters.actorId}::uuid`);
  if (filters.actorRole)
    clauses.push(Prisma.sql`l.actor_role = ${filters.actorRole}`);
  if (filters.cityId)
    clauses.push(Prisma.sql`l.city_id = ${filters.cityId}::uuid`);
  if (filters.areaId)
    clauses.push(Prisma.sql`l.area_id = ${filters.areaId}::uuid`);
  if (filters.from) clauses.push(Prisma.sql`l.occurred_at >= ${filters.from}`);
  if (filters.to) clauses.push(Prisma.sql`l.occurred_at < ${filters.to}`);
  return clauses;
}

function where(
  scope: AuditReadScope,
  filters: AuditFilters,
  after?: AuditPosition,
): Prisma.Sql {
  const clauses = [scopeClause(scope), ...filterClauses(filters)];
  if (after)
    clauses.push(Prisma.sql`(l.occurred_at, l.id) <
      (${after.occurredAt}::timestamptz, ${after.id}::uuid)`);
  return Prisma.join(clauses, ' AND ');
}

@Injectable()
export class PrismaAuditReadRepository implements AuditReadRepository {
  constructor(private readonly database: PrismaDatabase) {}

  page(
    tx: TxContext,
    scope: AuditReadScope,
    filters: AuditFilters,
    limit: number,
    after?: AuditPosition,
  ): Promise<AuditSummaryRow[]> {
    return this.database.client(tx).$queryRaw<AuditSummaryRow[]>(Prisma.sql`
      SELECT ${summaryColumns} FROM audit_logs l
      WHERE ${where(scope, filters, after)}
      ORDER BY l.occurred_at DESC, l.id DESC
      LIMIT ${limit}`);
  }

  pageDetailed(
    tx: TxContext,
    scope: AuditReadScope,
    filters: AuditFilters,
    limit: number,
    after?: AuditPosition,
  ): Promise<AuditDetailRow[]> {
    return this.database.client(tx).$queryRaw<AuditDetailRow[]>(Prisma.sql`
      SELECT ${detailColumns} FROM audit_logs l
      WHERE ${where(scope, filters, after)}
      ORDER BY l.occurred_at DESC, l.id DESC
      LIMIT ${limit}`);
  }

  async find(
    tx: TxContext,
    scope: AuditReadScope,
    id: string,
  ): Promise<AuditDetailRow | null> {
    const rows = await this.database.client(tx).$queryRaw<
      AuditDetailRow[]
    >(Prisma.sql`
      SELECT ${detailColumns} FROM audit_logs l
      WHERE l.id = ${id}::uuid AND ${scopeClause(scope)}`);
    return rows[0] ?? null;
  }

  async countUpTo(
    tx: TxContext,
    scope: AuditReadScope,
    filters: AuditFilters,
    cap: number,
  ): Promise<number> {
    const rows = await this.database.client(tx).$queryRaw<
      { total: number }[]
    >(Prisma.sql`
      SELECT count(*)::int AS total FROM (
        SELECT 1 FROM audit_logs l WHERE ${where(scope, filters)}
        LIMIT ${cap + 1}) AS bounded`);
    return rows[0]?.total ?? 0;
  }
}
