import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { localUrl } from './targets.mjs';

const apiRoot = fileURLToPath(new URL('../', import.meta.url));
const prismaCli = resolve(
  dirname(createRequire(import.meta.url).resolve('prisma/package.json')),
  'build/index.js',
);

// Studio has no login. The owner role gives full visibility; read-only
// sessions prevent accidental edits but are not a security boundary.
function studioUrl(env) {
  if (!['local', 'test'].includes(env.APP_ENV))
    throw new Error('LOCAL_TEST_ONLY');
  const url = localUrl(env.MIGRATION_DATABASE_URL, 'apnatown_migrator');
  if (url.pathname !== '/apnatown_local')
    throw new Error('UNSAFE_DATABASE_TARGET');
  url.searchParams.set('default_transaction_read_only', 'on');
  url.searchParams.set('application_name', 'apnatown-prisma-studio');
  return url;
}

export async function studio(env) {
  const childEnv = { ...env, STUDIO_DATABASE_URL: studioUrl(env).toString() };
  for (const key of [
    'DATABASE_URL',
    'MIGRATION_DATABASE_URL',
    'SHADOW_DATABASE_URL',
  ])
    delete childEnv[key];
  // URL travels via env, never argv, so it is not visible in process lists.
  const child = spawn(
    process.execPath,
    [
      prismaCli,
      'studio',
      '--config',
      'prisma.studio.config.ts',
      '--browser',
      'none',
    ],
    { cwd: apiRoot, env: childEnv, stdio: 'inherit' },
  );
  const forward = (signal) => child.kill(signal);
  process.on('SIGINT', forward);
  process.on('SIGTERM', forward);
  try {
    const [code, signal] = await new Promise((resolveExit, reject) => {
      child.once('error', () => reject(new Error('STUDIO_FAILED')));
      child.once('close', (exitCode, exitSignal) =>
        resolveExit([exitCode, exitSignal]),
      );
    });
    if (code !== 0 && !signal) throw new Error('STUDIO_FAILED');
  } finally {
    process.off('SIGINT', forward);
    process.off('SIGTERM', forward);
  }
}
