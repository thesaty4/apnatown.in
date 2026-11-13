import { Inject, Injectable } from '@nestjs/common';
import type { JsonValue } from '@apnatown/shared';
import {
  AdminListingReportPageSchema,
  AdminListingReportSchema,
  type AdminListingReport,
  type AdminListingReportPage,
  type AdminListingReportResolution,
  type ListingReportStatus,
} from '@apnatown/shared/admin';
import { IdSchema, TimestampSchema } from '@apnatown/shared/wire';
import { z } from 'zod';
import {
  ADMIN_SCOPE,
  type AdminReadContext,
  type AdminScopePort,
} from '../../../shared/auth/ports';
import { DomainError } from '../../../shared/errors/errors';
import {
  COMMAND_CONTEXT_FACTORY,
  HttpCommandContextFactory,
} from '../../../shared/idempotency/context';
import { RECEIPT_TTL_MS } from '../../../shared/idempotency/receipt-ttl';
import {
  CURSOR_CODEC,
  CursorCodec,
  type CursorBinding,
} from '../../../shared/pagination/cursor';
import {
  COMMAND_UNIT_OF_WORK,
  UNIT_OF_WORK,
  type CommandUnitOfWork,
  type TxContext,
  type UnitOfWork,
} from '../../../shared/persistence/ports';
import { CLOCK, type Clock } from '../../../shared/runtime/providers';
import {
  AUDIT_WRITER,
  type AuditWriter,
} from '../../audit/application/audit-writer.port';
import {
  BUSINESS_ADMIN_LISTING_READ,
  type BusinessAdminListingReadPort,
} from '../../businesses/application/business-ports';
import {
  LISTING_REPORT_REPOSITORY,
  type ListingReportRepository,
  type StoredListingReport,
} from '../domain/listing-report';
import type { AdminCommand } from './admin-command';
import { AdminScopedActor, hideOutOfScope } from './admin-scoped-actor';

const positionSchema = z.tuple([TimestampSchema, IdSchema]);

/** Masked admin projection; the subject hash is never selected. */
export function reportDto(report: StoredListingReport): AdminListingReport {
  return AdminListingReportSchema.parse({
    id: report.id,
    targetType: report.targetType,
    targetId: report.targetId,
    reason: report.reason,
    details: report.details,
    reporter: report.reporterUserId ? 'account' : 'guest',
    cityId: report.cityId,
    areaId: report.areaId,
    status: report.status,
    resolution: report.resolution,
    resolutionNote: report.resolutionNote,
    resolvedAt: report.resolvedAt,
    createdAt: report.createdAt,
    version: report.version,
  });
}

/** Trusted read context holds `catalog` and some scope. */
export function assertCatalogReader(ctx: AdminReadContext): void {
  if (ctx.isSuper) return;
  const scoped =
    ctx.scope.platformWide ||
    ctx.scope.cityWideIds.length > 0 ||
    ctx.scope.areaIds.length > 0;
  if (ctx.permission?.module !== 'catalog' || !scoped)
    throw new DomainError('COMMON_FORBIDDEN');
}

/**
 * Admin listing-report reads and resolution (S-ADMN-03). Visibility is the
 * report's stored city/area against the caller's `catalog` scope, rechecked
 * in the transaction. Resolution is versioned and audited; any listing
 * action uses the owning listing command separately (no invented reply).
 */
