'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import type { BusinessKind, BusinessOwner } from '@apnatown/shared/businesses';
import {
  OWNER_REVIEW_FILTERS,
  OwnerReviewFilterSchema,
  type OwnerReviewCard,
  type OwnerReviewPage,
} from '@apnatown/shared/reviews';
import { Card } from '@apnatown/ui/cards/Card';
import { EmptyState } from '@apnatown/ui/feedback/StateViews';
import { Button } from '@apnatown/ui/primitives/Button';
import { Chip } from '@apnatown/ui/primitives/Chip';
import { Select } from '@apnatown/ui/primitives/Select';
import { OwnerGate } from '../../businesses/BusinessDashboard';
import { OwnerQueryState } from '../../businesses/OwnerQueryState';
import { LockedNote } from '../../businesses/parts';
import { RatingSummary, ReviewItem } from '../ReviewParts';
import type { OwnerReviewFilters } from './api';
import { OwnerReplyEditor, ReportReviewAction } from './OwnerReviewActions';
import { useOwnerReviews } from './queries';

/** S-VEND-09 / S-PROV-10 owner reviews, shared by vendor and provider. */
export function OwnerReviewsScreen({ kind }: { kind: BusinessKind }) {
  return (
    <OwnerGate kind={kind}>
      {(business) => <ReviewsGate business={business} />}
    </OwnerGate>
  );
}

function ReviewsGate({ business }: { business: BusinessOwner }) {
  const t = useTranslations('reviews.owner');
  return (
    <div className="grid min-w-0 gap-4">
      <h1 className="m-0 text-h1">{t('title')}</h1>
      {business.status === 'approved' ? (
        <Reviews kind={business.kind} />
      ) : (
        <Card padded>
          <LockedNote />
        </Card>
      )}
    </div>
  );
}

/** i18n keys are camelCase; the wire filter is snake_case. */
const FILTER_KEY = { all: 'all', needs_reply: 'needsReply', reported: 'reported' } as const;

/** URL state: `?filter=all|needs_reply|reported&rating=1..5`. */
function useFilters(): [OwnerReviewFilters, (next: OwnerReviewFilters) => void] {
  const params = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const filter = OwnerReviewFilterSchema.catch('all').parse(params.get('filter'));
  const raw = Number(params.get('rating'));
  const rating = Number.isInteger(raw) && raw >= 1 && raw <= 5 ? raw : null;
  const set = (next: OwnerReviewFilters) => {
    const query = new URLSearchParams();
    if (next.filter !== 'all') query.set('filter', next.filter);
    if (next.rating) query.set('rating', String(next.rating));
    const search = query.toString();
    router.replace(search ? `${path}?${search}` : path, { scroll: false });
  };
  return [{ filter, rating }, set];
}

function Reviews({ kind }: { kind: BusinessKind }) {
  const t = useTranslations('reviews.owner');
  const [filters, setFilters] = useFilters();
  const query = useOwnerReviews(kind, filters);
  const first = query.data?.pages[0];
  return (
    <>
      {first && <RatingSummary summary={first.summary} />}
      <div className="flex flex-wrap items-end gap-2">
        <div role="group" aria-label={t('filtersLabel')} className="flex flex-wrap gap-2">
          {OWNER_REVIEW_FILTERS.map((value) => (
            <Chip
              key={value}
              label={t(`filters.${FILTER_KEY[value]}`)}
              {...(first && { count: String(first.counts[value]) })}
              selected={filters.filter === value}
              onClick={() => setFilters({ ...filters, filter: value })}
            />
          ))}
        </div>
        <Select
          label={t('ratingLabel')}
          value={filters.rating ? String(filters.rating) : ''}
          options={[
            { value: '', label: t('allRatings') },
            ...[5, 4, 3, 2, 1].map((star) => ({
              value: String(star),
              label: t('stars', { count: star }),
            })),
          ]}
          onChange={(event) =>
            setFilters({ ...filters, rating: Number(event.target.value) || null })
          }
        />
      </div>
      <OwnerQueryState query={query} loadingLabel={t('loading')} errorTitle={t('error')}>
        {(data) => {
          const items = data.pages.flatMap((page: OwnerReviewPage) => page.items);
          if (!items.length)
            return (
              <EmptyState
                icon="⭐"
                title={t(`empty.${FILTER_KEY[filters.filter]}`)}
                message={t('emptyMessage')}
                action={null}
              />
            );
          return (
            <div className="grid gap-3">
              <ul className="m-0 grid list-none gap-3 p-0">
                {items.map((review) => (
                  <li key={review.id}>
                    <OwnerReviewItem kind={kind} review={review} />
                  </li>
                ))}
              </ul>
              {query.hasNextPage && (
                <Button
                  variant="outline"
                  loading={query.isFetchingNextPage}
                  onClick={() => void query.fetchNextPage()}
                >
                  {t('loadMore')}
                </Button>
              )}
            </div>
          );
        }}
      </OwnerQueryState>
    </>
  );
}

function OwnerReviewItem({ kind, review }: { kind: BusinessKind; review: OwnerReviewCard }) {
  const t = useTranslations('reviews.owner');
  const locale = useLocale();
  const name = (locale === 'hi' && review.targetNameHi) || review.targetNameEn;
  return (
    <ReviewItem
      review={review}
      context={
        <p className="m-0 text-caption text-muted [overflow-wrap:anywhere]">
          {name ? t('on', { name }) : t('onProfile')}
        </p>
      }
    >
      <div className="flex flex-wrap items-start justify-between gap-2 border-t border-border pt-2">
        <OwnerReplyEditor key={review.ownerReply ?? ''} kind={kind} review={review} />
        <ReportReviewAction kind={kind} review={review} />
      </div>
    </ReviewItem>
  );
}
