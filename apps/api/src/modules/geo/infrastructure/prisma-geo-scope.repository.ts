import { Injectable } from '@nestjs/common';
import type { AreaRef, CityRef } from '@apnatown/shared/admin';
import { Prisma } from '../../../shared/persistence/generated/client';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import type { TxContext } from '../../../shared/persistence/ports';
import type { GeoScopeRepository } from '../domain/geo-scope.repository';

@Injectable()
export class PrismaGeoScopeRepository implements GeoScopeRepository {
  constructor(private readonly database: PrismaDatabase) {}
  async lockCity(tx: TxContext, cityId: string): Promise<boolean> {
    const rows = await this.database.client(tx).$queryRaw<{ id: string }[]>`
      SELECT id FROM cities WHERE id = ${cityId}::uuid FOR SHARE`;
    return rows.length === 1;
  }
  async lockAreas(
    tx: TxContext,
    cityId: string,
    areaIds: readonly string[],
  ): Promise<string[]> {
    if (!areaIds.length) return [];
    const rows = await this.database.client(tx).$queryRaw<
      { id: string }[]
    >(Prisma.sql`
      SELECT id FROM areas WHERE city_id = ${cityId}::uuid
        AND id IN (${Prisma.join(areaIds.map((id) => Prisma.sql`${id}::uuid`))})
      ORDER BY id FOR SHARE`);
    return rows.map((row) => row.id);
  }
  findAreas(tx: TxContext, areaIds: readonly string[]): Promise<AreaRef[]> {
    if (!areaIds.length) return Promise.resolve([]);
    return this.database.client(tx).$queryRaw<AreaRef[]>(Prisma.sql`
      SELECT id, city_id AS "cityId", name_en AS "nameEn", name_hi AS "nameHi"
      FROM areas
      WHERE id IN (${Prisma.join(areaIds.map((id) => Prisma.sql`${id}::uuid`))})
      ORDER BY id FOR SHARE`);
  }
  findCities(tx: TxContext, cityIds: readonly string[]): Promise<CityRef[]> {
    if (!cityIds.length) return Promise.resolve([]);
    return this.database.client(tx).$queryRaw<CityRef[]>(Prisma.sql`
      SELECT id, name_en AS "nameEn", name_hi AS "nameHi" FROM cities
      WHERE id IN (${Prisma.join(cityIds.map((id) => Prisma.sql`${id}::uuid`))})
      ORDER BY id`);
  }
}
