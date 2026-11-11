export const locales = ['en', 'hi'] as const;
export type Locale = (typeof locales)[number];
export type Theme = 'light' | 'dark' | 'auto';
export const themeCookie = 'apnatown-theme';

export function isLocale(value: unknown): value is Locale {
  return value === 'en' || value === 'hi';
}

export function parseTheme(value: unknown): Theme {
  return value === 'dark' || value === 'auto' ? value : 'light';
}

/** Public URLs only; never use this for APIs, callbacks or private routes. */
export function publicHref(path: string, locale: Locale): string {
  if (
    !path.startsWith('/') ||
    path.startsWith('//') ||
    /[\\\r\n]/.test(path) ||
    /^\/(?:api|_next|en|hi)(?:\/|[?#]|$)/.test(path)
  ) {
    throw new Error('Expected an unprefixed local public path');
  }
  return locale === 'hi' ? `/hi${path === '/' ? '' : path}` : path;
}
