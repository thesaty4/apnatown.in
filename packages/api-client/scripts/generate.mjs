import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import openapiTS, { astToString } from 'openapi-typescript';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const { values } = parseArgs({
  options: { 'out-dir': { type: 'string' }, input: { type: 'string' } },
});
const input = resolve(
  values.input ?? resolve(root, 'packages/api-client/openapi.json'),
);
const destination = resolve(
  values['out-dir'] ?? root,
  'packages/api-client/src/schema.d.ts',
);
const ast = await openapiTS(pathToFileURL(input), { alphabetize: true });
await mkdir(dirname(destination), { recursive: true });
await writeFile(destination, astToString(ast));
