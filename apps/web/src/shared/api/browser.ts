'use client';

import { createApiClient } from '@apnatown/api-client';
import { CsrfSchema } from '@apnatown/shared/auth';
import { unwrap } from './result';
import { sessionTransport } from './session-transport';

/** No module-global session/cookie cache. The API prefix is applied exactly once. */
export function createBrowserApi(onInvalid: (code: string) => void = () => {}) {
  let controller = new AbortController();
  let token: Promise<string> | undefined;
  const api = createApiClient({
    baseUrl: '/api',
    credentials: 'same-origin',
    cache: 'no-store',
    fetch: sessionTransport((request, init) => fetch(request, init), {
      signal: () => controller.signal,
      csrf: () => csrf(),
      invalid: (code) => {
        if (
          ['CSRF_INVALID', 'SESSION_EXPIRED', 'ACCOUNT_UNAVAILABLE'].includes(
            code,
          )
        )
          token = undefined;
        onInvalid(code);
      },
    }),
  });
  function csrf(): Promise<string> {
    if (!token) {
      const signal = controller.signal;
      token = api
        .GET('/auth/csrf')
        .then((result) => {
          signal.throwIfAborted();
          return unwrap(result, CsrfSchema).csrfToken;
        })
        .catch((error: unknown) => {
          if (signal === controller.signal) token = undefined;
          throw error;
        });
    }
    return token;
  }
  return Object.assign(api, {
    async mutationHeaders() {
      return { Origin: window.location.origin, 'X-CSRF-Token': await csrf() };
    },
    reset() {
      controller.abort();
      controller = new AbortController();
      token = undefined;
    },
  });
}

export type BrowserApi = ReturnType<typeof createBrowserApi>;
