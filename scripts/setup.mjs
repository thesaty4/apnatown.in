// One-command local setup: runs the README "Local development" steps in order.
// Uses only Node built-ins so it works before `pnpm install`.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const isWindows = process.platform === 'win32';
const flags = new Set(process.argv.slice(2).filter((arg) => arg !== '--'));
const known = ['--skip-install', '--skip-db', '--no-seed', '--dev', '--help'];

const usage = `Usage: node scripts/setup.mjs [options]

Sets up the local workspace: install -> env:local -> generate -> db:up ->
db:migrate -> db:seed. Safe to re-run; existing .env.local, database volume
and seeded rows are kept.

Options:
  --skip-install  Skip pnpm install
  --skip-db       Skip Docker database start, migrations and seed
  --no-seed       Skip loading local demo data
  --dev           Start web, API and worker (pnpm dev) after setup
  --help          Show this help`;

function fail(message) {
  console.error(`\nSetup failed: ${message}`);
  process.exit(1);
}

function succeeds(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    shell: isWindows,
  });
  return result.status === 0 ? result.stdout.trim() : undefined;
}

function step(label, command, args, shell = false) {
  console.log(`\n==> ${label}`);
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell,
  });
  if (result.error)
    fail(`could not start ${command} (${result.error.message}).`);
  if (result.status !== 0)
    fail(`"${label}" exited with ${result.status ?? result.signal}.`);
}

if (flags.has('--help')) {
  console.log(usage);
  process.exit(0);
}
const unknown = [...flags].filter((flag) => !known.includes(flag));
if (unknown.length) fail(`unknown option ${unknown.join(', ')}\n\n${usage}`);

const manifest = JSON.parse(
  readFileSync(resolve(root, 'package.json'), 'utf8'),
);
const nodeVersion = readFileSync(resolve(root, '.node-version'), 'utf8').trim();
const pnpmVersion = manifest.engines.pnpm;

if (process.versions.node !== nodeVersion) {
  fail(
    `Node ${nodeVersion} is required (found ${process.versions.node}). ` +
      `Install it, e.g. "nvm install ${nodeVersion} && nvm use ${nodeVersion}" or "fnm use".`,
  );
}

// npx/pnpm are .cmd shims on Windows and may be missing from PATH elsewhere,
// so run npm's bundled npx with this same Node instead of spawning `npx`.
function findNpxCli() {
  const bin = dirname(process.execPath);
  return [
    resolve(bin, 'node_modules/npm/bin/npx-cli.js'),
    resolve(bin, '../lib/node_modules/npm/bin/npx-cli.js'),
  ].find((path) => existsSync(path));
}

// Prefer an installed pnpm of the pinned version; otherwise fetch it via npx.
function resolvePnpm() {
  if (succeeds('pnpm', ['--version']) === pnpmVersion)
    return { command: 'pnpm', prefix: [], shell: isWindows };
  const npxCli = findNpxCli();
  if (!npxCli)
    fail(
      `pnpm ${pnpmVersion} was not found and npm's npx is missing next to ${process.execPath}. ` +
        `Install it with "npm install -g pnpm@${pnpmVersion}" (or "corepack enable") and re-run.`,
    );
  return {
    command: process.execPath,
    prefix: [npxCli, '--yes', `pnpm@${pnpmVersion}`],
    shell: false,
  };
}

const pnpm = resolvePnpm();
const pnpmStep = (label, ...args) =>
  step(label, pnpm.command, [...pnpm.prefix, ...args], pnpm.shell);

const useDb = !flags.has('--skip-db');
if (useDb) {
  if (succeeds('docker', ['compose', 'version']) === undefined)
    fail('Docker with the compose plugin is required (or pass --skip-db).');
  if (succeeds('docker', ['info']) === undefined)
    fail(
      'Docker is installed but not running. Start Docker Desktop/daemon (or pass --skip-db).',
    );
}

// An interrupted `prisma generate` can leave only empty folders behind, which
// Prisma then refuses to overwrite. Remove the output only if it has no files.
function clearEmptyPrismaOutput() {
  const output = resolve(root, 'apps/api/src/shared/persistence/generated');
  if (!existsSync(output)) return;
  const entries = readdirSync(output, { recursive: true, withFileTypes: true });
  if (entries.every((entry) => entry.isDirectory()))
    rmSync(output, { recursive: true });
}

console.log(`ApnaTown local setup (Node ${nodeVersion}, pnpm ${pnpmVersion})`);
if (!flags.has('--skip-install'))
  pnpmStep('Installing dependencies', 'install', '--frozen-lockfile');
pnpmStep('Creating private .env.local', 'run', 'env:local');
clearEmptyPrismaOutput();
pnpmStep('Generating and building workspace packages', 'run', 'generate');
if (useDb) {
  pnpmStep('Starting local PostgreSQL (Docker)', 'run', 'db:up');
  pnpmStep('Applying database migrations', 'run', 'db:migrate');
  if (!flags.has('--no-seed'))
    pnpmStep('Loading local demo data', 'run', 'db:seed');
}

console.log(`
Setup complete.
  Web:    http://localhost:3000
  API:    http://localhost:3001
Start the app with: ${pnpm.command === 'pnpm' ? 'pnpm' : `npx --yes pnpm@${pnpmVersion}`} dev`);

if (flags.has('--dev')) pnpmStep('Starting web, API and worker', 'run', 'dev');
