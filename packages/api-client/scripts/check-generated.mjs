import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const temporary = await mkdtemp(resolve(tmpdir(), 'apnatown-client-'));
const file = 'packages/api-client/src/schema.d.ts';
try {
  execFileSync(
    process.execPath,
    [
      fileURLToPath(new URL('./generate.mjs', import.meta.url)),
      '--out-dir',
      temporary,
    ],
    { stdio: 'inherit' },
  );
  if (
    !(await readFile(resolve(root, file))).equals(
      await readFile(resolve(temporary, file)),
    )
  ) {
    throw new Error(`Generated drift: ${file}`);
  }
  console.log('client: generated files match');
} finally {
  await rm(temporary, { recursive: true, force: true });
}
