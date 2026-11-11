import { provision } from './provision.mjs';
import { createSuite, dropSuite } from './suites.mjs';
import { migrate } from './migrate.mjs';
import { seed } from './seed.mjs';
import { suiteId } from './targets.mjs';

const commands = new Set([
  'provision',
  'migrate',
  'seed',
  'test:create',
  'test:drop',
]);
const safeErrors = new Set([
  'INVALID_SUITE_ID',
  'INVALID_DATABASE_TARGET',
  'UNSAFE_DATABASE_TARGET',
  'LOCAL_TEST_ONLY',
  'TEST_ENV_REQUIRED',
  'UNSAFE_RUNTIME_MEMBERSHIPS',
  'UNMARKED_SHADOW_DATABASE',
  'UNSAFE_MANIFEST_DIRECTORY',
  'UNSAFE_SUITE_MANIFEST',
  'INVALID_SUITE_MANIFEST',
  'DATABASE_MARKER_MISMATCH',
  'SUITE_STILL_CONNECTED',
  'C01_C02_REQUIRED_NO_REVIEWED_MIGRATIONS',
  'C02_REQUIRED_NO_DOMAIN_SEED_ADAPTER',
  'C01_REQUIRED_QUEUE_SCHEMA_AND_RUNTIME_MANIFEST',
  'MIGRATION_DEPLOY_FAILED',
  'INVALID_COMMAND',
]);

async function main() {
  const [command, ...args] = process.argv
    .slice(2)
    .filter((arg) => arg !== '--');
  if (
    !commands.has(command) ||
    args.length > 1 ||
    (args[0] && !args[0].startsWith('--suite='))
  )
    throw new Error('INVALID_COMMAND');
  const suite = args[0] ? suiteId(args[0].slice('--suite='.length)) : undefined;
  if (command.startsWith('test:') && !suite)
    throw new Error('INVALID_SUITE_ID');
  if (command === 'provision' && suite) throw new Error('INVALID_COMMAND');
  if (command === 'provision') await provision(process.env);
  if (command === 'migrate') await migrate(process.env, suite);
  if (command === 'seed') await seed(process.env);
  if (command === 'test:create') await createSuite(process.env, suite);
  if (command === 'test:drop') await dropSuite(process.env, suite);
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
