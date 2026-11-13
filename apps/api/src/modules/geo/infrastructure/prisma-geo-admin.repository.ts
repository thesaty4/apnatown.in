import { Injectable } from '@nestjs/common';
import type { CityStatus, FeeSlab } from '@apnatown/shared/geo';
import { Prisma } from '../../../shared/persistence/generated/client';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import type { TxContext } from '../../../shared/persistence/ports';
import type {
  AreaOption,
  CityCursor,
  CityOption,
  GeoAdminRepository,
  NamedCursor,
  OptionVisibility,
  PolygonCheck,
  StoredCity,
  StoredZone,
  ZoneOption,
  ZoneWrite,
} from '../domain/geo-admin.repository';
import type { GeoArea } from '../domain/geo-read.repository';

const timestamp = (column: string) =>
  Prisma.raw(
    `to_char(${column} AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`,
  );
/** `column IN (...)`, or FALSE for an empty list. */
const inIds = (column: string, ids: readonly string[]) =>
  ids.length
    ? Prisma.sql`${Prisma.raw(column)} IN (${Prisma.join(
        ids.map((id) => Prisma.sql`${id}::uuid`),
      )})`
    : Prisma.sql`FALSE`;
const like = (text: string) => `%${text.replace(/[\\%_]/g, '\\$&')}%`;
const geometry = (geoJson: string) =>
  Prisma.sql`ST_SetSRID(ST_GeomFromGeoJSON(${geoJson}::text), 4326)`;

const cityColumns = Prisma.sql`
  c.id, c.slug, c.name_en AS "nameEn", c.name_hi AS "nameHi",
  c.state_code AS "stateCode", c.status, c.version,
  ${timestamp('c.created_at')} AS "createdAt",
  ${timestamp('c.updated_at')} AS "updatedAt",
  (SELECT count(*)::int FROM areas a WHERE a.city_id = c.id) AS "areaCount",
  (SELECT count(*)::int FROM zones z WHERE z.city_id = c.id) AS "zoneCount",
  (SELECT count(*)::int FROM service_area_waitlist w
    WHERE w.city_id = c.id) AS "waitlistCount"`;
const zoneColumns = Prisma.sql`
  z.id, z.city_id AS "cityId", z.name, z.status, z.version,
  ST_AsGeoJSON(z.polygon, 7) AS polygon,
  COALESCE((SELECT json_agg(json_build_object(
      'upperDistanceKm', s.upper_distance_km::float8,
      'feePaise', s.fee_paise) ORDER BY s.sequence)
    FROM zone_fee_slabs s WHERE s.zone_id = z.id), '[]'::json) AS "feeSlabs",
  ${timestamp('z.created_at')} AS "createdAt",
  ${timestamp('z.updated_at')} AS "updatedAt"`;

@Injectable()
export class PrismaGeoAdminRepository implements GeoAdminRepository {
  constructor(private readonly database: PrismaDatabase) {}

  listCities(
    tx: TxContext,
    input: { limit: number; after?: CityCursor },
  ): Promise<StoredCity[]> {
    const after = input.after
      ? Prisma.sql`WHERE (c.status, c.name_en, c.id) >
          (${input.after.status}, ${input.after.nameEn}, ${input.after.id}::uuid)`
      : Prisma.empty;
    return this.database.client(tx).$queryRaw<StoredCity[]>(Prisma.sql`
      SELECT ${cityColumns} FROM cities c ${after}
      ORDER BY c.status, c.name_en, c.id
      LIMIT ${input.limit + 1}`);
  }

  async findCity(
    tx: TxContext,
    id: string,
    lock = false,
  ): Promise<StoredCity | null> {
    const client = this.database.client(tx);
    if (lock) {
      const locked = await client.$queryRaw<{ id: string }[]>`
        SELECT id FROM cities WHERE id = ${id}::uuid FOR UPDATE`;
      if (!locked.length) return null;
    }
    const rows = await client.$queryRaw<StoredCity[]>(Prisma.sql`
      SELECT ${cityColumns} FROM cities c WHERE c.id = ${id}::uuid`);
    return rows[0] ?? null;
  }

