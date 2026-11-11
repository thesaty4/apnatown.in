import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { provision } from '../prisma/provision.mjs';
import { createSuite, dropSuite, readManifest } from '../prisma/suites.mjs';
import { ddl, withDatabase } from '../prisma/database.mjs';
import { localTargets } from '../prisma/targets.mjs';
import { PostgresReadinessRepository } from '../dist/shared/persistence/readiness-repository.js';
import { parseConfig } from '../dist/shared/config/config.js';
import { runtimeEnvironment } from './fixtures.mjs';

describe('C00 real PostgreSQL provisioning/isolation (requires explicit local test env)', () => {
  it('isolates marked suites, restricts runtime DDL, checks extensions and refuses unsafe cleanup', async () => {
    // No skip/pass for absent DB. Root must route privileged test-only env here.
    const env = process.env;
    localTargets(env);
    expect(env.APP_ENV).toBe('test');
    await provision(env);
    await provision(env);
    const suites = [
      `c00_a_${randomBytes(4).toString('hex')}`,
      `c00_b_${randomBytes(4).toString('hex')}`,
    ];
    const created = [];
    try {
      for (const suite of suites) {
        await createSuite(env, suite);
        created.push(suite);
      }
      const [a, b] = await Promise.all(suites.map(readManifest));
      expect(a.databaseName).not.toBe(b.databaseName);
      await expect(createSuite(env, suites[0])).rejects.toThrow();
      await withDatabase(a.env.MIGRATION_DATABASE_URL, async (client) => {
        for (const name of ['postgis', 'pg_trgm', 'unaccent']) {
          await ddl(
            client,
            "SELECT format('CREATE EXTENSION IF NOT EXISTS %I', $1::text) AS statement",
            [name],
          );
        }
        const extensions = await client.query(
          'SELECT extname, extversion FROM pg_extension',
        );
        expect(
          extensions.rows.find((row) => row.extname === 'postgis').extversion,
        ).toMatch(/^3\.5\./);
        const smoke = await client.query(
          "SELECT ST_Distance(ST_Point(0,0)::geography, ST_Point(0,0)::geography) AS distance, similarity('town','town') AS similarity, unaccent('café') AS plain",
        );
        expect(smoke.rows[0]).toEqual({
          distance: 0,
          similarity: 1,
          plain: 'cafe',
        });
        await expect(dropSuite(env, suites[0])).rejects.toThrow(
          'SUITE_STILL_CONNECTED',
        );
      });
      await withDatabase(a.env.DATABASE_URL, async (client) => {
        await expect(
          client.query('CREATE TABLE forbidden_runtime_ddl(id integer)'),
        ).rejects.toThrow();
        const roles = await client.query(
          'SELECT rolsuper, rolcreatedb, rolcreaterole, rolbypassrls FROM pg_roles WHERE rolname = current_user',
        );
        expect(roles.rows[0]).toEqual({
          rolsuper: false,
          rolcreatedb: false,
          rolcreaterole: false,
          rolbypassrls: false,
        });
      });
      const repository = new PostgresReadinessRepository(
        parseConfig(runtimeEnvironment({ DATABASE_URL: a.env.DATABASE_URL })),
      );
      try {
        expect(await repository.check()).toBe(false);
      } finally {
        await repository.close();
      }
      await expect(
        dropSuite({ ...env, APP_ENV: 'production' }, suites[0]),
      ).rejects.toThrow('LOCAL_TEST_ONLY');
      await withDatabase(a.env.MIGRATION_DATABASE_URL, async (client) => {
        await ddl(
          client,
          "SELECT format('COMMENT ON DATABASE %I IS %L', $1::text, $2::text) AS statement",
          [a.databaseName, 'unmarked'],
        );
      });
      await expect(dropSuite(env, suites[0])).rejects.toThrow(
        'DATABASE_MARKER_MISMATCH',
      );
      await withDatabase(a.env.MIGRATION_DATABASE_URL, async (client) => {
        await ddl(
          client,
          "SELECT format('COMMENT ON DATABASE %I IS %L', $1::text, $2::text) AS statement",
          [a.databaseName, a.marker],
        );
      });
      await dropSuite(env, suites[0]);
      created.splice(created.indexOf(suites[0]), 1);
      await withDatabase(b.env.DATABASE_URL, async (client) => {
        const result = await client.query('SELECT current_database() AS name');
        expect(result.rows[0].name).toBe(b.databaseName);
      });
    } finally {
      for (const suite of created) await dropSuite(env, suite);
    }
  });
});
