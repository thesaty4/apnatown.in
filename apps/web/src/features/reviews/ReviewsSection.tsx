'use client';

import { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import type {
  ReviewPublicTargetType,
  ReviewSort,
} from '@apnatown/shared/reviews';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import { EmptyState, ErrorState } from '@apnatown/ui/feedback/StateViews';
import { Chip } from '@apnatown/ui/primitives/Chip';
import { Button } from '@apnatown/ui/primitives/Button';
import { useSession } from '../../shared/auth/SessionProvider';
import { reviewsOptions } from './api';
import { RatingSummary, ReviewItem } from './ReviewParts';
import { WriteReviewAction } from './WriteReviewAction';

const SORTS: readonly ReviewSort[] = ['recent', 'helpful'];

/** S-CUST-08 "Ratings & reviews" (F-PD-007, F-RV-001) for one public target. */
export function ReviewsSection({
  targetType,
  targetId,
  name,
  returnPath,
}: {
  targetType: ReviewPublicTargetType;
  targetId: string;
  name: string;
  returnPath: string;
}) {
  const t = useTranslations('reviews.section');
  const { api } = useSession();
  const [sort, setSort] = useState<ReviewSort>('recent');
  const query = useInfiniteQuery(
    reviewsOptions(api, targetType, targetId, sort),
  );
  const summary = query.data?.pages[0]?.summary;
  const reviews = query.data?.pages.flatMap((page) => page.items) ?? [];
  const headingId = `reviews-${targetType}-${targetId}`;

  let body;
  if (query.isPending) body = <Skeleton label={t('loading')} />;
  else if (query.isError)
    body = (
      <ErrorState
        title={t('errorTitle')}
        message={t('errorMessage')}
        headingLevel="h2"
        action={
          <Button onClick={() => void query.refetch()}>{t('retry')}</Button>
        }
      />
    );
  else if (!summary || summary.count === 0)
    body = (
      <EmptyState
        icon="⭐"
        title={t('emptyTitle')}
        message={t('emptyMessage')}
        headingLevel="h2"
        action={null}
      />
    );
  else
    body = (
      <>
        <RatingSummary summary={summary} />
        <div role="group" aria-label={t('sortLabel')} className="flex gap-2">
          {SORTS.map((value) => (
            <Chip
              key={value}
              label={t(`sort.${value}`)}
              selected={sort === value}
              aria-pressed={sort === value}
              onClick={() => setSort(value)}
            />
          ))}
        </div>
        <ul className="m-0 grid list-none gap-3 p-0">
          {reviews.map((review) => (
            <li key={review.id}>
              <ReviewItem review={review} />
            </li>
          ))}
        </ul>
        {query.hasNextPage && (
          <Button
            variant="outline"
            className="justify-self-center"
            loading={query.isFetchingNextPage}
            onClick={() => void query.fetchNextPage()}
          >
            {t('loadMore')}
          </Button>
        )}
      </>
    );

  return (
    <section aria-labelledby={headingId} className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id={headingId} className="m-0 text-h2">
          {t('title')}
        </h2>
        <WriteReviewAction name={name} returnPath={returnPath} />
      </div>
      {body}
    </section>
  );
}
