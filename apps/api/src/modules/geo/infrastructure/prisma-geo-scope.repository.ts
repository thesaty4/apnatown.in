import { Injectable } from '@nestjs/common';
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
}
