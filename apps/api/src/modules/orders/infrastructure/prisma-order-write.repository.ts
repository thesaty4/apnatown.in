import { Injectable } from '@nestjs/common';
import { Money } from '@apnatown/shared';
import { Prisma } from '../../../shared/persistence/generated/client';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import type { TxContext } from '../../../shared/persistence/ports';
import type {
  NewOrder,
  NewOrderLine,
  OrderWriteRepository,
  StatusChange,
  StockOperation,
  StoredHistory,
} from '../domain/order';
import { ORDER_COLUMNS, toStoredOrder, type OrderRow } from './order-row';

const lineTotal = (line: NewOrderLine) =>
  Money.fromPaise(line.unitPricePaise).multiply(line.quantity).subtract(Money.fromPaise(line.discountPaise)).toPaiseNumber();

/** Orders-owned tables; append-only snapshots, parameterized SQL only. */
@Injectable()
export class PrismaOrderWriteRepository implements OrderWriteRepository {
  constructor(private readonly db: PrismaDatabase) {}

  async insertOrder(tx: TxContext, order: NewOrder) {
    const a = order.amounts;
    await this.db.client(tx).$executeRaw`
      INSERT INTO orders (id,order_number,checkout_attempt_id,customer_user_id,business_id,city_id,
        area_id,mode,delivery_method,status,payment_attempt_id,
        ordered_items_subtotal_paise,ordered_discount_paise,ordered_delivery_fee_paise,
        ordered_platform_fee_paise,ordered_total_paise,fulfilled_items_subtotal_paise,
        fulfilled_discount_paise,fulfilled_delivery_fee_paise,fulfilled_platform_fee_paise,
        fulfilled_total_paise,business_snapshot,delivery_address_snapshot,placed_at,created_at,updated_at)
      VALUES (${order.id}::uuid,${order.orderNumber},${order.checkoutAttemptId}::uuid,
        ${order.customerUserId}::uuid,${order.businessId}::uuid,${order.cityId}::uuid,
        ${order.areaId}::uuid,${order.mode},${order.deliveryMethod},'placed',
        ${order.paymentAttemptId}::uuid,
        ${a.itemsSubtotalPaise}::bigint,${a.discountPaise}::bigint,${a.deliveryFeePaise}::bigint,
        ${a.platformFeePaise}::bigint,${a.totalPaise}::bigint,
        ${a.itemsSubtotalPaise}::bigint,${a.discountPaise}::bigint,${a.deliveryFeePaise}::bigint,
        ${a.platformFeePaise}::bigint,${a.totalPaise}::bigint,
        ${JSON.stringify(order.business)}::jsonb,
        ${order.address ? JSON.stringify(order.address) : null}::jsonb,
        ${order.at},${order.at},${order.at})`;
  }

  async insertItems(tx: TxContext, orderId: string, lines: readonly NewOrderLine[], at: Date) {
    for (const line of lines)
      await this.db.client(tx).$executeRaw`
        INSERT INTO order_items (id,order_id,product_id,product_variant_id,product_name_en,
          product_name_hi,variant_label,ordered_quantity,fulfilled_quantity,unit_price_paise,
          ordered_discount_paise,ordered_line_total_paise,fulfilled_discount_paise,
          fulfilled_line_total_paise,availability,created_at,updated_at)
        VALUES (${line.id}::uuid,${orderId}::uuid,${line.productId}::uuid,${line.variantId}::uuid,
          ${line.nameEn},${line.nameHi},${line.variantLabel},${line.quantity},${line.quantity},
          ${line.unitPricePaise}::bigint,${line.discountPaise}::bigint,${lineTotal(line)}::bigint,
          ${line.discountPaise}::bigint,${lineTotal(line)}::bigint,'ordered',${at},${at})`;
  }

