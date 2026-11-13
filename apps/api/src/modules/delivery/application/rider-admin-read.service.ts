import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import {
  RiderApplicationPageSchema,
  type RiderApplicationPage,
  type RiderApplicationQuery,
} from '@apnatown/shared/delivery';
import { IdSchema, TimestampSchema } from '@apnatown/shared/wire';
import { z } from 'zod';
import type { AdminReadContext } from '../../../shared/auth/ports';
import { ScopeRegistry } from '../../../shared/auth/scope-registry';
import { DomainError } from '../../../shared/errors/errors';
import {
  CURSOR_CODEC,
  CursorCodec,
  type CursorBinding,
} from '../../../shared/pagination/cursor';
import {
  UNIT_OF_WORK,
  type UnitOfWork,
} from '../../../shared/persistence/ports';
import {
  RIDER_REPOSITORY,
  allowedRiderActions,
  riderScope,
  type RiderRepository,
  type StoredRider,
} from '../domain/rider';
import type { RiderApplicationsReadPort } from './delivery-ports';

export const RIDER_APPLICATION_SCOPE = 'delivery.rider_application';
const positionSchema = z.tuple([TimestampSchema, IdSchema]);

function card(rider: StoredRider) {
  return {
    userId: rider.userId,
    fullName: rider.fullName,
    status: rider.status,
    cityId: rider.cityId,
    areaId: rider.areaId,
    vehicleType: rider.vehicleType,
    submittedAt: rider.submittedAt,
    createdAt: rider.createdAt,
    version: rider.version,
    allowedActions: allowedRiderActions(rider.status),
  };
}

/**
 * Scoped rider approval queue (F-AD-002, BR-12). Visibility is the caller's
 * server-derived city/area scope over the application's validated Geo
 * scope; drafts never enter the queue. Cards carry no phone, KYC or payout.
 */
@Injectable()
export class RiderAdminReadService
  implements RiderApplicationsReadPort, OnModuleInit
{
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(RIDER_REPOSITORY) private readonly riders: RiderRepository,
    @Inject(CURSOR_CODEC) private readonly cursors: CursorCodec,
    private readonly registry: ScopeRegistry,
  ) {}

  onModuleInit(): void {
    this.registry.register(RIDER_APPLICATION_SCOPE, async (id, tx) => {
      const row = await (tx
        ? this.riders.find(tx, id)
        : this.uow.run((t) => this.riders.find(t, id)));
      // Missing/draft rows resolve as unresolved scope (super_admin only) so
      // scoped admins cannot probe IDs; the command returns not-found.
      if (!row || row.status === 'draft') return [];
      return [riderScope(row)];
    });
  }

  list(
    ctx: AdminReadContext,
    query: RiderApplicationQuery,
  ): Promise<RiderApplicationPage> {
    assertReader(ctx);
    const binding: CursorBinding = {
      operation: 'delivery.admin.rider_applications',
      sort: 'createdAt-userId',
      filters: { status: query.status },
      scope: { actor: ctx.actorUserId, revision: ctx.scopeRevision },
    };
    const after = this.position(query.cursor, binding);
    return this.uow.run(async (tx) => {
      const rows = await this.riders.scopedPage(tx, {
        status: query.status,
        visibility: {
          platformWide: ctx.isSuper || ctx.scope.platformWide,
          cityIds: ctx.scope.cityWideIds,
          areaIds: ctx.scope.areaIds,
        },
        ...(after ? { after } : {}),
        limit: query.limit,
      });
      const page = rows.slice(0, query.limit);
      const last = page.at(-1);
      return RiderApplicationPageSchema.parse({
        items: page.map(card),
        nextCursor:
          rows.length > query.limit && last
            ? this.cursors.encode(binding, [last.createdAt, last.userId])
            : null,
      });
    });
  }

  private position(
    cursor: string | undefined,
    binding: CursorBinding,
  ): [string, string] | undefined {
    if (!cursor) return undefined;
    const parsed = positionSchema.safeParse(this.cursors.decode(cursor, binding));
    if (!parsed.success)
      throw new DomainError('VALIDATION_ERROR', { field: 'cursor' });
    return parsed.data;
  }
}

/** Trusted read context holds approvals and some assigned scope. */
function assertReader(ctx: AdminReadContext): void {
  if (ctx.isSuper) return;
  if (
    ctx.permission?.module !== 'approvals' ||
    !(
      ctx.scope.platformWide ||
      ctx.scope.cityWideIds.length ||
      ctx.scope.areaIds.length
    )
  )
    throw new DomainError('COMMON_FORBIDDEN');
}