  async insertCity(
    tx: TxContext,
    input: {
      id: string;
      slug: string;
      nameEn: string;
      nameHi: string;
      stateCode: string;
      status: CityStatus;
      at: Date;
    },
  ): Promise<boolean> {
    const count = await this.database.client(tx).$executeRaw`
      INSERT INTO cities
        (id, slug, name_en, name_hi, state_code, status, version,
         created_at, updated_at)
      VALUES (${input.id}::uuid, ${input.slug}, ${input.nameEn},
        ${input.nameHi}, ${input.stateCode}, ${input.status}, 1,
        ${input.at}, ${input.at})
      ON CONFLICT (slug) DO NOTHING`;
    return count === 1;
  }

  async updateCity(
    tx: TxContext,
    input: {
      id: string;
      expectedVersion: number;
      status?: CityStatus;
      stateCode?: string;
      at: Date;
    },
  ): Promise<boolean> {
    const count = await this.database.client(tx).$executeRaw`
      UPDATE cities SET
        status = COALESCE(${input.status ?? null}::text, status),
        state_code = COALESCE(${input.stateCode ?? null}::text, state_code),
        version = version + 1, updated_at = ${input.at}
      WHERE id = ${input.id}::uuid AND version = ${input.expectedVersion}`;
    return count === 1;
  }

  cityAreas(tx: TxContext, cityId: string, limit: number): Promise<GeoArea[]> {
    return this.database.client(tx).$queryRaw<GeoArea[]>`
      SELECT id, city_id AS "cityId", slug, name_en AS "nameEn",
        name_hi AS "nameHi", pin_code AS "pinCode"
      FROM areas WHERE city_id = ${cityId}::uuid
      ORDER BY name_en, id LIMIT ${limit}`;
  }

  cityZones(
    tx: TxContext,
    cityId: string,
    limit: number,
  ): Promise<StoredZone[]> {
    return this.database.client(tx).$queryRaw<StoredZone[]>(Prisma.sql`
      SELECT ${zoneColumns} FROM zones z WHERE z.city_id = ${cityId}::uuid
      ORDER BY z.name, z.id LIMIT ${limit}`);
  }

  async findZone(
    tx: TxContext,
    id: string,
    lock = false,
  ): Promise<StoredZone | null> {
    const rows = await this.database.client(tx).$queryRaw<StoredZone[]>(
      Prisma.sql`SELECT ${zoneColumns} FROM zones z WHERE z.id = ${id}::uuid
        ${lock ? Prisma.sql`FOR UPDATE OF z` : Prisma.empty}`,
    );
    return rows[0] ?? null;
  }

  async checkPolygon(tx: TxContext, geoJson: string): Promise<PolygonCheck> {
    const [row] = await this.database.client(tx).$queryRaw<
      { valid: boolean }[]
    >(Prisma.sql`
      SELECT (g IS NOT NULL AND GeometryType(g) = 'POLYGON'
        AND NOT ST_IsEmpty(g) AND ST_IsValid(g) AND ST_Area(g) > 0) AS valid
      FROM (SELECT ${geometry(geoJson)} AS g) AS candidate`);
    return row?.valid ? 'ok' : 'invalid';
  }

  async overlapsActiveZone(
    tx: TxContext,
    input: { cityId: string; geoJson: string; excludeZoneId: string | null },
  ): Promise<boolean> {
    const exclude = input.excludeZoneId
      ? Prisma.sql`AND id <> ${input.excludeZoneId}::uuid`
      : Prisma.empty;
    const [row] = await this.database.client(tx).$queryRaw<
      { overlaps: boolean }[]
    >(Prisma.sql`
      SELECT EXISTS (
        SELECT 1 FROM zones
        WHERE city_id = ${input.cityId}::uuid AND status = 'active' ${exclude}
          AND ST_Intersects(polygon, ${geometry(input.geoJson)})
      ) AS overlaps`);
    return row?.overlaps ?? false;
  }

