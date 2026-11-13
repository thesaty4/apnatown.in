import {
  SearchPopularSchema,
  SearchResponseSchema,
  SearchSuggestionsSchema,
  type SearchFilters,
  type SearchSuggestionsQuery,
} from '@apnatown/shared/search';
import type { BrowserApi } from '../../shared/api/browser';
import { normalizeFailure, unwrap } from '../../shared/api/result';
import type { DevicePosition } from '../geo';

type Reader = Pick<BrowserApi, 'GET'>;

/** `exactOptionalPropertyTypes`: omit absent filters instead of sending undefined. */
function defined<T extends object>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined),
  ) as { [K in keyof T]: Exclude<T[K], undefined> };
}

/** DTOs and paths are owned by Search BE / the generated OpenAPI client. */
export async function getSearch(
  api: Reader,
  filters: SearchFilters,
  cursor: string | null,
  signal: AbortSignal,
  position: DevicePosition | null,
) {
  try {
    return unwrap(await api.GET('/search', {
      params: { query: defined({ ...filters, limit: 20, ...(cursor && { cursor }) }) },
      signal,
      ...(position && { headers: {
        'X-Discovery-Latitude': String(position.lat),
        'X-Discovery-Longitude': String(position.lng),
      } }),
    }), SearchResponseSchema);
  } catch (error) {
    signal.throwIfAborted();
    throw normalizeFailure(error);
  }
}

export async function getSuggestions(
  api: Reader,
  query: SearchSuggestionsQuery,
  signal: AbortSignal,
) {
  try {
    return unwrap(await api.GET('/search/suggestions', {
      params: { query: defined(query) },
      signal,
    }), SearchSuggestionsSchema);
  } catch (error) {
    signal.throwIfAborted();
    throw normalizeFailure(error);
  }
}

export async function getPopular(api: Reader, signal: AbortSignal) {
  try {
    return unwrap(await api.GET('/search/popular', { signal }), SearchPopularSchema);
  } catch (error) {
    signal.throwIfAborted();
    throw normalizeFailure(error);
  }
}
