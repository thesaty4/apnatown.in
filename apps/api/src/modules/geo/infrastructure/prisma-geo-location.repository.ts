import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../shared/persistence/generated/client';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import type { TxContext } from '../../../shared/persistence/ports';
import type {
  CityFiscal,
  GeoLocationRepository,
  GeoPoint,
  StoredFeeSlab,
  ZoneHit,
} from '../domain/geo-location.repository';
import type { GeoArea, GeoCity } from '../domain/geo-read.repository';

// Bounded lookups: a PIN or a point never fans out unboundedly.
const MATCH_LIMIT = 20;
const point = (value: GeoPoint) =>
  Prisma.sql`ST_SetSRID(ST_MakePoint(${value.lng}::float8, ${value.lat}::float8), 4326)`;

@Injectable()
export class PrismaGeoLocationRepository implements GeoLocationRepository {
  constructor(private readonly database: PrismaDatabase) {}

  async findCity(tx: TxContext, id: string): Promise<GeoCity | null> {
    const rows = await this.database.client(tx).$queryRaw<GeoCity[]>`
      SELECT id, slug, name_en AS "nameEn", name_hi AS "nameHi", status
      FROM cities WHERE id = ${id}::uuid`;
    return rows[0] ?? null;
  }

  async cityFiscal(tx: TxContext, id: string): Promise<CityFiscal | null> {
    const rows = await this.database.client(tx).$queryRaw<CityFiscal[]>`
      SELECT status, state_code AS "stateCode", version
      FROM cities WHERE id = ${id}::uuid FOR SHARE`;
    return rows[0] ?? null;
  }

  async findArea(tx: TxContext, id: string): Promise<GeoArea | null> {
    const rows = await this.database.client(tx).$queryRaw<GeoArea[]>`
      SELECT id, city_id AS "cityId", slug, name_en AS "nameEn",
        name_hi AS "nameHi", pin_code AS "pinCode"
      FROM areas WHERE id = ${id}::uuid`;
    return rows[0] ?? null;
  }

  areasByPin(
    tx: TxContext,
    pinCode: string,
    cityId: string | null,
  ): Promise<GeoArea[]> {
    const city = cityId
      ? Prisma.sql`AND city_id = ${cityId}::uuid`
      : Prisma.empty;
    return this.database.client(tx).$queryRaw<GeoArea[]>(Prisma.sql`
      SELECT id, city_id AS "cityId", slug, name_en AS "nameEn",
        name_hi AS "nameHi", pin_code AS "pinCode"
      FROM areas WHERE pin_code = ${pinCode} ${city}
      ORDER BY city_id, name_en, id
      LIMIT ${MATCH_LIMIT}`);
  }

  zonesAt(
    tx: TxContext,
    location: GeoPoint,
    cityId: string | null,
  ): Promise<ZoneHit[]> {
    const city = cityId
      ? Prisma.sql`AND city_id = ${cityId}::uuid`
      : Prisma.empty;
    return this.database.client(tx).$queryRaw<ZoneHit[]>(Prisma.sql`
      SELECT id, city_id AS "cityId", name, status, version
      FROM zones
      WHERE ST_Covers(polygon, ${point(location)}) ${city}
      ORDER BY (status = 'active') DESC, name, id
      LIMIT ${MATCH_LIMIT}`);
  }

  async feeSlabs(tx: TxContext, zoneId: string): Promise<StoredFeeSlab[]> {
    const rows = await this.database.client(tx).$queryRaw<
      { upperDistanceKm: number; feePaise: string }[]
    >`
      SELECT upper_distance_km::float8 AS "upperDistanceKm",
        fee_paise::text AS "feePaise"
      FROM zone_fee_slabs WHERE zone_id = ${zoneId}::uuid
      ORDER BY sequence`;
    return rows.map((row) => ({
      upperDistanceKm: row.upperDistanceKm,
      feePaise: Number(row.feePaise),
    }));
  }

  async distanceKm(
    tx: TxContext,
    from: GeoPoint,
    to: GeoPoint,
  ): Promise<number> {
    const [row] = await this.database.client(tx).$queryRaw<
      { km: number }[]
    >(Prisma.sql`
      SELECT ST_Distance(${point(from)}::geography, ${point(to)}::geography)
        / 1000.0 AS km`);
    return Number(row!.km);
  }

  async insertWaitlist(
    tx: TxContext,
    input: {
      id: string;
      cityId: string | null;
      phoneCiphertext: string;
      phoneLookupHash: Uint8Array;
      at: Date;
    },
  ): Promise<void> {
    await this.database.client(tx).serviceAreaWaitlist.create({
      data: {
        id: input.id,
        cityId: input.cityId,
        phoneCiphertext: input.phoneCiphertext,
        phoneLookupHash: Uint8Array.from(input.phoneLookupHash),
        requestedAt: input.at,
      },
      select: { id: true },
    });
  }
}
