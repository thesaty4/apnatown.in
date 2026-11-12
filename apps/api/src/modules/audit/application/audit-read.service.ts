import { Inject, Injectable } from '@nestjs/common';
import {
  AUDIT_EXPORT_MAX_ROWS,
  type ActivityExportQuery,
  type ActivityListQuery,
  type AuditEntryDetail,
  type AuditPage,
} from '@apnatown/shared/admin';
import { IdSchema } from '@apnatown/shared/wire';
import { z } from 'zod';
import type { AdminReadContext } from '../../../shared/auth/ports';
import { DomainError } from '../../../shared/errors/errors';
import { csvRow } from '../../../shared/http/csv';
import {
  CURSOR_CODEC,
  CursorCodec,
  type CursorBinding,
} from '../../../shared/pagination/cursor';
import {
  UNIT_OF_WORK,
  type UnitOfWork,
} from '../../../shared/persistence/ports';
import { CLOCK, type Clock } from '../../../shared/runtime/providers';
import {
  USER_IDENTITY,
  type UserIdentityPort,
} from '../../users/application/identity-port';
import {
  USER_ROLES,
  type UserRolePort,
} from '../../users/application/user-role-port';
import {
  AUDIT_READ_REPOSITORY,
  type AuditFilters,
  type AuditPosition,
  type AuditReadRepository,
  type AuditReadScope,
} from '../domain/audit-read';
import { AUDIT_WRITER, type AuditWriter } from './audit-writer.port';

/** `admin.audit` is the scoped admin view; `super-admin.activity` is global. */
export type AuditFeed = 'admin.audit' | 'super-admin.activity';

const IST_OFFSET_MS = 330 * 60_000;
const EXPORT_BATCH = 500;
// [occurredAt (µs UTC ISO), id]
const positionSchema = z.tuple([
  z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/),
  IdSchema,
]);

/** Start of an IST calendar date as a UTC instant (`days` shifts the date). */
function istMidnight(date: string, days = 0): Date {
  const [year, month, day] = date.split('-').map(Number) as [
    number,
    number,
    number,
  ];
  return new Date(Date.UTC(year, month - 1, day + days) - IST_OFFSET_MS);
}

function toFilters(query: ActivityExportQuery): AuditFilters {
  return {
    q: query.q,
    action: query.action,
    entityType: query.entityType,
    actorId: query.actorId,
    actorRole: query.actorRole,
    cityId: query.cityId,
    areaId: query.areaId,
    from: query.from ? istMidnight(query.from) : undefined,
    // Inclusive end date → exclusive start of the next IST day.
    to: query.to ? istMidnight(query.to, 1) : undefined,
  };
}

/** `2026-11-12 09:21:54 IST` for a UTC timestamp. */
function istTime(occurredAt: string): string {
  const shifted = new Date(Date.parse(occurredAt) + IST_OFFSET_MS);
  return `${shifted.toISOString().slice(0, 19).replace('T', ' ')} IST`;
}

function readScope(ctx: AdminReadContext): AuditReadScope {
  return ctx.isSuper
    ? { platformWide: true, cityWideIds: [], areaIds: [] }
    : {
        platformWide: false,
        cityWideIds: ctx.scope.cityWideIds,
        areaIds: ctx.scope.areaIds,
      };
}

@Injectable()
export class AuditReadService {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(AUDIT_READ_REPOSITORY)
    private readonly repository: AuditReadRepository,
    @Inject(AUDIT_WRITER) private readonly writer: AuditWriter,
    @Inject(USER_ROLES) private readonly roles: UserRolePort,
    @Inject(USER_IDENTITY) private readonly identity: UserIdentityPort,
    @Inject(CURSOR_CODEC) private readonly cursors: CursorCodec,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  list(
    ctx: AdminReadContext,
    feed: AuditFeed,
    query: ActivityListQuery,
  ): Promise<AuditPage> {
    this.assertFeed(ctx, feed);
    const binding: CursorBinding = {
      operation: feed,
      sort: 'occurredAt-id-desc',
      filters: {
        q: query.q ?? null,
        action: query.action ?? null,
        entityType: query.entityType ?? null,
        actorId: query.actorId ?? null,
        actorRole: query.actorRole ?? null,
        cityId: query.cityId ?? null,
        areaId: query.areaId ?? null,
        from: query.from ?? null,
        to: query.to ?? null,
      },
      // A grant change bumps the revision and invalidates later pages.
      scope: { actor: ctx.actorUserId, revision: ctx.scopeRevision },
    };
    let after: AuditPosition | undefined;
    if (query.cursor) {
      const parsed = positionSchema.safeParse(
        this.cursors.decode(query.cursor, binding),
      );
      if (!parsed.success) throw new DomainError('VALIDATION_ERROR');
      after = { occurredAt: parsed.data[0], id: parsed.data[1] };
    }
    return this.uow.run(async (tx) => {
      const rows = await this.repository.page(
        tx,
        readScope(ctx),
        toFilters(query),
        query.limit + 1,
        after,
      );
      const items = rows.slice(0, query.limit);
      const last = items.at(-1);
      return {
        items,
        nextCursor:
          rows.length > query.limit && last
            ? this.cursors.encode(binding, [last.occurredAt, last.id])
            : null,
      };
    });
  }

