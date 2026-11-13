'use client';

import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import type { BusinessKind } from '@apnatown/shared/businesses';
import type { ReviewReport } from '@apnatown/shared/reviews';
import type { AccountScope } from '../../../shared/api/query-keys';
import { privateInfiniteQueryOptions } from '../../../shared/api/private-query';
import { retryTransientRead } from '../../../shared/api/result';
import { usePrivateMutation } from '../../../shared/api/use-private-mutation';
import { businessKeys, useOwnerContext } from '../../businesses/queries';
import {
  listOwnerReviews,
  reportReview,
  saveOwnerReply,
  type OwnerReviewFilters,
} from './api';

/** Kind-scoped under the owner business root (vendor/provider never share). */
export const ownerReviewKeys = {
  root: (scope: AccountScope, kind: BusinessKind) =>
    [...businessKeys.all(scope, kind), 'reviews'] as const,
  list: (scope: AccountScope, kind: BusinessKind, filters: OwnerReviewFilters) =>
    [...ownerReviewKeys.root(scope, kind), filters.filter, filters.rating] as const,
};

export function useOwnerReviews(kind: BusinessKind, filters: OwnerReviewFilters) {
  const { api, lifecycle, scope } = useOwnerContext();
  return useInfiniteQuery({
    ...privateInfiniteQueryOptions(
      scope
        ? ownerReviewKeys.list(scope, kind, filters)
        : ['private', 'pending', 'business', kind, 'reviews'],
      scope?.epoch ?? 0,
      lifecycle,
      (cursor, signal) => listOwnerReviews(api, kind, filters, cursor, signal),
    ),
    enabled: scope !== null,
    retry: retryTransientRead,
  });
}

/** Not optimistic: on success every filter page/count is re-read. */
function useOwnerReviewMutation<Input>(
  kind: BusinessKind,
  run: (input: Input, assertCurrent: () => void) => Promise<unknown>,
) {
  const { lifecycle, scope } = useOwnerContext();
  const client = useQueryClient();
  return usePrivateMutation(lifecycle, async (input: Input, assertCurrent) => {
    const result = await run(input, assertCurrent);
    assertCurrent();
    if (scope)
      await client.invalidateQueries({ queryKey: ownerReviewKeys.root(scope, kind) });
    return result;
  });
}

export function useOwnerReply(kind: BusinessKind) {
  const { api } = useOwnerContext();
  return useOwnerReviewMutation(
    kind,
    (input: { reviewId: string; text: string | null }, assertCurrent) =>
      saveOwnerReply(api, kind, input.reviewId, input.text, assertCurrent),
  );
}

export function useReportReview(kind: BusinessKind) {
  const { api } = useOwnerContext();
  return useOwnerReviewMutation(
    kind,
    (input: { reviewId: string; report: ReviewReport }, assertCurrent) =>
      reportReview(api, input.reviewId, input.report, assertCurrent),
  );
}
