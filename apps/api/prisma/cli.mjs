import { provision } from './provision.mjs';
import { migrate } from './migrate.mjs';
import { seed } from './seed.mjs';

const commands = new Set(['provision', 'migrate', 'seed']);
const safeErrors = new Set([
  'INVALID_DATABASE_TARGET',
  'UNSAFE_DATABASE_TARGET',
  'LOCAL_TEST_ONLY',
  'UNSAFE_RUNTIME_MEMBERSHIPS',
  'UNMARKED_SHADOW_DATABASE',
  'C01_C02_REQUIRED_NO_REVIEWED_MIGRATIONS',
  'API_BUILD_REQUIRED',
  'SEED_KEYS_REQUIRED',
  'SEED_DATA_INVALID',
  'MIGRATION_DEPLOY_FAILED',
  'QUEUE_SCHEMA_SETUP_FAILED',
  'INVALID_COMMAND',
]);

async function main() {
  const [command, ...args] = process.argv
    .slice(2)
    .filter((arg) => arg !== '--');
  if (!commands.has(command) || args.length) throw new Error('INVALID_COMMAND');
  if (command === 'provision') await provision(process.env);
  if (command === 'migrate') await migrate(process.env);
  if (command === 'seed') await seed(process.env);
  process.stdout.write('Database command completed\n');
}

main().catch((error) => {
  const code = safeErrors.has(error.message)
    ? error.message
    : 'DATABASE_COMMAND_FAILED';
  const databaseCode =
    typeof error.code === 'string' && /^[0-9A-Z]{5}$/.test(error.code)
      ? ` (PostgreSQL ${error.code})`
      : '';
  process.stderr.write(`${code}${databaseCode}\n`);
  process.exitCode = 1;
});