@Injectable()
export class AdminListingReportsService {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(COMMAND_UNIT_OF_WORK) private readonly commands: CommandUnitOfWork,
    @Inject(COMMAND_CONTEXT_FACTORY)
    private readonly contexts: HttpCommandContextFactory,
    @Inject(LISTING_REPORT_REPOSITORY)
    private readonly reports: ListingReportRepository,
    @Inject(BUSINESS_ADMIN_LISTING_READ)
    private readonly listings: BusinessAdminListingReadPort,
    @Inject(ADMIN_SCOPE) private readonly scope: AdminScopePort,
    @Inject(AUDIT_WRITER) private readonly audit: AuditWriter,
    @Inject(CURSOR_CODEC) private readonly cursors: CursorCodec,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly actors: AdminScopedActor,
  ) {}

  list(
    ctx: AdminReadContext,
    input: {
      targetId?: string;
      status: ListingReportStatus;
      cursor?: string;
      limit: number;
    },
  ): Promise<AdminListingReportPage> {
    assertCatalogReader(ctx);
    const binding: CursorBinding = {
      operation: 'admin.listing-reports',
      sort: 'createdAt-id-desc',
      filters: { status: input.status, targetId: input.targetId ?? null },
      scope: { actor: ctx.actorUserId, revision: ctx.scopeRevision },
    };
    const after = this.position(input.cursor, binding);
    return this.uow.run(async (tx) => {
      const rows = await this.reports.page(tx, {
        visibility: {
          platformWide: ctx.isSuper || ctx.scope.platformWide,
          cityIds: ctx.scope.cityWideIds,
          areaIds: ctx.scope.areaIds,
        },
        status: input.status,
        ...(input.targetId ? { targetId: input.targetId } : {}),
        ...(after ? { after } : {}),
        limit: input.limit,
      });
      const page = rows.slice(0, input.limit);
      const last = page.at(-1);
      return AdminListingReportPageSchema.parse({
        items: page.map(reportDto),
        nextCursor:
          rows.length > input.limit && last
            ? this.cursors.encode(binding, [last.createdAt, last.id])
            : null,
      });
    });
  }

  detail(ctx: AdminReadContext, id: string): Promise<AdminListingReport> {
    assertCatalogReader(ctx);
    return this.uow.run(async (tx) => {
      const report = await this.reports.find(tx, id);
      if (!report) throw new DomainError('COMMON_NOT_FOUND');
      await hideOutOfScope(
        this.scope.authorize(
          {
            actorUserId: ctx.actorUserId,
            module: 'catalog',
            action: 'view',
            scopes: [scopeOf(report)],
          },
          tx,
        ),
      );
      return reportDto(report);
    });
  }

  /** Open counts for already-authorized listings (<= 50 IDs). */
  openCounts(
    tx: TxContext,
    targetIds: readonly string[],
  ): Promise<Map<string, number>> {
    return this.reports.openCounts(tx, targetIds);
  }

  resolve(
    request: AdminCommand,
    id: string,
    input: AdminListingReportResolution,
  ): Promise<AdminListingReport> {
    const command = this.contexts.create(
      {
        name: 'listing.reports.resolve',
        method: 'POST',
        scope: 'principal',
        successStatus: 200,
      },
      {
        actorId: request.actorId,
        correlationId: request.correlationId,
        resource: `/admin/listing-reports/${id}/resolution`,
        business: null,
        expiresAt: new Date(this.clock.now().getTime() + RECEIPT_TTL_MS),
      },
      {
        key: request.key,
        payload: JSON.parse(JSON.stringify(input)) as JsonValue,
      },
    );
    return this.commands.run(
      command,
      async (tx) => {
        const before = await this.reports.find(tx, id, true);
        if (!before) throw new DomainError('COMMON_NOT_FOUND');
        const actor = await hideOutOfScope(
          this.actors.require(tx, request, {
            module: 'catalog',
            action: 'edit',
            scopes: [scopeOf(before)],
          }),
        );
        const listing = await this.listings.scopeOf(tx, before.targetId);
        if (listing?.ownerUserId === actor.userId)
          throw new DomainError('ADMIN_SELF_ACTION');
        if (
          before.version !== input.expectedVersion ||
          before.status !== 'open'
        )
          throw new DomainError('ADMIN_VERSION_CONFLICT');
        const at = this.clock.now();
        if (
          !(await this.reports.resolve(tx, {
            id,
            expectedVersion: input.expectedVersion,
            resolution: input.resolution,
            note: input.note ?? null,
            resolvedBy: actor.userId,
            at,
          }))
        )
          throw new DomainError('ADMIN_VERSION_CONFLICT');
        const after = (await this.reports.find(tx, id))!;
        await this.audit.record(tx, {
          actor,
          action: 'listing_report.resolve',
          entityType: 'listing_report',
          entityId: id,
          cityId: after.cityId,
          areaId: after.areaId,
          summary: `Listing report ${input.resolution}`,
          before: snapshot(before),
          after: snapshot(after),
          fields: [
            'status',
            'resolution',
            'resolutionNote',
            'targetId',
            'version',
          ],
          correlationId: request.correlationId,
        });
        return reportDto(after) as AdminListingReport & JsonValue;
      },
      {
        store: (result) => result,
        // Replay rechecks the caller's current catalog:edit over the report.
        replay: async (tx, stored) => {
          const current = await this.reports.find(tx, id);
          await this.actors.require(tx, request, {
            module: 'catalog',
            action: 'edit',
            scopes: [
              current ? scopeOf(current) : { cityId: null, areaId: null },
            ],
          });
          return AdminListingReportSchema.parse(stored) as AdminListingReport &
            JsonValue;
        },
      },
    );
  }

  private position(
    cursor: string | undefined,
    binding: CursorBinding,
  ): [string, string] | undefined {
    if (!cursor) return undefined;
    const parsed = positionSchema.safeParse(
      this.cursors.decode(cursor, binding),
    );
    if (!parsed.success)
      throw new DomainError('VALIDATION_ERROR', { field: 'cursor' });
    return parsed.data;
  }
}

function scopeOf(report: StoredListingReport) {
  return { cityId: report.cityId, areaId: report.areaId };
}

function snapshot(report: StoredListingReport) {
  return {
    status: report.status,
    resolution: report.resolution,
    resolutionNote: report.resolutionNote,
    targetId: report.targetId,
    version: report.version,
  };
}
