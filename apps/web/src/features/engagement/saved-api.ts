import { SavedPageSchema, type SavedQuery } from '@apnatown/shared';
import type { BrowserApi } from '../../shared/api/browser';
import type { PrivateLifecycle } from '../../shared/api/private-lifecycle';
import { privateInfiniteQueryOptions } from '../../shared/api/private-query';
import { queryKeys, type AccountScope } from '../../shared/api/query-keys';
import { unwrap } from '../../shared/api/result';

export async function listSaved(
  api: Pick<BrowserApi, 'GET'>,
  query: SavedQuery,
  cursor?: string,
  signal?: AbortSignal,
) {
  return unwrap(
    await api.GET('/engagement/me/saved', {
      params: {
        query: {
          tab: query.tab,
          mediaFilter: query.mediaFilter,
          limit: query.limit,
          ...(cursor && { cursor }),
        },
      },
      ...(signal && { signal }),
    }),
    SavedPageSchema,
  );
}

export function savedOptions(
  api: BrowserApi,
  scope: AccountScope,
  lifecycle: PrivateLifecycle,
  query: SavedQuery,
) {
  return {
    ...privateInfiniteQueryOptions(
      queryKeys.saved(scope, query.tab, query.mediaFilter),
      scope.epoch,
      lifecycle,
      (cursor, signal) => listSaved(api, query, cursor, signal),
    ),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    retry: false as const,
  };
}
