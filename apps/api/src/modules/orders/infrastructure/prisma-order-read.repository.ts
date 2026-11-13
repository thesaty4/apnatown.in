import { Injectable } from '@nestjs/common';
import type { OrderStatus } from '@apnatown/shared/orders';
import { Prisma } from '../../../shared/persistence/generated/client';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import type { TxContext } from '../../../shared/persistence/ports';
import type {
  ListOwner,
  OrderListRow,
  OrderReadRepository,
  Position,
  StoredHistory,
  StoredOrderItem,
} from '../domain/order';
import { ORDER_COLUMNS, toStoredOrder, type OrderRow } from './order-row';

/** Owner predicate shared by pages and counts (orders BE rule 13). */
function ownerPredicate(owner: ListOwner): Prisma.Sql {
  if (owner.kind === 'customer') return Prisma.sql`o.customer_user_id=${owner.userId}::uuid`;
  if (owner.kind === 'business') return Prisma.sql`o.business_id=${owner.businessId}::uuid`;
  const v = owner.visibility;
  if (v.platformWide) return Prisma.sql`TRUE`;
  return Prisma.sql`(o.area_id = ANY(${[...v.areaIds]}::uuid[]) OR o.city_id = ANY(${[...v.cityIds]}::uuid[]))`;
}

/** Orders-owned read model; scope predicates precede pagination. */
@Injectable()
export class PrismaOrderReadRepository implements OrderReadRepository {
  constructor(private readonly db: PrismaDatabase) {}

  async find(tx: TxContext, orderId: string) {
    const rows = await this.db.client(tx).$queryRaw<OrderRow[]>(Prisma.sql`
      SELECT ${ORDER_COLUMNS} FROM orders o WHERE o.id=${orderId}::uuid`);
    return rows[0] ? toStoredOrder(rows[0]) : null;
  }

  async byCheckout(tx: TxContext, checkoutAttemptId: string) {
    const rows = await this.db.client(tx).$queryRaw<OrderRow[]>(Prisma.sql`
      SELECT ${ORDER_COLUMNS} FROM orders o
      WHERE o.checkout_attempt_id=${checkoutAttemptId}::uuid ORDER BY o.created_at,o.id`);
    return rows.map(toStoredOrder);
  }

  items(tx: TxContext, orderId: string) {
    return this.db.client(tx).$queryRaw<StoredOrderItem[]>(Prisma.sql`
      SELECT i.id::text AS id,i.product_id::text AS "productId",
        i.product_variant_id::text AS "variantId",i.product_name_en AS "nameEn",
        i.product_name_hi AS "nameHi",i.variant_label AS "variantLabel",
        i.ordered_quantity AS "orderedQuantity",i.fulfilled_quantity AS "fulfilledQuantity",
        i.unit_price_paise::float8 AS "unitPricePaise",
        i.ordered_line_total_paise::float8 AS "orderedLineTotalPaise",
        i.fulfilled_line_total_paise::float8 AS "fulfilledLineTotalPaise",i.availability
      FROM order_items i WHERE i.order_id=${orderId}::uuid ORDER BY i.created_at,i.id`);
  }

  history(tx: TxContext, orderId: string) {
    return this.db.client(tx).$queryRaw<StoredHistory[]>(Prisma.sql`
      SELECT h.from_status AS "fromStatus",h.to_status AS "toStatus",h.event_key AS "eventKey",
        h.actor_user_id::text AS "actorUserId",h.reason_key AS "reasonKey",h.created_at AS "createdAt"
      FROM order_status_history h WHERE h.order_id=${orderId}::uuid ORDER BY h.created_at,h.id`);
  }

  page(
    tx: TxContext,
    input: { owner: ListOwner; statuses: readonly OrderStatus[]; after?: Position; limit: number },
  ) {
    const after = input.after
      ? Prisma.sql`AND (o.placed_at,o.id) < (${input.after.placedAt}::timestamptz,${input.after.id}::uuid)`
      : Prisma.empty;
    return this.db.client(tx).$queryRaw<OrderListRow[]>(Prisma.sql`
      SELECT o.id::text AS id,o.order_number AS "orderNumber",o.version,
        o.business_id::text AS "businessId",o.business_snapshot->>'nameEn' AS "businessNameEn",
        o.business_snapshot->>'nameHi' AS "businessNameHi",
        o.customer_user_id::text AS "customerUserId",o.city_id::text AS "cityId",
        o.area_id::text AS "areaId",o.mode,o.delivery_method AS "deliveryMethod",o.status,
        o.ordered_total_paise::float8 AS "orderedTotalPaise",
        o.fulfilled_total_paise::float8 AS "fulfilledTotalPaise",o.placed_at AS "placedAt",
        s.name_en AS "firstItemNameEn",s.name_hi AS "firstItemNameHi",
        s.line_count AS "lineCount",s.item_count AS "itemCount"
      FROM orders o
      CROSS JOIN LATERAL (
        SELECT (array_agg(i.product_name_en ORDER BY i.created_at,i.id))[1] AS name_en,
          (array_agg(i.product_name_hi ORDER BY i.created_at,i.id))[1] AS name_hi,
          count(*)::int AS line_count,sum(i.ordered_quantity)::int AS item_count
        FROM order_items i WHERE i.order_id=o.id) s
      WHERE ${ownerPredicate(input.owner)} AND o.status = ANY(${[...input.statuses]}::text[]) ${after}
      ORDER BY o.placed_at DESC,o.id DESC LIMIT ${input.limit + 1}`);
  }

  async counts(tx: TxContext, owner: ListOwner) {
    const rows = await this.db.client(tx).$queryRaw<{ status: OrderStatus; count: number }[]>(
      Prisma.sql`SELECT o.status,count(*)::int AS count FROM orders o
        WHERE ${ownerPredicate(owner)} GROUP BY o.status`,
    );
    return new Map(rows.map((row) => [row.status, row.count]));
  }

  async scope(tx: TxContext, orderId: string) {
    const rows = await this.db.client(tx).$queryRaw<{ cityId: string; areaId: string }[]>(Prisma.sql`
      SELECT o.city_id::text AS "cityId",o.area_id::text AS "areaId" FROM orders o
      WHERE o.id=${orderId}::uuid`);
    return rows[0] ?? null;
  }
}
