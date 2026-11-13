import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../shared/persistence/generated/client';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import type { TxContext } from '../../../shared/persistence/ports';
import type {
  BusinessCartReadPort,
  CartBusinessView,
} from '../application/business-cart-read-port';

type Row = Omit<CartBusinessView, 'minimumOrderPaise'> & {
  minimumOrderPaise: number | null;
};

const MAX_IDS = 200;

/** Public context gates visibility; settings add the delivery minimum. */
@Injectable()
export class PrismaBusinessCartReadRepository implements BusinessCartReadPort {
  constructor(private readonly db: PrismaDatabase) {}

  async forCart(tx: TxContext, businessIds: readonly string[]) {
    const ids = [...new Set(businessIds)];
    if (ids.length === 0) return new Map<string, CartBusinessView>();
    if (ids.length > MAX_IDS) throw new Error('CART_BUSINESS_READ_LIMIT');
    const rows = await this.db.client(tx).$queryRaw<Row[]>(Prisma.sql`
      SELECT b.id::text AS "businessId",b.slug,b.kind,b.name_en AS "nameEn",
        b.name_hi AS "nameHi",b.area_name_en AS "areaNameEn",b.area_name_hi AS "areaNameHi",
        coalesce(b.pickup,false) AS "pickupEnabled",
        (b.delivery_method IS NOT NULL) AS "deliveryAvailable",
        coalesce(s.temporarily_closed,false) AS "temporarilyClosed",
        s.minimum_order_paise::float8 AS "minimumOrderPaise"
      FROM businesses_public_context b
      LEFT JOIN business_settings s ON s.business_id=b.id
      WHERE b.id = ANY(${ids}::uuid[])`);
    return new Map(rows.map((row) => [row.businessId, row]));
  }
}
