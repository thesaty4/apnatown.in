import { infiniteQueryOptions } from '@tanstack/react-query';
import type { BrowserApi } from '../../../shared/api/browser';
import { retryTransientRead } from '../../../shared/api/result';
import { getPublicOffers } from './api';

type Reader = Pick<BrowserApi, 'GET'>;

export function publicOffersOptions(api: Reader, businessId?: string) {
  return infiniteQueryOptions({
    queryKey: ['offers', 'public', 'active', businessId ?? 'all'] as const,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam, signal }) =>
      getPublicOffers(api, pageParam, signal, businessId),
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: retryTransientRead,
    retryOnMount: false,
  });
}
