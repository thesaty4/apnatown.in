import 'reflect-metadata';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';
import type { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import type { TxContext } from '../../../shared/persistence/ports';
import { PrismaAddressRepository } from '../infrastructure/address.repository';
import { PrismaGeoScopeRepository } from '../../geo/infrastructure/prisma-geo-scope.repository';
import { addressFixture } from './address.fixture';

test('Address and Geo repository adapters use the supplied transaction and bind IDs, text, points and keysets', async () => {
  const h = addressFixture();
  const created = await h.service.create(h.command(), h.input);
  const row = h.state.rows.get(created.id)!;
  type Query = { sql: string; values: unknown[] };
  const queries: Query[] = [];
  const client = {
    async $queryRaw(query: Query | TemplateStringsArray, ...values: unknown[]) {
      queries.push('sql' in query ? query : { sql: query.join('?'), values });
      return [];
    },
    async $executeRaw(query: Query) {
      queries.push(query);
      return 1;
    },
  };
  const database = {
    client(tx: TxContext) {
      assert.equal(tx, h.tx);
      return client;
    },
  } as unknown as PrismaDatabase;
  const repository = new PrismaAddressRepository(database);
  const attack = "'; DROP TABLE addresses; --";
  await repository.insert(h.tx, { ...row, label: attack, lat: 12, lng: 34 });
  assert.ok(queries[0]?.values.includes(attack));
  assert.equal(queries[0]?.sql.includes(attack), false);
  assert.match(
    queries[0]!.sql,
    /ST_MakePoint\(\?::double precision, \?::double precision\)/,
  );
  assert.ok(queries[0]!.values.indexOf(34) < queries[0]!.values.indexOf(12));
  await repository.list(h.tx, h.userId, 50, {
    createdAt: '2026-11-12T00:00:00.123456Z',
    id: created.id,
  });
  assert.match(queries[1]!.sql, /deleted_at IS NULL.*\(created_at, id\) </s);
  assert.ok(queries[1]!.values.includes('2026-11-12T00:00:00.123456Z'));
  assert.equal(queries[1]!.values.at(-1), 51);
  await repository.update(h.tx, { ...row, version: 2 }, 1);
  assert.match(
    queries[2]!.sql,
    /WHERE id = .*AND user_id = .*AND deleted_at IS NULL AND version =/s,
  );
  assert.doesNotMatch(queries[2]!.sql.split('WHERE')[0]!, /user_id\s*=/);
  await repository.lock(h.tx, created.id);
  assert.match(queries[3]!.sql, /FOR UPDATE/);
  const scopes = new PrismaGeoScopeRepository(database);
  await scopes.lockCity(h.tx, h.cityId);
  await scopes.lockAreas(h.tx, h.cityId, [h.areaId]);
  assert.match(queries[4]!.sql, /cities.*FOR SHARE/s);
  assert.match(queries[5]!.sql, /areas WHERE city_id = .*id IN .*FOR SHARE/s);
  assert.doesNotMatch(queries[5]!.sql, /zones|centroid/);
});

test('Forward migration declares constraints, FK indexes, immutable ownership privileges and no seed writes', () => {
  // Static SQL coverage only; does not claim PostgreSQL execution.
  const migration = readFileSync(
    resolve(
      __dirname,
      '../../../../prisma/migrations/20261112001000_users_addresses/migration.sql',
    ),
    'utf8',
  );
  for (const fragment of [
    'addresses_version_check',
    'addresses_pin_code_check',
    'addresses_location_check',
    'addresses_address_text_encrypted_check',
    'addresses_landmark_encrypted_check',
    'addresses_owner_page_idx',
    'addresses_city_id_idx',
    'addresses_area_city_idx',
    'addresses_live_default_key',
    'WHERE "is_default" AND "deleted_at" IS NULL',
    'FOREIGN KEY ("area_id", "city_id") REFERENCES "areas"("id", "city_id")',
    'ON DELETE RESTRICT ON UPDATE RESTRICT',
  ])
    assert.ok(migration.includes(fragment), fragment);
  assert.match(migration, /^BEGIN;$/m);
  assert.match(migration, /^COMMIT;$/m);
  assert.doesNotMatch(migration, /INSERT INTO|GRANT DELETE/);
  const updates = /GRANT UPDATE \(([^;]+?)\)\s+ON "addresses"/s.exec(
    migration,
  )?.[1];
  assert.ok(updates);
  assert.doesNotMatch(updates, /"user_id"|"id"|"created_at"/);
});
