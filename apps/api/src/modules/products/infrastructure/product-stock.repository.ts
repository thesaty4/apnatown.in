import { Injectable } from '@nestjs/common';
import { DomainError } from '../../../shared/errors/errors';
import { Prisma } from '../../../shared/persistence/generated/client';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import type { TxContext } from '../../../shared/persistence/ports';
import type {
  ProductStockPort,
  StockLine,
  StockResult,
} from '../application/product-stock-port';

type Locked = { productId: string; onHand: number; availableForSale: boolean; live: boolean };

/** Sums labels into one product line; stable product-ID lock order. */
function aggregate(lines: readonly StockLine[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const line of lines) {
    if (!Number.isSafeInteger(line.quantity) || line.quantity <= 0)
      throw new Error('STOCK_QUANTITY_INVALID');
    totals.set(line.productId, (totals.get(line.productId) ?? 0) + line.quantity);
  }
  return new Map([...totals].sort(([a], [b]) => a.localeCompare(b)));
}

/** Parameterized SQL only; Products owns `inventory`. */
@Injectable()
export class PrismaProductStockRepository implements ProductStockPort {
  constructor(private readonly db: PrismaDatabase) {}

  async reserve(tx: TxContext, lines: readonly StockLine[], at: Date): Promise<StockResult> {
    const totals = aggregate(lines);
    const locked = await this.lock(tx, [...totals.keys()]);
    for (const [productId, quantity] of totals) {
      const row = locked.get(productId);
      if (!row || !row.live || !row.availableForSale || row.onHand < quantity)
        throw new DomainError('PRODUCT_NOT_AVAILABLE');
    }
    return this.apply(tx, totals, -1, at);
  }

  async release(tx: TxContext, lines: readonly StockLine[], at: Date): Promise<StockResult> {
    const totals = aggregate(lines);
    // Tombstoned products keep their inventory row; restocking is still exact.
    await this.lock(tx, [...totals.keys()]);
    return this.apply(tx, totals, 1, at);
  }

  private async lock(tx: TxContext, ids: readonly string[]): Promise<Map<string, Locked>> {
    const rows = await this.db.client(tx).$queryRaw<Locked[]>(Prisma.sql`
      SELECT i.product_id::text AS "productId",i.on_hand AS "onHand",
        i.available_for_sale AS "availableForSale",(p.deleted_at IS NULL) AS live
      FROM inventory i JOIN products p ON p.id=i.product_id
      WHERE i.product_id = ANY(${ids}::uuid[])
      ORDER BY i.product_id FOR UPDATE OF i`);
    return new Map(rows.map((row) => [row.productId, row]));
  }

  private async apply(
    tx: TxContext,
    totals: ReadonlyMap<string, number>,
    sign: 1 | -1,
    at: Date,
  ): Promise<StockResult> {
    const stocks: { productId: string; version: number; onHand: number }[] = [];
    for (const [productId, quantity] of totals) {
      const rows = await this.db.client(tx).$queryRaw<{ version: number; onHand: number }[]>(Prisma.sql`
        UPDATE inventory SET on_hand=on_hand + ${sign * quantity}::int,
          version=version+1,updated_at=${at}
        WHERE product_id=${productId}::uuid
        RETURNING version,on_hand AS "onHand"`);
      if (!rows[0]) throw new DomainError('PRODUCT_NOT_AVAILABLE');
      stocks.push({ productId, ...rows[0] });
    }
    return { stocks };
  }
}
