import 'reflect-metadata';
import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { AreaListQuerySchema, CityPageSchema } from '@apnatown/shared/geo';
import { PageQuerySchema } from '@apnatown/shared/wire';
import { DomainError } from '../../../shared/errors/errors';
import { CursorCodec } from '../../../shared/pagination/cursor';
import { GeoReadService } from '../application/geo-read.service';
import type {
  GeoArea,
  GeoCity,
  GeoReadRepository,
} from '../domain/geo-read.repository';
import { GeoAreaQueryPipe } from '../presentation/geo.dto';

function fixture() {
  const city: GeoCity = {
    id: randomUUID(),
    slug: 'synthetic-city',
    nameEn: 'Synthetic city',
    nameHi: 'Synthetic city',
    status: 'enabled',
  };
  const area: GeoArea = {
    id: randomUUID(),
    cityId: city.id,
    slug: 'synthetic-area',
    nameEn: 'Synthetic area',
    nameHi: 'Synthetic area',
    pinCode: null,
  };
  const state: {
    cities: GeoCity[];
    areas: GeoArea[];
    cityQuery?: Parameters<GeoReadRepository['listCities']>[0];
    areaQuery?: Parameters<GeoReadRepository['listAreas']>[0];
  } = {
    cities: [city, { ...city, id: randomUUID() }],
    areas: [area, { ...area, id: randomUUID() }],
  };
  const reads: GeoReadRepository = {
    listCities(input) {
      state.cityQuery = input;
      return Promise.resolve(state.cities);
    },
    findCity(id) {
      return Promise.resolve(id === city.id ? city : null);
    },
    listAreas(input) {
      state.areaQuery = input;
      return Promise.resolve(state.areas);
    },
  };
  const cursors = new CursorCodec(randomBytes(32).toString('base64url'));
  return { city, area, state, service: new GeoReadService(reads, cursors) };
}

const invalidCursor = (error: unknown) =>
  error instanceof DomainError && error.code === 'COMMON_VALIDATION_FAILED';

test('Geo queries enforce defaults, cap, allow-list and PIN error contract', () => {
  assert.equal(PageQuerySchema.parse({}).limit, 20);
  assert.equal(PageQuerySchema.parse({ limit: '50' }).limit, 50);
  for (const input of [{ limit: '51' }, { limit: '0' }, { order: 'id DESC' }])
    assert.equal(PageQuerySchema.safeParse(input).success, false);
  assert.equal(AreaListQuerySchema.parse({ query: '  %_  ' }).query, '%_');
  assert.equal(
    AreaListQuerySchema.safeParse({ query: 'x'.repeat(101) }).success,
    false,
  );
  assert.throws(
    () => new GeoAreaQueryPipe().transform({ pinCode: 'x'.repeat(6) }),
    (error: unknown) =>
      error instanceof DomainError && error.code === 'PIN_CODE_INVALID',
  );
});

test('City pagination projects only public fields and preserves the signed tuple', async () => {
  const { service, state, city } = fixture();
  const internal = { ...city, stateCode: '09' };
  state.cities[0] = internal;
  const first = await service.cities({ limit: 1 });
  assert.deepEqual(first.items, [city]);
  assert.equal(CityPageSchema.safeParse(first).success, true);
  assert.ok(first.nextCursor);
  state.cities = [];
  assert.deepEqual(
    await service.cities({ limit: 1, cursor: first.nextCursor }),
    { items: [], nextCursor: null },
  );
  assert.deepEqual(state.cityQuery?.after, {
    status: city.status,
    nameEn: city.nameEn,
    id: city.id,
  });
  await assert.rejects(
    service.areas(city.id, { limit: 1, cursor: first.nextCursor }),
    invalidCursor,
  );
});

test('Area cursors bind city, PIN and normalized search without broadening scope', async () => {
  const { service, state, city, area } = fixture();
  const first = await service.areas(city.id, { limit: 1, query: 'Synthetic' });
  assert.deepEqual(first.items, [area]);
  assert.ok(first.nextCursor);
  for (const query of [
    { query: 'Other' },
    { query: 'Synthetic', pinCode: '100001' },
  ])
    await assert.rejects(
      service.areas(city.id, { ...query, limit: 1, cursor: first.nextCursor }),
      invalidCursor,
    );
  await assert.rejects(
    service.areas(randomUUID(), {
      limit: 1,
      query: 'Synthetic',
      cursor: first.nextCursor,
    }),
    invalidCursor,
  );
  state.areas = [];
  assert.deepEqual(
    await service.areas(city.id, {
      limit: 1,
      query: 'Synthetic',
      cursor: first.nextCursor,
    }),
    { items: [], nextCursor: null },
  );
  assert.deepEqual(state.areaQuery?.after, {
    nameEn: area.nameEn,
    id: area.id,
  });
  await assert.rejects(
    service.areas(randomUUID(), { limit: 1 }),
    (error: unknown) =>
      error instanceof DomainError && error.code === 'CITY_NOT_FOUND',
  );
});
