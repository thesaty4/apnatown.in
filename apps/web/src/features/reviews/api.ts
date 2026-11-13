import { infiniteQueryOptions } from '@tanstack/react-query';
import {
  ReviewPageSchema,
  type ReviewPublicTargetType,
  type ReviewSort,
} from '@apnatown/shared/reviews';
import type { BrowserApi } from '../../shared/api/browser';
import { queryKeys } from '../../shared/api/query-keys';
import {
  normalizeFailure,
  retryTransientRead,
  unwrap,
} from '../../shared/api/result';

const PAGE_SIZE = 10;

/** Public reviews list (`GET /reviews`); 30 s freshness, transient retries only. */
export function reviewsOptions(
  api: Pick<BrowserApi, 'GET'>,
  targetType: ReviewPublicTargetType,
  targetId: string,
  sort: ReviewSort,
) {
  return infiniteQueryOptions({
    queryKey: queryKeys.publicReviews(targetType, targetId, sort),
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam, signal }) => {
      try {
        return unwrap(
          await api.GET('/reviews', {
            params: {
              query: {
                targetType,
                targetId,
                sort,
                limit: PAGE_SIZE,
                ...(pageParam && { cursor: pageParam }),
              },
            },
            signal,
          }),
          ReviewPageSchema,
        );
      } catch (error) {
        signal.throwIfAborted();
        throw normalizeFailure(error);
      }
    },
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    staleTime: 30_000,
    retry: retryTransientRead,
  });
}
