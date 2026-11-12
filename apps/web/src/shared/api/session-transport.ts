import { correlationId } from './transport';

type Security = {
  signal: () => AbortSignal;
  csrf: () => Promise<string>;
  invalid: (code: string) => void;
};

/** The only browser mutation transport. Never retries a mutation automatically. */
export function sessionTransport(
  fetcher: (request: Request, init: RequestInit) => Promise<Response>,
  security: Security,
) {
  return async (request: Request): Promise<Response> => {
    const url = new URL(request.url);
    if (
      url.origin !== window.location.origin ||
      !url.pathname.startsWith('/api/')
    )
      throw new Error('Browser requests must use the same-origin API');
    // Capped CSV exports (≤100 000 rows) stream far longer than JSON reads.
    const timeoutMs = url.pathname.endsWith('.csv') ? 120_000 : 10_000;
    const signal = AbortSignal.any([
      request.signal,
      security.signal(),
      AbortSignal.timeout(timeoutMs),
    ]);
    const headers = new Headers(request.headers);
    headers.set(
      'X-Correlation-ID',
      correlationId(headers.get('X-Correlation-ID')),
    );
    // Preserve an already-bound mutation header. Rebinding an old account's draft
    // to a newly signed-in account would be an unsafe implicit replay.
    if (
      !['GET', 'HEAD'].includes(request.method) &&
      !headers.has('X-CSRF-Token')
    )
      headers.set('X-CSRF-Token', await security.csrf());
    signal.throwIfAborted();
    const response = await fetcher(request, {
      headers,
      signal,
      credentials: 'same-origin',
      cache: 'no-store',
      redirect: 'error',
    });
    signal.throwIfAborted();
    if (!response.ok) {
      const body: unknown = await response
        .clone()
        .json()
        .catch(() => null);
      if (
        body &&
        typeof body === 'object' &&
        'code' in body &&
        typeof body.code === 'string'
      )
        security.invalid(body.code);
    }
    return response;
  };
}
