import { Injectable } from '@nestjs/common';
import { DomainError } from '../../../shared/errors/errors';
import { Prisma } from '../../../shared/persistence/generated/client';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import type { TxContext } from '../../../shared/persistence/ports';
import type {
  DeliveryJobRepository,
  GeoPoint,
  JobProgress,
  NewJob,
  StoredJob,
} from '../domain/delivery-job';

const iso = (column: string) =>
  Prisma.raw(`to_char(${column} AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`);
const point = (p: GeoPoint) =>
  Prisma.sql`ST_SetSRID(ST_MakePoint(${p.lng}::float8, ${p.lat}::float8), 4326)::geography`;

/** Paise columns are CHECK-bounded to 2^53-1, so float8 is exact. */
export const JOB_COLUMNS = Prisma.sql`
  j.id::text AS id, j.order_id::text AS "orderId", j.city_id::text AS "cityId",
  j.area_id::text AS "areaId", j.rider_user_id::text AS "riderUserId", j.status,
  j.assignment_state AS "assignmentState", j.fail_reason AS "failReason",
  j.distance_m AS "distanceM", j.estimate_base_paise::float8 AS "eBase",
  j.estimate_per_km_paise::float8 AS "ePerKm", j.estimate_total_paise::float8 AS "eTotal",
  j.estimate_settings_version AS "eVersion", ${iso('j.estimated_at')} AS "eAt",
  j.earned_base_paise::float8 AS "aBase", j.earned_per_km_paise::float8 AS "aPerKm",
  j.earned_distance_m AS "aDistance", j.earned_distance_pay_paise::float8 AS "aDistancePay",
  j.earned_rounding_paise::float8 AS "aRounding", j.earned_total_paise::float8 AS "aTotal",
  j.earned_settings_version AS "aVersion", ${iso('j.earned_at')} AS "aAt",
  j.payable_financial_version AS "payableFinancialVersion",
  j.checked_item_ids::text[] AS "checkedItemIds", j.version,
  ${iso('j.accepted_at')} AS "acceptedAt", ${iso('j.delivered_at')} AS "deliveredAt",
  ${iso('j.failed_at')} AS "failedAt", ${iso('j.cancelled_at')} AS "cancelledAt",
  ${iso('j.created_at')} AS "createdAt"`;

export interface JobRow {
  id: string; orderId: string; cityId: string; areaId: string; riderUserId: string | null;
  status: StoredJob['status']; assignmentState: StoredJob['assignmentState'];
  failReason: StoredJob['failReason']; distanceM: number;
  eBase: number; ePerKm: number; eTotal: number; eVersion: string; eAt: string;
  aBase: number | null; aPerKm: number | null; aDistance: number | null; aDistancePay: number | null;
  aRounding: number | null; aTotal: number | null; aVersion: string | null; aAt: string | null;
  payableFinancialVersion: number; checkedItemIds: string[]; version: number;
  acceptedAt: string | null; deliveredAt: string | null; failedAt: string | null;
  cancelledAt: string | null; createdAt: string;
}

export function toStoredJob(row: JobRow): StoredJob {
  const { eBase, ePerKm, eTotal, eVersion, eAt, aBase, aPerKm, aDistance, aDistancePay, aRounding, aTotal, aVersion, aAt, ...rest } = row;
  return {
    ...rest,
    estimate: { basePaise: eBase, perKmPaise: ePerKm, totalPaise: eTotal, settingsVersion: eVersion, estimatedAt: eAt },
    earned:
      aTotal === null
        ? null
        : {
            basePaise: aBase!, perKmPaise: aPerKm!, distanceM: aDistance!, distancePayPaise: aDistancePay!,
            roundingPaise: aRounding!, totalPaise: aTotal, settingsVersion: aVersion!, earnedAt: aAt!,
          },
  };
}

function mentions(error: unknown, constraint: string): boolean {
  for (let current = error, depth = 0; current && depth < 4; depth += 1) {
    const { message, meta, cause } = current as { message?: unknown; meta?: unknown; cause?: unknown };
    if (`${String(message)} ${JSON.stringify(meta ?? null)}`.includes(constraint)) return true;
    current = cause;
  }
  return false;
}

// Allow-listed status -> timestamp column (never a client value).
const PROGRESS_COLUMN: Readonly<Record<JobProgress['status'], string>> = {
  reached_shop: 'reached_shop_at',
  picked_up: 'picked_up_at',
  reached_drop: 'reached_drop_at',
  failed: 'failed_at',
};

/** Owning `delivery_jobs` adapter; parameterized SQL only. */
@Injectable()
export class PrismaDeliveryJobRepository implements DeliveryJobRepository {
  constructor(private readonly db: PrismaDatabase) {}

  async distanceM(tx: TxContext, from: GeoPoint, to: GeoPoint) {
    const [row] = await this.db.client(tx).$queryRaw<{ m: number }[]>(
      Prisma.sql`SELECT round(ST_Distance(${point(from)}, ${point(to)}))::int AS m`,
    );
    return row!.m;
  }

