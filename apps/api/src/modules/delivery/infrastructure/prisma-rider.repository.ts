import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../shared/persistence/generated/client';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import type { TxContext } from '../../../shared/persistence/ports';
import type {
  RiderDraftChanges,
  RiderRepository,
  RiderVisibility,
  StoredRider,
  StoredRiderDocument,
} from '../domain/rider';

/** ISO-8601 UTC text with microseconds (matches `TimestampSchema`). */
const timestamp = (column: string) =>
  Prisma.raw(
    `to_char(${column} AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`,
  );

const riderColumns = Prisma.sql`
  r.user_id AS "userId", r.city_id AS "cityId", r.area_id AS "areaId",
  r.full_name AS "fullName", r.vehicle_type AS "vehicleType",
  r.vehicle_number AS "vehicleNumber",
  r.payout_upi_ciphertext AS "payoutUpiCiphertext",
  r.payout_bank_ciphertext AS "payoutBankCiphertext", r.status,
  r.decision_reason AS "decisionReason",
  r.requirements_version AS "requirementsVersion",
  ${timestamp('r.submitted_at')} AS "submittedAt", r.is_online AS "isOnline",
  r.preferred_locale AS "preferredLocale", r.version,
  ${timestamp('r.created_at')} AS "createdAt",
  ${timestamp('r.updated_at')} AS "updatedAt"`;

// Allow-listed draft field -> column map (never a client field name).
const DRAFT_COLUMNS: Readonly<Record<keyof RiderDraftChanges, string>> = {
  fullName: 'full_name',
  cityId: 'city_id',
  areaId: 'area_id',
  vehicleType: 'vehicle_type',
  vehicleNumber: 'vehicle_number',
  payoutUpiCiphertext: 'payout_upi_ciphertext',
  payoutBankCiphertext: 'payout_bank_ciphertext',
};
const UUID_COLUMNS = new Set(['city_id', 'area_id']);

function assignments(changes: RiderDraftChanges): Prisma.Sql[] {
  return (Object.keys(DRAFT_COLUMNS) as (keyof RiderDraftChanges)[])
    .filter((field) => changes[field] !== undefined)
    .map((field) => {
      const column = DRAFT_COLUMNS[field];
      const value = changes[field] ?? null;
      return UUID_COLUMNS.has(column)
        ? Prisma.sql`${Prisma.raw(column)} = ${value}::uuid`
        : Prisma.sql`${Prisma.raw(column)} = ${value}`;
    });
}

function visible(visibility: RiderVisibility): Prisma.Sql {
  if (visibility.platformWide) return Prisma.sql`TRUE`;
  return Prisma.sql`(r.area_id = ANY(${[...visibility.areaIds]}::uuid[])
    OR r.city_id = ANY(${[...visibility.cityIds]}::uuid[]))`;
}

/** Owning `rider_profiles`/`rider_documents` adapter; parameterized SQL only. */
@Injectable()
export class PrismaRiderRepository implements RiderRepository {
  constructor(private readonly database: PrismaDatabase) {}

  async find(tx: TxContext, userId: string, lock = false) {
    const rows = await this.database.client(tx).$queryRaw<StoredRider[]>(
      Prisma.sql`SELECT ${riderColumns} FROM rider_profiles r
        WHERE r.user_id = ${userId}::uuid
        ${lock ? Prisma.sql`FOR UPDATE OF r` : Prisma.empty}`,
    );
    return rows[0] ?? null;
  }

  async insertDraft(
    tx: TxContext,
    input: { userId: string; locale: 'en' | 'hi'; changes: RiderDraftChanges; at: Date },
  ): Promise<boolean> {
    const count = await this.database.client(tx).$executeRaw`
      INSERT INTO rider_profiles (user_id, preferred_locale, created_at, updated_at)
      VALUES (${input.userId}::uuid, ${input.locale}, ${input.at}, ${input.at})
      ON CONFLICT (user_id) DO NOTHING`;
    if (count !== 1) return false;
    const sets = assignments(input.changes);
    if (sets.length)
      await this.database.client(tx).$executeRaw(
        Prisma.sql`UPDATE rider_profiles SET ${Prisma.join(sets, ', ')}
          WHERE user_id = ${input.userId}::uuid`,
      );
    return true;
  }

