import { infiniteQueryOptions } from '@tanstack/react-query';
import { ExploreResponseSchema } from '@apnatown/shared/search';
import type { BrowserApi } from '../../shared/api/browser';
import { queryKeys } from '../../shared/api/query-keys';
import { normalizeFailure, unwrap } from '../../shared/api/result';
import type { ExploreFilters } from './url-state';

export async function getExplore(
  api: Pick<BrowserApi, 'GET'>,
  filters: ExploreFilters,
  cursor?: string,
  signal?: AbortSignal,
) {
  const query = {
    tab: filters.tab,
    sort: filters.sort,
    limit: 20,
    ...(filters.category ? { category: filters.category } : {}),
    ...(filters.verified ? { verified: 'true' } : {}),
    ...(cursor ? { cursor } : {}),
  };
  return unwrap(
    await api.GET('/explore', {
      params: { query },
      ...(signal && { signal }),
    }),
    ExploreResponseSchema,
  );
}

export function exploreOptions(
  api: Pick<BrowserApi, 'GET'>,
  filters: ExploreFilters,
) {
  return infiniteQueryOptions({
    queryKey: queryKeys.explore(filters),
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam, signal }) => {
      try {
        return await getExplore(api, filters, pageParam ?? undefined, signal);
      } catch (error) {
        signal.throwIfAborted();
        throw normalizeFailure(error);
      }
    },
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    staleTime: 30_000,
    retry: false,
  });
}
