import { spawnSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';

for (const config of ['tsconfig.json', 'tsconfig.cjs.json']) {
  const result = spawnSync('pnpm', ['exec', 'tsc', '-p', config], {
    stdio: 'inherit',
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
for (const [directory, type] of [
  ['esm', 'module'],
  ['cjs', 'commonjs'],
]) {
  await mkdir(`dist/${directory}`, { recursive: true });
  await writeFile(
    `dist/${directory}/package.json`,
    `${JSON.stringify({ type })}\n`,
  );
}
