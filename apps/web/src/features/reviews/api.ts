import { infiniteQueryOptions } from '@tanstack/react-query';
import {
  MyReviewPageSchema,
  ReviewPageSchema,
  type ReviewPublicTargetType,
  type ReviewSort,
} from '@apnatown/shared/reviews';
import type { BrowserApi } from '../../shared/api/browser';
import {
  queryKeys,
  type AccountScope,
} from '../../shared/api/query-keys';
import { privateQueryOptions } from '../../shared/api/private-query';
import type { PrivateLifecycle } from '../../shared/api/private-lifecycle';
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


/** Own review history (account "My reviews"); private, revision-fenced. */
export function myReviewsOptions(
  api: Pick<BrowserApi, 'GET'>,
  scope: AccountScope | null,
  lifecycle: PrivateLifecycle,
) {
  return privateQueryOptions(
    scope ? queryKeys.myReviews(scope) : ['private', 'pending', 'reviews'],
    scope?.epoch ?? 0,
    lifecycle,
    async (signal) =>
      unwrap(
        await api.GET('/reviews/me', { signal }),
        MyReviewPageSchema,
      ),
  );
}
