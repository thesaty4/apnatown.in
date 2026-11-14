'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import type { MyReview } from '@apnatown/shared/reviews';
import { Card } from '@apnatown/ui/cards/Card';
import { StatusBadge, type BadgeTone } from '@apnatown/ui/primitives/Badge';
import { Button } from '@apnatown/ui/primitives/Button';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import { EmptyState, ErrorState } from '@apnatown/ui/feedback/StateViews';
import { accountScope } from '../../shared/api/query-keys';
import { AccessState } from '../../shared/auth/AccessState';
import { useSession } from '../../shared/auth/SessionProvider';
import { publicHref, type Locale } from '../../shared/i18n/preferences';
import { myReviewsOptions } from './api';

const TONES: Record<MyReview['status'], BadgeTone> = {
  published: 'ok',
  reported: 'info',
  pending: 'warn',
  hidden: 'neutral',
};

const ICONS: Record<MyReview['status'], string> = {
  published: '✓',
  reported: '!',
  pending: '⏳',
  hidden: '⊘',
};

const KINDS = {
  product: 'product',
  service: 'service',
  business: 'business',
  rider: 'rider',
} as const;

/** S-CUST-23: the customer's own reviews with their current moderation state. */
export function MyReviewsScreen() {
  const t = useTranslations('account.myReviews');
  const stars = useTranslations('reviews.section');
  const locale: Locale = useLocale() === 'hi' ? 'hi' : 'en';
  const { api, lifecycle, state, epoch } = useSession();
  const scope = state.kind === 'ready' ? accountScope(state.data, epoch) : null;
  const query = useQuery({
    ...myReviewsOptions(api, scope, lifecycle),
    enabled: scope !== null,
  });

  if (state.kind !== 'ready') return <AccessState guest />;
  if (query.isPending) return <Skeleton label={t('loading')} />;
  if (query.isError)
    return (
      <ErrorState
        title={t('errorTitle')}
        message={t('errorMessage')}
        action={<Button onClick={() => void query.refetch()}>{t('retry')}</Button>}
      />
    );
  if (query.data.items.length === 0)
    return (
      <EmptyState
        icon="⭐"
        title={t('emptyTitle')}
        message={t('emptyMessage')}
        action={null}
      />
    );

  const format = new Intl.DateTimeFormat(locale === 'hi' ? 'hi-IN' : 'en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });
  return (
    <ul className="m-0 grid list-none gap-3 p-0">
      {query.data.items.map((review) => {
        const name =
          (locale === 'hi'
            ? (review.targetNameHi ?? review.targetNameEn)
            : review.targetNameEn) ?? t(`kind.${KINDS[review.targetType]}`);
        return (
          <li key={review.id} className="min-w-0">
            <Card padded className="grid gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge
                  tone="neutral"
                  icon="•"
                  label={t(`kind.${KINDS[review.targetType]}`)}
                />
                <StatusBadge
                  tone={TONES[review.status]}
                  icon={ICONS[review.status]}
                  label={t(`status.${review.status}`)}
                />
                <span className="text-caption text-muted">
                  {format.format(new Date(review.createdAt))}
                </span>
              </div>
              <div className="flex min-w-0 flex-wrap items-baseline gap-2">
                {review.targetPath ? (
                  <Link
                    href={publicHref(review.targetPath, locale)}
                    className="font-semibold text-primary underline [overflow-wrap:anywhere]"
                  >
                    {name}
                  </Link>
                ) : (
                  <span className="font-semibold [overflow-wrap:anywhere]">
                    {name}
                  </span>
                )}
                <span
                  className="text-small text-star"
                  aria-label={stars('starsLabel', { rating: review.rating })}
                >
                  {'★'.repeat(review.rating)}
                  <span className="text-border-strong">
                    {'★'.repeat(5 - review.rating)}
                  </span>
                </span>
              </div>
              <p className="m-0 whitespace-pre-wrap [overflow-wrap:anywhere]">
                {review.text}
              </p>
              {review.ownerReply && (
                <div className="rounded-md border border-border bg-surface-2 px-3 py-2 text-small">
                  <p className="m-0 font-semibold">
                    {stars('ownerReply')}
                  </p>
                  <p className="m-0 whitespace-pre-wrap [overflow-wrap:anywhere]">
                    {review.ownerReply}
                  </p>
                </div>
              )}
              <p className="m-0 text-caption text-muted">
                {t('helpful', { count: review.helpfulCount })}
              </p>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
