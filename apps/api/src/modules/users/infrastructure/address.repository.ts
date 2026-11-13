import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../shared/persistence/generated/client';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import type { TxContext } from '../../../shared/persistence/ports';
import type {
  AddressPosition,
  AddressRepository,
  StoredAddress,
} from '../domain/address';

// Text timestamps preserve PostgreSQL microseconds for keyset pagination.
const columns = Prisma.sql`
  id, user_id AS "userId", label, address_text AS "addressText", landmark,
  pin_code AS "pinCode", city_id AS "cityId", area_id AS "areaId",
  ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng,
  is_default AS "isDefault", version,
  to_char(deleted_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS "deletedAt",
  to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS "createdAt",
  to_char(updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS "updatedAt"`;

@Injectable()
export class PrismaAddressRepository implements AddressRepository {
  constructor(private readonly database: PrismaDatabase) {}
  list(
    tx: TxContext,
    userId: string,
    limit: number,
    after?: AddressPosition,
  ): Promise<StoredAddress[]> {
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 50)
      throw new Error('INVALID_ADDRESS_PAGE_LIMIT');
    const position = after
      ? Prisma.sql`AND (created_at, id) < (${after.createdAt}::timestamptz, ${after.id}::uuid)`
      : Prisma.empty;
    return this.database.client(tx).$queryRaw(Prisma.sql`
      SELECT ${columns} FROM addresses
      WHERE user_id = ${userId}::uuid AND deleted_at IS NULL ${position}
      ORDER BY created_at DESC, id DESC LIMIT ${limit + 1}`);
  }
  async lock(tx: TxContext, id: string): Promise<StoredAddress | null> {
    const rows = await this.database.client(tx).$queryRaw<
      StoredAddress[]
    >(Prisma.sql`
      SELECT ${columns} FROM addresses WHERE id = ${id}::uuid FOR UPDATE`);
    return rows[0] ?? null;
  }
  async defaultAddress(
    tx: TxContext,
    userId: string,
  ): Promise<StoredAddress | null> {
    const rows = await this.database.client(tx).$queryRaw<
      StoredAddress[]
    >(Prisma.sql`
      SELECT ${columns} FROM addresses
      WHERE user_id = ${userId}::uuid AND deleted_at IS NULL AND is_default FOR UPDATE`);
    return rows[0] ?? null;
  }
  async insert(tx: TxContext, row: StoredAddress): Promise<void> {
    await this.database.client(tx).$executeRaw(Prisma.sql`
      INSERT INTO addresses (id, user_id, label, address_text, landmark, pin_code,
        city_id, area_id, location, is_default, version, deleted_at, created_at, updated_at)
      VALUES (${row.id}::uuid, ${row.userId}::uuid, ${row.label}, ${row.addressText},
        ${row.landmark}, ${row.pinCode}, ${row.cityId}::uuid, ${row.areaId}::uuid,
        ${this.location(row)}, ${row.isDefault}, ${row.version}, ${row.deletedAt}::timestamptz,
        ${row.createdAt}::timestamptz, ${row.updatedAt}::timestamptz)`);
  }
  async eraseForUser(
    tx: TxContext,
    userId: string,
    now: string,
    seal: (id: string) => string,
  ): Promise<number> {
    const db = this.database.client(tx);
    const rows = await db.$queryRaw<{ id: string }[]>(Prisma.sql`
      SELECT id FROM addresses WHERE user_id = ${userId}::uuid
      ORDER BY id FOR UPDATE`);
    for (const { id } of rows)
      await db.$executeRaw(Prisma.sql`
        UPDATE addresses SET label = 'Erased', address_text = ${seal(id)},
          landmark = NULL, location = NULL, is_default = false,
          version = version + 1,
          deleted_at = COALESCE(deleted_at, ${now}::timestamptz),
          updated_at = ${now}::timestamptz
        WHERE id = ${id}::uuid AND user_id = ${userId}::uuid`);
    return rows.length;
  }
  async update(
    tx: TxContext,
    row: StoredAddress,
    expectedVersion: number,
  ): Promise<boolean> {
    const count = await this.database.client(tx).$executeRaw(Prisma.sql`
      UPDATE addresses SET label = ${row.label}, address_text = ${row.addressText},
        landmark = ${row.landmark}, pin_code = ${row.pinCode}, city_id = ${row.cityId}::uuid,
        area_id = ${row.areaId}::uuid, location = ${this.location(row)},
        is_default = ${row.isDefault}, version = ${row.version},
        deleted_at = ${row.deletedAt}::timestamptz, updated_at = ${row.updatedAt}::timestamptz
      WHERE id = ${row.id}::uuid AND user_id = ${row.userId}::uuid
        AND deleted_at IS NULL AND version = ${expectedVersion}`);
    return count === 1;
  }
  private location(row: StoredAddress): Prisma.Sql {
    return row.lat === null && row.lng === null
      ? Prisma.sql`NULL`
      : Prisma.sql`ST_SetSRID(ST_MakePoint(${row.lng}::double precision, ${row.lat}::double precision), 4326)::geography`;
  }
}
