import assert from 'node:assert/strict';
import { glob, readFile } from 'node:fs/promises';

const readJson = async (file) => JSON.parse(await readFile(file, 'utf8'));
const root = await readJson('package.json');
const node = (await readFile('.node-version', 'utf8')).trim();
assert.equal(process.versions.node, node, 'Use the pinned Node version.');
assert.equal(root.engines.node, node);
assert.equal(root.packageManager, `pnpm@${root.engines.pnpm}`);

const names = [
  'apps/api',
  'apps/web',
  'packages/shared',
  'packages/ui',
  'packages/api-client',
];
const manifests = [
  root,
  ...(await Promise.all(names.map((name) => readJson(`${name}/package.json`)))),
];
const versions = new Map();
for (const manifest of manifests) {
  for (const field of ['dependencies', 'devDependencies']) {
    for (const [name, version] of Object.entries(manifest[field] ?? {})) {
      if (name.startsWith('@apnatown/')) {
        assert.equal(version, 'workspace:*', `${name} must use workspace:*`);
      } else {
        assert.match(
          version,
          /^\d+\.\d+\.\d+$/,
          `${manifest.name}: pin ${name} exactly.`,
        );
        assert(
          !versions.has(name) || versions.get(name) === version,
          `${name}: inconsistent pins.`,
        );
        versions.set(name, version);
      }
    }
  }
  for (const hook of ['preinstall', 'install', 'postinstall', 'prepare']) {
    assert(
      !manifest.scripts?.[hook],
      `No hidden installation side effect: ${manifest.name}/${hook}`,
    );
  }
}
assert.equal(versions.get('prisma'), versions.get('@prisma/client'));
assert.equal(versions.get('react'), versions.get('react-dom'));
for (const name of ['packages/ui']) {
  const manifest = await readJson(`${name}/package.json`);
  assert(manifest.peerDependencies?.react, 'UI must share React as a peer.');
  assert(
    !manifest.dependencies?.react,
    'UI must not own a second React runtime.',
  );
}
const compose = await readFile('compose.yaml', 'utf8');
assert.match(compose, /postgis\/postgis:\d+-[\d.]+@sha256:[a-f0-9]{64}/);
assert(!/redis|bullmq/i.test(compose), 'No Redis at launch.');
for await (const path of glob('.github/workflows/*.{yml,yaml}')) {
  const workflow = await readFile(path, 'utf8');
  for (const [, reference] of workflow.matchAll(/uses:\s+([^\s]+)/g)) {
    assert.match(
      reference,
      /^[\w./-]+@[a-f0-9]{40}$/,
      `${path}: pin actions by immutable SHA.`,
    );
  }
}
console.log('Workspace pins, package boundaries, and CI action pins verified.');
