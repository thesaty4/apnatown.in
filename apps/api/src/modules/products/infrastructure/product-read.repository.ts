import { Injectable } from '@nestjs/common';
import { ProductPublicSchema } from '@apnatown/shared';
import { stockMaxQuantity } from '@apnatown/shared/cart';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import { publicListingDetail } from '../../../shared/persistence/public-listing-detail';
import type { ProductReadPort } from '../application/product-read.service';
import { productPublicProjection } from './public-projection';

type PurchaseRow = {
  categoryId: string;
  subcategoryId: string;
  onHand: number;
  availableForSale: boolean;
  variants: { id: string; label: string }[];
};

@Injectable()
export class PrismaProductReadRepository implements ProductReadPort {
  constructor(private readonly db: PrismaDatabase) {}
  bySlug(slug: string) {
    return this.db.transaction(async (tx) => {
      const client = this.db.client(tx);
      await client.$executeRaw`SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY`;
      const result = await publicListingDetail(client,productPublicProjection,slug);
      if (!result) return null;
      // Products-owned rows of the already-public product (same snapshot).
      const [row] = await client.$queryRaw<PurchaseRow[]>`
        SELECT p.category_id::text AS "categoryId",p.subcategory_id::text AS "subcategoryId",
          coalesce(i.on_hand,0)::int AS "onHand",
          coalesce(i.available_for_sale,false) AS "availableForSale",
          coalesce(v.items,'[]'::jsonb) AS variants
        FROM products p
        LEFT JOIN inventory i ON i.product_id=p.id
        LEFT JOIN LATERAL (SELECT jsonb_agg(jsonb_build_object('id',a.id::text,'label',a.label)
            ORDER BY a.position,a.id) AS items
          FROM (SELECT pv.id,pv.label,pv.position FROM product_variants pv
            WHERE pv.product_id=p.id AND pv.active ORDER BY pv.position,pv.id LIMIT 20) a) v ON true
        WHERE p.id=${result.item.id}::uuid AND p.deleted_at IS NULL`;
      if (!row) return null;
      const maxQuantity = stockMaxQuantity(row);
      return ProductPublicSchema.parse({
        ...result,
        categoryId: row.categoryId, subcategoryId: row.subcategoryId,
        variants: row.variants,
        inventory: { inStock: maxQuantity > 0, maxQuantity },
        orderability: { orderable: false, reasonCode: 'CHECKOUT_UNAVAILABLE' },
      });
    });
  }
}
