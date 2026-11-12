import type { components } from '@apnatown/api-client';
import { publicHref, type Locale } from '../i18n/preferences';

const implemented = new Set([
  '/',
  '/hi',
  '/account',
  '/account/profile',
  '/account/preferences',
  '/account/addresses',
  '/admin/profile',
  '/super-admin/admins',
  '/super-admin/roles',
]);

/** Only implemented, non-operational destinations; auth loops and encoded paths fail closed. */
export function safeReturnTo(input: unknown): string | undefined {
  if (
    typeof input !== 'string' ||
    input.length > 2048 ||
    !input.startsWith('/') ||
    input.startsWith('//') ||
    /[\\\s]/u.test(input) ||
    [...input].some(
      (character) => character.codePointAt(0)! < 32 || character === '\u007f',
    )
  )
    return;
  const url = new URL(input, 'https://return.invalid');
  if (
    url.origin !== 'https://return.invalid' ||
    !implemented.has(url.pathname) ||
    input.split(/[?#]/)[0] !== url.pathname
  )
    return;
  url.searchParams.delete('returnTo');
  url.searchParams.delete('onboarding');
  return `${url.pathname}${url.search}${url.hash}`;
}

export function landing(
  session: components['schemas']['SessionDto'],
  returnTo: unknown,
  locale: Locale,
) {
  // Roles never imply business/rider approval. Their dashboards have no live owner gate yet.
  return (
    safeReturnTo(returnTo) ??
    (session.roles.includes('customer') ? publicHref('/', locale) : '/account')
  );
}

export function loginHref(locale: Locale, returnTo?: string) {
  const destination = safeReturnTo(returnTo);
  return (
    publicHref('/login', locale) +
    (destination ? `?${new URLSearchParams({ returnTo: destination })}` : '')
  );
}
