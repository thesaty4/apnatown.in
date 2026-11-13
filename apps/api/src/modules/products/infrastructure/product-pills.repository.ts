import { Injectable } from '@nestjs/common';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import type { TxContext } from '../../../shared/persistence/ports';
import type {
  ProductPillsRepository,
  StoredPill,
} from '../application/product-owner-ports';

/** Parameterized SQL only; Products owns `product_category_pills`. */
@Injectable()
export class PrismaProductPillsRepository implements ProductPillsRepository {
  constructor(private readonly db: PrismaDatabase) {}

  saved(tx: TxContext, businessId: string): Promise<StoredPill[]> {
    return this.db.client(tx).$queryRaw<StoredPill[]>`
      SELECT subcategory_id::text AS "subcategoryId",position,label_en AS "labelEn",
        label_hi AS "labelHi",hidden
      FROM product_category_pills WHERE business_id=${businessId}::uuid
      ORDER BY position`;
  }

  async productSubcategoryIds(
    tx: TxContext,
    businessId: string,
  ): Promise<string[]> {
    const rows = await this.db.client(tx).$queryRaw<{ id: string }[]>`
      SELECT DISTINCT subcategory_id::text AS id FROM products
      WHERE business_id=${businessId}::uuid AND deleted_at IS NULL`;
    return rows.map((row) => row.id);
  }

  async replace(
    tx: TxContext,
    businessId: string,
    items: readonly StoredPill[],
  ): Promise<void> {
    const client = this.db.client(tx);
    await client.$executeRaw`
      DELETE FROM product_category_pills WHERE business_id=${businessId}::uuid`;
    for (const item of items)
      await client.$executeRaw`
        INSERT INTO product_category_pills (business_id,subcategory_id,position,label_en,label_hi,hidden)
        VALUES (${businessId}::uuid,${item.subcategoryId}::uuid,${item.position},
          ${item.labelEn},${item.labelHi},${item.hidden})`;
  }
}
