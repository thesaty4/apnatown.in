import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '../../../shared/persistence/generated/client';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import type {
  AreaFilters,
  AreaPosition,
  CityPosition,
  GeoArea,
  GeoCity,
  GeoReadRepository,
} from '../domain/geo-read.repository';

@Injectable()
export class PrismaGeoReadRepository implements GeoReadRepository {
  constructor(
    @Inject(PrismaDatabase) private readonly database: PrismaDatabase,
  ) {}

  listCities(input: {
    limit: number;
    after?: CityPosition;
  }): Promise<GeoCity[]> {
    const after = input.after;
    const position = after
      ? Prisma.sql`AND (status, name_en, id) >
          (${after.status}, ${after.nameEn}, ${after.id}::uuid)`
      : Prisma.empty;
    return this.database.queryRaw<GeoCity[]>(Prisma.sql`
      SELECT id, slug, name_en AS "nameEn", name_hi AS "nameHi", status
      FROM cities
      WHERE TRUE ${position}
      ORDER BY status ASC, name_en ASC, id ASC
      LIMIT ${this.fetchLimit(input.limit)}
    `);
  }

  async findCity(id: string): Promise<GeoCity | null> {
    const rows = await this.database.queryRaw<GeoCity[]>(Prisma.sql`
      SELECT id, slug, name_en AS "nameEn", name_hi AS "nameHi", status
      FROM cities WHERE id = ${id}::uuid
    `);
    return rows[0] ?? null;
  }

  listAreas(
    input: AreaFilters & { limit: number; after?: AreaPosition },
  ): Promise<GeoArea[]> {
    const pattern = `%${input.query.replace(/[\\%_]/g, '\\$&')}%`;
    const query = input.query
      ? Prisma.sql`AND (name_en ILIKE ${pattern} OR name_hi ILIKE ${pattern})`
      : Prisma.empty;
    const pin = input.pinCode
      ? Prisma.sql`AND pin_code = ${input.pinCode}`
      : Prisma.empty;
    const position = input.after
      ? Prisma.sql`AND (name_en, id) >
          (${input.after.nameEn}, ${input.after.id}::uuid)`
      : Prisma.empty;
    return this.database.queryRaw<GeoArea[]>(Prisma.sql`
      SELECT id, city_id AS "cityId", slug, name_en AS "nameEn",
        name_hi AS "nameHi", pin_code AS "pinCode"
      FROM areas
      WHERE city_id = ${input.cityId}::uuid ${query} ${pin} ${position}
      ORDER BY name_en ASC, id ASC
      LIMIT ${this.fetchLimit(input.limit)}
    `);
  }

  private fetchLimit(limit: number): number {
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 50)
      throw new Error('INVALID_GEO_PAGE_LIMIT');
    return limit + 1;
  }
}
