import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../shared/persistence/generated/client';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import type { TxContext } from '../../../shared/persistence/ports';
import type { DeliveryJobReadPort } from '../application/delivery-ports';
import { JOB_COLUMNS, toStoredJob, type JobRow } from './prisma-delivery-job.repository';

const ACTIVE = Prisma.sql`('accepted','reached_shop','picked_up','reached_drop')`;
const TERMINAL = Prisma.sql`('delivered','failed','cancelled')`;
const TERMINAL_AT = Prisma.sql`COALESCE(j.delivered_at, j.failed_at, j.cancelled_at)`;

/**
 * Rider-owned job reads over `delivery_jobs` (replaces the pre-Orders empty
 * adapter). Own rows only; terminal timestamps drive rolling periods.
 */
@Injectable()
export class PrismaDeliveryJobReadRepository implements DeliveryJobReadPort {
  constructor(private readonly db: PrismaDatabase) {}

  async activeJobId(tx: TxContext, riderUserId: string) {
    return (await this.activeJob(tx, riderUserId))?.id ?? null;
  }

  async activeJob(tx: TxContext, riderUserId: string) {
    const rows = await this.db.client(tx).$queryRaw<JobRow[]>(Prisma.sql`
      SELECT ${JOB_COLUMNS} FROM delivery_jobs j
      WHERE j.rider_user_id = ${riderUserId}::uuid AND j.status IN ${ACTIVE} LIMIT 1`);
    return rows[0] ? toStoredJob(rows[0]) : null;
  }

  async completedTotals(tx: TxContext, input: { riderUserId: string; from: Date; toExclusive: Date }) {
    const [row] = await this.db.client(tx).$queryRaw<{ count: number; total: number }[]>(Prisma.sql`
      SELECT count(*)::int AS count, COALESCE(sum(j.earned_total_paise), 0)::float8 AS total
      FROM delivery_jobs j
      WHERE j.rider_user_id = ${input.riderUserId}::uuid AND j.status = 'delivered'
        AND j.earned_at >= ${input.from} AND j.earned_at < ${input.toExclusive}`);
    return { count: row?.count ?? 0, totalPaise: row?.total ?? 0 };
  }

  async history(tx: TxContext, input: Parameters<DeliveryJobReadPort['history']>[1]) {
    const [afterAt, afterId] = input.after ?? [];
    const rows = await this.db.client(tx).$queryRaw<JobRow[]>(Prisma.sql`
      SELECT ${JOB_COLUMNS} FROM delivery_jobs j
      WHERE j.rider_user_id = ${input.riderUserId}::uuid
        AND ${input.deliveredOnly ? Prisma.sql`j.status = 'delivered'` : Prisma.sql`j.status IN ${TERMINAL}`}
        AND ${TERMINAL_AT} < ${input.toExclusive}
        ${input.from ? Prisma.sql`AND ${TERMINAL_AT} >= ${input.from}` : Prisma.empty}
        ${afterAt !== undefined && afterId !== undefined
          ? Prisma.sql`AND (${TERMINAL_AT}, j.id) < (${new Date(String(afterAt))}::timestamptz, ${String(afterId)}::uuid)`
          : Prisma.empty}
      ORDER BY ${TERMINAL_AT} DESC, j.id DESC LIMIT ${input.limit}`);
    return rows.map(toStoredJob);
  }

  async historyDetail(tx: TxContext, input: { riderUserId: string; jobId: string }) {
    const rows = await this.db.client(tx).$queryRaw<JobRow[]>(Prisma.sql`
      SELECT ${JOB_COLUMNS} FROM delivery_jobs j
      WHERE j.id = ${input.jobId}::uuid AND j.rider_user_id = ${input.riderUserId}::uuid
        AND j.status IN ${TERMINAL}`);
    return rows[0] ? toStoredJob(rows[0]) : null;
  }
}
