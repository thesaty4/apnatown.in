import { describe, expect, it } from 'vitest';
import {
  localTargets,
  suiteId,
  createManifest,
  validateManifest,
} from '../prisma/targets.mjs';
import { migrate } from '../prisma/migrate.mjs';
import { seed } from '../prisma/seed.mjs';
import { ddl, databaseMarker } from '../prisma/database.mjs';
import { databaseEnvironment } from './fixtures.mjs';

describe('C00 DB launcher safety units', () => {
  it('rejects production, unmarked, non-loopback and privileged runtime targets', () => {
    const env = databaseEnvironment();
    expect(localTargets(env).runtime.username).toBe('apnatown_runtime');
    for (const overrides of [
      { APP_ENV: 'production' },
      { DATABASE_URL: env.MIGRATION_DATABASE_URL },
      {
        DATABASE_URL: env.DATABASE_URL.replace('127.0.0.1', 'example.invalid'),
      },
      { DATABASE_URL: `${env.DATABASE_URL}?options=-csearch_path=evil` },
      {
        MIGRATION_DATABASE_URL: env.MIGRATION_DATABASE_URL.replace(
          'apnatown_local',
          'production',
        ),
      },
      { SHADOW_DATABASE_URL: env.MIGRATION_DATABASE_URL },
    ])
      expect(() => localTargets({ ...env, ...overrides })).toThrow();
  });

  it('rejects traversal/injection/oversized suite IDs and manifest tampering', () => {
    for (const value of [
      '',
      '../outside',
      'x;DROP DATABASE',
      'x'.repeat(33),
      'UPPER',
      null,
    ]) {
      expect(() => suiteId(value)).toThrow('INVALID_SUITE_ID');
    }
    const manifest = createManifest(
      'c00-safe',
      localTargets(databaseEnvironment()),
    );
    expect(validateManifest(manifest, 'c00-safe')).toBe(manifest);
    expect(manifest.shadowDatabaseName.length).toBeLessThanOrEqual(63);
    for (const changes of [
      { suite: 'another' },
      { databaseName: 'apnatown_local' },
      { shadowDatabaseName: 'apnatown_local' },
      { marker: 'unmarked' },
      { env: { ...manifest.env, APP_ENV: 'production' } },
      {
        env: {
          ...manifest.env,
          DATABASE_URL: databaseEnvironment().DATABASE_URL,
        },
      },
    ])
      expect(() =>
        validateManifest({ ...manifest, ...changes }, 'c00-safe'),
      ).toThrow();
  });

  it('binds DDL values for PostgreSQL quoting instead of concatenating input', async () => {
    const calls = [];
    const client = {
      query: async (...args) => {
        calls.push(args);
        return { rows: [{ statement: 'quoted server result' }] };
      },
    };
    const untrusted = "'; DROP DATABASE postgres; --";
    await ddl(
      client,
      "SELECT format('ALTER ROLE apnatown_runtime PASSWORD %L', $1) AS statement",
      [untrusted],
    );
    expect(calls[0][0]).not.toContain(untrusted);
    expect(calls[0][1]).toEqual([untrusted]);
    expect(calls[1]).toEqual(['quoted server result']);
    await databaseMarker(client, untrusted);
    expect(calls[2][0]).not.toContain(untrusted);
    expect(calls[2][1]).toEqual([untrusted]);
  });

  it('does not report missing migrations/seed as successful work', async () => {
    const env = databaseEnvironment();
    await expect(migrate(env)).rejects.toThrow(
      'C01_C02_REQUIRED_NO_REVIEWED_MIGRATIONS',
    );
    await expect(seed(env)).rejects.toThrow(
      'C02_REQUIRED_NO_DOMAIN_SEED_ADAPTER',
    );
  });
});
