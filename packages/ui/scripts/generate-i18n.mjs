import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parse } from '@formatjs/icu-messageformat-parser';
import { root, outputRoot, writeOutput } from './output.mjs';

const read = async (path) =>
  JSON.parse(await readFile(resolve(root, path), 'utf8'));

function parameters(message) {
  const names = new Set();
  const visit = (nodes) => {
    for (const node of nodes) {
      if (node.type !== 0 && typeof node.value === 'string')
        names.add(node.value);
      if (node.children) visit(node.children);
      if (node.options)
        Object.values(node.options).forEach((option) => visit(option.value));
    }
  };
  visit(parse(message, { ignoreTag: true }));
  return [...names].sort().join(',');
}

function insert(catalogue, key, value) {
  if (
    !/^[a-z][a-zA-Z0-9]*(?:\.[a-z][a-zA-Z0-9]*){2,}$/.test(key) ||
    key
      .split('.')
      .some((part) => ['__proto__', 'prototype', 'constructor'].includes(part))
  ) {
    throw new Error(`Invalid semantic key: ${key}`);
  }
  const path = key.split('.');
  const leaf = path.pop();
  let target = catalogue;
  for (const part of path) {
    target[part] ??= {};
    if (typeof target[part] !== 'object')
      throw new Error(`Key prefix collision: ${key}`);
    target = target[part];
  }
  if (target[leaf] !== undefined)
    throw new Error(`Duplicate semantic key: ${key}`);
  target[leaf] = value;
}

export function generateCatalogues(source, mapping, additions = {}) {
  const en = {},
    hi = {};
  const sourceKeys = new Set(source.strings.map((entry) => entry.en));
  if (
    sourceKeys.size !== source.strings.length ||
    source.count !== source.strings.length
  ) {
    throw new Error('Source catalogue count/uniqueness mismatch');
  }
  for (const key of Object.keys(mapping)) {
    if (!sourceKeys.has(key)) throw new Error(`Stale source mapping: ${key}`);
  }
  const entries = source.strings.map((entry) => ({
    ...entry,
    key: mapping[entry.en],
  }));
  for (const [key, entry] of Object.entries(additions))
    entries.push({ key, ...entry });
  for (const entry of entries.sort((a, b) =>
    String(a.key).localeCompare(String(b.key), 'en'),
  )) {
    if (!entry.key || !entry.en?.trim() || !entry.hi?.trim()) {
      throw new Error(
        `Missing semantic mapping or EN/HI translation: ${entry.en}`,
      );
    }
    if (parameters(entry.en) !== parameters(entry.hi))
      throw new Error(`ICU mismatch: ${entry.key}`);
    insert(en, entry.key, entry.en);
    insert(hi, entry.key, entry.hi);
  }
  return { en, hi };
}

// Keep this module importable by tests without writing artifacts.
if (
  process.argv[1] &&
  resolve(process.argv[1]) === new URL(import.meta.url).pathname
) {
  const catalogues = generateCatalogues(
    await read('docs/design-context/09a-i18n-en-hi.json'),
    await read('apps/web/src/shared/i18n/source-key-map.json'),
    await read('apps/web/src/shared/i18n/reviewed-additions.json'),
  );
  const destination = outputRoot();
  for (const locale of ['en', 'hi']) {
    await writeOutput(
      destination,
      `apps/web/src/shared/i18n/messages/${locale}.json`,
      JSON.stringify(catalogues[locale], null, 2) + '\n',
    );
    const { copy: _unusedSourceCopy, ...common } = catalogues[locale].common;
    await writeOutput(
      destination,
      `apps/web/src/shared/i18n/messages/bootstrap.${locale}.json`,
      JSON.stringify({ common }, null, 2) + '\n',
    );
  }
}
