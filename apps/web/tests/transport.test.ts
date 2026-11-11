import { describe, expect, it, vi } from 'vitest';
import { createApiClient } from '@apnatown/api-client';
import {
  browserReadTransport,
  correlationId,
  serverReadTransport,
} from '../src/shared/api/transport';

const base = 'http://localhost:3001/api';
const request = () =>
  new Request(`${base}/health/live`, {
    headers: {
      Cookie: 'untrusted=1',
      Authorization: 'do-not-forward',
      Host: 'untrusted.invalid',
    },
  });

describe('typed health transport boundaries', () => {
  it('generates the real health operation with one API prefix', async () => {
    const fetcher = vi.fn(async () => new Response(null, { status: 204 }));
    const client = createApiClient({ baseUrl: base, fetch: fetcher });
    await client.GET('/health/live');
    expect(fetcher.mock.calls).toHaveLength(1);
    const sent = (fetcher.mock.calls[0] as unknown as [Request])[0];
    expect(sent.url).toBe(`${base}/health/live`);
  });

  it('public health omits private headers and cannot be cached', async () => {
    const fetcher = vi.fn(
      async (_request: Request, _init?: RequestInit) =>
        new Response(null, { status: 204 }),
    );
    await serverReadTransport(
      base,
      { kind: 'public', cache: { revalidate: 60, tags: ['public-probes'] } },
      fetcher,
    )(request());
    const init = fetcher.mock.calls[0]?.[1];
    const headers = new Headers(init?.headers);
    expect(headers.has('cookie')).toBe(false);
    expect(headers.has('authorization')).toBe(false);
    expect(headers.has('host')).toBe(false);
    expect(headers.get('x-correlation-id')).toBeTruthy();
    expect(init?.cache).toBe('no-store');
    expect(init?.redirect).toBe('error');
    expect(init?.credentials).toBe('omit');
  });

  it('keeps private SSR cookies request-local under concurrency', async () => {
    const fetcher = vi.fn(
      async (_request: Request, _init?: RequestInit) =>
        new Response(null, { status: 204 }),
    );
    await Promise.all(
      ['session-a', 'session-b'].map((cookie) =>
        serverReadTransport(
          base,
          { kind: 'private', cookie, correlation: 'request-123' },
          fetcher,
        )(request()),
      ),
    );
    expect(
      fetcher.mock.calls.map(([, init]) =>
        new Headers(init?.headers).get('cookie'),
      ),
    ).toEqual(['session-a', 'session-b']);
    expect(
      fetcher.mock.calls.every(([, init]) => init?.cache === 'no-store'),
    ).toBe(true);
  });

  it('public fragments require explicit cache tags; no ambient header state', async () => {
    const fetcher = vi.fn(
      async (_request: Request, _init?: RequestInit) =>
        new Response(null, { status: 204 }),
    );
    // Transport unit input only, not an implemented/fake domain API operation.
    await serverReadTransport(
      base,
      { kind: 'public', cache: { revalidate: 60, tags: ['catalog-taxonomy'] } },
      fetcher,
    )(new Request(`${base}/fragment`));
    expect(fetcher.mock.calls[0]?.[1]?.cache).toBe('force-cache');
    await expect(
      serverReadTransport(
        base,
        { kind: 'public', cache: { revalidate: 0, tags: [] } },
        fetcher,
      )(request()),
    ).rejects.toThrow('Public cache');
  });

  it('rejects arbitrary upstream URLs, mutations, and follows cancellation', async () => {
    const fetcher = vi.fn(async (_request: Request, init?: RequestInit) => {
      init?.signal?.throwIfAborted();
      return new Response(null, { status: 204 });
    });
    const transport = serverReadTransport(base, { kind: 'public' }, fetcher);
    await expect(
      transport(new Request('http://untrusted.invalid/api/health/live')),
    ).rejects.toThrow('boundary');
    await expect(
      transport(new Request(`${base}/health/live`, { method: 'POST' })),
    ).rejects.toThrow('mutations');
    await expect(
      transport(
        new Request(`${base}/health/live`, {
          headers: { 'X-Discovery-Latitude': '26.9' },
        }),
      ),
    ).rejects.toThrow('private no-store');
    const controller = new AbortController();
    controller.abort();
    await expect(
      transport(
        new Request(`${base}/health/live`, { signal: controller.signal }),
      ),
    ).rejects.toThrow();
  });

  it('browser uses same-origin credentials/no-store and refuses off-origin requests', async () => {
    const fetcher = vi.fn(
      async (_request: Request, _init?: RequestInit) =>
        new Response(null, { status: 204 }),
    );
    const transport = browserReadTransport(fetcher);
    await transport(new Request('http://localhost:3000/api/health/live'));
    expect(fetcher.mock.calls[0]?.[1]?.credentials).toBe('same-origin');
    expect(fetcher.mock.calls[0]?.[1]?.cache).toBe('no-store');
    await expect(transport(new Request(`${base}/health/live`))).rejects.toThrow(
      'same-origin',
    );
    await expect(
      transport(
        new Request('http://localhost:3000/api/health/live', {
          method: 'POST',
        }),
      ),
    ).rejects.toThrow('Auth CSRF');
    expect(correlationId('safe-correlation')).toBe('safe-correlation');
    expect(correlationId('\r\ninjected')).not.toContain('injected');
  });
});
