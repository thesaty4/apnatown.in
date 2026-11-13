import { Inject, Injectable } from '@nestjs/common';
import type { JsonValue } from '@apnatown/shared';
import type { OrderStatus } from '@apnatown/shared/orders';
import { IdSchema, TimestampSchema } from '@apnatown/shared/wire';
import { z } from 'zod';
import { DomainError } from '../../../shared/errors/errors';
import { CURSOR_CODEC, CursorCodec, type CursorBinding } from '../../../shared/pagination/cursor';
import type { TxContext } from '../../../shared/persistence/ports';
import {
  ORDER_READS,
  type ListOwner,
  type OrderListRow,
  type OrderReadRepository,
} from '../domain/order';

const positionSchema = z.tuple([TimestampSchema, IdSchema]);

/** Shared card fields for customer/business lists. */
export function card(row: OrderListRow) {
  return {
    id: row.id,
    orderNumber: row.orderNumber,
    itemSummary: {
      nameEn: row.firstItemNameEn,
      nameHi: row.firstItemNameHi,
      moreCount: Math.max(0, row.lineCount - 1),
    },
    itemCount: row.itemCount,
    mode: row.mode,
    status: row.status,
    orderedTotalPaise: row.orderedTotalPaise,
    currentPayablePaise: row.fulfilledTotalPaise,
    placedAt: row.placedAt.toISOString(),
  };
}

/** Opaque keyset (placedAt DESC, id DESC) bound to operation/filter/owner. */
@Injectable()
export class OrderPager {
  constructor(
    @Inject(ORDER_READS) private readonly reads: OrderReadRepository,
    @Inject(CURSOR_CODEC) private readonly cursors: CursorCodec,
  ) {}

  async page(
    tx: TxContext,
    input: {
      owner: ListOwner;
      statuses: readonly OrderStatus[];
      binding: { operation: string; filters: JsonValue; scope: JsonValue };
      query: { cursor?: string | undefined; limit: number };
    },
  ): Promise<{ rows: OrderListRow[]; nextCursor: string | null }> {
    const binding: CursorBinding = { ...input.binding, sort: 'placedAt-desc-id-desc' };
    let after: { placedAt: string; id: string } | undefined;
    if (input.query.cursor) {
      const parsed = positionSchema.safeParse(this.cursors.decode(input.query.cursor, binding));
      if (!parsed.success) throw new DomainError('VALIDATION_ERROR', { field: 'cursor' });
      after = { placedAt: parsed.data[0], id: parsed.data[1] };
    }
    const rows = await this.reads.page(tx, {
      owner: input.owner,
      statuses: input.statuses,
      ...(after ? { after } : {}),
      limit: input.query.limit,
    });
    const page = rows.slice(0, input.query.limit);
    const last = page.at(-1);
    return {
      rows: page,
      nextCursor:
        rows.length > input.query.limit && last
          ? this.cursors.encode(binding, [last.placedAt.toISOString(), last.id])
          : null,
    };
  }
}
