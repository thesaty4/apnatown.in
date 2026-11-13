import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../shared/persistence/generated/client';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import type { TxContext } from '../../../shared/persistence/ports';
import type {
  CandidateRow,
  DeliveryOfferRepository,
  GeoPoint,
  RiderPublicRow,
  StoredOffer,
} from '../domain/delivery-job';

const OFFER_COLUMNS = Prisma.sql`o.id::text AS id, o.job_id::text AS "jobId",
  o.rider_user_id::text AS "riderUserId", o.status, o.expires_at AS "expiresAt", o.version`;
const ACTIVE = Prisma.sql`('accepted','reached_shop','picked_up','reached_drop')`;

/** Distance from the job's pickup (or a supplied shop point) to the rider. */
function riderDistance(jobId: string | null, pickup?: GeoPoint): Prisma.Sql {
  const origin = pickup
    ? Prisma.sql`ST_SetSRID(ST_MakePoint(${pickup.lng}::float8, ${pickup.lat}::float8), 4326)::geography`
    : jobId
      ? Prisma.sql`(SELECT pickup_point FROM delivery_jobs WHERE id = ${jobId}::uuid)`
      : Prisma.sql`NULL::geography`;
  return Prisma.sql`round(ST_Distance(r.last_location, ${origin}))::int`;
}

/** Busy / pending-offer / declined flags shared by picker and auto-assign. */
function flags(jobId: string | null, now: Date): Prisma.Sql {
  return Prisma.sql`
    EXISTS (SELECT 1 FROM delivery_jobs a WHERE a.rider_user_id = r.user_id AND a.status IN ${ACTIVE}) AS busy,
    EXISTS (SELECT 1 FROM delivery_offers p WHERE p.rider_user_id = r.user_id AND p.status = 'offered'
      AND p.expires_at > ${now}
      ${jobId ? Prisma.sql`AND p.job_id <> ${jobId}::uuid` : Prisma.empty}) AS "pendingOffer",
    ${jobId
      ? Prisma.sql`EXISTS (SELECT 1 FROM delivery_offers d WHERE d.job_id = ${jobId}::uuid
          AND d.rider_user_id = r.user_id)`
      : Prisma.sql`false`} AS declined`;
}

/**
 * Owning `delivery_offers` adapter and dispatch candidate reads over
 * Delivery's own `rider_profiles`/`delivery_jobs`. Parameterized SQL only;
 * rider rows are not locked here (acceptance rechecks under the rider lock).
 */
@Injectable()
export class PrismaDeliveryOfferRepository implements DeliveryOfferRepository {
  constructor(private readonly db: PrismaDatabase) {}

  async insert(tx: TxContext, offer: { id: string; jobId: string; riderUserId: string; expiresAt: Date; at: Date }) {
    const [row] = await this.db.client(tx).$queryRaw<StoredOffer[]>(Prisma.sql`
      INSERT INTO delivery_offers AS o (id, job_id, rider_user_id, status, expires_at, created_at, updated_at)
      VALUES (${offer.id}::uuid, ${offer.jobId}::uuid, ${offer.riderUserId}::uuid, 'offered',
        ${offer.expiresAt}, ${offer.at}, ${offer.at})
      RETURNING ${OFFER_COLUMNS}`);
    return row!;
  }

  find(tx: TxContext, offerId: string, lock = false) {
    return this.one(tx, Prisma.sql`o.id = ${offerId}::uuid`, lock);
  }

  liveForJob(tx: TxContext, jobId: string, lock = false) {
    return this.one(tx, Prisma.sql`o.job_id = ${jobId}::uuid AND o.status = 'offered'`, lock);
  }

  currentFor(tx: TxContext, riderUserId: string, now: Date) {
    return this.one(
      tx,
      Prisma.sql`o.rider_user_id = ${riderUserId}::uuid AND o.status = 'offered' AND o.expires_at > ${now}`,
      false,
    );
  }

  async respond(tx: TxContext, input: { id: string; expectedVersion: number; status: string; at: Date }) {
    const count = await this.db.client(tx).$executeRaw(Prisma.sql`
      UPDATE delivery_offers SET status = ${input.status}, responded_at = ${input.at},
        version = version + 1, updated_at = ${input.at}
      WHERE id = ${input.id}::uuid AND version = ${input.expectedVersion} AND status = 'offered'`);
    return count === 1;
  }

