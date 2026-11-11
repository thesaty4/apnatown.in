import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

export const root = fileURLToPath(new URL('../../../', import.meta.url));

export function outputRoot() {
  const { values } = parseArgs({ options: { 'out-dir': { type: 'string' } } });
  return resolve(values['out-dir'] ?? root);
}

export async function writeOutput(base, path, content) {
  const destination = resolve(base, path);
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, content);
}
