import { Inject, Injectable } from '@nestjs/common';
import {
  CityStatusSchema,
  type AreaListQuery,
  type AreaPage,
  type CityPage,
} from '@apnatown/shared/geo';
import { IdSchema, type PageQuery } from '@apnatown/shared/wire';
import { z } from 'zod';
import { DomainError } from '../../../shared/errors/errors';
import {
  CURSOR_CODEC,
  CursorCodec,
  type CursorBinding,
} from '../../../shared/pagination/cursor';
import {
  GEO_READ_REPOSITORY,
  type AreaPosition,
  type CityPosition,
  type GeoReadRepository,
} from '../domain/geo-read.repository';

const cityBinding: CursorBinding = {
  operation: 'geo.cities',
  sort: 'status-name-id',
  filters: {},
  scope: 'public',
};
const cityPositionSchema = z.tuple([CityStatusSchema, z.string(), IdSchema]);
const areaPositionSchema = z.tuple([z.string(), IdSchema]);

@Injectable()
export class GeoReadService {
  constructor(
    @Inject(GEO_READ_REPOSITORY) private readonly reads: GeoReadRepository,
    @Inject(CURSOR_CODEC) private readonly cursors: CursorCodec,
  ) {}

  async cities(query: PageQuery): Promise<CityPage> {
    const after = this.cityPosition(query.cursor);
    const rows = await this.reads.listCities({
      limit: query.limit,
      ...(after ? { after } : {}),
    });
    const items = rows.slice(0, query.limit).map((city) => ({
      id: city.id,
      slug: city.slug,
      nameEn: city.nameEn,
      nameHi: city.nameHi,
      status: city.status,
    }));
    const last = items.at(-1);
    return {
      items,
      nextCursor:
        rows.length > query.limit && last
          ? this.cursors.encode(cityBinding, [
              last.status,
              last.nameEn,
              last.id,
            ])
          : null,
    };
  }

  async areas(cityId: string, query: AreaListQuery): Promise<AreaPage> {
    const filters = {
      cityId,
      query: query.query ?? '',
      pinCode: query.pinCode ?? null,
    };
    const binding: CursorBinding = {
      operation: 'geo.areas',
      sort: 'name-id',
      filters,
      scope: 'public',
    };
    const after = this.areaPosition(query.cursor, binding);
    if (!(await this.reads.findCity(cityId)))
      throw new DomainError('CITY_NOT_FOUND');
    const rows = await this.reads.listAreas({
      ...filters,
      limit: query.limit,
      ...(after ? { after } : {}),
    });
    const items = rows.slice(0, query.limit).map((area) => ({
      id: area.id,
      cityId: area.cityId,
      slug: area.slug,
      nameEn: area.nameEn,
      nameHi: area.nameHi,
      pinCode: area.pinCode,
    }));
    const last = items.at(-1);
    return {
      items,
      nextCursor:
        rows.length > query.limit && last
          ? this.cursors.encode(binding, [last.nameEn, last.id])
          : null,
    };
  }

  private cityPosition(cursor: string | undefined): CityPosition | undefined {
    if (!cursor) return undefined;
    const parsed = cityPositionSchema.safeParse(
      this.cursors.decode(cursor, cityBinding),
    );
    if (!parsed.success)
      throw new DomainError('COMMON_VALIDATION_FAILED', { field: 'cursor' });
    const [status, nameEn, id] = parsed.data;
    return { status, nameEn, id };
  }

  private areaPosition(
    cursor: string | undefined,
    binding: CursorBinding,
  ): AreaPosition | undefined {
    if (!cursor) return undefined;
    const parsed = areaPositionSchema.safeParse(
      this.cursors.decode(cursor, binding),
    );
    if (!parsed.success)
      throw new DomainError('COMMON_VALIDATION_FAILED', { field: 'cursor' });
    const [nameEn, id] = parsed.data;
    return { nameEn, id };
  }
}