  async insertZone(
    tx: TxContext,
    input: ZoneWrite & { id: string; cityId: string; at: Date },
  ): Promise<void> {
    await this.database.client(tx).$executeRaw(Prisma.sql`
      INSERT INTO zones
        (id, city_id, name, polygon, status, version, created_at, updated_at)
      VALUES (${input.id}::uuid, ${input.cityId}::uuid, ${input.name},
        ${geometry(input.polygon)}, ${input.status}, 1, ${input.at},
        ${input.at})`);
  }

  async updateZone(
    tx: TxContext,
    input: Partial<ZoneWrite> & {
      id: string;
      expectedVersion: number;
      at: Date;
    },
  ): Promise<boolean> {
    const sets = [
      ...(input.name !== undefined ? [Prisma.sql`name = ${input.name}`] : []),
      ...(input.status !== undefined
        ? [Prisma.sql`status = ${input.status}`]
        : []),
      ...(input.polygon !== undefined
        ? [Prisma.sql`polygon = ${geometry(input.polygon)}`]
        : []),
      Prisma.sql`version = version + 1`,
      Prisma.sql`updated_at = ${input.at}`,
    ];
    const count = await this.database.client(tx).$executeRaw(Prisma.sql`
      UPDATE zones SET ${Prisma.join(sets)}
      WHERE id = ${input.id}::uuid AND version = ${input.expectedVersion}`);
    return count === 1;
  }

  async replaceFeeSlabs(
    tx: TxContext,
    zoneId: string,
    slabs: readonly FeeSlab[],
    at: Date,
  ): Promise<void> {
    const client = this.database.client(tx);
    await client.$executeRaw`
      DELETE FROM zone_fee_slabs WHERE zone_id = ${zoneId}::uuid`;
    if (!slabs.length) return;
    await client.$executeRaw(Prisma.sql`
      INSERT INTO zone_fee_slabs
        (zone_id, sequence, upper_distance_km, fee_paise, created_at,
         updated_at)
      VALUES ${Prisma.join(
        slabs.map(
          (slab, index) => Prisma.sql`(${zoneId}::uuid, ${index + 1},
            ${slab.upperDistanceKm}::numeric(5,2), ${slab.feePaise}::bigint,
            ${at}, ${at})`,
        ),
      )}`);
  }

  async deleteZone(
    tx: TxContext,
    input: { id: string; expectedVersion: number },
  ): Promise<boolean> {
    const count = await this.database.client(tx).$executeRaw`
      DELETE FROM zones
      WHERE id = ${input.id}::uuid AND version = ${input.expectedVersion}`;
    return count === 1;
  }

  cityOptions(
    tx: TxContext,
    input: {
      visibility: OptionVisibility;
      q: string;
      limit: number;
      after?: NamedCursor;
    },
  ): Promise<CityOption[]> {
    const visible = input.visibility
      ? Prisma.sql`AND (${inIds('id', input.visibility.cityIds)}
          OR id IN (SELECT city_id FROM areas
            WHERE ${inIds('id', input.visibility.areaIds)}))`
      : Prisma.empty;
    const query = input.q
      ? Prisma.sql`AND (name_en ILIKE ${like(input.q)}
          OR name_hi ILIKE ${like(input.q)})`
      : Prisma.empty;
    const after = input.after
      ? Prisma.sql`AND (name_en, id) >
          (${input.after.name}, ${input.after.id}::uuid)`
      : Prisma.empty;
    return this.database.client(tx).$queryRaw<CityOption[]>(Prisma.sql`
      SELECT id, name_en AS "nameEn", name_hi AS "nameHi", status, version
      FROM cities WHERE TRUE ${visible} ${query} ${after}
      ORDER BY name_en, id LIMIT ${input.limit + 1}`);
  }

