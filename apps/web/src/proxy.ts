import createMiddleware from 'next-intl/middleware';
import { NextResponse, NextRequest } from 'next/server';
import { routing } from './shared/i18n/routing';
import { parseWebEnvironment } from './shared/config/schema';
import { contentSecurityPolicy } from './shared/config/content-security';

const internationalize = createMiddleware(routing);
const { APP_BASE_URL } = parseWebEnvironment(process.env);

export default function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const normalized = path.replace(/\/+$/, '') || '/';
  if (/^\/en(?:\/|$)/.test(path) || normalized !== path) {
    const destination = new URL(APP_BASE_URL);
    destination.pathname = normalized.replace(/^\/en(?=\/|$)/, '') || '/';
    destination.search = request.nextUrl.search;
    return NextResponse.redirect(destination, 308);
  }
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const policy = contentSecurityPolicy(
    nonce,
    process.env.NODE_ENV === 'development',
  );
  const headers = new Headers(request.headers);
  headers.set('x-nonce', nonce);
  // Next extracts this trusted request nonce and applies it to its own scripts.
  headers.set('Content-Security-Policy', policy);
  const response = internationalize(new NextRequest(request, { headers }));
  response.headers.set('Content-Security-Policy', policy);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

export const config = { matcher: ['/((?!api(?:/|$)|_next(?:/|$)|.*\\..*).*)'] };