  async insert(tx: TxContext, job: NewJob) {
    const rows = await this.db.client(tx).$queryRaw<JobRow[]>(Prisma.sql`
      INSERT INTO delivery_jobs AS j (id, order_id, city_id, area_id, status, assignment_state,
        pickup_point, drop_point, distance_m, estimate_base_paise, estimate_per_km_paise,
        estimate_total_paise, estimate_settings_version, estimated_at, payable_financial_version,
        created_at, updated_at)
      VALUES (${job.id}::uuid, ${job.orderId}::uuid, ${job.cityId}::uuid, ${job.areaId}::uuid,
        'requested', 'queued', ${point(job.pickup)}, ${point(job.drop)}, ${job.distanceM},
        ${job.estimate.basePaise}, ${job.estimate.perKmPaise}, ${job.estimate.totalPaise},
        ${job.estimate.settingsVersion}, ${job.at}, ${job.payableFinancialVersion}, ${job.at}, ${job.at})
      ON CONFLICT (order_id) DO NOTHING
      RETURNING ${JOB_COLUMNS}`);
    return rows[0] ? toStoredJob(rows[0]) : null;
  }

  byOrder(tx: TxContext, orderId: string, lock = false) {
    return this.one(tx, Prisma.sql`j.order_id = ${orderId}::uuid`, lock);
  }

  find(tx: TxContext, jobId: string, lock = false) {
    return this.one(tx, Prisma.sql`j.id = ${jobId}::uuid`, lock);
  }

  setAssignmentState(tx: TxContext, input: { id: string; expectedVersion: number; state: string; at: Date }) {
    return this.update(tx, input, Prisma.sql`assignment_state = ${input.state}`,
      Prisma.sql`j.status = 'requested'`);
  }

  async assign(tx: TxContext, input: { id: string; expectedVersion: number; riderUserId: string; at: Date }) {
    try {
      return await this.update(
        tx, input,
        Prisma.sql`rider_user_id = ${input.riderUserId}::uuid, status = 'accepted',
          assignment_state = 'assigned', accepted_at = ${input.at}`,
        Prisma.sql`j.status = 'requested' AND j.rider_user_id IS NULL`,
      );
    } catch (error) {
      // Partial unique active-rider index: the final one-active-job backstop.
      if (mentions(error, 'delivery_jobs_rider_active_key')) throw new DomainError('RIDER_HAS_ACTIVE_JOB');
      throw error;
    }
  }

  progress(tx: TxContext, input: JobProgress) {
    const column = Prisma.raw(PROGRESS_COLUMN[input.status]);
    const checked = input.checked
      ? Prisma.sql`, checked_item_ids = ${[...input.checked.itemIds]}::uuid[],
          checked_financial_version = ${input.checked.financialVersion}`
      : Prisma.empty;
    const reason = input.failReason ? Prisma.sql`, fail_reason = ${input.failReason}` : Prisma.empty;
    return this.update(
      tx, input,
      Prisma.sql`status = ${input.status}, ${column} = ${input.at}${checked}${reason}`,
      Prisma.sql`j.status IN ('accepted','reached_shop','picked_up','reached_drop')`,
    );
  }

  deliver(tx: TxContext, input: Parameters<DeliveryJobRepository['deliver']>[1]) {
    const e = input.earned;
    return this.update(
      tx, input,
      Prisma.sql`status = 'delivered', delivered_at = ${input.at}, earned_base_paise = ${e.basePaise},
        earned_per_km_paise = ${e.perKmPaise}, earned_distance_m = ${e.distanceM},
        earned_distance_pay_paise = ${e.distancePayPaise}, earned_rounding_paise = ${e.roundingPaise},
        earned_total_paise = ${e.totalPaise}, earned_settings_version = ${e.settingsVersion},
        earned_at = ${input.at}`,
      Prisma.sql`j.status = 'reached_drop'`,
    );
  }

  private async one(tx: TxContext, where: Prisma.Sql, lock: boolean) {
    const rows = await this.db.client(tx).$queryRaw<JobRow[]>(Prisma.sql`
      SELECT ${JOB_COLUMNS} FROM delivery_jobs j WHERE ${where}
      ${lock ? Prisma.sql`FOR UPDATE OF j` : Prisma.empty}`);
    return rows[0] ? toStoredJob(rows[0]) : null;
  }

  private async update(
    tx: TxContext,
    input: { id: string; expectedVersion: number; at: Date },
    set: Prisma.Sql,
    guard: Prisma.Sql,
  ) {
    const rows = await this.db.client(tx).$queryRaw<JobRow[]>(Prisma.sql`
      UPDATE delivery_jobs j SET ${set}, version = j.version + 1, updated_at = ${input.at}
      WHERE j.id = ${input.id}::uuid AND j.version = ${input.expectedVersion} AND ${guard}
      RETURNING ${JOB_COLUMNS}`);
    return rows[0] ? toStoredJob(rows[0]) : null;
  }
}
