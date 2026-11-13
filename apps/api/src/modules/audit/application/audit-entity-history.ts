import { Inject, Injectable } from '@nestjs/common';
import { AuditPageSchema, type AuditPage } from '@apnatown/shared/admin';
import { IdSchema } from '@apnatown/shared/wire';
import { z } from 'zod';
import type { AdminReadContext } from '../../../shared/auth/ports';
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
  AUDIT_READ_REPOSITORY,
  type AuditPosition,
  type AuditReadRepository,
} from '../domain/audit-read';
import { auditReadScope } from './audit-read-scope';

export const AUDIT_ENTITY_HISTORY = Symbol('AUDIT_ENTITY_HISTORY');

/**
 * `AuditReadPort.entityHistory`: the narrow approval history of one entity.
 * The caller must already have authorized `approvals:view` and the entity's
 * scope; the audit row scope predicate is still applied as defence in depth.
 */
export interface AuditEntityHistoryPort {
  entityHistory(
    ctx: AdminReadContext,
    input: {
      entityType: string;
      entityId: string;
      cursor?: string | undefined;
      limit: number;
    },
  ): Promise<AuditPage>;
}

// [occurredAt (µs UTC ISO), id]
const positionSchema = z.tuple([
  z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/),
  IdSchema,
]);

@Injectable()
export class AuditEntityHistoryService implements AuditEntityHistoryPort {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(AUDIT_READ_REPOSITORY)
    private readonly repository: AuditReadRepository,
    @Inject(CURSOR_CODEC) private readonly cursors: CursorCodec,
  ) {}

  entityHistory(
    ctx: AdminReadContext,
    input: {
      entityType: string;
      entityId: string;
      cursor?: string | undefined;
      limit: number;
    },
  ): Promise<AuditPage> {
    const binding: CursorBinding = {
      operation: 'audit.entity-history',
      sort: 'occurredAt-id-desc',
      filters: { entityType: input.entityType, entityId: input.entityId },
      scope: { actor: ctx.actorUserId, revision: ctx.scopeRevision },
    };
    const after = this.position(input.cursor, binding);
    const scope = auditReadScope(ctx);
    return this.uow.run(async (tx) => {
      const rows = await this.repository.page(
        tx,
        scope,
        { entityType: input.entityType, entityId: input.entityId },
        input.limit + 1,
        after,
      );
      const items = rows.slice(0, input.limit);
      const last = items.at(-1);
      return AuditPageSchema.parse({
        items,
        nextCursor:
          rows.length > input.limit && last
            ? this.cursors.encode(binding, [last.occurredAt, last.id])
            : null,
      });
    });
  }

  private position(
    cursor: string | undefined,
    binding: CursorBinding,
  ): AuditPosition | undefined {
    if (!cursor) return undefined;
    const parsed = positionSchema.safeParse(
      this.cursors.decode(cursor, binding),
    );
    if (!parsed.success)
      throw new DomainError('VALIDATION_ERROR', { field: 'cursor' });
    return { occurredAt: parsed.data[0], id: parsed.data[1] };
  }
}
