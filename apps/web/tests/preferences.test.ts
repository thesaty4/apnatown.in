import { describe, expect, it } from 'vitest';
import {
  isLocale,
  parseTheme,
  publicHref,
} from '../src/shared/i18n/preferences';
import { parseWebEnvironment } from '../src/shared/config/schema';
import { contentSecurityPolicy } from '../src/shared/config/content-security';

describe('validated bootstrap preferences and origin boundaries', () => {
  it('requires a nonce and never permits inline scripts or production eval', () => {
    const policy = contentSecurityPolicy('bm9uY2U=', false);
    expect(policy).toContain("'nonce-bm9uY2U='");
    expect(policy).not.toContain('unsafe-inline');
    expect(policy).not.toContain('unsafe-eval');
    expect(() => contentSecurityPolicy("'; unsafe-inline", false)).toThrow();
  });
  it('accepts only supported locales/themes and defaults to light', () => {
    expect(isLocale('hi')).toBe(true);
    for (const value of ['fr', '<script>', '', undefined, ['hi']])
      expect(isLocale(value)).toBe(false);
    for (const value of ['invalid', '', undefined, null])
      expect(parseTheme(value)).toBe('light');
    expect(parseTheme('auto')).toBe('auto');
    expect(parseTheme('dark')).toBe('dark');
  });

  it('keeps public English unprefixed and Hindi prefixed exactly once', () => {
    expect(publicHref('/', 'hi')).toBe('/hi');
    expect(publicHref('/500?retry=1#main', 'hi')).toBe('/hi/500?retry=1#main');
    expect(publicHref('/offline', 'en')).toBe('/offline');
    for (const path of [
      'https://example.invalid',
      '//example.invalid',
      '/\\example.invalid',
      '/api/health/live',
      '/hi/500',
    ]) {
      expect(() => publicHref(path, 'hi')).toThrow();
    }
  });

  const valid = {
    APP_ENV: 'local',
    APP_BASE_URL: 'http://localhost:3000',
    API_INTERNAL_ORIGIN: 'http://localhost:3001',
  };
  it('only returns owner configuration and rejects untrusted destinations', () => {
    expect(
      parseWebEnvironment({ ...valid, DATABASE_URL: 'do-not-pass-to-web' }),
    ).toEqual(valid);
    for (const value of [
      'file:///etc/passwd',
      'https://user:secret@example.invalid',
      'https://example.invalid/api',
      'https://example.invalid/?next=evil',
    ]) {
      expect(() =>
        parseWebEnvironment({ ...valid, API_INTERNAL_ORIGIN: value }),
      ).toThrow('API_INTERNAL_ORIGIN');
    }
    expect(() =>
      parseWebEnvironment({ ...valid, APP_ENV: 'production' }),
    ).toThrow('APP_BASE_URL');
    expect(() => parseWebEnvironment({})).toThrow('Invalid Web environment');
  });
});
