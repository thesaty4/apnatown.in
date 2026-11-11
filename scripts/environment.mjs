import { randomBytes } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseEnv } from 'node:util';

const loopback = new Set(['localhost', '127.0.0.1', '[::1]']);
const commonKeys = ['PATH', 'HOME', 'TMPDIR', 'TEMP', 'SystemRoot', 'CI'];
const ownerKeys = {
  api: [
    'APP_ENV',
    'NODE_ENV',
    'DATABASE_URL',
    'WEB_ORIGIN',
    'CURSOR_SIGNING_KEY',
    'IDEMPOTENCY_HASH_KEY',
    'PORT',
    'WORKER_PROBE_PORT',
    'LOG_LEVEL',
    'SHUTDOWN_TIMEOUT_MS',
  ],
  web: ['APP_ENV', 'NODE_ENV', 'APP_BASE_URL', 'API_INTERNAL_ORIGIN'],
  database: [
    'APP_ENV',
    'NODE_ENV',
    'DATABASE_URL',
    'MIGRATION_DATABASE_URL',
    'SHADOW_DATABASE_URL',
  ],
  compose: ['POSTGRES_PASSWORD'],
  build: [],
};

export function validateLocalEnvironment(values) {
  if (!['local', 'test'].includes(values.APP_ENV)) {
    throw new Error('Local launchers require APP_ENV=local or test.');
  }
  for (const key of [
    'DATABASE_URL',
    'MIGRATION_DATABASE_URL',
    'SHADOW_DATABASE_URL',
  ]) {
    let url;
    try {
      url = new URL(values[key]);
    } catch {
      throw new Error(`Missing or invalid ${key}.`);
    }
    if (
      !['postgres:', 'postgresql:'].includes(url.protocol) ||
      !loopback.has(url.hostname) ||
      !/^\/apnatown_(local|shadow|test_[a-z0-9_]+)$/.test(url.pathname) ||
      !url.password ||
      url.search
    ) {
      throw new Error(`Unsafe local database target in ${key}.`);
    }
  }
  const runtime = new URL(values.DATABASE_URL);
  const migration = new URL(values.MIGRATION_DATABASE_URL);
  const shadow = new URL(values.SHADOW_DATABASE_URL);
  if (
    runtime.username !== 'apnatown_runtime' ||
    migration.username !== 'apnatown_migrator' ||
    runtime.username === migration.username ||
    runtime.host !== migration.host ||
    runtime.pathname !== migration.pathname ||
    shadow.host !== migration.host ||
    shadow.pathname === migration.pathname
  ) {
    throw new Error(
      'Database roles must be separate; shadow must be an isolated local database.',
    );
  }
  if (
    values.POSTGRES_PASSWORD !== decodeURIComponent(migration.password) ||
    !/^[a-f0-9]{64}$/.test(values.CURSOR_SIGNING_KEY ?? '')
  ) {
    throw new Error('Missing or inconsistent generated local credentials.');
  }
  if (!/^[a-f0-9]{64}$/.test(values.IDEMPOTENCY_HASH_KEY ?? '')) {
    throw new Error(
      'Provision IDEMPOTENCY_HASH_KEY with 32 random bytes encoded as lowercase hex. Existing local configuration is never overwritten or automatically rotated.',
    );
  }
  for (const key of ['APP_BASE_URL', 'API_INTERNAL_ORIGIN', 'WEB_ORIGIN']) {
    let url;
    try {
      url = new URL(values[key]);
    } catch {
      throw new Error(`Missing or invalid ${key}.`);
    }
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      !loopback.has(url.hostname) ||
      url.username ||
      url.password ||
      url.pathname !== '/' ||
      url.search ||
      url.hash
    ) {
      throw new Error(`Unsafe local origin in ${key}.`);
    }
  }
  if (
    new URL(values.WEB_ORIGIN).origin !== new URL(values.APP_BASE_URL).origin
  ) {
    throw new Error('WEB_ORIGIN must match APP_BASE_URL.');
  }
  return values;
}

export async function createLocalEnvironment(root, environment = process.env) {
  if (!['local', 'test'].includes(environment.APP_ENV ?? 'local')) {
    throw new Error('env:local cannot create production configuration.');
  }
  const file = resolve(root, '.env.local');
  try {
    const existing = parseEnv(await readFile(file, 'utf8'));
    validateLocalEnvironment(existing);
    return false;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const template = await readFile(resolve(root, '.env.example'), 'utf8');
  const values = parseEnv(template);
  const migrationPassword = randomBytes(32).toString('hex');
  const runtimePassword = randomBytes(32).toString('hex');
  Object.assign(values, {
    APP_ENV: environment.APP_ENV ?? 'local',
    NODE_ENV: environment.APP_ENV === 'test' ? 'test' : 'development',
    POSTGRES_PASSWORD: migrationPassword,
    DATABASE_URL: `postgresql://apnatown_runtime:${runtimePassword}@127.0.0.1:5432/apnatown_local`,
    MIGRATION_DATABASE_URL: `postgresql://apnatown_migrator:${migrationPassword}@127.0.0.1:5432/apnatown_local`,
    SHADOW_DATABASE_URL: `postgresql://apnatown_migrator:${migrationPassword}@127.0.0.1:5432/apnatown_shadow`,
    CURSOR_SIGNING_KEY: randomBytes(32).toString('hex'),
    IDEMPOTENCY_HASH_KEY: randomBytes(32).toString('hex'),
    SESSION_COOKIE_SECRET: randomBytes(32).toString('hex'),
    ANONYMOUS_SESSION_TTL_SECONDS: '900',
    SHUTDOWN_TIMEOUT_MS: '10000',
  });
  validateLocalEnvironment(values);
  const content = template.replace(
    /^([A-Z_]+)=.*$/gm,
    (_, key) => `${key}=${values[key]}`,
  );
  await writeFile(file, content, { flag: 'wx', mode: 0o600 });
  return true;
}

export async function readLocalEnvironment(root, inherited = process.env) {
  let values;
  try {
    values = parseEnv(await readFile(resolve(root, '.env.local'), 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    throw new Error('Missing .env.local; run pnpm env:local first.', {
      cause: error,
    });
  }
  if (inherited.APP_ENV && !['local', 'test'].includes(inherited.APP_ENV)) {
    throw new Error('Local launchers cannot target production.');
  }
  if (inherited.APP_ENV) values.APP_ENV = inherited.APP_ENV;
  return validateLocalEnvironment(values);
}

export function environmentFor(owner, values, inherited = process.env) {
  if (!Object.hasOwn(ownerKeys, owner))
    throw new Error('Unknown environment owner.');
  const result = {};
  for (const key of commonKeys) {
    if (inherited[key] !== undefined) result[key] = inherited[key];
  }
  for (const key of ownerKeys[owner]) {
    if (values[key] !== undefined) result[key] = values[key];
  }
  if (owner === 'web') result.NEXT_TELEMETRY_DISABLED = '1';
  return result;
}
