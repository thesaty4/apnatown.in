import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';
import type { SearchFilters, SearchSuggestionsQuery } from '@apnatown/shared/search';
import type { BrowserApi } from '../../shared/api/browser';
import type { Locale } from '../../shared/i18n/preferences';
import type { DevicePosition } from '../geo';
import { getPopular, getSearch, getSuggestions } from './api';
import { searchParams } from './url-state';

type Reader = Pick<BrowserApi, 'GET'>;

// Public, read-only Search namespace. No location coordinates, history,
// account data or writes are cached here. Explore owns different keys.
export function searchOptions(
  api: Reader,
  filters: SearchFilters,
  locale: Locale,
  revision = 0,
  position: DevicePosition | null = null,
) {
  return infiniteQueryOptions({
    queryKey: ['search', 'results', locale, searchParams(filters).toString(), revision],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam, signal }) => getSearch(api, filters, pageParam, signal, position),
    getNextPageParam: (page) => page.tab === 'all' ? undefined : page.page.nextCursor ?? undefined,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    retry: false,
    retryOnMount: false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

export function suggestionsOptions(api: Reader, query: SearchSuggestionsQuery) {
  return queryOptions({
    queryKey: ['search', 'suggestions', query],
    queryFn: ({ signal }) => getSuggestions(api, query, signal),
    enabled: query.q.trim().length > 0,
    staleTime: 30_000,
    gcTime: 60_000,
    retry: false,
    retryOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
}

export function popularOptions(api: Reader, locale: Locale) {
  return queryOptions({
    queryKey: ['search', 'popular', locale],
    queryFn: ({ signal }) => getPopular(api, signal),
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    retry: false,
    retryOnMount: false,
  });
}