  detail(
    ctx: AdminReadContext,
    feed: AuditFeed,
    id: string,
  ): Promise<AuditEntryDetail> {
    this.assertFeed(ctx, feed);
    return this.uow.run(async (tx) => {
      const row = await this.repository.find(tx, readScope(ctx), id);
      // Missing and out-of-scope are indistinguishable.
      if (!row) throw new DomainError('AUDIT_NOT_FOUND');
      return row;
    });
  }

  /**
   * Counts (capped), rechecks super_admin and records `audit.exported` in one
   * transaction, then returns the CSV body as a lazy batch stream. Rows are
   * bounded to those that occurred before the export started.
   */
  async exportCsv(
    ctx: AdminReadContext,
    query: ActivityExportQuery,
    correlationId: string,
  ): Promise<{ fileName: string; body: AsyncIterable<string> }> {
    this.assertFeed(ctx, 'super-admin.activity');
    const startedAt = this.clock.now();
    const requested = toFilters(query);
    const filters: AuditFilters = {
      ...requested,
      to: requested.to && requested.to < startedAt ? requested.to : startedAt,
    };
    const scope = readScope(ctx);
    await this.uow.run(async (tx) => {
      if (
        !(await this.roles.hasActiveRole(
          { userId: ctx.actorUserId, role: 'super_admin' },
          tx,
        ))
      )
        throw new DomainError('COMMON_FORBIDDEN');
      const rowCount = await this.repository.countUpTo(
        tx,
        scope,
        filters,
        AUDIT_EXPORT_MAX_ROWS,
      );
      if (rowCount > AUDIT_EXPORT_MAX_ROWS)
        throw new DomainError('REPORT_TOO_LARGE');
      const [profile] = await this.identity.describe(tx, [ctx.actorUserId]);
      const after = {
        rowCount,
        q: filters.q ?? null,
        action: filters.action ?? null,
        entityType: filters.entityType ?? null,
        actorId: filters.actorId ?? null,
        actorRole: filters.actorRole ?? null,
        cityId: filters.cityId ?? null,
        areaId: filters.areaId ?? null,
        from: filters.from?.toISOString() ?? null,
        to: filters.to?.toISOString() ?? null,
      };
      // Platform-wide evidence: no city/area, so only super_admin can read it.
      await this.writer.record(tx, {
        actor: {
          userId: ctx.actorUserId,
          role: 'super_admin',
          label: profile?.displayName ?? 'Super admin',
        },
        action: 'audit.exported',
        entityType: 'audit_log',
        entityId: null,
        summary: 'Activity log exported as CSV',
        before: null,
        after,
        fields: Object.keys(after),
        correlationId,
      });
    });
    const day = new Date(startedAt.getTime() + IST_OFFSET_MS)
      .toISOString()
      .slice(0, 10);
    return {
      fileName: `apnatown-activity-${day}.csv`,
      body: this.csv(scope, filters),
    };
  }

  private async *csv(
    scope: AuditReadScope,
    filters: AuditFilters,
  ): AsyncGenerator<string> {
    // Header first so the response starts before any further database I/O.
    yield `\uFEFF${csvRow(['Time (IST)', 'Actor', 'Role', 'Action', 'Entity', 'Summary', 'Before', 'After'])}`;
    let after: AuditPosition | undefined;
    let emitted = 0;
    while (emitted < AUDIT_EXPORT_MAX_ROWS) {
      const limit = Math.min(EXPORT_BATCH, AUDIT_EXPORT_MAX_ROWS - emitted);
      const rows = await this.uow.run((tx) =>
        this.repository.pageDetailed(tx, scope, filters, limit, after),
      );
      if (!rows.length) return;
      let chunk = '';
      for (const row of rows)
        chunk += csvRow([
          istTime(row.occurredAt),
          row.actorUserId
            ? `${row.actorLabel} (${row.actorUserId})`
            : row.actorLabel,
          row.actorRole,
          row.action,
          row.entityId ? `${row.entityType}:${row.entityId}` : row.entityType,
          row.summary,
          row.before ? JSON.stringify(row.before) : null,
          row.after ? JSON.stringify(row.after) : null,
        ]);
      yield chunk;
      emitted += rows.length;
      const last = rows.at(-1)!;
      after = { occurredAt: last.occurredAt, id: last.id };
      if (rows.length < limit) return;
    }
  }

  private assertFeed(ctx: AdminReadContext, feed: AuditFeed): void {
    // Guards already enforce these; fail closed if a route is miswired.
    if (ctx.isSuper) return;
    if (
      feed === 'super-admin.activity' ||
      ctx.permission?.module !== 'reports' ||
      ctx.permission.action !== 'view'
    )
      throw new DomainError('COMMON_FORBIDDEN');
  }
}
