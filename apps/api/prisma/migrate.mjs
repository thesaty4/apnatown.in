import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { localTargets } from './targets.mjs';
import { readManifest, verifySuite } from './suites.mjs';
import { withDatabase } from './database.mjs';

export async function migrate(env, suite) {
  const targets = localTargets(env);
  let migrationEnv = env;
  if (suite) {
    if (env.APP_ENV !== 'test') throw new Error('TEST_ENV_REQUIRED');
    const manifest = await readManifest(suite);
    await withDatabase(targets.migration, (client) =>
      verifySuite(client, manifest),
    );
    migrationEnv = manifest.env;
  }
  const directory = new URL('./migrations/', import.meta.url);
  const entries = await readdir(directory).catch((error) => {
    if (error.code === 'ENOENT') return [];
    throw error;
  });
  if (!entries.length)
    throw new Error('C01_C02_REQUIRED_NO_REVIEWED_MIGRATIONS');
  // Queue schema setup must be reviewed with the C01 runtime migration manifest;
  // never let an API/worker auto-migrate. Prisma runs only the reviewed history.
  const result = spawnSync(
    'pnpm',
    ['exec', 'prisma', 'migrate', 'deploy', '--config', 'prisma.config.ts'],
    {
      cwd: fileURLToPath(new URL('../', import.meta.url)),
      env: {
        PATH: env.PATH,
        HOME: env.HOME,
        MIGRATION_DATABASE_URL: migrationEnv.MIGRATION_DATABASE_URL,
        SHADOW_DATABASE_URL: migrationEnv.SHADOW_DATABASE_URL,
      },
      // Prisma output can contain a target URL. Report only the exit result.
      stdio: 'pipe',
    },
  );
  if (result.status !== 0) throw new Error('MIGRATION_DEPLOY_FAILED');
  throw new Error('C01_REQUIRED_QUEUE_SCHEMA_AND_RUNTIME_MANIFEST');
}
