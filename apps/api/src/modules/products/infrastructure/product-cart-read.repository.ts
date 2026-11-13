import { Injectable } from '@nestjs/common';
import { PublicImageVariantSchema } from '@apnatown/shared';
import { Prisma } from '../../../shared/persistence/generated/client';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import type { TxContext } from '../../../shared/persistence/ports';
import type {
  CartProductView,
  ProductCartReadPort,
} from '../application/product-cart-read-port';

type Row = {
  productId: string;
  businessId: string;
  slug: string | null;
  nameEn: string;
  nameHi: string | null;
  unit: string;
  visible: boolean;
  pricePaise: number | null;
  mrpPaise: number | null;
  onHand: number;
  availableForSale: boolean;
  variants: unknown;
  image: unknown;
};

const MAX_IDS = 200;

function variants(value: unknown): CartProductView['variants'] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item: unknown) => {
    const row = item as { id?: unknown; label?: unknown } | null;
    return row && typeof row.id === 'string' && typeof row.label === 'string'
      ? [{ id: row.id, label: row.label }]
      : [];
  });
}

/**
 * Visibility and the effective price come only from the Products-owned
 * `products_public_discovery` projection (public shop, category, offers);
 * stock is the shared per-product `inventory` row. Paise are CHECK-bounded
 * to 2^53-1, so float8 is exact.
 */
@Injectable()
export class PrismaProductCartReadRepository implements ProductCartReadPort {
  constructor(private readonly db: PrismaDatabase) {}

  async forCart(tx: TxContext, productIds: readonly string[]) {
    const ids = [...new Set(productIds)];
    if (ids.length === 0) return new Map<string, CartProductView>();
    if (ids.length > MAX_IDS) throw new Error('CART_PRODUCT_READ_LIMIT');
    const rows = await this.db.client(tx).$queryRaw<Row[]>(Prisma.sql`
      SELECT p.id::text AS "productId",p.business_id::text AS "businessId",
        CASE WHEN d.id IS NULL THEN NULL ELSE p.slug END AS slug,
        p.name_en AS "nameEn",p.name_hi AS "nameHi",p.unit,
        (d.id IS NOT NULL) AS visible,
        d.price_paise::float8 AS "pricePaise",d.mrp_paise::float8 AS "mrpPaise",
        coalesce(i.on_hand,0)::int AS "onHand",
        coalesce(i.available_for_sale,false) AS "availableForSale",
        coalesce(v.items,'[]'::jsonb) AS variants,image.image
      FROM products p
      LEFT JOIN products_public_discovery d ON d.id=p.id
      LEFT JOIN inventory i ON i.product_id=p.id
      LEFT JOIN LATERAL (SELECT jsonb_agg(jsonb_build_object('id',pv.id::text,'label',pv.label)
          ORDER BY pv.position,pv.id) AS items
        FROM product_variants pv WHERE pv.product_id=p.id AND pv.active) v ON true
      LEFT JOIN LATERAL (SELECT m.image FROM media_public_listing_images m
        WHERE d.id IS NOT NULL AND m.placement_type='product' AND m.placement_id=p.id
        ORDER BY m.position,(m.width<=640) DESC,m.width DESC LIMIT 1) image ON true
      WHERE p.id = ANY(${ids}::uuid[])`);
    const result = new Map<string, CartProductView>();
    for (const row of rows) {
      const image = PublicImageVariantSchema.nullable().safeParse(row.image ?? null);
      result.set(row.productId, {
        productId: row.productId,
        businessId: row.businessId,
        slug: row.slug,
        nameEn: row.nameEn,
        nameHi: row.nameHi,
        unit: row.unit,
        visible: row.visible,
        pricePaise: row.visible ? row.pricePaise : null,
        mrpPaise: row.visible ? row.mrpPaise : null,
        image: image.success ? image.data : null,
        stock: { onHand: row.onHand, availableForSale: row.availableForSale },
        variants: variants(row.variants),
      });
    }
    return result;
  }
}
