import { lstat, mkdir, open, readFile, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  createDatabase,
  databaseMarker,
  ddl,
  restrictDatabase,
  withDatabase,
} from './database.mjs';
import {
  createManifest,
  localTargets,
  manifestDirectory,
  suiteId,
  validateManifest,
} from './targets.mjs';

const manifestPath = (suite) =>
  resolve(manifestDirectory, `${suiteId(suite)}.json`);
const lockPath = (suite) =>
  resolve(manifestDirectory, `${suiteId(suite)}.lock`);

async function withSuiteLock(suite, work) {
  await mkdir(manifestDirectory, { recursive: true, mode: 0o700 });
  const directory = await lstat(manifestDirectory);
  if (!directory.isDirectory() || directory.isSymbolicLink())
    throw new Error('UNSAFE_MANIFEST_DIRECTORY');
  const lock = await open(lockPath(suite), 'wx', 0o600);
  try {
    return await work();
  } finally {
    await lock.close();
    await unlink(lockPath(suite));
  }
}

export async function readManifest(suite) {
  const path = manifestPath(suite);
  const stat = await lstat(path);
  if (
    !stat.isFile() ||
    stat.isSymbolicLink() ||
    (stat.mode & 0o077) !== 0 ||
    stat.size > 8192
  ) {
    throw new Error('UNSAFE_SUITE_MANIFEST');
  }
  return validateManifest(JSON.parse(await readFile(path, 'utf8')), suite);
}

export async function createSuite(env, suite) {
  const targets = localTargets(env);
  if (env.APP_ENV !== 'test') throw new Error('TEST_ENV_REQUIRED');
  return withSuiteLock(suite, async () => {
    const manifest = createManifest(suite, targets);
    // Reserve before DDL. On interruption, the recorded names enable safe recovery.
    const file = await open(manifestPath(suite), 'wx', 0o600);
    try {
      await file.writeFile(`${JSON.stringify(manifest, null, 2)}\n`);
    } finally {
      await file.close();
    }
    await withDatabase(targets.migration, async (client) => {
      await createDatabase(client, manifest.databaseName, manifest.marker);
      await createDatabase(
        client,
        manifest.shadowDatabaseName,
        manifest.marker,
      );
    });
    await restrictDatabase(
      manifest.env.MIGRATION_DATABASE_URL,
      manifest.databaseName,
    );
    await restrictDatabase(
      manifest.env.SHADOW_DATABASE_URL,
      manifest.shadowDatabaseName,
      false,
    );
    return manifestPath(suite);
  });
}

export async function verifySuite(client, manifest) {
  for (const name of [manifest.databaseName, manifest.shadowDatabaseName]) {
    const marker = await databaseMarker(client, name);
    if (marker !== undefined && marker !== manifest.marker)
      throw new Error('DATABASE_MARKER_MISMATCH');
  }
}

export async function dropSuite(env, suite) {
  const targets = localTargets(env);
  if (env.APP_ENV !== 'test') throw new Error('TEST_ENV_REQUIRED');
  await withSuiteLock(suite, async () => {
    const manifest = await readManifest(suite);
    await withDatabase(targets.migration, async (client) => {
      await verifySuite(client, manifest);
      const names = [manifest.databaseName, manifest.shadowDatabaseName];
      const { rows } = await client.query(
        'SELECT 1 FROM pg_stat_activity WHERE datname = ANY($1::text[]) LIMIT 1',
        [names],
      );
      if (rows.length) throw new Error('SUITE_STILL_CONNECTED');
      // No FORCE or backend termination. Stop workers/API before cleanup.
      for (const name of names) {
        await ddl(
          client,
          "SELECT format('DROP DATABASE IF EXISTS %I', $1::text) AS statement",
          [name],
        );
      }
    });
    await unlink(manifestPath(suite));
  });
}
