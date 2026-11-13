import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../shared/persistence/generated/client';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import type { TxContext } from '../../../shared/persistence/ports';
import type {
  BusinessCheckoutReadPort,
  CheckoutBusinessView,
} from '../application/business-checkout-read-port';

type Row = Omit<CheckoutBusinessView, 'location'> & {
  lat: number | null;
  lng: number | null;
};

const MAX_IDS = 50;

/**
 * Public context gates visibility (approved, live, public shop); the base
 * row adds address/version and settings add fulfilment. Paise are
 * CHECK-bounded to 2^53-1, so float8 is exact.
 */
@Injectable()
export class PrismaBusinessCheckoutReadRepository implements BusinessCheckoutReadPort {
  constructor(private readonly db: PrismaDatabase) {}

  async forCheckout(tx: TxContext, businessIds: readonly string[], lock = false) {
    const ids = [...new Set(businessIds)].sort();
    if (ids.length === 0) return new Map<string, CheckoutBusinessView>();
    if (ids.length > MAX_IDS) throw new Error('CHECKOUT_BUSINESS_READ_LIMIT');
    const forUpdate = lock ? Prisma.sql`FOR SHARE OF b` : Prisma.empty;
    const rows = await this.db.client(tx).$queryRaw<Row[]>(Prisma.sql`
      SELECT b.id::text AS "businessId",b.kind,p.slug,p.name_en AS "nameEn",
        p.name_hi AS "nameHi",b.city_id::text AS "cityId",b.area_id::text AS "areaId",
        p.area_name_en AS "areaNameEn",p.area_name_hi AS "areaNameHi",
        b.address_text AS "addressText",
        ST_Y(b.location::geometry) AS lat,ST_X(b.location::geometry) AS lng,
        b.version,coalesce(s.temporarily_closed,false) AS "temporarilyClosed",
        s.delivery_method AS "deliveryMethod",
        s.delivery_radius_km::float8 AS "deliveryRadiusKm",
        s.delivery_fee_paise::float8 AS "deliveryFeePaise",
        s.minimum_order_paise::float8 AS "minimumOrderPaise",
        coalesce(s.pickup_enabled,false) AS "pickupEnabled",
        s.pickup_instructions AS "pickupInstructions"
      FROM businesses b
      JOIN businesses_public_context p ON p.id=b.id
      LEFT JOIN business_settings s ON s.business_id=b.id
      WHERE b.id = ANY(${ids}::uuid[]) AND b.status='approved' AND b.deleted_at IS NULL
        AND b.city_id IS NOT NULL AND b.area_id IS NOT NULL
      ORDER BY b.id ${forUpdate}`);
    return new Map(
      rows.map(({ lat, lng, ...row }) => [
        row.businessId,
        { ...row, location: lat === null || lng === null ? null : { lat, lng } },
      ]),
    );
  }
}
