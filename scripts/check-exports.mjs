import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { environmentFor } from './environment.mjs';

for (const name of ['shared', 'ui', 'api-client']) {
  const directory = resolve('packages', name);
  const manifest = JSON.parse(
    await readFile(resolve(directory, 'package.json'), 'utf8'),
  );
  for (const [subpath, target] of Object.entries(manifest.exports)) {
    assert(!subpath.includes('*'), 'Scaffold exports must be explicit.');
    const specifier = manifest.name + (subpath === '.' ? '' : subpath.slice(1));
    const paths = [];
    const collect = (value) => {
      if (typeof value === 'string') paths.push(value);
      else Object.values(value).forEach(collect);
    };
    collect(target);
    for (const path of paths) await access(resolve(directory, path));
    if (paths.every((path) => path.endsWith('.css') || path.endsWith('.d.ts')))
      continue;
    for (const mode of name === 'shared' ? ['import', 'require'] : ['import']) {
      const source =
        mode === 'import'
          ? `await import(${JSON.stringify(specifier)})`
          : `require(${JSON.stringify(specifier)})`;
      const result = spawnSync(
        process.execPath,
        [...(mode === 'import' ? ['--input-type=module'] : []), '-e', source],
        { cwd: directory, env: environmentFor('build', {}), encoding: 'utf8' },
      );
      assert.equal(
        result.status,
        0,
        `${specifier} ${mode} failed: ${result.stderr}`,
      );
    }
  }
}
console.log(
  'All built package exports load in their supported Node module modes.',
);