  async updateDraft(
    tx: TxContext,
    input: { userId: string; expectedVersion: number; changes: RiderDraftChanges; at: Date },
  ): Promise<boolean> {
    const sets = [
      ...assignments(input.changes),
      Prisma.sql`version = version + 1`,
      Prisma.sql`updated_at = ${input.at}`,
    ];
    const count = await this.database.client(tx).$executeRaw(
      Prisma.sql`UPDATE rider_profiles SET ${Prisma.join(sets, ', ')}
        WHERE user_id = ${input.userId}::uuid AND version = ${input.expectedVersion}`,
    );
    return count === 1;
  }

  async transition(
    tx: TxContext,
    input: {
      userId: string;
      expectedVersion: number;
      status: StoredRider['status'];
      reason?: string | null;
      submittedAt?: Date;
      at: Date;
    },
  ): Promise<boolean> {
    const sets: Prisma.Sql[] = [Prisma.sql`status = ${input.status}`];
    if (input.reason !== undefined)
      sets.push(Prisma.sql`decision_reason = ${input.reason}`);
    if (input.submittedAt)
      sets.push(Prisma.sql`submitted_at = ${input.submittedAt}`);
    // Online implies approved: any other status forces offline, no location.
    if (input.status !== 'approved')
      sets.push(
        Prisma.sql`is_online = false`,
        Prisma.sql`last_location = NULL`,
        Prisma.sql`last_location_at = NULL`,
      );
    sets.push(
      Prisma.sql`version = version + 1`,
      Prisma.sql`updated_at = ${input.at}`,
    );
    const count = await this.database.client(tx).$executeRaw(
      Prisma.sql`UPDATE rider_profiles SET ${Prisma.join(sets, ', ')}
        WHERE user_id = ${input.userId}::uuid AND version = ${input.expectedVersion}`,
    );
    return count === 1;
  }

  async setOnline(
    tx: TxContext,
    input: { userId: string; online: boolean; at: Date },
  ): Promise<void> {
    await this.database.client(tx).$executeRaw(
      input.online
        ? Prisma.sql`UPDATE rider_profiles SET is_online = true, updated_at = ${input.at}
            WHERE user_id = ${input.userId}::uuid AND status = 'approved'`
        : Prisma.sql`UPDATE rider_profiles SET is_online = false,
            last_location = NULL, last_location_at = NULL, updated_at = ${input.at}
            WHERE user_id = ${input.userId}::uuid`,
    );
  }

  async recordLocation(
    tx: TxContext,
    input: { userId: string; lat: number; lng: number; at: Date },
  ): Promise<boolean> {
    const count = await this.database.client(tx).$executeRaw`
      UPDATE rider_profiles SET
        last_location = ST_SetSRID(ST_MakePoint(${input.lng}::float8, ${input.lat}::float8), 4326)::geography,
        last_location_at = ${input.at}
      WHERE user_id = ${input.userId}::uuid AND is_online AND status = 'approved'`;
    return count === 1;
  }

  documents(tx: TxContext, userId: string): Promise<StoredRiderDocument[]> {
    return this.database.client(tx).$queryRaw<StoredRiderDocument[]>(
      Prisma.sql`SELECT d.doc_type AS kind, d.media_asset_id AS "assetId",
          ${timestamp('d.created_at')} AS "createdAt"
        FROM rider_documents d
        WHERE d.rider_user_id = ${userId}::uuid AND d.superseded_at IS NULL
        ORDER BY d.doc_type, d.created_at, d.id`,
    );
  }

  scopedPage(
    tx: TxContext,
    input: {
      status: StoredRider['status'];
      visibility: RiderVisibility;
      after?: [string, string];
      limit: number;
    },
  ): Promise<StoredRider[]> {
    return this.database.client(tx).$queryRaw<StoredRider[]>(
      Prisma.sql`SELECT ${riderColumns} FROM rider_profiles r
        WHERE r.status = ${input.status} AND ${visible(input.visibility)}
          ${
            input.after
              ? Prisma.sql`AND (r.created_at, r.user_id) >
                  (${input.after[0]}::timestamptz, ${input.after[1]}::uuid)`
              : Prisma.empty
          }
        ORDER BY r.created_at, r.user_id
        LIMIT ${input.limit + 1}`,
    );
  }
}
