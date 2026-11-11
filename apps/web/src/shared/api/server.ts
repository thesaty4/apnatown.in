import 'server-only';
import { headers } from 'next/headers';
import { createApiClient } from '@apnatown/api-client';
import { getWebEnvironment } from '../config/server';
import { serverReadTransport, type ReadPolicy } from './transport';

function createServerReader(policy: ReadPolicy) {
  const { API_INTERNAL_ORIGIN } = getWebEnvironment();
  const baseUrl = `${new URL(API_INTERNAL_ORIGIN).origin}/api`;
  return createApiClient({
    baseUrl,
    fetch: serverReadTransport(baseUrl, policy, (request, init) =>
      fetch(request, init),
    ),
  });
}

export async function createPrivateServerApi() {
  const incoming = await headers();
  return createServerReader({
    kind: 'private',
    cookie: incoming.get('cookie') ?? '',
    correlation: incoming.get('x-correlation-id') ?? '',
  });
}

/** Public fragments only. Probes are always no-store regardless of this policy. */
export function createPublicServerApi(cache?: {
  revalidate: number;
  tags: string[];
}) {
  return createServerReader({ kind: 'public', ...(cache ? { cache } : {}) });
}