  async insertAllocations(
    tx: TxContext,
    input: { orderId: string; reservationId: string; lines: readonly NewOrderLine[]; at: Date },
  ) {
    for (const line of input.lines)
      await this.db.client(tx).$executeRaw`
        INSERT INTO order_stock_allocations (order_item_id,order_id,reservation_id,product_id,
          variant_id,reserved_quantity,created_at,updated_at)
        VALUES (${line.id}::uuid,${input.orderId}::uuid,${input.reservationId}::uuid,
          ${line.productId}::uuid,${line.variantId}::uuid,${line.quantity},${input.at},${input.at})`;
  }

  async insertHistory(
    tx: TxContext,
    orderId: string,
    entry: Omit<StoredHistory, 'createdAt'> & { id: string; at: Date },
  ) {
    await this.db.client(tx).$executeRaw`
      INSERT INTO order_status_history (id,order_id,from_status,to_status,event_key,actor_user_id,
        reason_key,created_at)
      VALUES (${entry.id}::uuid,${orderId}::uuid,${entry.fromStatus},${entry.toStatus},
        ${entry.eventKey},${entry.actorUserId}::uuid,${entry.reasonKey},${entry.at})`;
  }

  async claimStockOperation(tx: TxContext, op: StockOperation) {
    const count = await this.db.client(tx).$executeRaw`
      INSERT INTO order_stock_operations (id,reservation_id,kind,source_key,payload_hash,lines,
        result,applied_at)
      VALUES (${op.id}::uuid,${op.reservationId}::uuid,${op.kind},${op.sourceKey},${op.payloadHash},
        ${JSON.stringify(op.lines)}::jsonb,${JSON.stringify(op.result)}::jsonb,${op.at})
      ON CONFLICT (source_key) DO NOTHING`;
    return count === 1;
  }

  async lock(tx: TxContext, orderId: string) {
    const rows = await this.db.client(tx).$queryRaw<OrderRow[]>(Prisma.sql`
      SELECT ${ORDER_COLUMNS} FROM orders o WHERE o.id=${orderId}::uuid FOR UPDATE`);
    return rows[0] ? toStoredOrder(rows[0]) : null;
  }

  async updateStatus(tx: TxContext, change: StatusChange) {
    const s = change.status;
    const rows = await this.db.client(tx).$queryRaw<OrderRow[]>(Prisma.sql`
      UPDATE orders o SET status=${s}::text,version=o.version+1,updated_at=${change.at},
        ready_at=CASE WHEN ${s}::text='ready' THEN ${change.at} ELSE o.ready_at END,
        fulfilled_at=CASE WHEN ${s}::text IN ('delivered','picked_up') THEN ${change.at} ELSE o.fulfilled_at END,
        cancelled_at=CASE WHEN ${s}::text='cancelled' THEN ${change.at} ELSE o.cancelled_at END
      WHERE o.id=${change.id}::uuid AND o.version=${change.expectedVersion}
      RETURNING ${ORDER_COLUMNS}`);
    return rows[0] ? toStoredOrder(rows[0]) : null;
  }

  reservedAllocations(tx: TxContext, orderId: string) {
    return this.db.client(tx).$queryRaw<{ orderItemId: string; productId: string; quantity: number }[]>(
      Prisma.sql`
        SELECT a.order_item_id::text AS "orderItemId",a.product_id::text AS "productId",
          (a.reserved_quantity - a.released_quantity) AS quantity
        FROM order_stock_allocations a
        WHERE a.order_id=${orderId}::uuid AND a.disposition='reserved'
        ORDER BY a.product_id,a.order_item_id FOR UPDATE`,
    );
  }

  async settleAllocations(
    tx: TxContext,
    input: { orderId: string; disposition: 'released' | 'fulfilled'; at: Date },
  ) {
    const released = input.disposition === 'released';
    await this.db.client(tx).$executeRaw`
      UPDATE order_stock_allocations SET disposition=${input.disposition},
        released_quantity=CASE WHEN ${released}::boolean THEN reserved_quantity ELSE released_quantity END,
        version=version+1,updated_at=${input.at}
      WHERE order_id=${input.orderId}::uuid AND disposition='reserved'`;
  }
}
