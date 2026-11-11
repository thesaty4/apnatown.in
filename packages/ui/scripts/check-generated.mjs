import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { root } from './output.mjs';

const kind = process.argv[2];
if (!['tokens', 'i18n'].includes(kind))
  throw new Error('Expected tokens or i18n');
const temporary = await mkdtemp(resolve(tmpdir(), 'apnatown-generated-'));
const files =
  kind === 'tokens'
    ? ['packages/ui/src/tokens.css', 'packages/ui/src/tailwind.css']
    : ['en', 'hi', 'bootstrap.en', 'bootstrap.hi'].map(
        (locale) => `apps/web/src/shared/i18n/messages/${locale}.json`,
      );
try {
  execFileSync(
    process.execPath,
    [
      resolve(root, `packages/ui/scripts/generate-${kind}.mjs`),
      '--out-dir',
      temporary,
    ],
    { stdio: 'inherit' },
  );
  for (const file of files) {
    const actual = await readFile(resolve(root, file));
    const expected = await readFile(resolve(temporary, file));
    if (!actual.equals(expected)) throw new Error(`Generated drift: ${file}`);
  }
  console.log(`${kind}: generated files match`);
} finally {
  await rm(temporary, { recursive: true, force: true });
}
