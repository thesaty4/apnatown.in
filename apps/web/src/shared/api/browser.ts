'use client';

import { createApiClient } from '@apnatown/api-client';
import { browserReadTransport } from './transport';

/** No module-global session/cookie cache. The API prefix is applied exactly once. */
export function createBrowserApi() {
  return createApiClient({
    baseUrl: '/api',
    credentials: 'same-origin',
    cache: 'no-store',
    fetch: browserReadTransport((request, init) => fetch(request, init)),
  });
}
