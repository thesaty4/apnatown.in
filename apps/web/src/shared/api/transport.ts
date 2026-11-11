const timeoutMs = 10_000;
const safeCorrelation = /^[a-zA-Z0-9_-]{1,128}$/;
const reads = new Set(['GET', 'HEAD']);

export function correlationId(value: string | null | undefined): string {
  return value && safeCorrelation.test(value) ? value : crypto.randomUUID();
}

type PublicCache = { revalidate: number; tags: string[] };
export type ReadPolicy =
  | { kind: 'private'; cookie?: string; correlation?: string }
  | { kind: 'public'; cache?: PublicCache };

type NextFetchOptions = RequestInit & { next?: PublicCache };
type Fetcher = (input: Request, init?: NextFetchOptions) => Promise<Response>;

/** Current contracts are read-only. Auth will own CSRF bootstrap and mutations. */
export function serverReadTransport(
  baseUrl: string,
  policy: ReadPolicy,
  fetcher: Fetcher,
) {
  const trusted = new URL(baseUrl);
  return async (request: Request): Promise<Response> => {
    const url = new URL(request.url);
    if (
      url.origin !== trusted.origin ||
      !url.pathname.startsWith(`${trusted.pathname}/`)
    ) {
      throw new Error('Request outside the configured API boundary');
    }
    if (!reads.has(request.method))
      throw new Error('Server reads cannot perform mutations');
    if (
      policy.kind === 'public' &&
      (request.headers.has('x-discovery-latitude') ||
        request.headers.has('x-discovery-longitude'))
    ) {
      throw new Error('Precise location requires a private no-store operation');
    }
    // Start from an allow-list. Never forward authorization, Host, user-selected
    // upstreams, discovery coordinates, business context or arbitrary SSR headers.
    const headers = new Headers({ Accept: 'application/json' });
    headers.set(
      'X-Correlation-ID',
      correlationId(policy.kind === 'private' ? policy.correlation : undefined),
    );
    if (policy.kind === 'private' && policy.cookie)
      headers.set('Cookie', policy.cookie);
    const cache = policy.kind === 'public' ? policy.cache : undefined;
    if (
      cache &&
      (!Number.isSafeInteger(cache.revalidate) ||
        cache.revalidate <= 0 ||
        !cache.tags.length ||
        cache.tags.some((tag) => !/^[a-zA-Z0-9:_-]{1,128}$/.test(tag)))
    ) {
      throw new Error(
        'Public cache requires bounded, non-personal tags and positive revalidation',
      );
    }
    // Probes must never claim readiness from a cached response.
    const cacheable =
      cache && !url.pathname.startsWith(`${trusted.pathname}/health/`);
    const init: NextFetchOptions = {
      headers,
      credentials: 'omit',
      redirect: 'error',
      cache: cacheable ? 'force-cache' : 'no-store',
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(timeoutMs)]),
      ...(cacheable ? { next: cache } : {}),
    };
    return fetcher(request, init);
  };
}

export function browserReadTransport(fetcher: Fetcher) {
  return async (request: Request): Promise<Response> => {
    const url = new URL(request.url);
    if (
      url.origin !== window.location.origin ||
      !url.pathname.startsWith('/api/')
    ) {
      throw new Error('Browser requests must use the same-origin API');
    }
    if (!reads.has(request.method))
      throw new Error('Mutations require the live Auth CSRF contract');
    const headers = new Headers(request.headers);
    headers.set(
      'X-Correlation-ID',
      correlationId(headers.get('X-Correlation-ID')),
    );
    return fetcher(request, {
      headers,
      credentials: 'same-origin',
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(timeoutMs)]),
    });
  };
}
