import 'server-only';
import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import type { BusinessKind } from '@apnatown/shared/businesses';
import { readSession } from '../../shared/auth/server';
import { loginHref } from '../../shared/auth/return-to';
import { mapConfiguration } from '../../shared/config/maps';
import { getWebEnvironment } from '../../shared/config/server';

/**
 * Owner dashboard guard: a guest (no/expired session) is sent to login with a
 * return-to; every other session state renders the client gate, which shows
 * the account/permission/error states. The API stays authoritative.
 */
export async function requireOwnerSession(path: string) {
  const session = await readSession();
  if (session.kind !== 'ready' && session.code === 'SESSION_EXPIRED') {
    const locale = (await getLocale()) === 'hi' ? 'hi' : 'en';
    redirect(loginHref(locale, path));
  }
}

export const ownerBase = (kind: BusinessKind) =>
  kind === 'shop' ? '/vendor' : '/provider';

/** Map configuration for the client-only MapView (server-read). */
export const ownerMapConfig = () => mapConfiguration(getWebEnvironment());

/** Public origin for locally generated share links / QR codes. */
export const publicOrigin = () => getWebEnvironment().APP_BASE_URL;
