import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export const repositoryRoot = fileURLToPath(
  new URL('../../../', import.meta.url),
);
export const manifestDirectory = resolve(
  repositoryRoot,
  '.local/test-databases',
);
const suitePattern = /^[a-z0-9][a-z0-9_-]{0,31}$/;

export function suiteId(value) {
  if (typeof value !== 'string' || !suitePattern.test(value))
    throw new Error('INVALID_SUITE_ID');
  return value;
}

export function localUrl(value, username) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error('INVALID_DATABASE_TARGET');
  }
  if (
    !['postgres:', 'postgresql:'].includes(url.protocol) ||
    url.hostname !== '127.0.0.1' ||
    url.port !== '5432' ||
    url.username !== username ||
    !url.password ||
    !/^\/apnatown_[a-z0-9_-]+$/.test(url.pathname) ||
    url.search ||
    url.hash
  )
    throw new Error('UNSAFE_DATABASE_TARGET');
  return url;
}

export function localTargets(env) {
  if (!['local', 'test'].includes(env.APP_ENV))
    throw new Error('LOCAL_TEST_ONLY');
  const migration = localUrl(env.MIGRATION_DATABASE_URL, 'apnatown_migrator');
  const runtime = localUrl(env.DATABASE_URL, 'apnatown_runtime');
  const shadow = localUrl(env.SHADOW_DATABASE_URL, 'apnatown_migrator');
  if (
    migration.pathname !== '/apnatown_local' ||
    runtime.pathname !== migration.pathname ||
    shadow.pathname !== '/apnatown_shadow'
  )
    throw new Error('UNSAFE_DATABASE_TARGET');
  return { migration, runtime, shadow };
}

export function createManifest(suite, targets) {
  suiteId(suite);
  const suffix = randomUUID().slice(0, 8);
  const databaseName = `apnatown_test_${suite}_${suffix}`;
  const shadowDatabaseName = `${databaseName}_shadow`;
  const migration = new URL(targets.migration);
  const runtime = new URL(targets.runtime);
  const shadow = new URL(targets.shadow);
  migration.pathname = runtime.pathname = `/${databaseName}`;
  shadow.pathname = `/${shadowDatabaseName}`;
  return {
    version: 1,
    suite,
    databaseName,
    shadowDatabaseName,
    marker: `apnatown:c00:test:${suite}:${randomUUID()}`,
    env: {
      APP_ENV: 'test',
      DATABASE_URL: runtime.href,
      MIGRATION_DATABASE_URL: migration.href,
      SHADOW_DATABASE_URL: shadow.href,
    },
  };
}

export function validateManifest(manifest, suite) {
  suiteId(suite);
  if (
    !manifest ||
    manifest.version !== 1 ||
    manifest.suite !== suite ||
    !new RegExp(`^apnatown_test_${suite}_[a-f0-9]{8}$`).test(
      manifest.databaseName,
    ) ||
    manifest.shadowDatabaseName !== `${manifest.databaseName}_shadow` ||
    !new RegExp(`^apnatown:c00:test:${suite}:[a-f0-9-]{36}$`).test(
      manifest.marker,
    ) ||
    manifest.env?.APP_ENV !== 'test'
  )
    throw new Error('INVALID_SUITE_MANIFEST');
  const migration = localUrl(
    manifest.env.MIGRATION_DATABASE_URL,
    'apnatown_migrator',
  );
  const runtime = localUrl(manifest.env.DATABASE_URL, 'apnatown_runtime');
  const shadow = localUrl(
    manifest.env.SHADOW_DATABASE_URL,
    'apnatown_migrator',
  );
  if (
    migration.pathname !== `/${manifest.databaseName}` ||
    runtime.pathname !== migration.pathname ||
    shadow.pathname !== `/${manifest.shadowDatabaseName}`
  )
    throw new Error('INVALID_SUITE_MANIFEST');
  return manifest;
}
