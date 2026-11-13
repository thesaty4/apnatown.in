import { queryOptions, skipToken } from '@tanstack/react-query';
import { SearchHomeSchema } from '@apnatown/shared/search';
import type { BrowserApi } from '../../../shared/api/browser';
import { queryKeys } from '../../../shared/api/query-keys';
import {
  normalizeFailure,
  retryTransientRead,
  unwrap,
} from '../../../shared/api/result';
import type { Locale } from '../../../shared/i18n/preferences';
import type { DevicePosition } from '../../geo';

type Reader = Pick<BrowserApi, 'GET'>;

/** Public discovery context for the located Home read. */
export type HomeLocation = {
  cityId: string;
  areaId: string | null;
  /** In-memory GPS point only; sent as headers, never in the URL or key. */
  position: DevicePosition | null;
  revision: number;
};

export async function getSearchHome(
  api: Reader,
  locale: Locale,
  location: HomeLocation,
  signal: AbortSignal,
) {
  const { position } = location;
  try {
    return unwrap(
      await api.GET('/search/home', {
        params: {
          query: {
            locale,
            cityId: location.cityId,
            ...(location.areaId && { areaId: location.areaId }),
          },
        },
        signal,
        ...(position && {
          headers: {
            'X-Discovery-Latitude': String(position.lat),
            'X-Discovery-Longitude': String(position.lng),
          },
        }),
      }),
      SearchHomeSchema,
    );
  } catch (error) {
    signal.throwIfAborted();
    throw normalizeFailure(error);
  }
}

/**
 * Located `GET /search/home` (private, no-store server-side). Only the
 * location-dependent sections are read from it; the location-free sections
 * stay server-rendered. Memory-only; a location change bumps `revision`.
 */
export function homeLocatedOptions(
  api: Reader,
  locale: Locale,
  location: HomeLocation | null,
) {
  return queryOptions({
    queryKey: queryKeys.searchHomeLocated(
      locale,
      location?.cityId ?? null,
      location?.areaId ?? null,
      location?.revision ?? 0,
    ),
    // No browse location: nothing to read (Home shows the optional prompt).
    queryFn: location
      ? ({ signal }) => getSearchHome(api, locale, location, signal)
      : skipToken,
    // Projections change slowly; avoid refetching on every focus.
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: retryTransientRead,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
}