  async dueIds(tx: TxContext, now: Date, limit: number) {
    const rows = await this.db.client(tx).$queryRaw<{ id: string }[]>(Prisma.sql`
      SELECT o.id::text AS id FROM delivery_offers o
      WHERE o.status = 'offered' AND o.expires_at <= ${now}
      ORDER BY o.expires_at, o.id LIMIT ${limit}`);
    return rows.map((row) => row.id);
  }

  async nextCandidate(tx: TxContext, input: { jobId: string; cityId: string; now: Date }) {
    const rows = await this.db.client(tx).$queryRaw<{ id: string }[]>(Prisma.sql`
      SELECT r.user_id::text AS id FROM rider_profiles r
      WHERE r.status = 'approved' AND r.is_online AND r.city_id = ${input.cityId}::uuid
        AND NOT EXISTS (SELECT 1 FROM delivery_jobs a WHERE a.rider_user_id = r.user_id AND a.status IN ${ACTIVE})
        AND NOT EXISTS (SELECT 1 FROM delivery_offers p WHERE p.rider_user_id = r.user_id
          AND p.status = 'offered' AND p.expires_at > ${input.now})
        AND NOT EXISTS (SELECT 1 FROM delivery_offers d WHERE d.job_id = ${input.jobId}::uuid
          AND d.rider_user_id = r.user_id)
      ORDER BY ${riderDistance(input.jobId)} ASC NULLS LAST,
        r.last_location_at ASC NULLS LAST, r.updated_at ASC, r.user_id
      LIMIT 1`);
    return rows[0]?.id ?? null;
  }

  async candidate(
    tx: TxContext,
    input: { jobId: string | null; cityId: string; riderUserId: string; now: Date; pickup?: GeoPoint },
  ) {
    const rows = await this.select(tx, input, Prisma.sql`r.user_id = ${input.riderUserId}::uuid`, 1);
    return rows[0] ?? null;
  }

  candidates(tx: TxContext, input: { jobId: string | null; cityId: string; now: Date; pickup?: GeoPoint }) {
    return this.select(
      tx, input,
      Prisma.sql`r.status = 'approved' AND r.is_online AND r.city_id = ${input.cityId}::uuid`,
      50,
    );
  }

  async riderPublic(tx: TxContext, riderUserId: string) {
    const rows = await this.db.client(tx).$queryRaw<RiderPublicRow[]>(Prisma.sql`
      SELECT r.full_name AS "fullName", r.vehicle_type AS "vehicleType", r.vehicle_number AS "vehicleNumber"
      FROM rider_profiles r WHERE r.user_id = ${riderUserId}::uuid`);
    return rows[0] ?? null;
  }

  private select(
    tx: TxContext,
    input: { jobId: string | null; now: Date; pickup?: GeoPoint },
    where: Prisma.Sql,
    limit: number,
  ) {
    const distance = riderDistance(input.jobId, input.pickup);
    return this.db.client(tx).$queryRaw<(CandidateRow & { status: string })[]>(Prisma.sql`
      SELECT r.user_id::text AS "riderUserId", r.full_name AS "fullName",
        r.vehicle_type AS "vehicleType", r.vehicle_number AS "vehicleNumber",
        r.city_id::text AS "cityId", r.area_id::text AS "areaId", r.is_online AS online,
        r.status, ${distance} AS "distanceM", ${flags(input.jobId, input.now)}
      FROM rider_profiles r WHERE ${where}
      ORDER BY "distanceM" ASC NULLS LAST, r.last_location_at ASC NULLS LAST, r.user_id
      LIMIT ${limit}`);
  }

  private async one(tx: TxContext, where: Prisma.Sql, lock: boolean) {
    const rows = await this.db.client(tx).$queryRaw<StoredOffer[]>(Prisma.sql`
      SELECT ${OFFER_COLUMNS} FROM delivery_offers o WHERE ${where}
      ORDER BY o.created_at DESC, o.id DESC LIMIT 1
      ${lock ? Prisma.sql`FOR UPDATE OF o` : Prisma.empty}`);
    return rows[0] ?? null;
  }
}
