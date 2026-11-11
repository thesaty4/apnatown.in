import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { PgBoss } from 'pg-boss';
import { localTargets } from './targets.mjs';
import { withDatabase } from './database.mjs';

export async function migrate(env) {
  localTargets(env);
  const directory = new URL('./migrations/', import.meta.url);
  const entries = await readdir(directory).catch((error) => {
    if (error.code === 'ENOENT') return [];
    throw error;
  });
  if (!entries.length)
    throw new Error('C01_C02_REQUIRED_NO_REVIEWED_MIGRATIONS');
  // Prisma applies only the reviewed history; queue setup below uses the
  // separately pinned pg-boss migration API under the local migration role.
  const result = spawnSync(
    'pnpm',
    ['exec', 'prisma', 'migrate', 'deploy', '--config', 'prisma.config.ts'],
    {
      cwd: fileURLToPath(new URL('../', import.meta.url)),
      env: {
        PATH: env.PATH,
        HOME: env.HOME,
        MIGRATION_DATABASE_URL: env.MIGRATION_DATABASE_URL,
        SHADOW_DATABASE_URL: env.SHADOW_DATABASE_URL,
      },
      // Prisma output can contain a target URL. Report only the exit result.
      stdio: 'pipe',
    },
  );
  if (result.status !== 0) throw new Error('MIGRATION_DEPLOY_FAILED');

  // Use pg-boss's pinned migration API as the privileged local migration
  // role. API/worker runtimes must use migrate:false and createSchema:false.
  const boss = new PgBoss({
    connectionString: env.MIGRATION_DATABASE_URL,
    connectionTimeoutMillis: 2000,
    max: 1,
    schema: 'pgboss',
    migrate: true,
    createSchema: true,
    supervise: false,
    schedule: false,
  });
  let queueFailed = false;
  boss.on('error', () => {
    queueFailed = true;
  });
  try {
    await boss.start({ attempts: 1 });
    if (!(await boss.isInstalled()) || !(await boss.schemaVersion()))
      throw new Error('QUEUE_SCHEMA_SETUP_FAILED');
    await boss.createQueue('apnatown.outbox');
  } finally {
    await boss.stop({ close: true, graceful: false, timeout: 5000 });
  }
  if (queueFailed) throw new Error('QUEUE_SCHEMA_SETUP_FAILED');

  // The runtime role can operate queue records but cannot create or alter
  // schemas/tables. Defaults cover future objects created by this migrator.
  await withDatabase(localTargets(env).migration, async (client) => {
    await client.query(
      'GRANT SELECT ON TABLE public._prisma_migrations TO apnatown_runtime',
    );
    await client.query('GRANT USAGE ON SCHEMA pgboss TO apnatown_runtime');
    await client.query(
      'GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA pgboss TO apnatown_runtime',
    );
    await client.query(
      'GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA pgboss TO apnatown_runtime',
    );
    await client.query(
      'ALTER DEFAULT PRIVILEGES IN SCHEMA pgboss GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO apnatown_runtime',
    );
    await client.query(
      'ALTER DEFAULT PRIVILEGES IN SCHEMA pgboss GRANT USAGE, SELECT ON SEQUENCES TO apnatown_runtime',
    );
  });
}
