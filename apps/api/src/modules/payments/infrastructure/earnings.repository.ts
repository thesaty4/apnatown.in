import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../shared/persistence/generated/client';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import type { TxContext } from '../../../shared/persistence/ports';
import type { EarningsReadPort } from '../application/earnings-ports';

const IST = 'Asia/Kolkata';

/** Parameterized, read-only. Orders' fulfilled amounts are read with the Payments attempt that settled them. */
@Injectable()
export class PrismaEarningsRepository implements EarningsReadPort {
  constructor(private readonly db: PrismaDatabase) {}

  async monthlySales(tx: TxContext, input: { businessId: string; fromIstMonth: string }) {
    const rows = await this.db.client(tx).$queryRaw<
      { month: string; grossPaise: number; orders: number }[]
    >(Prisma.sql`
      SELECT to_char(o.fulfilled_at AT TIME ZONE ${IST}, 'YYYY-MM') AS month,
        sum(o.fulfilled_items_subtotal_paise - o.fulfilled_discount_paise)::float8 AS "grossPaise",
        count(*)::integer AS orders
      FROM orders o
      JOIN payment_attempts pa ON pa.id = o.payment_attempt_id
      WHERE o.business_id = ${input.businessId}::uuid
        AND o.status IN ('delivered', 'picked_up')
        AND pa.status IN ('paid', 'collected')
        AND o.fulfilled_at >= (${`${input.fromIstMonth}-01`}::date)::timestamp AT TIME ZONE ${IST}
      GROUP BY 1`);
    return new Map(rows.map((row) => [row.month, { grossPaise: row.grossPaise, orders: row.orders }]));
  }

  async activeSubscription(tx: TxContext, input: { businessId: string; at: Date }) {
    const rows = await this.db.client(tx).$queryRaw<{ planKey: string; endsAt: string | null }[]>(Prisma.sql`
      SELECT plan_key AS "planKey",
        to_char(ends_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS "endsAt"
      FROM business_subscriptions
      WHERE business_id = ${input.businessId}::uuid
        AND starts_at <= ${input.at} AND (ends_at IS NULL OR ends_at > ${input.at})
      ORDER BY starts_at DESC, id DESC LIMIT 1`);
    return rows[0] ?? null;
  }
}
