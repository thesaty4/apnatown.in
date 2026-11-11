// One-time catalogue migration, NOT part of generate/dev/check:generated.
// The checked-in output is the explicit mapping input; additions require review.
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { root } from './output.mjs';

const source = JSON.parse(
  await readFile(
    resolve(root, 'docs/design-context/09a-i18n-en-hi.json'),
    'utf8',
  ),
);
const shellKeys = {
  'Welcome to ApnaTown': 'common.app.welcome',
  'Something went wrong': 'common.error.title',
  'Please check your connection and try again.': 'common.error.message',
  'Try again': 'common.actions.retry',
  'Check again': 'common.actions.checkAgain',
  'Go home': 'common.actions.home',
  'Page not found': 'common.notFound.title',
  'The page you are looking for does not exist or has moved.':
    'common.notFound.message',
  'Nothing here yet': 'common.empty.title',
  'Check back soon.': 'common.empty.message',
  Loading: 'common.loading.label',
  'You don’t have permission': 'common.noPermission.title',
  'This section is not available for your role. Ask a Super Admin for access.':
    'common.noPermission.message',
  'No internet connection': 'common.offline.title',
  'We’ll be right back': 'common.maintenance.title',
  'ApnaTown is under maintenance. Please try again in a few minutes.':
    'common.maintenance.message',
  Theme: 'common.theme.label',
  Light: 'common.theme.light',
  Dark: 'common.theme.dark',
  Auto: 'common.theme.auto',
  Language: 'common.language.label',
};
const mapping = {};
const used = new Set();
for (const { en } of source.strings) {
  const words = en
    .normalize('NFKD')
    .replace(/[’']/g, '')
    .match(/[a-zA-Z0-9]+/g);
  if (!words?.length) throw new Error(`Needs explicit semantic key: ${en}`);
  const name = words
    .map((word, index) =>
      index === 0
        ? word.toLowerCase()
        : word[0].toUpperCase() + word.slice(1).toLowerCase(),
    )
    .join('');
  let key =
    shellKeys[en] ?? `common.copy.${/^\d/.test(name) ? 'label' : ''}${name}`;
  // Exact trailing-space variants in the source remain separately traceable.
  if (used.has(key)) {
    key +=
      en.trimEnd() !== en
        ? 'Spaced'
        : /^[a-z]/.test(en)
          ? 'Lowercase'
          : en.endsWith('?')
            ? 'Confirmation'
            : en.endsWith('!')
              ? 'Announcement'
              : 'Alternate';
  }
  if (used.has(key)) throw new Error(`Semantic key collision: ${key}`);
  mapping[en] = key;
  used.add(key);
}
await writeFile(
  resolve(root, 'apps/web/src/shared/i18n/source-key-map.json'),
  JSON.stringify(mapping, null, 2) + '\n',
  { flag: 'wx' },
);
