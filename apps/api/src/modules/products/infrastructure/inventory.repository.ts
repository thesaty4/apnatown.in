import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../shared/persistence/generated/client';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import type { TxContext } from '../../../shared/persistence/ports';
import type {
  InventoryRepository,
  InventoryRow,
  ProductPosition,
  StockState,
  StoredInventory,
} from '../application/product-owner-ports';

const inventoryColumns = Prisma.sql`
  i.on_hand AS "onHand",i.low_stock_threshold AS "lowStockThreshold",
  i.available_for_sale AS "availableForSale",i.version,i.updated_at AS "updatedAt"`;

/** Parameterized SQL only; Products owns `inventory`. */
@Injectable()
export class PrismaInventoryRepository implements InventoryRepository {
  constructor(private readonly db: PrismaDatabase) {}

  page(
    tx: TxContext,
    input: { businessId: string; after?: ProductPosition; limit: number },
  ): Promise<InventoryRow[]> {
    const after = input.after
      ? Prisma.sql`AND (p.created_at,p.id) < (${input.after.createdAt}::timestamptz,${input.after.id}::uuid)`
      : Prisma.empty;
    return this.db.client(tx).$queryRaw<InventoryRow[]>`
      SELECT p.id::text AS "productId",p.slug,p.name_en AS "nameEn",p.name_hi AS "nameHi",
        p.sku,p.unit,p.created_at AS "createdAt",${inventoryColumns}
      FROM products p JOIN inventory i ON i.product_id=p.id
      WHERE p.business_id=${input.businessId}::uuid AND p.deleted_at IS NULL ${after}
      ORDER BY p.created_at DESC,p.id DESC
      LIMIT ${input.limit + 1}`;
  }

  async update(
    tx: TxContext,
    input: StockState & { productId: string; expectedVersion: number; at: Date },
  ): Promise<StoredInventory | null> {
    const rows = await this.db.client(tx).$queryRaw<StoredInventory[]>`
      UPDATE inventory i SET on_hand=${input.onHand},low_stock_threshold=${input.lowStockThreshold},
        available_for_sale=${input.availableForSale},version=version+1,updated_at=${input.at}
      WHERE i.product_id=${input.productId}::uuid AND i.version=${input.expectedVersion}
      RETURNING ${inventoryColumns}`;
    return rows[0] ?? null;
  }

  lowRows(
    tx: TxContext,
    businessId: string,
  ): Promise<(StockState & { productId: string; version: number })[]> {
    return this.db.client(tx).$queryRaw`
      SELECT i.product_id::text AS "productId",i.version,i.on_hand AS "onHand",
        i.low_stock_threshold AS "lowStockThreshold",i.available_for_sale AS "availableForSale"
      FROM inventory i JOIN products p ON p.id=i.product_id
      WHERE p.business_id=${businessId}::uuid AND p.deleted_at IS NULL
        AND i.on_hand <= i.low_stock_threshold
      ORDER BY i.product_id FOR UPDATE OF i`;
  }
}
