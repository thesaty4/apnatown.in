import { createHash } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { canonicalJson } from '@apnatown/shared';
import type { TxContext } from '../../../shared/persistence/ports';
import { ID_PROVIDER, type IdProvider } from '../../../shared/runtime/providers';
import { PRODUCT_STOCK, type ProductStockPort } from '../../products/application/product-stock-port';
import { ORDER_WRITES, type OrderWriteRepository, type StockOperation } from '../domain/order';

type Line = StockOperation['lines'][number];

/**
 * Durable stock operations (orders BE `order_stock_operations`): the
 * Products mutation and the unique source-key claim commit together; a
 * replayed source key aborts the transaction instead of moving stock twice.
 */
@Injectable()
export class OrderStock {
  constructor(
    @Inject(ORDER_WRITES) private readonly writes: OrderWriteRepository,
    @Inject(PRODUCT_STOCK) private readonly stock: ProductStockPort,
    @Inject(ID_PROVIDER) private readonly ids: IdProvider,
  ) {}

  /** reservationId = checkoutAttemptId. False when already reserved. */
  async reserve(tx: TxContext, reservationId: string, lines: readonly Line[], at: Date): Promise<boolean> {
    const result = await this.stock.reserve(tx, lines, at);
    return this.claim(tx, { kind: 'reserve', reservationId, sourceKey: `reserve:${reservationId}`, lines, result, at });
  }

  /** Releases only still-reserved allocations of the order (never twice). */
  async releaseOrder(tx: TxContext, input: { orderId: string; reservationId: string; at: Date }) {
    const lines = await this.writes.reservedAllocations(tx, input.orderId);
    if (!lines.length) return;
    const result = await this.stock.release(tx, lines, input.at);
    const claimed = await this.claim(tx, {
      kind: 'release',
      reservationId: input.reservationId,
      sourceKey: `release:cancel:${input.orderId}`,
      lines,
      result,
      at: input.at,
    });
    if (!claimed) throw new Error('ORDER_STOCK_RELEASE_REPLAYED');
    await this.writes.settleAllocations(tx, { orderId: input.orderId, disposition: 'released', at: input.at });
  }

  private claim(tx: TxContext, op: Omit<StockOperation, 'id' | 'payloadHash'>): Promise<boolean> {
    const payloadHash = createHash('sha256').update(canonicalJson(op.lines.map((l) => ({ ...l })))).digest('hex');
    return this.writes.claimStockOperation(tx, { ...op, id: this.ids.uuidv7(), payloadHash });
  }
}
