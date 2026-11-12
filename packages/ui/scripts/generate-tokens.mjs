import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { root, outputRoot, writeOutput } from './output.mjs';

const source = JSON.parse(
  await readFile(
    resolve(root, 'docs/design-context/04-design-tokens.json'),
    'utf8',
  ),
);
const metrics = JSON.parse(
  await readFile(
    resolve(root, 'packages/ui/src/prototype-metrics.json'),
    'utf8',
  ),
);
const light = Object.assign({}, ...Object.values(source.light));
// The cascade merges overrides over :root once; invariant font/layout tokens
// must not be reassigned in dark mode (that would undo next/font bindings).
const dark = Object.assign({}, ...Object.values(source.dark_overrides));
const theme = {};
const custom = {};
const set = (name, value) => {
  custom[name] = String(value);
  return `var(--at-${name})`;
};
const map = (namespace, name, value) => {
  theme[`${namespace}-${name}`] = set(name, value);
};

for (const group of ['color', 'status-order', 'status-approval']) {
  for (const [key, value] of Object.entries(source.light[group]))
    map('color', key, value);
}
for (const key of Object.keys(source.light.radius))
  theme[`radius-${key.slice(2)}`] = `var(--at-${key})`;
for (const key of Object.keys(source.light.shadow))
  theme[`shadow-${key.slice(3)}`] = `var(--at-${key})`;
for (const key of Object.keys(source.light.font))
  theme[key] = `var(--at-${key})`;
for (const key of Object.keys(source.light.motion)) {
  theme[
    key === 'ease' ? 'ease-standard' : `transition-duration-${key.slice(4)}`
  ] = `var(--at-${key})`;
}
for (const [key, value] of Object.entries(source.light.layout))
  map('spacing', key, value);
for (const [key, value] of Object.entries(source.layout.breakpoints)) {
  // Breakpoints cannot reference runtime custom properties in media queries.
  theme[`breakpoint-${key}`] = value;
}
map('container', 'page', source.layout['container-max']);
map('spacing', 'touch', source.spacing['touch-target-min']);
set('focus-ring', source.spacing['focus-ring']);
theme.spacing = set('space-unit', source.spacing.base.split(' / ')[0]);
for (const value of source.spacing['gap-scale'].split(','))
  map('spacing', Number(value) / 4, `${value}px`);

// The pack contains descriptive type/metric values as well as CSS values.
// Normalize every entry explicitly; fail rather than silently dropping additions.
const typography = source.typography;
const typeNames = ['h1', 'h2', 'h3', 'h4'];
for (const key of typeNames) {
  const [size, weight] = typography[key].split('/');
  map('text', key, size);
  theme[`text-${key}--font-weight`] = weight;
  theme[`text-${key}--line-height`] = typography['heading-line-height'];
  theme[`text-${key}--letter-spacing`] = typography['heading-letter-spacing'];
}
for (const key of ['price', 'kpi-value', 'big-number']) {
  const [weight, size] = typography[key].split(' ');
  map('text', key, size);
  theme[`text-${key}--font-weight`] = weight;
}
for (const key of ['small', 'caption']) {
  const [minimum, maximum] = typography[key].split('-');
  map('text', `${key}-min`, `${parseFloat(minimum)}rem`);
  map('text', key, maximum ?? minimum);
}
map('text', 'mrp', typography.mrp.split(' ')[0]);
map('text', 'body', typography.base.split('/')[0]);
theme['text-body--line-height'] = typography.base.split('/')[1].split(' ')[0];
theme['text-body--font-weight'] = typography.base.split('weight ')[1];
map('text', 'button', typography.button.split(' ')[1]);
theme['text-button--font-weight'] = typography.button.split(' ')[0];
map('tracking', 'heading', typography['heading-letter-spacing']);
map('leading', 'heading', typography['heading-line-height']);
set('font-devanagari', `"${typography.families.devanagari}",sans-serif`);
theme['font-devanagari'] = 'var(--at-font-devanagari)';
for (const [key, value] of Object.entries(source.layout.columns))
  set(`columns-${key}`, value);
map('spacing', 'nav-height', source.layout['nav-height']);
map('spacing', 'bottom-tab-height', source.layout['bottom-tab-height']);
for (const key of [
  'button-min-height',
  'input-min-height',
  'searchbar-min-height',
]) {
  map('spacing', key, source['components-metrics'][key]);
}
const [otpWidth, otpHeight] =
  source['components-metrics']['otp-box'].split('x');
