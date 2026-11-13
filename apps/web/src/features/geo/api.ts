import { infiniteQueryOptions } from '@tanstack/react-query';
import {
  AreaPageSchema,
  CityPageSchema,
  LocationResolutionSchema,
  WaitlistAcceptedSchema,
  type City,
} from '@apnatown/shared/geo';
import type { components } from '@apnatown/api-client';
import type { BrowserApi } from '../../shared/api/browser';
import { normalizeFailure, unwrap } from '../../shared/api/result';
import { queryKeys } from '../../shared/api/query-keys';
import type { Locale } from '../../shared/i18n/preferences';

type Reader = Pick<BrowserApi, 'GET'>;
export type LocationResolveBody = components['schemas']['LocationResolveDto'];
export type WaitlistBody = components['schemas']['WaitlistRequestDto'];
const referenceStaleTime = 5 * 60_000;

async function guarded<T>(read: () => Promise<T>, signal: AbortSignal) {
  try {
    const data = await read();
    signal.throwIfAborted();
    return data;
  } catch (error) {
    signal.throwIfAborted();
    throw normalizeFailure(error);
  }
}

/** Public city reference list, all statuses; names come from the API, never translated. */
export function cityOptions(api: Reader) {
  return infiniteQueryOptions({
    queryKey: queryKeys.geoCities,
    initialPageParam: null as string | null,
    getNextPageParam: (last: { nextCursor: string | null }) => last.nextCursor,
    staleTime: referenceStaleTime,
    queryFn: ({ pageParam, signal }) =>
      guarded(
        async () =>
          unwrap(
            await api.GET('/geo/cities', {
              params: { query: pageParam ? { cursor: pageParam } : {} },
              signal,
            }),
            CityPageSchema,
          ),
        signal,
      ),
  });
}

export function areaOptions(api: Reader, cityId: string) {
  return infiniteQueryOptions({
    queryKey: queryKeys.geoAreas(cityId),
    initialPageParam: null as string | null,
    getNextPageParam: (last: { nextCursor: string | null }) => last.nextCursor,
    staleTime: referenceStaleTime,
    queryFn: ({ pageParam, signal }) =>
      guarded(
        async () =>
          unwrap(
            await api.GET('/geo/cities/{cityId}/areas', {
              params: {
                path: { cityId },
                query: pageParam ? { cursor: pageParam } : {},
              },
              signal,
            }),
            AreaPageSchema,
          ),
        signal,
      ),
  });
}

export function geoName(
  place: Pick<City, 'nameEn' | 'nameHi'>,
  locale: Locale,
) {
  return locale === 'hi' ? place.nameHi : place.nameEn;
}

/** Read-only resolve of exactly one selector. Coordinates travel in this body
 * only; they never enter a query key, cache or storage. */
export async function resolveLocation(
  api: BrowserApi,
  body: LocationResolveBody,
  assertCurrent: () => void,
) {
  const header = await api.mutationHeaders();
  assertCurrent();
  return unwrap(
    await api.POST('/geo/location/resolve', { params: { header }, body }),
    LocationResolutionSchema,
  );
}

/** Explicit notify-me request; the caller owns the per-payload command key. */
export async function joinWaitlist(
  api: BrowserApi,
  body: WaitlistBody,
  key: string,
  assertCurrent: () => void,
) {
  const header = await api.mutationHeaders();
  assertCurrent();
  return unwrap(
    await api.POST('/geo/waitlist', {
      params: { header: { ...header, 'Idempotency-Key': key } },
      body,
    }),
    WaitlistAcceptedSchema,
  );
}
