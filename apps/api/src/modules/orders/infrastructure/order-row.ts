import { Prisma } from '../../../shared/persistence/generated/client';
import type { AddressSnapshot, BusinessSnapshot, StoredOrder } from '../domain/order';

/** Paise are CHECK-bounded to 2^53-1, so float8 is exact. */
export const ORDER_COLUMNS = Prisma.sql`
  o.id::text AS id,o.order_number AS "orderNumber",
  o.checkout_attempt_id::text AS "checkoutAttemptId",
  o.customer_user_id::text AS "customerUserId",o.business_id::text AS "businessId",
  o.city_id::text AS "cityId",o.area_id::text AS "areaId",o.mode,
  o.delivery_method AS "deliveryMethod",o.status,
  o.payment_attempt_id::text AS "paymentAttemptId",
  o.ordered_items_subtotal_paise::float8 AS "oSub",o.ordered_discount_paise::float8 AS "oDisc",
  o.ordered_delivery_fee_paise::float8 AS "oDel",o.ordered_platform_fee_paise::float8 AS "oPlat",
  o.ordered_total_paise::float8 AS "oTot",
  o.fulfilled_items_subtotal_paise::float8 AS "fSub",o.fulfilled_discount_paise::float8 AS "fDisc",
  o.fulfilled_delivery_fee_paise::float8 AS "fDel",o.fulfilled_platform_fee_paise::float8 AS "fPlat",
  o.fulfilled_total_paise::float8 AS "fTot",
  o.financial_version AS "financialVersion",o.version,
  o.business_snapshot AS business,o.delivery_address_snapshot AS address,
  o.ready_at AS "readyAt",o.fulfilled_at AS "fulfilledAt",o.cancelled_at AS "cancelledAt",
  o.placed_at AS "placedAt"`;

export type OrderRow = Omit<StoredOrder, 'ordered' | 'fulfilled' | 'business' | 'address'> & {
  oSub: number; oDisc: number; oDel: number; oPlat: number; oTot: number;
  fSub: number; fDisc: number; fDel: number; fPlat: number; fTot: number;
  business: unknown;
  address: unknown;
};

export function toStoredOrder(row: OrderRow): StoredOrder {
  const { oSub, oDisc, oDel, oPlat, oTot, fSub, fDisc, fDel, fPlat, fTot, business, address, ...rest } = row;
  return {
    ...rest,
    ordered: {
      itemsSubtotalPaise: oSub, discountPaise: oDisc, deliveryFeePaise: oDel,
      platformFeePaise: oPlat, totalPaise: oTot,
    },
    fulfilled: {
      itemsSubtotalPaise: fSub, discountPaise: fDisc, deliveryFeePaise: fDel,
      platformFeePaise: fPlat, totalPaise: fTot,
    },
    // Written only by this module's validated creation path.
    business: business as BusinessSnapshot,
    address: (address ?? null) as AddressSnapshot | null,
  };
}