map('spacing', 'otp-width', `${otpWidth}px`);
map('spacing', 'otp-height', otpHeight);
const [iconMin, iconMax] = source['components-metrics'].iconbutton.split('-');
map('spacing', 'icon-min', `${iconMin}px`);
map('spacing', 'icon-max', iconMax);
for (const [namespace, entries] of Object.entries(metrics.tokens)) {
  for (const [key, value] of Object.entries(entries)) {
    if (namespace === 'breakpoint') theme[`breakpoint-${key}`] = value;
    else map(namespace, key, value);
  }
}

const expected = {
  typography: [
    'families',
    'base',
    ...typeNames,
    'price',
    'mrp',
    'small',
    'caption',
    'button',
    'kpi-value',
    'big-number',
    'heading-letter-spacing',
    'heading-line-height',
  ],
  spacing: ['base', 'touch-target-min', 'focus-ring', 'gap-scale'],
  layout: [
    'breakpoints',
    'container-max',
    'columns',
    'nav-height',
    'bottom-tab-height',
    'safe-area',
  ],
  'components-metrics': [
    'button-min-height',
    'input-min-height',
    'otp-box',
    'searchbar-min-height',
    'iconbutton',
  ],
};
for (const [group, keys] of Object.entries(expected)) {
  if (Object.keys(source[group]).sort().join() !== keys.sort().join())
    throw new Error(`Unmapped ${group} token`);
}
const declarations = (values, prefix) =>
  Object.entries(values)
    .sort(([a], [b]) => a.localeCompare(b, 'en'))
    .map(([key, value]) => `  --${prefix}${key}: ${value};`)
    .join('\n');
const block = (selector, values) =>
  `${selector} {\n${declarations(values, 'at-')}\n}\n`;
const generated =
  '/* Generated from the Design Context Pack; do not edit. */\n';
const colors = { ...custom, ...light };
const css =
  generated +
  block(':root', colors) +
  ':root { color-scheme: light; }\n' +
  block(':root[data-theme="dark"]', dark) +
  ':root[data-theme="dark"] { color-scheme: dark; }\n' +
  '@media (prefers-color-scheme: dark) {\n' +
  block(':root[data-theme="auto"]', dark) +
  ':root[data-theme="auto"] { color-scheme: dark; }\n}\n';
const integration =
  generated +
  '@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));\n' +
  `@theme inline {\n  --color-*: initial;\n  --radius-*: initial;\n  --shadow-*: initial;\n  --breakpoint-*: initial;\n${declarations(theme, '')}\n}\n` +
  '@utility ring-focus { outline: var(--at-focus-ring) solid var(--at-primary); outline-offset: 2px; }\n' +
  Object.entries(source.layout.columns)
    .map(
      ([key]) =>
        `@utility grid-cols-${key} { grid-template-columns: repeat(var(--at-columns-${key}), minmax(0, 1fr)); }\n`,
    )
    .join('') +
  Object.keys(source.light.motion)
    .filter((key) => key.startsWith('dur-'))
    .map(
      (key) =>
        `@utility duration-${key.slice(4)} { transition-duration: var(--at-${key}); }\n`,
    )
    .join('') +
  '@keyframes apnatown-shimmer { 0% { background-position: 100% 50%; } 100% { background-position: 0 50%; } }\n' +
  '@keyframes apnatown-spin { to { transform: rotate(360deg); } }\n' +
  '@keyframes apnatown-overlay-fade { from { opacity: 0; } }\n' +
  '@keyframes apnatown-sheet-up { from { transform: translateY(100%); } }\n' +
  '@keyframes apnatown-sheet-pop { from { opacity: 0; transform: translateY(4%); } }\n' +
  ':root:has(dialog[data-apnatown-overlay][open]) { overflow: hidden; }\n' +
  '@utility skeleton-fill { background: linear-gradient(90deg, var(--at-surface-2) 25%, var(--at-border) 37%, var(--at-surface-2) 63%); background-size: 400% 100%; }\n' +
  '@utility badge-fill { background: var(--at-badge-fill); }\n' +
  '@utility art-fill { background: linear-gradient(var(--at-art-angle), hsl(var(--at-art-hue, var(--at-art-hue-default)) var(--at-art-start-saturation) var(--at-art-start-lightness)), hsl(var(--at-art-hue, var(--at-art-hue-default)) var(--at-art-end-saturation) var(--at-art-end-lightness))); }\n' +
  '@utility art-shadow { filter: drop-shadow(var(--at-art-shadow)); }\n' +
  '@utility art-dim { :root[data-theme="dark"] & { filter: brightness(var(--at-art-brightness)); } @media (prefers-color-scheme: dark) { :root[data-theme="auto"] & { filter: brightness(var(--at-art-brightness)); } } }\n';
const destination = outputRoot();
await writeOutput(destination, 'packages/ui/src/tokens.css', css);
await writeOutput(destination, 'packages/ui/src/tailwind.css', integration);
