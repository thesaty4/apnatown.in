// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { generateCatalogues } from '../../../packages/ui/scripts/generate-i18n.mjs';

const read = (path: string) =>
  JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const source = read('../../../docs/design-context/09a-i18n-en-hi.json');
const mapping = read('../src/shared/i18n/source-key-map.json');
const additions = read('../src/shared/i18n/reviewed-additions.json');

describe('complete deterministic source generation', () => {
  it('preserves every source translation under an explicit semantic key', () => {
    const result = generateCatalogues(source, mapping, additions);
    expect(Object.keys(mapping)).toHaveLength(927);
    for (const locale of ['en', 'hi'] as const) {
      expect(result[locale]).toEqual(
        read(`../src/shared/i18n/messages/${locale}.json`),
      );
    }
  });

  it('fails unmapped, untranslated and placeholder-mismatched copy', () => {
    const one = {
      count: 1,
      strings: [{ en: 'Example {name}', hi: 'Example {name}' }],
    };
    expect(() => generateCatalogues(one, {})).toThrow('Missing');
    expect(() =>
      generateCatalogues(
        { ...one, strings: [{ en: 'Example {name}', hi: '' }] },
        { 'Example {name}': 'test.example.label' },
      ),
    ).toThrow('Missing');
    expect(() =>
      generateCatalogues(
        { ...one, strings: [{ en: 'Example {name}', hi: 'Example {other}' }] },
        { 'Example {name}': 'test.example.label' },
      ),
    ).toThrow('ICU mismatch');
  });

  it('maps every light/dark palette variable, status and physical metric', () => {
    const tokens = read('../../../docs/design-context/04-design-tokens.json');
    const css = readFileSync(
      new URL('../../../packages/ui/src/tokens.css', import.meta.url),
      'utf8',
    );
    const theme = readFileSync(
      new URL('../../../packages/ui/src/tailwind.css', import.meta.url),
      'utf8',
    );
    for (const groups of [tokens.light, tokens.dark_overrides]) {
      for (const group of Object.values(groups)) {
        for (const [key, value] of Object.entries(
          group as Record<string, string>,
        )) {
          expect(css).toContain(`--at-${key}: ${value};`);
        }
      }
    }
    expect(theme).toContain('--breakpoint-tablet: 600px');
    expect(theme).toContain('--breakpoint-desktop: 900px');
    expect(theme).toContain('--radius-md: var(--at-r-md)');
    expect(theme).toContain('--shadow-1: var(--at-sh-1)');
    expect(theme).toContain('@utility ring-focus');
    expect(theme).toContain('@utility duration-1');
    expect(css).toContain('--at-focus-ring: 3px');
    expect(css).toContain('--at-touch: 48px');
  });
});
