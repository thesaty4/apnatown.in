import 'server-only';
import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { readSession } from '../../shared/auth/server';
import { loginHref } from '../../shared/auth/return-to';

/**
 * Rider route guard: a guest (no/expired session) goes to login with a
 * return-to. Every other session state renders the client gate, which shows
 * the role/no-permission/error states; the API stays authoritative.
 */
export async function requireRiderSession(path: string) {
  const session = await readSession();
  if (session.kind !== 'ready' && session.code === 'SESSION_EXPIRED') {
    const locale = (await getLocale()) === 'hi' ? 'hi' : 'en';
    redirect(loginHref(locale, path));
  }
}
