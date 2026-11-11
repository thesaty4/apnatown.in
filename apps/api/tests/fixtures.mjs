import { randomBytes } from 'node:crypto';
import { createServer } from 'node:net';

export function runtimeEnvironment(overrides = {}) {
  return {
    APP_ENV: 'test',
    DATABASE_URL: `postgresql://apnatown_runtime:${randomBytes(16).toString('hex')}@127.0.0.1:1/apnatown_test_unavailable`,
    WEB_ORIGIN: 'http://127.0.0.1:3000',
    CURSOR_SIGNING_KEY: randomBytes(32).toString('base64url'),
    PORT: '3001',
    WORKER_PROBE_PORT: '3002',
    LOG_LEVEL: 'silent',
    SHUTDOWN_TIMEOUT_MS: '1000',
    ...overrides,
  };
}

export async function unusedPort() {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
  return port;
}

export function databaseEnvironment(overrides = {}) {
  const password = randomBytes(16).toString('hex');
  return {
    APP_ENV: 'test',
    DATABASE_URL: `postgresql://apnatown_runtime:${password}@127.0.0.1:5432/apnatown_local`,
    MIGRATION_DATABASE_URL: `postgresql://apnatown_migrator:${password}@127.0.0.1:5432/apnatown_local`,
    SHADOW_DATABASE_URL: `postgresql://apnatown_migrator:${password}@127.0.0.1:5432/apnatown_shadow`,
    ...overrides,
  };
}
