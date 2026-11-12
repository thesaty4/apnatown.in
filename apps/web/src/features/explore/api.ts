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
  position?: { lat: number; lng: number } | null,
) {
  const query = {
    ...filters,
    limit: 20,
    ...(cursor ? { cursor } : {}),
  };
  return unwrap(
    await api.GET('/explore', {
      params: { query },
      ...(position && { headers: {
        'X-Discovery-Latitude': String(position.lat),
        'X-Discovery-Longitude': String(position.lng),
      } }),
      ...(signal && { signal }),
    }),
    ExploreResponseSchema,
  );
}

export function exploreOptions(
  api: Pick<BrowserApi, 'GET'>,
  filters: ExploreFilters,
  locationRevision = 0,
  screen = 'explore',
  position?: { lat: number; lng: number } | null,
) {
  return infiniteQueryOptions({
    queryKey: queryKeys.explore(filters, locationRevision, screen),
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam, signal }) => {
      try {
        return await getExplore(api, filters, pageParam ?? undefined, signal, position);
      } catch (error) {
        signal.throwIfAborted();
        throw normalizeFailure(error);
      }
    },
    getNextPageParam: (page) => page.page.nextCursor ?? undefined,
    staleTime: 30_000,
    retry: false,
  });
}
