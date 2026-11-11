import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

const directory = await mkdtemp(resolve(tmpdir(), 'apnatown-openapi-'));
try {
  const output = resolve(directory, 'openapi.json');
  const result = spawnSync(
    'pnpm',
    ['run', 'api:openapi', `--output=${output}`],
    { stdio: 'inherit' },
  );
  if (result.status !== 0) throw new Error('OpenAPI regeneration failed');
  const [actual, expected] = await Promise.all([
    readFile(output, 'utf8'),
    readFile('../../packages/api-client/openapi.json', 'utf8'),
  ]);
  if (actual !== expected)
    throw new Error(
      'OpenAPI drift: run pnpm api:openapi and review the contract',
    );
} finally {
  await rm(directory, { recursive: true, force: true });
}
