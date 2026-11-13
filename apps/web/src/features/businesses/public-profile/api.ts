import { infiniteQueryOptions } from '@tanstack/react-query';
import {
  BusinessPublicProductsResponseSchema,
  BusinessPublicServicesResponseSchema,
} from '@apnatown/shared';
import type { BrowserApi } from '../../../shared/api/browser';
import { queryKeys } from '../../../shared/api/query-keys';
import {
  normalizeFailure,
  retryTransientRead,
  unwrap,
} from '../../../shared/api/result';

type Reader = Pick<BrowserApi, 'GET'>;
const PAGE_SIZE = 20;

async function guarded<T>(load: () => Promise<T>, signal: AbortSignal) {
  try {
    return await load();
  } catch (error) {
    signal.throwIfAborted();
    throw normalizeFailure(error);
  }
}

/**
 * Products tab (Products-owned). Responses are `private, no-store` with live
 * prices/stock, so only the shared 30 s client freshness applies; each pill
 * selection is its own key and resets the keyset cursor.
 */
export function businessProductsOptions(
  api: Reader,
  slug: string,
  subcategory: string | undefined,
) {
  return infiniteQueryOptions({
    queryKey: queryKeys.publicBusinessProducts(slug, subcategory ?? null),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam, signal }) =>
      guarded(
        async () =>
          unwrap(
            await api.GET('/businesses/public/{slug}/products', {
              params: {
                path: { slug },
                query: {
                  limit: PAGE_SIZE,
                  ...(subcategory && { subcategory }),
                  ...(pageParam && { cursor: pageParam }),
                },
              },
              signal,
            }),
            BusinessPublicProductsResponseSchema,
          ),
        signal,
      ),
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    retry: retryTransientRead,
  });
}

/** Services tab (Services-owned); a subcategory is only sent with its category. */
export function businessServicesOptions(
  api: Reader,
  slug: string,
  category: string | undefined,
  subcategory: string | undefined,
) {
  const sub = category ? subcategory : undefined;
  return infiniteQueryOptions({
    queryKey: queryKeys.publicBusinessServices(
      slug,
      category ?? null,
      sub ?? null,
    ),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam, signal }) =>
      guarded(
        async () =>
          unwrap(
            await api.GET('/businesses/public/{slug}/services', {
              params: {
                path: { slug },
                query: {
                  limit: PAGE_SIZE,
                  ...(category && { category }),
                  ...(sub && { subcategory: sub }),
                  ...(pageParam && { cursor: pageParam }),
                },
              },
              signal,
            }),
            BusinessPublicServicesResponseSchema,
          ),
        signal,
      ),
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    retry: retryTransientRead,
  });
}
