/**
 * Public-tunnel launcher.
 *
 * Runs API, worker and Web with the per-process environment allow-lists from
 * scripts/environment.mjs, but reads `.env.public` instead of `.env.local` and
 * skips the loopback-only validation those local launchers enforce.
 *
 * Usage:
 *   node scripts/public.mjs dev    # next dev (works before a production build)
 *   node scripts/public.mjs start  # next start (requires `next build`)
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { parseEnv } from 'node:util';
import { environmentFor } from './environment.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const mode = process.argv[2] === 'start' ? 'start' : 'dev';
const dev = mode === 'dev';

const values = parseEnv(
  await readFile(resolve(root, '.env.public'), 'utf8').catch(() => {
    throw new Error(
      'Missing .env.public. Create it from .env.local with APP_ENV=production and the public https origins.',
    );
  }),
);

if (values.APP_ENV !== 'production') {
  throw new Error('scripts/public.mjs requires APP_ENV=production in .env.public.');
}
if (!values.APP_BASE_URL?.startsWith('https://')) {
  throw new Error('APP_BASE_URL must be https in .env.public.');
}

const webUrl = new URL(values.APP_BASE_URL);
// The public URL's port is upstream-port, not the local listener: ngrok points
// at this local port. Override with WEB_PORT if you change the tunnel target.
const webPort = process.env.WEB_PORT ?? values.WEB_PORT ?? '3000';

// NODE_ENV must follow the Next.js command, not the .env.public value.
const webEnvironment = {
  ...environmentFor('web', values),
  NODE_ENV: dev ? 'development' : 'production',
  NEXT_TELEMETRY_DISABLED: '1',
};

const processes = [
  ['api', process.execPath, [resolve(root, 'apps/api/dist/main.js')], root, environmentFor('api', values)],
  ['worker', process.execPath, [resolve(root, 'apps/api/dist/worker.js')], root, environmentFor('api', values)],
  [
    'web',
    process.execPath,
    [
      resolve(root, 'apps/web/node_modules/next/dist/bin/next'),
      mode,
      '--hostname',
      'localhost',
      '--port',
      webPort,
    ],
    resolve(root, 'apps/web'),
    webEnvironment,
  ],
];

const children = [];

for (const [name, command, args, cwd, env] of processes) {
  const child = spawn(command, args, { cwd, env, stdio: ['ignore', 'pipe', 'pipe'] });
  children.push([name, child]);
  const prefix = `[${name}] `;
  const pipe = (stream, target) => {
    stream.setEncoding('utf8');
    stream.on('data', (chunk) => {
      for (const line of chunk.split('\n')) {
        if (line.trim()) target.write(`${prefix}${line}\n`);
      }
    });
  };
  pipe(child.stdout, process.stdout);
  pipe(child.stderr, process.stderr);
  child.on('exit', (code, signal) => {
    console.error(`[${name}] exited (code=${code ?? 'null'}, signal=${signal ?? 'none'})`);
    shutdown();
  });
}

let stopping = false;
function shutdown() {
  if (stopping) return;
  stopping = true;
  for (const [, child] of children) {
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGTERM');
  }
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    shutdown();
    setTimeout(() => process.exit(0), 500);
  });
}

console.log(`[public] mode=${mode} public=${values.APP_BASE_URL} web=localhost:${webPort}`);
