import type { BusinessKind } from '@apnatown/shared/businesses';
import {
  OwnerReviewCardSchema,
  OwnerReviewPageSchema,
  ReviewReportResultSchema,
  type OwnerReviewFilter,
  type ReviewReport,
} from '@apnatown/shared/reviews';
import type { BrowserApi } from '../../../shared/api/browser';
import { unwrap } from '../../../shared/api/result';

const kindHeader = (kind: BusinessKind) => ({ 'X-Business-Kind': kind });

export type OwnerReviewFilters = { filter: OwnerReviewFilter; rating: number | null };

export async function listOwnerReviews(
  api: Pick<BrowserApi, 'GET'>,
  kind: BusinessKind,
  filters: OwnerReviewFilters,
  cursor: string | undefined,
  signal: AbortSignal,
) {
  return unwrap(
    await api.GET('/businesses/me/reviews', {
      params: {
        header: kindHeader(kind),
        query: {
          filter: filters.filter,
          ...(filters.rating && { rating: filters.rating }),
          ...(cursor && { cursor }),
        },
      },
      signal,
    }),
    OwnerReviewPageSchema,
  );
}

/** `text === null` removes the reply. */
export async function saveOwnerReply(
  api: BrowserApi,
  kind: BusinessKind,
  reviewId: string,
  text: string | null,
  assertCurrent: () => void,
) {
  const csrf = await api.mutationHeaders();
  assertCurrent();
  const params = { header: { ...csrf, ...kindHeader(kind) }, path: { reviewId } };
  const path = '/businesses/me/reviews/{reviewId}/reply';
  return unwrap(
    text === null
      ? await api.DELETE(path, { params })
      : await api.PUT(path, { params, body: { text } }),
    OwnerReviewCardSchema,
  );
}

export async function reportReview(
  api: BrowserApi,
  reviewId: string,
  report: ReviewReport,
  assertCurrent: () => void,
) {
  const csrf = await api.mutationHeaders();
  assertCurrent();
  return unwrap(
    await api.POST('/reviews/{reviewId}/reports', {
      params: { header: csrf, path: { reviewId } },
      body: {
        reason: report.reason,
        ...(report.details && { details: report.details }),
      },
    }),
    ReviewReportResultSchema,
  );
}