  areaOptions(
    tx: TxContext,
    input: {
      visibility: OptionVisibility;
      cityId: string | null;
      q: string;
      limit: number;
      after?: NamedCursor;
    },
  ): Promise<AreaOption[]> {
    const visible = input.visibility
      ? Prisma.sql`AND (${inIds('city_id', input.visibility.cityIds)}
          OR ${inIds('id', input.visibility.areaIds)})`
      : Prisma.empty;
    const city = input.cityId
      ? Prisma.sql`AND city_id = ${input.cityId}::uuid`
      : Prisma.empty;
    const query = input.q
      ? Prisma.sql`AND (name_en ILIKE ${like(input.q)}
          OR name_hi ILIKE ${like(input.q)})`
      : Prisma.empty;
    const after = input.after
      ? Prisma.sql`AND (name_en, id) >
          (${input.after.name}, ${input.after.id}::uuid)`
      : Prisma.empty;
    return this.database.client(tx).$queryRaw<AreaOption[]>(Prisma.sql`
      SELECT id, city_id AS "cityId", name_en AS "nameEn", name_hi AS "nameHi"
      FROM areas WHERE TRUE ${visible} ${city} ${query} ${after}
      ORDER BY name_en, id LIMIT ${input.limit + 1}`);
  }

  zoneOptions(
    tx: TxContext,
    input: {
      cityIds: readonly string[] | null;
      cityId: string | null;
      q: string;
      limit: number;
      after?: NamedCursor;
    },
  ): Promise<ZoneOption[]> {
    const visible = input.cityIds
      ? Prisma.sql`AND ${inIds('city_id', input.cityIds)}`
      : Prisma.empty;
    const city = input.cityId
      ? Prisma.sql`AND city_id = ${input.cityId}::uuid`
      : Prisma.empty;
    const query = input.q
      ? Prisma.sql`AND name ILIKE ${like(input.q)}`
      : Prisma.empty;
    const after = input.after
      ? Prisma.sql`AND (name, id) > (${input.after.name}, ${input.after.id}::uuid)`
      : Prisma.empty;
    return this.database.client(tx).$queryRaw<ZoneOption[]>(Prisma.sql`
      SELECT id, city_id AS "cityId", name, status, version
      FROM zones WHERE TRUE ${visible} ${city} ${query} ${after}
      ORDER BY name, id LIMIT ${input.limit + 1}`);
  }

  zonesByIds(tx: TxContext, ids: readonly string[]): Promise<ZoneOption[]> {
    if (!ids.length) return Promise.resolve([]);
    return this.database.client(tx).$queryRaw<ZoneOption[]>(Prisma.sql`
      SELECT id, city_id AS "cityId", name, status, version
      FROM zones WHERE ${inIds('id', ids)} ORDER BY id`);
  }

  zonesInCities(
    tx: TxContext,
    cityIds: readonly string[],
  ): Promise<ZoneOption[]> {
    if (!cityIds.length) return Promise.resolve([]);
    return this.database.client(tx).$queryRaw<ZoneOption[]>(Prisma.sql`
      SELECT id, city_id AS "cityId", name, status, version
      FROM zones WHERE ${inIds('city_id', cityIds)}
      ORDER BY name, id`);
  }

  async summary(
    tx: TxContext,
  ): Promise<{ enabledCities: number; waitlistSignups: number }> {
    const [row] = await this.database.client(tx).$queryRaw<
      { enabledCities: number; waitlistSignups: number }[]
    >`
      SELECT
        (SELECT count(*)::int FROM cities WHERE status = 'enabled')
          AS "enabledCities",
        (SELECT count(*)::int FROM service_area_waitlist) AS "waitlistSignups"`;
    return row ?? { enabledCities: 0, waitlistSignups: 0 };
  }
}
