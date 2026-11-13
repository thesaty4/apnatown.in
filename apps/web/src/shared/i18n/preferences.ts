import { PROVIDER_DASHBOARD_SEGMENTS } from '@apnatown/shared/businesses';

export const locales = ['en', 'hi'] as const;
export type Locale = (typeof locales)[number];
export type Theme = 'light' | 'dark' | 'auto';
export const themeCookie = 'apnatown-theme';
export const localeCookie = 'apnatown-locale';

const dashboardPath = new RegExp(
  `^/(?:vendor|provider/(?:${PROVIDER_DASHBOARD_SEGMENTS.join('|')})|rider|admin|super-admin)(?:/|$)`,
);

export function isDashboardPath(path: string) {
  return dashboardPath.test(path);
}

export function isPrivatePath(path: string) {
  return (
    /^\/(?:account|cart|orders|saved|my-reviews|checkout|bill)(?:\/|$)/.test(path) ||
    // Exact match only: the future public signed `/notifications/unsubscribe`
    // stays outside the private, cookie-locale tree.
    /^\/notifications\/?$/.test(path) ||
    isDashboardPath(path)
  );
}

/** Private routes outside `app/[locale]` use the saved locale cookie. */
export function isUnprefixedPath(path: string) {
  return isPrivatePath(path);
}

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
