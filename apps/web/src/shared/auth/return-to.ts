import type { components } from '@apnatown/api-client';
import { publicHref, type Locale } from '../i18n/preferences';

const implemented = new Set([
  '/',
  '/hi',
  '/account',
  '/account/profile',
  '/account/preferences',
  '/account/addresses',
  '/videos',
  '/hi/videos',
  '/explore',
  '/hi/explore',
  '/search',
  '/hi/search',
  '/services',
  '/hi/services',
  '/saved',
  '/cart',
  '/checkout',
  '/checkout/success',
  '/orders',
  '/notifications',
  '/vendor/enquiries',
  '/vendor/inventory',
  '/vendor/media',
  '/vendor/notifications',
  '/vendor/onboarding',
  '/vendor/orders',
  '/vendor/overview',
  '/vendor/products',
  '/vendor/profile',
  '/vendor/qr',
  '/vendor/services',
  '/provider/enquiries',
  '/provider/media',
  '/provider/notifications',
  '/provider/onboarding',
  '/provider/orders',
  '/provider/overview',
  '/provider/products',
  '/provider/profile',
  '/provider/qr',
  '/provider/services',
  '/rider',
  '/rider/home',
  '/rider/onboarding',
  '/rider/requests',
  '/rider/active',
  '/rider/history',
  '/rider/earnings',
  '/rider/feedback',
  '/rider/profile',
  '/admin',
  '/admin/approvals',
  '/admin/audit',
  '/admin/categories',
  '/admin/keywords',
  '/admin/listings',
  '/admin/orders',
  '/admin/profile',
  '/admin/subcategory-suggestions',
  '/admin/videos',
  '/super-admin',
  '/super-admin/activity',
  '/super-admin/admins',
  '/super-admin/cities',
  '/super-admin/roles',
  '/super-admin/settings',
]);
const implementedCityPath =
  /^\/super-admin\/cities\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;
const implementedApprovalPath =
  /^\/admin\/approvals\/(?:business|provider)\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;
const implementedEnquiryPath =
  /^\/(?:vendor|provider)\/enquiries\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;
const implementedOwnerOrderPath =
  /^\/(?:vendor|provider|admin)\/orders\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;
const implementedProductEditorPath =
  /^\/(?:vendor|provider)\/products\/(?:new|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/iu;
const implementedOrderPath =
  /^\/orders\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;
const implementedVideoPath =
  /^\/(?:hi\/)?videos\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;
const implementedListingPath =
  /^\/(?:hi\/)?(?:product|service|shop|provider)\/[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const implementedCategoryPath =
  /^\/(?:hi\/)?category\/[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)?$/u;

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
    (!implemented.has(url.pathname) &&
      !implementedVideoPath.test(url.pathname) &&
      !implementedOrderPath.test(url.pathname) &&
      !implementedCityPath.test(url.pathname) &&
      !implementedApprovalPath.test(url.pathname) &&
      !implementedEnquiryPath.test(url.pathname) &&
      !implementedOwnerOrderPath.test(url.pathname) &&
      !implementedProductEditorPath.test(url.pathname) &&
      !implementedListingPath.test(url.pathname) &&
      !implementedCategoryPath.test(url.pathname)) ||
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
  // Roles never imply business/rider approval; each dashboard keeps its own
  // gate. Only a rider without a higher operational role opens Rider home.
  return (
    safeReturnTo(returnTo) ??
    (riderLanding(session.roles)
      ? '/rider/home'
      : session.roles.includes('customer')
        ? publicHref('/', locale)
        : '/account')
  );
}

const aboveRider = ['super_admin', 'admin', 'vendor', 'provider'];
const riderLanding = (roles: readonly string[]) =>
  roles.includes('rider') && !roles.some((role) => aboveRider.includes(role));

export function loginHref(locale: Locale, returnTo?: string) {
  const destination = safeReturnTo(returnTo);
  return (
    publicHref('/login', locale) +
    (destination ? `?${new URLSearchParams({ returnTo: destination })}` : '')
  );
}
